import { HabitLogModel, IHabitLog } from "../models/habitLog.model";

export const createLog = async (id: any, data: Partial<IHabitLog>): Promise<IHabitLog> => {
  const logData = { ...data, habitId: id };
  return await HabitLogModel.create(logData);
};

export const getLogsByHabitId = async (habitId: any): Promise<IHabitLog[]> => {
  return await HabitLogModel.find({ habitId: habitId });
};

export const getAllLogs = async (): Promise<IHabitLog[]> => {
  return await HabitLogModel.find();
};