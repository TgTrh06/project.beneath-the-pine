import type { HelpMeStartAiOutput } from "@beneath-the-pine/contracts";
import { NotFoundError } from "../../../../shared/errors/NotFoundError.js";
import type { ConsumeAiQuota } from "../../../analytics/application/use-cases/ConsumeAiQuota.js";
import type { TaskRepository } from "../../../task/domain/repositories/TaskRepository.js";
import type { CaptureRepository, GrowthAssistant } from "../../domain/CapturePorts.js";
export class HelpMeStart { public constructor(private readonly tasks: TaskRepository, private readonly captures: CaptureRepository, private readonly assistant: GrowthAssistant, private readonly quota: ConsumeAiQuota) {} public async execute(userId: string, taskId: string, context?: string): Promise<HelpMeStartAiOutput> { await this.quota.check(userId, "help_me_start"); const task = await this.tasks.findByIdForUser(taskId, userId); if (!task) throw new NotFoundError("Task not found"); const result = await this.assistant.helpStart(`${task.getTitle()}\n${context ?? ""}`); await this.quota.commit(userId, "help_me_start"); return result; } }
