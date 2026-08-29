export type View = "now" | "capture" | "habits" | "review" | "study" | "settings" | "admin";
export type TaskStatus = "ready" | "done" | "deferred";
export type Task = { id: string; title: string; minutes: number; status: TaskStatus };
export type Habit = { id: string; title: string; completed: boolean };
export type Energy = "low" | "medium" | "high";
export type HelpSuggestion = { taskId: string; title: string; minutes: number };
export type WeeklyReviewContent = { summary: string; insight: string; experiment: { title: string; why: string } };
