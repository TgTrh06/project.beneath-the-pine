import { describe, expect, it } from "vitest";
import { Task } from "./Task.js";

describe("Task entity", () => {
  it("owns its completion and rename rules", () => {
    const task = new Task({ id: "task-1", userId: "user-1", title: "Viết một dòng", minutes: 5 });
    task.rename("Mở tài liệu");
    task.complete();
    expect(task.getTitle()).toBe("Mở tài liệu");
    expect(task.getStatus()).toBe("done");
    task.reopen();
    expect(task.getStatus()).toBe("ready");
  });
  it("can be made smaller without controller logic", () => {
    const task = new Task({ id: "task-1", userId: "user-1", title: "Viết báo cáo", minutes: 10 });
    task.makeSmaller();
    expect(task.getMinutes()).toBe(2);
  });
});
