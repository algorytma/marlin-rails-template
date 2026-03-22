import express from "express";
import { getServiceStatuses } from "../helpers/healthScheduler.js";

export const servicesRouter = express.Router();

// GET /api/services/status
servicesRouter.get("/status", (req, res) => {
  try {
    const statuses = getServiceStatuses();
    res.json({ ok: true, services: statuses });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
