import type { FastifyReply, FastifyRequest } from "fastify";
import { waitlistSchema } from "@beneath-the-pine/contracts";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError.js";
import type { CurrentUser } from "../../user/domain/UserRepository.js";
import { ApproveWaitlistMember } from "../application/use-cases/ApproveWaitlistMember.js";
import { JoinWaitlist } from "../application/use-cases/JoinWaitlist.js";
import type { WaitlistRepository } from "../domain/WaitlistRepository.js";
export class BetaController { public constructor(private readonly joinWaitlist: JoinWaitlist, private readonly approveWaitlist: ApproveWaitlistMember, private readonly waitlist: WaitlistRepository) {} public async join(request: FastifyRequest, reply: FastifyReply): Promise<unknown> { const input = waitlistSchema.parse(request.body); await this.joinWaitlist.execute(input); return reply.code(201).send({ ok: true, message: "Bạn đã có trong waitlist. Mình sẽ gửi lời mời khi beta mở." }); } public async list(_request: FastifyRequest, _reply: FastifyReply, user: CurrentUser): Promise<unknown> { if (!user.isAdmin) throw new ForbiddenError("Admin access is required."); return { entries: await this.waitlist.list() }; } public async approve(request: FastifyRequest, _reply: FastifyReply, user: CurrentUser): Promise<unknown> { return { entry: await this.approveWaitlist.execute(user, (request.params as { id: string }).id), invitation: "sent" }; } }
