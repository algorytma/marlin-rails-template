import path from "node:path";
import os from "node:os";

// We use the same STATE_DIR logic or pass it around. Assuming it's based on OPENCLAW_STATE_DIR or fallback to /data
// According to the requirement, the root is /data. For local it might be different, but let's just use /data or defined state dir.
const DATA_DIR = process.env.DATA_DIR?.trim() || path.join(os.homedir(), ".openclaw", "data");

export function resolveSafePath(relativePath) {
  const resolvedPath = path.resolve(DATA_DIR, '.' + relativePath);
  
  if (!resolvedPath.startsWith(DATA_DIR)) {
    throw new Error('Path traversal detected');
  }
  
  return resolvedPath;
}
