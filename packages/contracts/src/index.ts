import { z } from "zod";

export const accountRoleSchema = z.enum(["wanderer", "pine_keeper"]);
export type AccountRole = z.infer<typeof accountRoleSchema>;
export const accountSessionSchema = z.object({
  authenticated: z.boolean(),
  user: z.object({ id: z.string().uuid(), email: z.string().email(), role: accountRoleSchema }).nullable(),
  csrfToken: z.string().regex(/^[a-f0-9]{64}$/),
}).refine(value => value.authenticated === Boolean(value.user));
export type AccountSessionPayload = z.infer<typeof accountSessionSchema>;

export const aiQuotaKinds = ["brain_dump", "help_me_start", "weekly_review"] as const;
export type AiQuotaKind = (typeof aiQuotaKinds)[number];
export const weeklyQuota: Record<AiQuotaKind, number> = {
  brain_dump: 3,
  help_me_start: 5,
  weekly_review: 1,
};

export const waitlistSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).max(80).optional(),
  context: z.string().trim().max(500).optional(),
});

export const consentSchema = z.object({
  aiProcessing: z.literal(true),
  contentRetention: z.literal(true),
  researchAnalytics: z.boolean().default(false),
});

export const brainDumpSchema = z.object({
  content: z.string().trim().min(3).max(6000),
});

export const nextActionSchema = z.object({
  title: z.string().trim().min(2).max(280),
  minutes: z.number().int().min(1).max(10),
  sourceBrainDumpId: z.string().uuid().optional(),
});

export const taskStatusSchema = z.enum(["ready", "done", "deferred", "archived"]);
export const mutableTaskStatusSchema = z.enum(["ready", "done", "deferred"]);

export const taskSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().trim().min(2).max(280),
  minutes: z.number().int().min(1).max(10),
  status: taskStatusSchema,
  sourceBrainDumpId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const confirmedNextActionSchema = z.object({
  taskId: z.string().uuid(),
  title: z.string().trim().min(2).max(280),
  minutes: z.number().int().min(1).max(10),
  confirmedAt: z.string().datetime(),
});

export const createNextActionResponseSchema = z.object({
  task: taskSchema,
  nextAction: confirmedNextActionSchema,
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(2).max(280).optional(),
  minutes: z.number().int().min(1).max(10).optional(),
  status: mutableTaskStatusSchema.optional(),
}).refine((value) => Object.values(value).some((field) => field !== undefined), {
  message: "At least one task field must be provided",
});

export const taskListResponseSchema = z.object({ tasks: z.array(taskSchema) });

export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type Task = z.infer<typeof taskSchema>;
export type ConfirmedNextAction = z.infer<typeof confirmedNextActionSchema>;
export type CreateNextActionResponse = z.infer<typeof createNextActionResponseSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const helpMeStartSchema = z.object({
  taskId: z.string().uuid(),
  context: z.string().trim().max(1200).optional(),
});

export const habitSchema = z.object({ title: z.string().trim().min(1).max(100) });
export const checkInSchema = z.object({
  energy: z.enum(["low", "medium", "high"]),
  note: z.string().trim().max(1000).optional(),
});

export const brainDumpAiSchema = z.object({
  acknowledgement: z.string().max(280),
  candidates: z.array(z.object({ title: z.string().min(2).max(280), minutes: z.number().int().min(1).max(10) })).min(1).max(4),
  safety: z.object({ needsHumanSupport: z.boolean(), message: z.string().max(400).optional() }),
});

export const helpMeStartAiSchema = z.object({
  acknowledgement: z.string().max(280),
  tinyStep: z.string().min(2).max(280),
  options: z.array(z.string().min(2).max(220)).max(3),
  minutes: z.number().int().min(1).max(10),
  safety: z.object({ needsHumanSupport: z.boolean(), message: z.string().max(400).optional() }),
});

export const weeklyReviewAiSchema = z.object({
  summary: z.string().max(600),
  insight: z.string().max(400),
  experiment: z.object({ title: z.string().min(2).max(160), why: z.string().max(280) }),
  safety: z.object({ needsHumanSupport: z.boolean(), message: z.string().max(400).optional() }),
});

export type BrainDumpAiOutput = z.infer<typeof brainDumpAiSchema>;
export type HelpMeStartAiOutput = z.infer<typeof helpMeStartAiSchema>;
export type WeeklyReviewAiOutput = z.infer<typeof weeklyReviewAiSchema>;

export const eventNames = [
  "brain_dump_submitted",
  "next_action_confirmed",
  "start_event",
  "focus_completed",
  "still_stuck",
  "reset_completed",
  "return_flow_completed",
] as const;
export type ProductEventName = (typeof eventNames)[number];

export const studyConditionSchema = z.enum(["control", "intervention"]);
export type StudyCondition = z.infer<typeof studyConditionSchema>;
export const studyEnrollmentSchema = z.object({ consent: z.literal(true) });
export const studySessionSchema = z.object({ frictionBefore: z.number().int().min(1).max(5) });
export const studySessionStartSchema = z.object({ startedAt: z.string().datetime().optional() });
export const studySessionCompleteSchema = z.object({ frictionAfter: z.number().int().min(1).max(5), focusOutcome: z.enum(["done", "still_stuck", "not_recorded"]) });
