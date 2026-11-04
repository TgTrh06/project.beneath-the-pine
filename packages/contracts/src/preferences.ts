import { z } from 'zod';
import { durationMinutesSchema } from './shared';
import { forestThresholdSchema } from './memory';

export const forestLayoutSchema = z.enum(['clearing', 'gathered', 'arc']);
export const forestArrangementSchema = z.object({
  layout: forestLayoutSchema,
  hidden: z.array(forestThresholdSchema).max(3).refine(items => new Set(items).size === items.length),
  version: z.number().int().nonnegative().max(2147483646),
}).strict();
export type ForestArrangement = z.infer<typeof forestArrangementSchema>;
export const defaultForestArrangement: ForestArrangement = { layout: 'clearing', hidden: [], version: 0 };

export const soundscapeIdSchema = z.enum(['rain', 'forest', 'stream']);
export const focusPresetSchema = z.object({
  durationMinutes: durationMinutesSchema,
  soundscapeId: soundscapeIdSchema.nullable(),
}).strict();

export const preferencesSchema = z.object({
  sharePresence: z.boolean(),
  remindAcceptedPacts: z.boolean(),
  focusPreset: focusPresetSchema.nullable(),
  forestArrangement: forestArrangementSchema,
});

export const updatePreferencesSchema = preferencesSchema.omit({ forestArrangement: true }).partial().strict()
  .refine(value => Object.values(value).some(field => field !== undefined));

export type Preferences = z.infer<typeof preferencesSchema>;
export type UpdatePreferences = z.infer<typeof updatePreferencesSchema>;
export type FocusPreset = z.infer<typeof focusPresetSchema>;
