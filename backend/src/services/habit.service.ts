import { HabitModel, IHabit } from "../models/habit.model";

export const createHabit = async (data: Partial<IHabit>): Promise<IHabit> => {
  return await HabitModel.create(data);
};

export const getAllHabits = async (): Promise<IHabit[]> => {
  return await HabitModel.find();
};

export const getActiveHabits = async (): Promise<IHabit[]> => {
  return await HabitModel.find({ isArchived: false });
};

export const editHabit = async (
  id: any,
  data: Partial<IHabit>,
): Promise<IHabit> => {
  const editedHabit = await HabitModel.findByIdAndUpdate(id, data, {
    new: true,
  });
  if (!editedHabit) {
    throw new Error("Habit not found");
  }
  return editedHabit;
};

export const archiveHabit = async (id: any): Promise<void> => {
  await HabitModel.findByIdAndUpdate(id, { isArchived: true });
};
