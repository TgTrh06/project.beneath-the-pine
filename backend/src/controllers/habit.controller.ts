import { Request, Response, NextFunction } from "express";
import * as service from "../services/habit.service";

export const createHabit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const habit = await service.createHabit(req.body);
    res.status(201).json({ message: "Habit created successfully.", habit });
  } catch (error) {
    next(error);
  }
};

export const getAllHabits = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const habits = await service.getAllHabits();
    res.status(200).json({ message: "Habits retrieved successfully.", habits });
  } catch (error) {
    next(error);
  }
};

export const getActiveHabits = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const habits = await service.getActiveHabits();
    res.status(200).json({ message: "Active habits retrieved successfully.", habits });
  } catch (error) {
    next(error);
  }
};

export const editHabit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const habit = await service.editHabit(req.params.id, req.body);
    res.status(200).json({ message: "Habit edited successfully.", habit });
  } catch (error) {
    next(error);
  }
};

export const archiveHabit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await service.archiveHabit(req.params.id);
    res.status(200).json({ message: "Habit archived successfully." });
  } catch (error) {
    next(error);
  }
};