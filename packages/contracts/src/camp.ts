import { z } from "zod";
import { dateTimeSchema, idSchema } from "./shared";
export const campRoleSchema = z.enum(["owner", "member"]);
export const campStatusSchema = z.enum(["active", "archived"]);

export const campMemberSchema = z.object({
    accountId: idSchema,
    displayName: z.string().nullable(),
    role: campRoleSchema,
    joinedAt: dateTimeSchema
});

export const campSchema = z.object({
    id: idSchema,
    name: z.string(),
    status: campStatusSchema,
    myRole: campRoleSchema,
    memberCount: z.number().int(),
    members: z.array(campMemberSchema).optional(),
    createdAt: dateTimeSchema
});

export const createCampSchema = z.object({ name: z.string().trim().min(1).max(80) }).strict();

export const updateCampSchema = z.object({
    name: z.string().trim().min(1).max(80).optional(),
    status: campStatusSchema.optional()
}).strict().refine(value => Object.keys(value).length > 0);

export const createCampInviteSchema = z.object({
    expiresInHours: z.number().int().min(1).max(168).default(72)
}).strict();

export const transferOwnershipSchema = z.object({ accountId: idSchema }).strict();

export const campInviteSchema = z.object({
    id: idSchema,
    campId: idSchema,
    token: z.string().optional(),
    expiresAt: dateTimeSchema,
    status: z.enum(["pending", "accepted", "revoked", "expired"])
});

export type Camp = z.infer<typeof campSchema>;

export const inviteListQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(50).default(20),
    cursor: z.string().min(1).max(1000).optional()
}).strict();

export type InviteListQuery = z.infer<typeof inviteListQuerySchema>;

export type InviteListItem = {
    id: string;
    campId: string;
    createdAt: string;
    expiresAt: string;
    status: 'pending' | 'accepted' | 'revoked' | 'expired'
};

export type InvitePage = {
    items: InviteListItem[];
    nextCursor: string | null
};

export type CampInvitePreview = {
    campName: string;
    inviterName: string | null;
};
