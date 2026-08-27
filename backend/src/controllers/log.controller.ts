import { Request, Response, NextFunction } from "express";
import * as service from "../services/log.service";

export const createLog = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const newLog = await service.createLog(req.params.id, req.body);
    if (!req.body.date || !req.body.status) {
      res.status(400).json({ message: "Date and status are required." });
      return;
    }
    res.status(201).json({ message: "Log created successfully.", log: newLog });
  } catch (error) {
    next(error);
  }
};

export const getLogsByHabitId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const logs = await service.getLogsByHabitId(req.params.habitId);
    res.status(200).json({ message: "Logs retrieved successfully.", logs });
  } catch (error) {
    next(error);
  }
};

export const getAllLogs = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const logs = await service.getAllLogs();
    res.status(200).json({ message: "Logs retrieved successfully.", logs });
  } catch (error) {
    next(error);
  }
};