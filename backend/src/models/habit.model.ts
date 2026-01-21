import { Schema, model, Document, Types } from "mongoose";

export interface IHabit extends Document {
  name: string;
  description?: string;
  category: "health" | "mind" | "work" | "life";
  isArchived: boolean;
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
  isArchived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const HabitModel = model<IHabit>("Habit", HabitSchema);
