import { describe, it, expect } from "vitest";
import { getPrototypeCircle } from "@/lib/circle/circle-model";

describe("luxe circle prototype model", () => {
  it("reports honest zeros with no fabricated members or properties", () => {
    expect(getPrototypeCircle()).toEqual({
      memberCount: 0,
      sharedPropertyCount: 0,
      members: [],
      sharedProperties: [],
      isPrototype: true,
    });
  });

  it("counts never contradict the record arrays", () => {
    const circle = getPrototypeCircle();
    expect(circle.members).toHaveLength(circle.memberCount);
    expect(circle.sharedProperties).toHaveLength(circle.sharedPropertyCount);
  });
});
