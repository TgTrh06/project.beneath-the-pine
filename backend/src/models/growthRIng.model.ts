import { Schema, model, Document, Types } from "mongoose";

export interface IGrowthRing extends Document {
  weekStart: Date;
  weekEnd: Date;
  totalHabits: number;
  completedLogs: number;
  completionRate: number;
  growthLevel: number;
  createdAt: Date;
};

const GrowthRingSchema = new Schema<IGrowthRing>({
  weekStart: { type: Date, required: true },
  weekEnd: { type: Date, required: true },
  totalHabits: { type: Number, required: true },
  completedLogs: { type: Number, required: true },
  completionRate: { type: Number, required: true },
  growthLevel: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const GrowthRingModel = model<IGrowthRing>("GrowthRing", GrowthRingSchema);