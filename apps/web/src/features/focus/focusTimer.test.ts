import { describe, expect, it } from "vitest";
import { formatFocusTime } from "./focusTimer";

describe("formatFocusTime", () => {
  it("formats minutes and seconds with leading zeroes", () => {
    expect(formatFocusTime(605)).toBe("10:05");
  });

  it("does not render negative time", () => {
    expect(formatFocusTime(-1)).toBe("00:00");
  });
});
