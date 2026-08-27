import type { FastifyReply, FastifyRequest } from "fastify";
import { consentSchema } from "@beneath-the-pine/contracts";
import { RecordConsent } from "../application/use-cases/RecordConsent.js";
import type { CurrentUser } from "../domain/UserRepository.js";

export class UserController {
  public constructor(private readonly recordConsent: RecordConsent) {}
  public async consent(request: FastifyRequest, reply: FastifyReply, user: CurrentUser): Promise<unknown> {
    const input = consentSchema.parse(request.body);
    await this.recordConsent.execute(user.id, input);
    return reply.code(201).send({ ok: true });
  }
}
