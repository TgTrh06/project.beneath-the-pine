import { ForbiddenError } from "../../../../shared/errors/ForbiddenError.js";
import { NotFoundError } from "../../../../shared/errors/NotFoundError.js";
import type { AuthIdentityProvider } from "../../../auth/domain/AuthIdentity.js";
import type { CurrentUser, UserRepository } from "../../../user/domain/UserRepository.js";
import type { WaitlistRepository } from "../../domain/WaitlistRepository.js";
export class ApproveWaitlistMember { public constructor(private readonly waitlist: WaitlistRepository, private readonly identities: AuthIdentityProvider, private readonly users: UserRepository, private readonly webOrigin: string) {} public async execute(admin: CurrentUser, id: string) { if (!admin.isAdmin) throw new ForbiddenError("Admin access is required."); const entry = await this.waitlist.findById(id); if (!entry) throw new NotFoundError("Waitlist entry not found"); const identity = await this.identities.invite(entry.email, `${this.webOrigin}/auth/callback`); await this.users.ensureProfile(identity.id, entry.name ?? undefined); await this.users.activateMember(identity.id, admin.id); return this.waitlist.markApproved(entry.id, admin.id); } }
