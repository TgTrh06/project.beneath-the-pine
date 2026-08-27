import { describe, expect, it } from "vitest";
import { CreateTask } from "./CreateTask.js";
import type { TaskRepository } from "../../domain/repositories/TaskRepository.js";
import type { Task } from "../../domain/entities/Task.js";

describe("CreateTask", () => {
  it("depends on the repository abstraction", async () => {
    let stored: Task | null = null;
    const repository: TaskRepository = { create: async (task) => (stored = task, task), findByIdForUser: async () => null, listReady: async () => [], listAll: async () => [], update: async (task) => task };
    const result = await new CreateTask(repository).execute({ userId: "user-1", title: "Mở tài liệu", minutes: 5 });
    expect(result.getTitle()).toBe("Mở tài liệu");
    expect(stored).toBe(result);
  });
});
