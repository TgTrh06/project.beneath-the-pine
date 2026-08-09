import { ValidationError } from "../../../../shared/errors/ValidationError.js";

export type TaskState = "ready" | "done" | "deferred" | "archived";
export type TaskProps = { id: string; userId: string; title: string; minutes: number; status?: TaskState; sourceBrainDumpId?: string | null; createdAt?: Date };

export class Task {
  private title: string;
  private minutes: number;
  private status: TaskState;
  public readonly id: string;
  public readonly userId: string;
  public readonly sourceBrainDumpId: string | null;

  public constructor(props: TaskProps) { this.id = props.id; this.userId = props.userId; this.sourceBrainDumpId = props.sourceBrainDumpId ?? null; this.title = props.title.trim(); this.minutes = props.minutes; this.status = props.status ?? "ready"; this.assertValid(); }
  public rename(title: string): void { this.title = title.trim(); this.assertValid(); }
  public complete(): void { this.status = "done"; }
  public reopen(): void { this.status = "ready"; }
  public defer(): void { this.status = "deferred"; }
  public makeSmaller(): void { this.minutes = Math.min(2, this.minutes); }
  public getTitle(): string { return this.title; }
  public getMinutes(): number { return this.minutes; }
  public getStatus(): TaskState { return this.status; }
  private assertValid(): void { if (!this.title) throw new ValidationError("Task title cannot be empty"); if (!Number.isInteger(this.minutes) || this.minutes < 1 || this.minutes > 10) throw new ValidationError("Task duration must be between 1 and 10 minutes"); }
}
