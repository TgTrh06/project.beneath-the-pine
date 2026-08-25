import { studyEnrollmentSchema, studySessionCompleteSchema, studySessionSchema, studySessionStartSchema, type StudyCondition } from "@beneath-the-pine/contracts";
import type { FastifyReply, FastifyRequest } from "fastify";
import { NotFoundError } from "../../../shared/errors/NotFoundError.js";
import type { CurrentUser } from "../../user/domain/UserRepository.js";
import type { ResearchRepository } from "../domain/ResearchRepository.js";

const conditionFor = (enrollment: { sequence: "control_first" | "intervention_first"; consentedAt: Date }): StudyCondition => {
  const elapsedDays = (Date.now() - enrollment.consentedAt.getTime()) / 86_400_000;
  if (enrollment.sequence === "control_first") return elapsedDays < 7 ? "control" : "intervention";
  return elapsedDays < 7 ? "intervention" : "control";
};
export class ResearchController {
  public constructor(private readonly research: ResearchRepository) {}
  async get(_request: FastifyRequest, reply: FastifyReply, user: CurrentUser) { const enrollment = await this.research.findEnrollment(user.id); return reply.send({ enrollment, condition: enrollment && !enrollment.withdrawnAt ? conditionFor(enrollment) : null }); }
  async enroll(request: FastifyRequest, reply: FastifyReply, user: CurrentUser) { studyEnrollmentSchema.parse(request.body); const existing = await this.research.findEnrollment(user.id); const sequence = existing?.sequence ?? (parseInt(user.id.replace(/-/g, "").slice(-1), 16) % 2 === 0 ? "control_first" : "intervention_first"); const retentionUntil = new Date(Date.now() + 12 * 7 * 86_400_000 + 30 * 86_400_000); const enrollment = await this.research.enroll(user.id, sequence, retentionUntil); return reply.code(201).send({ enrollment, condition: conditionFor(enrollment) }); }
  async begin(request: FastifyRequest, reply: FastifyReply, user: CurrentUser) { const input = studySessionSchema.parse(request.body); const enrollment = await this.active(user.id); return reply.code(201).send({ session: await this.research.startSession(enrollment.id, conditionFor(enrollment), input.frictionBefore) }); }
  async markStarted(request: FastifyRequest, reply: FastifyReply, user: CurrentUser) { const input = studySessionStartSchema.parse(request.body); const enrollment = await this.active(user.id); const id = (request.params as { id?: string }).id; if (!id) throw new NotFoundError("Study session not found"); const session = await this.research.markStarted(id, enrollment.id, input.startedAt ? new Date(input.startedAt) : new Date()); if (!session) throw new NotFoundError("Study session not found"); return reply.send({ session }); }
  async complete(request: FastifyRequest, reply: FastifyReply, user: CurrentUser) { const input = studySessionCompleteSchema.parse(request.body); const enrollment = await this.active(user.id); const id = (request.params as { id?: string }).id; if (!id) throw new NotFoundError("Study session not found"); const session = await this.research.completeSession(id, enrollment.id, { ...input, at: new Date() }); if (!session) throw new NotFoundError("Study session not found"); return reply.send({ session }); }
  async withdraw(_request: FastifyRequest, reply: FastifyReply, user: CurrentUser) { await this.research.withdraw(user.id); return reply.code(204).send(); }
  private async active(userId: string) { const enrollment = await this.research.findEnrollment(userId); if (!enrollment || enrollment.withdrawnAt) throw new NotFoundError("Study enrollment not found"); return enrollment; }
}
