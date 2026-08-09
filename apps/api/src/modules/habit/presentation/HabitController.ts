import type { FastifyReply, FastifyRequest } from "fastify";
import { habitSchema } from "@beneath-the-pine/contracts";
import type { CurrentUser } from "../../user/domain/UserRepository.js";
import { CompleteHabit } from "../application/use-cases/CompleteHabit.js";
import { CreateHabit } from "../application/use-cases/CreateHabit.js";

export class HabitController {
    public constructor(
        private readonly createHabit: CreateHabit,
        private readonly completeHabit: CompleteHabit,
    ) { }

    public async create(request: FastifyRequest, reply: FastifyReply, user: CurrentUser): Promise<unknown> {
        const input = habitSchema.parse(request.body);
        const habit = await this.createHabit.execute(user.id, input.title);
        return reply.code(201).send({
            habit: { id: habit.id, userId: habit.userId, title: habit.getTitle() },
        });
    }

    public async complete(request: FastifyRequest, _reply: FastifyReply, user: CurrentUser): Promise<unknown> {
        return {
            ok: true,
            completedOn: await this.completeHabit.execute(user.id, (request.params as { id: string }).id),
        };
    }
}