import { z } from "zod";

export const profileSchema = z.object({
    displayName: z.string().trim().min(1).max(80).nullable(),
    timezone: z.string().trim().min(1).max(64)
});

export const updateProfileSchema = z.object({
    displayName: z.string().trim().min(1).max(80).nullable().optional(),
    timezone: z.string().trim().min(1).max(64).optional()
}).strict().refine(value => Object.values(value).some(field => field !== undefined));

export type Profile = z.infer<typeof profileSchema>;
