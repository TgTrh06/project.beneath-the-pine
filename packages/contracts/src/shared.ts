import { z } from "zod";
export const idSchema = z.string().uuid();
export const dateTimeSchema = z.string().datetime({ offset: true });
export const idempotencyKeySchema = z.string().trim().min(8).max(128).regex(/^[A-Za-z0-9._:-]+$/);
export const durationMinutesSchema = z.union([z.literal(5), z.literal(10), z.literal(25), z.literal(50)]);
export const apiErrorSchema = z.object({ code: z.string(), message: z.string(), requestId: z.string().optional(), details: z.array(z.unknown()).default([]) });
export type ApiErrorPayload = z.infer<typeof apiErrorSchema>;
