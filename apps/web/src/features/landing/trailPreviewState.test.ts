import { describe, expect, it } from "vitest";
import { previewReducer, trails } from "./trailPreviewState";

describe("landing illustration transitions", () => {
  it("does not shrink before a situation is selected", () => {
    expect(previewReducer({ selected: null, small: false }, { type: "shrink" })).toEqual({ selected: null, small: false });
  });
  it.each(trails.map((_, index) => index))("selects and shrinks situation %i, then resets on a different choice", (index) => {
    const selected = previewReducer({ selected: null, small: false }, { type: "select", index });
    const small = previewReducer(selected, { type: "shrink" });
    expect(small).toEqual({ selected: index, small: true });
    expect(trails[index].smaller).not.toBe(trails[index].step);
    expect(previewReducer(small, { type: "shrink" })).toEqual(small);
    expect(previewReducer(small, { type: "select", index: (index + 1) % trails.length })).toEqual({ selected: (index + 1) % trails.length, small: false });
  });
});
