import { z } from "zod";

export const assistanceCapabilitySchema = z.enum(["assisted_start", "open_seed_draft"]);
export type AssistanceCapability = z.infer<typeof assistanceCapabilitySchema>;

export const assistanceRequestSchema = z.discriminatedUnion("capability", [
  z.object({ capability: z.literal("assisted_start"), description: z.string().trim().min(1).max(280) }).strict(),
  z.object({ capability: z.literal("open_seed_draft"), context: z.string().trim().min(1).max(500) }).strict()
]);
export type AssistanceRequest = z.infer<typeof assistanceRequestSchema>;

export const assistanceOutputSchema = z.object({
  capability: assistanceCapabilitySchema,
  version: z.literal("1"),
  needsHumanSupport: z.boolean(),
  message: z.string().max(300).optional(),
  activationStep: z.string().trim().min(1).max(280).optional(),
  openSeedDraft: z.string().trim().min(1).max(500).optional(),
  estimatedMinutes: z.union([z.literal(3), z.literal(5), z.literal(10)]).optional(),
  fallback: z.enum(["manual_step", "take_break", "stop_and_return"])
}).strict().superRefine((output, context) => {
  if (output.needsHumanSupport) {
    if (!output.message || output.activationStep || output.openSeedDraft || output.estimatedMinutes) context.addIssue({ code: "custom", message: "Invalid boundary output" });
  } else if (output.message) {
    if (output.activationStep || output.openSeedDraft || output.estimatedMinutes) context.addIssue({ code: "custom", message: "Invalid fallback output" });
  } else if (output.capability === "assisted_start") {
    if (!output.activationStep || !output.estimatedMinutes || output.openSeedDraft || output.message) context.addIssue({ code: "custom", message: "Invalid start output" });
  } else if (!output.openSeedDraft || output.activationStep || output.estimatedMinutes || output.message) {
    context.addIssue({ code: "custom", message: "Invalid seed output" });
  }
});
export type AssistanceOutput = z.infer<typeof assistanceOutputSchema>;

export const assistanceResponseSchema = z.object({
  status: z.enum(["suggestion", "fallback", "boundary"]),
  output: assistanceOutputSchema,
  suggestionId: z.string().uuid().optional()
}).strict().superRefine((response, context) => {
  if (response.status === "suggestion" && (!response.suggestionId || response.output.message || response.output.needsHumanSupport)) context.addIssue({ code: "custom", message: "Invalid suggestion response" });
  if (response.status !== "suggestion" && (response.suggestionId || !response.output.message || response.output.needsHumanSupport !== (response.status === "boundary"))) context.addIssue({ code: "custom", message: "Invalid fallback response" });
});
export type AssistanceResponse = z.infer<typeof assistanceResponseSchema>;

export const assistanceInteractionSchema = z.object({
  capability: assistanceCapabilitySchema,
  suggestionId: z.string().uuid(),
  action: z.enum(["viewed", "selected", "edited", "discarded"])
}).strict();
export type AssistanceInteraction = z.infer<typeof assistanceInteractionSchema>;
