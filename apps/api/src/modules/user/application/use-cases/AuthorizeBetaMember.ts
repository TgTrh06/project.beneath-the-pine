import { ForbiddenError } from "../../../../shared/errors/ForbiddenError.js";
import type { AuthIdentityProvider } from "../../../auth/domain/AuthIdentity.js";
import type { CurrentUser, UserRepository } from "../../domain/UserRepository.js";

export class AuthorizeBetaMember {
  public constructor(private readonly identities: AuthIdentityProvider, private readonly users: UserRepository, private readonly adminEmails: ReadonlySet<string>) {}

  public async execute(accessToken: string | undefined): Promise<CurrentUser> {
    if (!accessToken) throw new ForbiddenError("Tài khoản này chưa có quyền private beta.");
    const identity = await this.identities.getIdentity(accessToken);
    if (!identity) throw new ForbiddenError("Tài khoản này chưa có quyền private beta.");
    await this.users.ensureProfile(identity.id);
    if (this.adminEmails.has(identity.email)) await this.users.activateAdmin(identity.id);
    if (await this.users.getMembershipStatus(identity.id) !== "active") throw new ForbiddenError("Tài khoản này chưa có quyền private beta.");
    return { ...identity, isAdmin: (await this.users.isAdmin(identity.id)) || this.adminEmails.has(identity.email) };
  }
}
