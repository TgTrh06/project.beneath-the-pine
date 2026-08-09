import { randomUUID } from "node:crypto";
import { ConflictError } from "../../../../shared/errors/ConflictError.js";
import { Habit } from "../../domain/entities/Habit.js";
import type { HabitRepository } from "../../domain/repositories/HabitRepository.js";
export class CreateHabit { public constructor(private readonly habits: HabitRepository) {} public async execute(userId: string, title: string): Promise<Habit> { if (await this.habits.countActive(userId) >= 3) throw new ConflictError("A maximum of three active habits is allowed."); return this.habits.create(new Habit(randomUUID(), userId, title)); } }
