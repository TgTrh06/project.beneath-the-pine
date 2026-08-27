import type { FastifyReply, FastifyRequest } from "fastify";
import type { CurrentUser } from "../domain/UserRepository.js";
import { DeleteAccount } from "../application/use-cases/DeleteAccount.js";
import { ExportAccountData } from "../application/use-cases/ExportAccountData.js";
export class AccountController { public constructor(private readonly deleteAccount: DeleteAccount, private readonly exportAccount: ExportAccountData) {} public async export(_request: FastifyRequest, _reply: FastifyReply, user: CurrentUser): Promise<unknown> { return this.exportAccount.execute(user.id); } public async delete(_request: FastifyRequest, reply: FastifyReply, user: CurrentUser): Promise<unknown> { await this.deleteAccount.execute(user.id); return reply.code(204).send(); } }
