import { z } from "zod";
import { idSchema } from "./shared";
export const credentialsSchema = z.object({ email: z.string().trim().toLowerCase().email().max(320), password: z.string().min(12).max(64) }).strict();
export const accountSchema = z.object({ id: idSchema, email: z.string().email() });
export const accountSessionSchema = z.object({ authenticated: z.boolean(), account: accountSchema.nullable(), csrfToken: z.string().regex(/^[a-f0-9]{64}$/) }).refine(value => value.authenticated === Boolean(value.account));
export type AccountSessionPayload = z.infer<typeof accountSessionSchema>;
export type Account = z.infer<typeof accountSchema>;
