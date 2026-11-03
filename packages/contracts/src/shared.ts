import { z } from "zod";

export const idSchema = z.guid();

// Preserve the v3 wire format: optional seconds and colonless UTC offsets.
// ISO date validation still rejects impossible dates and invalid leap days.
const isoDateSchema = z.iso.date();
const legacyTime = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/;
export const dateTimeSchema = z.string().refine(value => legacyTime.test(value) && isoDateSchema.safeParse(value.slice(0, 10)).success, 'Invalid datetime');
export const utcDateTimeSchema = dateTimeSchema.refine(value => value.endsWith('Z'), 'Invalid datetime');

export const idempotencyKeySchema = z.string().trim().min(8).max(128).regex(/^[A-Za-z0-9._:-]+$/);

export const durationMinutesSchema = z.union([z.literal(5), z.literal(10), z.literal(25), z.literal(50)]);

export const apiErrorSchema = z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
    details: z.array(z.unknown()).default([])
});

export type ApiErrorPayload = z.infer<typeof apiErrorSchema>;
