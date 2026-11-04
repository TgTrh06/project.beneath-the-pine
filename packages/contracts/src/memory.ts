import { z } from 'zod';
import { dateTimeSchema, idSchema } from './shared';

export const forestThresholdSchema = z.union([z.literal(1), z.literal(3), z.literal(7)]);
export const personalMilestoneSchema = z.object({
  threshold: forestThresholdSchema,
  sourceSessionId: idSchema,
  recordedAt: dateTimeSchema,
}).strict();
export const personalForestSchema = z.object({
  completedSessions: z.number().int().nonnegative(),
  milestones: z.array(personalMilestoneSchema).max(3),
}).strict();

export type ForestThreshold = z.infer<typeof forestThresholdSchema>;
export type PersonalMilestone = z.infer<typeof personalMilestoneSchema>;
export type PersonalForest = z.infer<typeof personalForestSchema>;

export const campForestSchema = z.object({
  campId: idSchema,
  name: z.string(),
  status: z.enum(['active', 'archived']),
  sharedSessions: z.number().int().nonnegative(),
  milestones: z.array(z.object({ threshold: forestThresholdSchema, recordedAt: dateTimeSchema }).strict()).max(3),
}).strict();
export const campForestsSchema = z.object({ camps: z.array(campForestSchema) }).strict();
export type CampForest = z.infer<typeof campForestSchema>;
