import { randomUUID } from "node:crypto";
import { Task } from "../../domain/entities/Task.js";
import type { TaskRepository } from "../../domain/repositories/TaskRepository.js";
export type CreateTaskInput = { userId: string; title: string; minutes: number; sourceBrainDumpId?: string };
export class CreateTask { public constructor(private readonly tasks: TaskRepository) {} public async execute(input: CreateTaskInput): Promise<Task> { return this.tasks.create(new Task({ ...input, id: randomUUID() })); } }
