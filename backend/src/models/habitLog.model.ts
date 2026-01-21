import { Schema, model, Document, Types } from "mongoose";

export interface IHabitLog extends Document {
  habitId: Types.ObjectId;
  date: string;
  status: "completed" | "missed";
  note?: string;
  createdAt: Date;
}

const HabitLogSchema = new Schema<IHabitLog>({
  habitId: {
    type: Schema.Types.ObjectId,
    ref: "Habit",
    required: true,
  },
  date: { type: String, required: true },
  status: {
    type: String,
    enum: ["completed", "missed"],
    required: true,
  },
  note: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Ensure a user can only have one log entry per habit per date
HabitLogSchema.index({ habitId: 1, date: 1 }, { unique: true });

export const HabitLogModel = model<IHabitLog>("HabitLog", HabitLogSchema);
