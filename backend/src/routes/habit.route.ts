import express, { Request, Response } from "express";
import { Habit } from "../models/habit.model";

const router = express.Router();

let habits: Habit[] = [
  { id: 1, name: "Drink Water", isActive: true, createdAt: new Date() },
  { id: 2, name: "Exercise", isActive: true, createdAt: new Date() },
];

// Create a new habit
router.post("/", (req: Request, res: Response) => {
  const { name } = req.body;
  const newHabit: Habit = {
    id: habits.length + 1,
    name,
    isActive: true,
    createdAt: new Date(),
  };
  habits.push(newHabit);
  console.log("Habit created successfully:", newHabit);
  res.status(201).json(newHabit);
});
  
// Get all habits
router.get("/", (req: Request, res: Response) => {
  console.log("Fetching all habits successfully.");
  res.json(habits);
});

// Update a habit
router.put("/:id", (req: Request<{ id: string }>, res: Response) => {
  const habitId = parseInt(req.params.id);
  const habitIndex = habits.findIndex(habit => habit.id === habitId)
  if (habitIndex === -1) {
    return res.status(404).json({ error: "Habit not found." });
  }

  const updatedHabit = {
    ...habits[habitIndex],
    ...req.body
  }

  habits[habitIndex] = updatedHabit;
  res.json(updatedHabit);
});

// Delete a habit
router.delete("/:id", (req: Request<{ id: string }>, res: Response) => {
  const habitId = parseInt(req.params.id);
  const habitIndex = habits.findIndex(habit => habit.id === habitId);
  
  if (habitIndex === -1) {
    return res.status(404).json({ error: "Habit not found." });
  }

  const deletedHabit = habits.splice(habitIndex, 1);
  res.json(deletedHabit[0])
});

export default router;
