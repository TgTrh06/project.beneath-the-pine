import type { FastifyReply, FastifyRequest } from "fastify";
import { nextActionSchema } from "@beneath-the-pine/contracts";
import type { CurrentUser } from "../../user/domain/UserRepository.js";
import { CreateTask } from "../application/use-cases/CreateTask.js";
import { FinishFocusSession } from "../application/use-cases/FinishFocusSession.js";
import { StartFocusSession } from "../application/use-cases/StartFocusSession.js";
import { ValidationError } from "../../../shared/errors/ValidationError.js";

export class TaskController {
  public constructor(private readonly createTask: CreateTask, private readonly startFocus: StartFocusSession, private readonly finishFocus: FinishFocusSession) {}
  public async createNextAction(request: FastifyRequest, reply: FastifyReply, user: CurrentUser): Promise<unknown> { const input = nextActionSchema.parse(request.body); const task = await this.createTask.execute({ userId: user.id, ...input }); return reply.code(201).send({ task: { id: task.id, userId: task.userId, title: task.getTitle(), minutes: task.getMinutes(), status: task.getStatus(), sourceBrainDumpId: task.sourceBrainDumpId }, nextAction: { taskId: task.id, title: task.getTitle(), minutes: task.getMinutes(), confirmedAt: new Date() } }); }
  public async startSession(request: FastifyRequest, reply: FastifyReply, user: CurrentUser): Promise<unknown> { const body = request.body as { taskId?: string; plannedMinutes?: number }; const session = await this.startFocus.execute(user.id, body.taskId ?? "", body.plannedMinutes ?? 0); return reply.code(201).send({ session }); }
  public async finishSession(request: FastifyRequest, _reply: FastifyReply, user: CurrentUser): Promise<unknown> { const body = request.body as { outcome?: "done" | "still_stuck" | "paused" }; if (!body.outcome) throw new ValidationError("Outcome is required"); return { session: await this.finishFocus.execute(user.id, (request.params as { id: string }).id, body.outcome) }; }
}
