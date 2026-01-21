import express, { Request, Response } from "express";
import { HabitModel, IHabit } from "../models/habit.model";

const router = express.Router();

// Create habit
router.post("/", async (req: Request, res: Response) => {
  try {
    const newHabit: IHabit = await HabitModel.create(req.body);
    res.status(201).json({ message: "Habit created successfully.", habit: newHabit });
  } catch (error) {
    res.status(500).json({ error: "Failed to create habit." });
  }
});

// Get all habits
router.get("/", async (req: Request, res: Response) => {
  try {
    const habits: IHabit[] = await HabitModel.find();
    res.status(200).json({ message: "Habits fetched successfully.", habits });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch habits." });
  }
});

// Edit a habit
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const updatedHabit: IHabit | null = await HabitModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    if (updatedHabit) {
      res.status(200).json({ message: "Habit updated successfully.", habit: updatedHabit });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to update habit." });
  }
});

// Archive a habit
router.patch("/:id/achieve", async (req: Request, res: Response) => {
  try {
    await HabitModel.findByIdAndUpdate(req.params.id, { isAchieved: true });
    res.json({ message: "Habit archived successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to archive habit." });
  }
});

// interface Habit {
//   id: number;
//   name: string;
//   isActive: boolean;
//   createdAt: Date;
// }

// let habits: Habit[] = [
//   { id: 1, name: "Drink Water", isActive: true, createdAt: new Date() },
//   { id: 2, name: "Exercise", isActive: true, createdAt: new Date() },
// ];

// // Create a new habit
// router.post("/", (req: Request, res: Response) => {
//   const { name } = req.body;
//   const newHabit: Habit = {
//     id: habits.length + 1,
//     name,
//     isActive: true,
//     createdAt: new Date(),
//   };
//   habits.push(newHabit);
//   console.log("Habit created successfully:", newHabit);
//   res.status(201).json(newHabit);
// });
  
// // Get all habits
// router.get("/", (req: Request, res: Response) => {
//   console.log("Fetching all habits successfully.");
//   res.json(habits);
// });

// // Update a habit
// router.put("/:id", (req: Request<{ id: string }>, res: Response) => {
//   const habitId = parseInt(req.params.id);
//   const habitIndex = habits.findIndex(habit => habit.id === habitId)
//   if (habitIndex === -1) {
//     return res.status(404).json({ error: "Habit not found." });
//   }

//   const updatedHabit = {
//     ...habits[habitIndex],
//     ...req.body
//   }

//   habits[habitIndex] = updatedHabit;
//   res.json(updatedHabit);
// });

// // Delete a habit
// router.delete("/:id", (req: Request<{ id: string }>, res: Response) => {
//   const habitId = parseInt(req.params.id);
//   const habitIndex = habits.findIndex(habit => habit.id === habitId);
  
//   if (habitIndex === -1) {
//     return res.status(404).json({ error: "Habit not found." });
//   }

//   const deletedHabit = habits.splice(habitIndex, 1);
//   res.json(deletedHabit[0])
// });

export default router;