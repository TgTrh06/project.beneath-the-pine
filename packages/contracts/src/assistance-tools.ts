import { z } from 'zod';
import { assistanceRequestSchema } from './assistance';

export const assistanceToolNameSchema = z.enum(['get_current_focus_context', 'get_my_open_seed']);
export type AssistanceToolName = z.infer<typeof assistanceToolNameSchema>;
export const focusContextSchema = z.object({
  kind: z.enum(['solo', 'pact']), status: z.literal('active'),
  intention: z.string().max(280).nullable(), durationMinutes: z.number().int().positive(),
  endsAt: z.iso.datetime(), presence: z.enum(['active', 'break', 'disconnected'])
}).strict().nullable();
export type OwnFocusContext = z.infer<typeof focusContextSchema>;
export const seedContextSchema = z.object({ text: z.string().max(500) }).strict().nullable();
export const assistanceToolPreviewSchema = z.discriminatedUnion('name', [
  z.object({ name: z.literal('get_current_focus_context'), data: focusContextSchema, consentToken: z.string().max(512) }).strict(),
  z.object({ name: z.literal('get_my_open_seed'), data: seedContextSchema, consentToken: z.string().max(512) }).strict()
]);
export const assistanceContextSchema = z.object({ tools: z.array(assistanceToolPreviewSchema).max(2) }).strict();
export type AssistanceContext = z.infer<typeof assistanceContextSchema>;
export const assistanceToolGrantSchema = z.object({ name: assistanceToolNameSchema, consentToken: z.string().min(1).max(512) }).strict();
export const assistanceToolRequestSchema = z.object({ request: assistanceRequestSchema,
  grants: z.array(assistanceToolGrantSchema).min(1).max(2).refine(items => new Set(items.map(i => i.name)).size === items.length)
}).strict();
export type AssistanceToolRequest = z.infer<typeof assistanceToolRequestSchema>;
export const assistanceToolsConfigSchema = z.object({ enabled: z.boolean(), provider: z.enum(['gemini', 'openrouter', 'openai', 'local', 'disabled']),
  tools: z.array(assistanceToolNameSchema).max(2) }).strict();
export type AssistanceToolsConfig = z.infer<typeof assistanceToolsConfigSchema>;
