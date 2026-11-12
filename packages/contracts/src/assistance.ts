import { z } from "zod";
import { idSchema } from "./shared";

export const assistanceCapabilitySchema = z.enum(["assisted_start", "open_seed_draft", "stuck_recovery"]);
export type AssistanceCapability = z.infer<typeof assistanceCapabilitySchema>;
export const stuckModeSchema = z.enum(["too_large", "unclear_next_step", "distracted", "low_energy"]);
export type StuckMode = z.infer<typeof stuckModeSchema>;
export const assistanceConfigSchema = z.object({
  enabled: z.boolean(), capabilities: z.array(assistanceCapabilitySchema),
  processing: z.enum(["disabled", "self_hosted", "external"])
}).strict();
export type AssistanceConfig = z.infer<typeof assistanceConfigSchema>;

export const assistanceRequestSchema = z.discriminatedUnion("capability", [
  z.object({ capability: z.literal("assisted_start"), description: z.string().trim().min(1).max(280) }).strict(),
  z.object({ capability: z.literal("open_seed_draft"), context: z.string().trim().min(1).max(500) }).strict(),
  z.object({ capability: z.literal("stuck_recovery"), currentStep: z.string().trim().min(1).max(280), stuckMode: stuckModeSchema }).strict()
]);
export type AssistanceRequest = z.infer<typeof assistanceRequestSchema>;

export const assistanceOutputSchema = z.object({
  capability: assistanceCapabilitySchema,
  version: z.literal("1"),
  needsHumanSupport: z.boolean(),
  message: z.string().trim().min(1).max(300).optional(),
  activationStep: z.string().trim().min(1).max(280).optional(),
  openSeedDraft: z.string().trim().min(1).max(500).optional(),
  estimatedMinutes: z.union([z.literal(3), z.literal(5), z.literal(10)]).optional(),
  recoveryAction: z.enum(["smaller_step", "different_approach", "take_break"]).optional(),
  recoveryStep: z.string().trim().min(1).max(280).optional(),
  breakMinutes: z.literal(2).optional(),
  fallback: z.enum(["manual_step", "take_break", "stop_and_return"])
}).strict().superRefine((output, context) => {
  const recovery = output.recoveryAction !== undefined || output.recoveryStep !== undefined || output.breakMinutes !== undefined;
  if (recovery && (output.capability !== "stuck_recovery" || output.needsHumanSupport || output.message !== undefined)) {
    context.addIssue({ code: "custom", message: "Unexpected recovery fields" });
  }
  if (output.needsHumanSupport) {
    if (!output.message || output.activationStep || output.openSeedDraft || output.estimatedMinutes) context.addIssue({ code: "custom", message: "Invalid boundary output" });
  } else if (output.message) {
    if (output.activationStep || output.openSeedDraft || output.estimatedMinutes) context.addIssue({ code: "custom", message: "Invalid fallback output" });
  } else if (output.capability === "assisted_start") {
    if (!output.activationStep || !output.estimatedMinutes || output.openSeedDraft || output.message) context.addIssue({ code: "custom", message: "Invalid start output" });
  } else if (output.capability === "stuck_recovery") {
    const invalid = output.activationStep !== undefined || output.openSeedDraft !== undefined || output.estimatedMinutes !== undefined;
    const validBreak = output.recoveryAction === "take_break" && output.breakMinutes === 2 && output.recoveryStep === undefined && output.fallback === "take_break";
    const validStep = (output.recoveryAction === "smaller_step" || output.recoveryAction === "different_approach") && !!output.recoveryStep && output.breakMinutes === undefined && output.fallback === "manual_step";
    if (invalid || (!validBreak && !validStep)) context.addIssue({ code: "custom", message: "Invalid recovery output" });
  } else if (!output.openSeedDraft || output.activationStep || output.estimatedMinutes || output.message) {
    context.addIssue({ code: "custom", message: "Invalid seed output" });
  }
});
export type AssistanceOutput = z.infer<typeof assistanceOutputSchema>;

export const assistanceResponseSchema = z.object({
  status: z.enum(["suggestion", "fallback", "boundary"]),
  output: assistanceOutputSchema,
  suggestionId: idSchema.optional(),
  reason: z.enum(['quota', 'context_expired', 'invalid_output', 'timeout', 'unavailable']).optional()
}).strict().superRefine((response, context) => {
  if (response.reason && response.status !== 'fallback') context.addIssue({ code: 'custom', message: 'Reason requires fallback' });
  if (response.status === "suggestion" && (!response.suggestionId || response.output.message || response.output.needsHumanSupport)) context.addIssue({ code: "custom", message: "Invalid suggestion response" });
  if (response.status !== "suggestion" && (response.suggestionId || !response.output.message || response.output.needsHumanSupport !== (response.status === "boundary"))) context.addIssue({ code: "custom", message: "Invalid fallback response" });
});
export type AssistanceResponse = z.infer<typeof assistanceResponseSchema>;

export const assistanceInteractionSchema = z.object({
  capability: assistanceCapabilitySchema,
  suggestionId: idSchema,
  action: z.enum(["viewed", "selected", "edited", "discarded"]),
  reason: z.enum(["irrelevant", "too_large_or_vague", "unclear", "inappropriate", "other"]).optional()
}).strict().superRefine((value, context) => {
  if (value.reason && value.action !== 'discarded') context.addIssue({ code: 'custom', message: 'Reason requires discarded action' });
});
export type AssistanceInteraction = z.infer<typeof assistanceInteractionSchema>;
