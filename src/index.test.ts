import { describe, expect, it, vi } from "vitest";

import { runActor } from "./index.js";

describe("Actor foundation lifecycle", () => {
  it("normalizes valid input through the Actor runtime boundary", async () => {
    const getInput = vi.fn(async () => ({ queries: ["topic"] }));
    const main = vi.fn(async (callback: () => Promise<unknown>) => callback());
    const runtime = { getInput, main } as Parameters<typeof runActor>[0];

    await expect(runActor(runtime)).resolves.toMatchObject({
      queries: ["topic"],
      maxItemsPerQuery: 20,
    });
    expect(main).toHaveBeenCalledOnce();
    expect(getInput).toHaveBeenCalledOnce();
  });

  it("passes validation failures back to Actor.main", async () => {
    const getInput = vi.fn(async () => ({ queries: [] }));
    const main = vi.fn(async (callback: () => Promise<unknown>) => callback());
    const runtime = { getInput, main } as Parameters<typeof runActor>[0];

    await expect(runActor(runtime)).rejects.toThrowError(/queries/);
    expect(main).toHaveBeenCalledOnce();
  });
});
