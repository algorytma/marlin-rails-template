import childProcess from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import { pinoLogger } from "../helpers/logger.js";

export const sshRouter = express.Router();

const DATA_DIR = process.env.DATA_DIR?.trim() || path.join(os.homedir(), ".openclaw", "data");
const SSH_INVENTORY_PATH = path.join(DATA_DIR, "ssh_inventory.json");
const SSH_DIR = path.join(path.dirname(DATA_DIR), ".ssh");
const ID_RSA_PATH = path.join(SSH_DIR, "id_rsa");

// Endpoint helper for reading the inventory
function readInventory() {
  try {
    if (!fs.existsSync(SSH_INVENTORY_PATH)) {
      return { hosts: [] };
    }
    const data = fs.readFileSync(SSH_INVENTORY_PATH, "utf8");
    return JSON.parse(data);
  } catch (err) {
    pinoLogger.error({ category: "sshRouter" }, `readInventory error: ${err.message}`);
    return { hosts: [] };
  }
}

// Endpoint helper for writing the inventory
function writeInventory(data) {
  try {
    fs.mkdirSync(path.dirname(SSH_INVENTORY_PATH), { recursive: true });
    fs.writeFileSync(SSH_INVENTORY_PATH, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    pinoLogger.error({ category: "sshRouter" }, `writeInventory error: ${err.message}`);
    return false;
  }
}

// GET /api/ssh/hosts
sshRouter.get("/hosts", (req, res) => {
  const inventory = readInventory();
  res.json({ ok: true, hosts: inventory.hosts || [] });
});

// POST /api/ssh/hosts
sshRouter.post("/hosts", (req, res) => {
  const { alias, host, port = 22, user = "root" } = req.body;
  if (!alias || !host) {
    return res.status(400).json({ ok: false, error: "Missing required fields: alias, host" });
  }

  const inventory = readInventory();
  if (inventory.hosts?.find((h) => h.alias === alias)) {
    return res.status(409).json({ ok: false, error: "Host with this alias already exists" });
  }

  const newHost = { alias, host, port: Number(port), user };
  if (!inventory.hosts) inventory.hosts = [];
  inventory.hosts.push(newHost);

  if (writeInventory(inventory)) {
    res.json({ ok: true, host: newHost });
  } else {
    res.status(500).json({ ok: false, error: "Failed to write ssh inventory" });
  }
});

// PUT /api/ssh/hosts/:alias
sshRouter.put("/hosts/:alias", (req, res) => {
  const { alias } = req.params;
  const { host, port, user } = req.body;

  const inventory = readInventory();
  const hostIndex = inventory.hosts?.findIndex((h) => h.alias === alias);

  if (hostIndex === undefined || hostIndex < 0) {
    return res.status(404).json({ ok: false, error: "Host not found" });
  }

  const existingHost = inventory.hosts[hostIndex];
  const updatedHost = {
    alias, // keep same alias
    host: host || existingHost.host,
    port: port ? Number(port) : existingHost.port,
    user: user || existingHost.user,
  };

  inventory.hosts[hostIndex] = updatedHost;

  if (writeInventory(inventory)) {
    res.json({ ok: true, host: updatedHost });
  } else {
    res.status(500).json({ ok: false, error: "Failed to write ssh inventory" });
  }
});

// DELETE /api/ssh/hosts/:alias
sshRouter.delete("/hosts/:alias", (req, res) => {
  const { alias } = req.params;
  const inventory = readInventory();

  if (!inventory.hosts) return res.status(404).json({ ok: false, error: "Host not found" });

  const initialLength = inventory.hosts.length;
  inventory.hosts = inventory.hosts.filter((h) => h.alias !== alias);

  if (inventory.hosts.length === initialLength) {
    return res.status(404).json({ ok: false, error: "Host not found" });
  }

  if (writeInventory(inventory)) {
    res.json({ ok: true });
  } else {
    res.status(500).json({ ok: false, error: "Failed to write ssh inventory" });
  }
});

// POST /api/ssh/hosts/:alias/check
sshRouter.post("/hosts/:alias/check", async (req, res) => {
  const { alias } = req.params;
  const inventory = readInventory();
  const targetHost = inventory.hosts?.find((h) => h.alias === alias);

  if (!targetHost) {
    return res.status(404).json({ ok: false, error: "Host not found for check" });
  }

  // Construct SSH command
  const sshCmd = [
    "ssh",
    "-o", "BatchMode=yes",
    "-o", "StrictHostKeyChecking=accept-new",
    "-o", "ConnectTimeout=10"
  ];

  if (fs.existsSync(ID_RSA_PATH)) {
    sshCmd.push("-i", ID_RSA_PATH);
  }

  sshCmd.push("-p", String(targetHost.port || 22));
  sshCmd.push(`${targetHost.user || "root"}@${targetHost.host}`);
  sshCmd.push('"echo ok"');

  const cmdString = sshCmd.join(" ");

  childProcess.exec(cmdString, (error, stdout, stderr) => {
    if (error) {
      pinoLogger.warn({ category: "sshRouter" }, `ssh check failed: ${error.message} ${stderr}`);
      return res.json({
        ok: false,
        status: "error",
        error: error.message,
        details: stderr,
      });
    }
    const output = stdout.trim();
    if (output === "ok") {
      res.json({ ok: true, status: "connected" });
    } else {
      res.json({ ok: false, status: "unexpected_output", output });
    }
  });
});
