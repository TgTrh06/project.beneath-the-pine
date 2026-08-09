import type { FastifyReply, FastifyRequest } from "fastify";
import { eventNames } from "@beneath-the-pine/contracts";
import { ValidationError } from "../../../shared/errors/ValidationError.js";
import type { CurrentUser } from "../../user/domain/UserRepository.js";
import { RecordProductEvent } from "../application/use-cases/RecordProductEvent.js";
export class AnalyticsController { public constructor(private readonly recordEvent: RecordProductEvent) {} public async event(request: FastifyRequest, reply: FastifyReply, user: CurrentUser): Promise<unknown> { const name = (request.body as { name?: string }).name; if (!name || !eventNames.includes(name as (typeof eventNames)[number])) throw new ValidationError("Invalid event"); await this.recordEvent.execute(user.id, name as (typeof eventNames)[number]); return reply.code(204).send(); } }
