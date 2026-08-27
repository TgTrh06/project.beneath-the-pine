import type { FastifyReply, FastifyRequest } from "fastify";
import { brainDumpSchema, checkInSchema, helpMeStartSchema } from "@beneath-the-pine/contracts";
import type { CurrentUser } from "../../user/domain/UserRepository.js";
import { CreateBrainDump } from "../application/use-cases/CreateBrainDump.js";
import { CreateCheckin } from "../application/use-cases/CreateCheckin.js";
import { CreateWeeklyReview } from "../application/use-cases/CreateWeeklyReview.js";
import { HelpMeStart } from "../application/use-cases/HelpMeStart.js";
import type { CaptureRepository } from "../domain/CapturePorts.js";
import { GetQuotaSnapshot } from "../../analytics/application/use-cases/GetQuotaSnapshot.js";
import { NotFoundError } from "../../../shared/errors/NotFoundError.js";

export class CaptureController {
  public constructor(private readonly createBrainDump: CreateBrainDump, private readonly helpMeStart: HelpMeStart, private readonly createCheckin: CreateCheckin, private readonly createWeeklyReview: CreateWeeklyReview, private readonly captures: CaptureRepository, private readonly quota: GetQuotaSnapshot) {}
  public async brainDump(request: FastifyRequest, reply: FastifyReply, user: CurrentUser): Promise<unknown> { const input = brainDumpSchema.parse(request.body); return reply.code(201).send({ ...(await this.createBrainDump.execute(user.id, input.content)), quota: await this.quota.execute(user.id) }); }
  public async helpStart(request: FastifyRequest, _reply: FastifyReply, user: CurrentUser): Promise<unknown> { const input = helpMeStartSchema.parse(request.body); return { suggestion: await this.helpMeStart.execute(user.id, input.taskId, input.context), quota: await this.quota.execute(user.id) }; }
  public async checkin(request: FastifyRequest, reply: FastifyReply, user: CurrentUser): Promise<unknown> { const input = checkInSchema.parse(request.body); const checkin = await this.createCheckin.execute(user.id, input.energy, input.note); return reply.code(201).send({ checkin }); }
  public async weeklyReview(_request: FastifyRequest, reply: FastifyReply, user: CurrentUser): Promise<unknown> { return reply.code(201).send({ ...(await this.createWeeklyReview.execute(user.id)), quota: await this.quota.execute(user.id) }); }
  public async approveExperiment(request: FastifyRequest, _reply: FastifyReply, user: CurrentUser): Promise<unknown> { const experiment = await this.captures.approveExperiment((request.params as { id: string }).id, user.id); if (!experiment) throw new NotFoundError("Experiment not found"); return { experiment }; }
}
