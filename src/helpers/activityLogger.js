import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";

const DATA_DIR = process.env.DATA_DIR?.trim() || path.join(os.homedir(), ".openclaw", "data");
const ACTIVITY_FILE = path.join(DATA_DIR, "activity.json");
const MAX_EVENTS = 2000;

export function appendActivityEvent(event) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    let activities = [];
    if (fs.existsSync(ACTIVITY_FILE)) {
      try {
        const content = fs.readFileSync(ACTIVITY_FILE, "utf8");
        activities = JSON.parse(content);
        if (!Array.isArray(activities)) activities = [];
      } catch (err) {
        console.error("Failed to parse activity.json", err);
        activities = [];
      }
    }

    const newEvent = {
      id: event.id || crypto.randomUUID(),
      timestamp: event.timestamp || new Date().toISOString(),
      type: event.type,
      source: event.source || "human",
      summary: event.summary,
      details: event.details || {},
    };

    activities.push(newEvent);

    if (activities.length > MAX_EVENTS) {
      activities = activities.slice(activities.length - MAX_EVENTS);
    }

    fs.writeFileSync(ACTIVITY_FILE, JSON.stringify(activities, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to append activity event:", err);
  }
}
