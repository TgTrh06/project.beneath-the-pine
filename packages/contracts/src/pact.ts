import { z } from "zod";
import { dateTimeSchema, durationMinutesSchema, idSchema } from "./shared";
export const pactStatusSchema = z.enum(["scheduled", "active", "completed", "cancelled", "expired"]);
export const pactResponseSchema = z.enum(["invited", "accepted", "declined"]);
export const createPactSchema = z.object({ participantIds: z.array(idSchema).min(1).max(7), startsAt: dateTimeSchema, durationMinutes: durationMinutesSchema }).strict();
export const respondPactSchema = z.object({ response: z.enum(["accepted", "declined"]) }).strict();
export const pactParticipantSchema = z.object({ accountId: idSchema, displayName: z.string().nullable(), response: pactResponseSchema });
export const pactSchema = z.object({ id: idSchema, circleId: idSchema, creatorId: idSchema.nullable(), startsAt: dateTimeSchema, durationMinutes: durationMinutesSchema, status: pactStatusSchema, sessionId: idSchema.nullable(), participants: z.array(pactParticipantSchema), createdAt: dateTimeSchema });
export type FocusPact = z.infer<typeof pactSchema>;
