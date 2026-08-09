import { describe, expect, it } from "vitest";
import { CreateHabit } from "./CreateHabit.js";
import type { HabitRepository } from "../../domain/repositories/HabitRepository.js";

describe("CreateHabit", () => {
  it("rejects a fourth active habit using a mock repository", async () => {
    const repository: HabitRepository = { countActive: async () => 3, create: async (habit) => habit, findOwned: async () => null, completeForDate: async () => undefined, listActive: async () => [], listAll: async () => [] };
    await expect(new CreateHabit(repository).execute("user-1", "Một habit nữa")).rejects.toMatchObject({ code: "CONFLICT" });
  });
});
