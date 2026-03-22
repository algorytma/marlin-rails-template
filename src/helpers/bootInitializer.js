import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const DATA_DIR = process.env.DATA_DIR?.trim() || path.join(os.homedir(), ".openclaw", "data");

export function initDataFiles() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    
    const activityPath = path.join(DATA_DIR, 'activity.json');
    if (!fs.existsSync(activityPath)) {
      fs.writeFileSync(activityPath, '[]', 'utf8');
      console.log(`[boot] Created ${activityPath}`);
    }

    const projectsPath = path.join(DATA_DIR, 'projects.json');
    if (!fs.existsSync(projectsPath)) {
      fs.writeFileSync(projectsPath, JSON.stringify({ projects: [], pipelines: [], tasks: [] }, null, 2), 'utf8');
      console.log(`[boot] Created ${projectsPath}`);
    }
  } catch (err) {
    console.error(`[boot] Error initializing data files: ${err.message}`);
  }
}
