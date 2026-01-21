import { Router } from "express";
import * as controller from "../controllers/habit.controller";

const router = Router();

// Create habit
router.post("/", controller.createHabit);

// Get all habits
router.get("/", controller.getAllHabits);

// Get active (non-archived) habits
router.get("/active", controller.getActiveHabits);

// Edit a habit
router.put("/:id", controller.editHabit);

// Archive a habit
router.patch("/:id/archive", controller.archiveHabit);

export default router;
