import { Schema, model, Document, Types } from "mongoose";

export interface IHabit extends Document {
  name: string;
  description?: string;
  category: "health" | "mind" | "work" | "life";
  isAchieved: boolean;
  createdAt: Date;
}

const HabitSchema = new Schema<IHabit>({
  name: { type: String, required: true },
  description: { type: String },
  category: {
    type: String,
    enum: ["health", "mind", "work", "life"],
    default: "life",
  },
  isAchieved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const HabitModel = model<IHabit>("Habit", HabitSchema);
