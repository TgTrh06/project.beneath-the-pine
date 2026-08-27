import type { FastifyReply, FastifyRequest } from "fastify";
import { BootstrapUser } from "../application/use-cases/BootstrapUser.js";
import type { CurrentUser } from "../domain/UserRepository.js";
export class BootstrapController { public constructor(private readonly bootstrap: BootstrapUser) {} public async get(_request: FastifyRequest, _reply: FastifyReply, user: CurrentUser): Promise<unknown> { return this.bootstrap.execute(user); } }
