import { and, desc, eq } from "drizzle-orm";
import type { Database } from "../../../../db/client.js";
import { focusSessions, tasks } from "../../../../db/schema.js";
import { Task, type TaskProps } from "../../domain/entities/Task.js";
import type { FocusRepository, TaskRepository } from "../../domain/repositories/TaskRepository.js";

const toTask = (row: TaskProps): Task => new Task(row);
export class DrizzleTaskRepository implements TaskRepository, FocusRepository {
  public constructor(private readonly db: Database) {}
  public async create(task: Task): Promise<Task> { const [row] = await this.db.insert(tasks).values({ id: task.id, userId: task.userId, title: task.getTitle(), minutes: task.getMinutes(), status: task.getStatus(), sourceBrainDumpId: task.sourceBrainDumpId }).returning(); return toTask(row); }
  public async findByIdForUser(id: string, userId: string): Promise<Task | null> { const [row] = await this.db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).limit(1); return row ? toTask(row) : null; }
  public async listReady(userId: string, limit: number): Promise<Task[]> { return (await this.db.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.status, "ready"))).orderBy(desc(tasks.createdAt)).limit(limit)).map(toTask); }
  public async listAll(userId: string): Promise<Task[]> { return (await this.db.select().from(tasks).where(eq(tasks.userId, userId))).map(toTask); }
  public async update(task: Task): Promise<Task> { const [row] = await this.db.update(tasks).set({ title: task.getTitle(), minutes: task.getMinutes(), status: task.getStatus(), updatedAt: new Date() }).where(and(eq(tasks.id, task.id), eq(tasks.userId, task.userId))).returning(); return toTask(row); }
  public async start(input: { userId: string; taskId: string; plannedMinutes: number }): Promise<{ id: string; userId: string; taskId: string | null; plannedMinutes: number; startedAt: Date }> { const [row] = await this.db.insert(focusSessions).values(input).returning(); return row; }
  public async finish(id: string, userId: string, outcome: "done" | "still_stuck" | "paused"): Promise<{ id: string; taskId: string | null; outcome: string | null } | null> { const [row] = await this.db.update(focusSessions).set({ outcome, completedAt: new Date() }).where(and(eq(focusSessions.id, id), eq(focusSessions.userId, userId))).returning({ id: focusSessions.id, taskId: focusSessions.taskId, outcome: focusSessions.outcome }); return row ?? null; }
}
