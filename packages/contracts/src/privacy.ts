import { z } from "zod";

export const deleteAccountSchema = z.object({
    password: z.string().min(12).max(64)
}).strict();

export const exportSchema = z.object({
    exportedAt: z.string(),
    profile: z.unknown(),
    openSeed: z.unknown(),
    circles: z.array(z.unknown()),
    pacts: z.array(z.unknown()),
    sessions: z.array(z.unknown()),
    milestones: z.array(z.unknown())
});
