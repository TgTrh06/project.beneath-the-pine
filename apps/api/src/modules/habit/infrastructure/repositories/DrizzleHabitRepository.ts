import { and, count, eq, sql } from "drizzle-orm";
import type { Database } from "../../../../db/client.js";
import { habitCompletions, habits } from "../../../../db/schema.js";
import { Habit } from "../../domain/entities/Habit.js";
import type { HabitRepository } from "../../domain/repositories/HabitRepository.js";

export class DrizzleHabitRepository implements HabitRepository {
    public constructor(private readonly db: Database) { }

    public async countActive(userId: string): Promise<number> {
        const [row] = await this.db
            .select({ total: count() })
            .from(habits)
            .where(and(eq(habits.userId, userId), sql`${habits.archivedAt} IS NULL`));
        return row?.total ?? 0;
    }

    public async create(habit: Habit): Promise<Habit> {
        const [row] = await this.db
            .insert(habits)
            .values({ id: habit.id, userId: habit.userId, title: habit.getTitle() })
            .returning();
        return new Habit(row.id, row.userId, row.title);
    }

    public async findOwned(id: string, userId: string): Promise<Habit | null> {
        const [row] = await this.db
            .select()
            .from(habits)
            .where(and(eq(habits.id, id), eq(habits.userId, userId)))
            .limit(1);
        return row ? new Habit(row.id, row.userId, row.title) : null;
    }

    public async completeForDate(habitId: string, userId: string, completedOn: string): Promise<void> {
        await this.db
            .insert(habitCompletions)
            .values({ habitId, userId, completedOn })
            .onConflictDoNothing();
    }

    public async listActive(userId: string): Promise<Habit[]> {
        return (await this.db
            .select()
            .from(habits)
            .where(and(eq(habits.userId, userId), sql`${habits.archivedAt} IS NULL`)))
            .map((row) => new Habit(row.id, row.userId, row.title));
    }

    public async listAll(userId: string): Promise<Habit[]> {
        return (await this.db
            .select()
            .from(habits)
            .where(eq(habits.userId, userId)))
            .map((row) => new Habit(row.id, row.userId, row.title));
    }
}
