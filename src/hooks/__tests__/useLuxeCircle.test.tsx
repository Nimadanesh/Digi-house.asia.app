import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLuxeCircle } from "@/hooks/useLuxeCircle";

describe("useLuxeCircle", () => {
  it("returns the prototype empty circle without a signed-in user", () => {
    const { result } = renderHook(() => useLuxeCircle());
    expect(result.current.memberCount).toBe(0);
    expect(result.current.sharedPropertyCount).toBe(0);
    expect(result.current.members).toEqual([]);
    expect(result.current.sharedProperties).toEqual([]);
    expect(result.current.isPrototype).toBe(true);
  });
});
