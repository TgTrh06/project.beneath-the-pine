import { ValidationError } from "../../../../shared/errors/ValidationError.js";
import type { FocusRepository, TaskRepository } from "../../domain/repositories/TaskRepository.js";
import { NotFoundError } from "../../../../shared/errors/NotFoundError.js";
export class StartFocusSession { public constructor(private readonly tasks: TaskRepository, private readonly focus: FocusRepository) {} public async execute(userId: string, taskId: string, plannedMinutes: number) { if (!Number.isInteger(plannedMinutes) || plannedMinutes < 1 || plannedMinutes > 30) throw new ValidationError("Focus duration must be between 1 and 30 minutes"); if (!(await this.tasks.findByIdForUser(taskId, userId))) throw new NotFoundError("Task not found"); return this.focus.start({ userId, taskId, plannedMinutes }); } }
