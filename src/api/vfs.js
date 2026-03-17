import express from "express";
import fs from "node:fs";
import path from "node:path";
import { resolveSafePath } from "../helpers/pathResolver.js";
import { appendActivityEvent } from "../helpers/activityLogger.js";

export const vfsRouter = express.Router();

function getSafeResourcePath(reqPath) {
  const p = reqPath || "";
  // Check access policies
  if (!p.startsWith("/workspace") && !p.startsWith("/.openclaw") && !p.startsWith("/logs") && !p.startsWith("/.ssh")) {
    throw new Error("Access denied: path must be within allowed namespaces");
  }

  const resolved = resolveSafePath(p);
  return { resolved, logical: p };
}

vfsRouter.get("/list", (req, res) => {
  try {
    const { resolved, logical } = getSafeResourcePath(req.query.path?.toString());

    if (!fs.existsSync(resolved)) {
      return res.status(404).json({ ok: false, error: "Path not found" });
    }

    const stat = fs.statSync(resolved);
    if (!stat.isDirectory()) {
      return res.status(400).json({ ok: false, error: "Path is not a directory" });
    }

    const items = fs.readdirSync(resolved).map((name) => {
      const childPath = path.join(resolved, name);
      const childStat = fs.statSync(childPath);
      const childLogical = path.posix.join(logical, name);
      return {
        name,
        path: childLogical,
        type: childStat.isDirectory() ? "dir" : "file",
        size: childStat.size,
        mtime: childStat.mtimeMs,
      };
    });

    res.json({ ok: true, path: logical, items });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

vfsRouter.get("/read", (req, res) => {
  try {
    const { resolved, logical } = getSafeResourcePath(req.query.path?.toString());

    // masked read policy for .ssh
    if (logical.startsWith("/.ssh")) {
       return res.status(403).json({ ok: false, error: "Read details are masked for SSH keys." });
    }

    if (!fs.existsSync(resolved)) {
      return res.status(404).json({ ok: false, error: "File not found" });
    }

    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) {
      return res.status(400).json({ ok: false, error: "Cannot read directory as file" });
    }

    const content = fs.readFileSync(resolved, "utf8");
    res.json({ ok: true, content });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

function canWrite(logical) {
  return logical.startsWith("/workspace");
}

vfsRouter.post("/write", (req, res) => {
  try {
    const { path: reqPath, content } = req.body;
    const { resolved, logical } = getSafeResourcePath(reqPath);

    if (!canWrite(logical)) {
       return res.status(403).json({ ok: false, error: "Write access denied" });
    }

    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, content, "utf8");

    appendActivityEvent({
      type: "file.edit",
      summary: `Edited ${logical}`,
      details: { path: logical }
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

vfsRouter.post("/mkdir", (req, res) => {
  try {
    const { path: reqPath } = req.body;
    const { resolved, logical } = getSafeResourcePath(reqPath);

    if (!canWrite(logical)) {
       return res.status(403).json({ ok: false, error: "Write access denied" });
    }

    fs.mkdirSync(resolved, { recursive: true });

    appendActivityEvent({
      type: "file.mkdir",
      summary: `Created directory ${logical}`,
      details: { path: logical }
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

vfsRouter.post("/delete", (req, res) => {
  try {
    const { path: reqPath } = req.body;
    const { resolved, logical } = getSafeResourcePath(reqPath);

    if (!canWrite(logical)) {
       return res.status(403).json({ ok: false, error: "Delete access denied" });
    }

    if (fs.existsSync(resolved)) {
      fs.rmSync(resolved, { recursive: true, force: true });
      
      appendActivityEvent({
        type: "file.delete",
        summary: `Deleted ${logical}`,
        details: { path: logical }
      });
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

vfsRouter.post("/rename", (req, res) => {
  try {
    const { from, to } = req.body;
    const { resolved: resolvedFrom, logical: logicalFrom } = getSafeResourcePath(from);
    const { resolved: resolvedTo, logical: logicalTo } = getSafeResourcePath(to);

    if (!canWrite(logicalFrom) || !canWrite(logicalTo)) {
       return res.status(403).json({ ok: false, error: "Write access denied" });
    }

    if (!fs.existsSync(resolvedFrom)) {
      return res.status(404).json({ ok: false, error: "Source not found" });
    }

    fs.renameSync(resolvedFrom, resolvedTo);

    appendActivityEvent({
      type: "file.rename",
      summary: `Renamed ${logicalFrom} to ${logicalTo}`,
      details: { from: logicalFrom, to: logicalTo }
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});
