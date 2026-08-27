import { Router, Request, Response } from "express";
import { HabitLogModel, IHabitLog } from "../models/habitLog.model";
import * as controller from "../controllers/log.controller";

const router = Router();

// Create a log
router.post("/:id", controller.createLog);

// Get all logs
router.get("/", controller.getAllLogs);

// Get logs for a specific habit
router.get("/habit/:habitId", controller.getLogsByHabitId);

export default router;