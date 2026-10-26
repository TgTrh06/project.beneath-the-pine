import { z } from 'zod';
import { durationMinutesSchema } from './shared';

export const soundscapeIdSchema = z.enum(['rain', 'forest', 'stream']);
export const focusPresetSchema = z.object({
  durationMinutes: durationMinutesSchema,
  soundscapeId: soundscapeIdSchema.nullable(),
}).strict();

export const preferencesSchema = z.object({
  sharePresence: z.boolean(),
  remindAcceptedPacts: z.boolean(),
  focusPreset: focusPresetSchema.nullable(),
});

export const updatePreferencesSchema = preferencesSchema.partial().strict()
  .refine(value => Object.values(value).some(field => field !== undefined));

export type Preferences = z.infer<typeof preferencesSchema>;
export type FocusPreset = z.infer<typeof focusPresetSchema>;
