import express from "express";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export const activityRouter = express.Router();
const DATA_DIR = process.env.DATA_DIR?.trim() || path.join(os.homedir(), ".openclaw", "data");
const ACTIVITY_FILE = path.join(DATA_DIR, "activity.json");

activityRouter.get("/", (req, res) => {
  try {
    const limit = parseInt(req.query.limit?.toString() || "200", 10) || 200;
    
    if (!fs.existsSync(ACTIVITY_FILE)) {
      return res.json({ ok: true, activities: [] });
    }
    
    const content = fs.readFileSync(ACTIVITY_FILE, "utf8");
    let activities = JSON.parse(content);
    if (!Array.isArray(activities)) activities = [];
    
    // Reverse to get newest first, then slice
    const latest = activities.reverse().slice(0, limit);
    return res.json({ ok: true, activities: latest });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});
