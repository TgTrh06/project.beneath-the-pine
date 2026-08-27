import { NotFoundError } from "../../../../shared/errors/NotFoundError.js";
import type { HabitRepository } from "../../domain/repositories/HabitRepository.js";
export class CompleteHabit { public constructor(private readonly habits: HabitRepository, private readonly today: () => string) {} public async execute(userId: string, habitId: string): Promise<string> { if (!(await this.habits.findOwned(habitId, userId))) throw new NotFoundError("Habit not found"); const date = this.today(); await this.habits.completeForDate(habitId, userId, date); return date; } }
