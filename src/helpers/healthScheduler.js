import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import childProcess from "node:child_process";
import { pinoLogger } from "./logger.js";
import { appendActivityEvent } from "./activityLogger.js";

const serviceStatuses = new Map();

function setServiceState(id, name, type, isOk, message = "") {
  const lastState = serviceStatuses.get(id);
  const statusStr = isOk ? "ok" : "error";
  
  const newState = {
    id,
    name,
    type,
    status: statusStr,
    message,
    lastCheck: new Date().toISOString()
  };
  
  serviceStatuses.set(id, newState);
  
  if (!lastState || lastState.status !== statusStr) {
    pinoLogger.info({ category: "healthTracker" }, `Service ${id} status changed to ${statusStr}: ${message}`);
    appendActivityEvent({
      type: isOk ? "service.health.ok" : "service.health.error",
      summary: `Service ${name} is ${statusStr}`,
      details: { serviceId: id, message }
    });
  }
}

async function checkGateway(gatewayTarget) {
  try {
    // Basic ping
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${gatewayTarget}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (res && res.ok) {
      setServiceState("gateway", "OpenClaw Gateway", "gateway", true, "Gateway is responding");
    } else {
      setServiceState("gateway", "OpenClaw Gateway", "gateway", false, `Gateway response not OK: ${res.status}`);
    }
  } catch (err) {
    const errorMsg = err.code || err.message;
    setServiceState("gateway", "OpenClaw Gateway", "gateway", false, errorMsg);
  }
}

async function checkLLM(configPath) {
  try {
    if (!fs.existsSync(configPath)) {
      setServiceState("llm", "Primary LLM", "llm", false, "OpenClaw configuration not found");
      return;
    }
    const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const model = cfg.model;
    if (!model) {
      setServiceState("llm", "Primary LLM", "llm", false, "No active model configured");
      return;
    }
    setServiceState("llm", `LLM: ${model}`, "llm", true, "Model configured");
  } catch (err) {
    setServiceState("llm", "Primary LLM", "llm", false, `Config read error: ${err.message}`);
  }
}

function checkSSHHosts(dataDir) {
  const sshInventoryPath = path.join(dataDir, "ssh_inventory.json");
  const sshDir = path.join(path.dirname(dataDir), ".ssh");
  const idRsaPath = path.join(sshDir, "id_rsa");

  try {
    if (!fs.existsSync(sshInventoryPath)) return;
    const inventory = JSON.parse(fs.readFileSync(sshInventoryPath, "utf8"));
    const hosts = inventory.hosts || [];
    
    for (const host of hosts) {
      const sshCmd = [
        "ssh", "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=5"
      ];
      if (fs.existsSync(idRsaPath)) {
        sshCmd.push("-i", idRsaPath);
      }
      sshCmd.push("-p", String(host.port || 22));
      sshCmd.push(`${host.user || "root"}@${host.host}`);
      sshCmd.push('"echo ok"');
      
      const cmdString = sshCmd.join(" ");
      
      childProcess.exec(cmdString, (error, stdout) => {
        const sid = `ssh:${host.alias}`;
        if (error) {
          setServiceState(sid, host.alias, "ssh", false, error.message);
        } else if (stdout.trim() === "ok") {
          setServiceState(sid, host.alias, "ssh", true, "Connection established");
        } else {
          setServiceState(sid, host.alias, "ssh", false, "Unexpected output or timeout");
        }
      });
    }
  } catch (err) {
    pinoLogger.warn({ category: "healthScheduler" }, `SSH hosts check error: ${err.message}`);
  }
}

export function startHealthScheduler({ gatewayTarget, configPath, dataDir }) {
  pinoLogger.info({ category: "healthScheduler" }, "Initializing interval periodic checks (60s)");
  
  // First run immediately
  checkGateway(gatewayTarget);
  checkLLM(configPath);
  checkSSHHosts(dataDir);

  // Then schedule every 60s
  setInterval(() => {
    checkGateway(gatewayTarget);
    checkLLM(configPath);
    checkSSHHosts(dataDir);
  }, 60000);
}

export function getServiceStatuses() {
  return Array.from(serviceStatuses.values());
}
