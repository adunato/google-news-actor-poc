import { Actor, log } from "apify";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { NormalizedActorInput } from "./contracts.js";
import { normalizeActorInput } from "./input.js";

type ActorRuntime = Pick<typeof Actor, "getInput" | "main">;

/** Run the Actor foundation without making requests or writing result records. */
export async function runActor(
  runtime: ActorRuntime = Actor,
): Promise<NormalizedActorInput | undefined> {
  return runtime.main(async () => {
    const input = await runtime.getInput<unknown>();
    const normalizedInput = normalizeActorInput(input);

    log.info("Actor input accepted", {
      queryCount: normalizedInput.queries.length,
      maxItemsPerQuery: normalizedInput.maxItemsPerQuery,
      language: normalizedInput.language,
      country: normalizedInput.country,
      dateRange: normalizedInput.dateRange,
      dedupe: normalizedInput.dedupe,
    });

    return normalizedInput;
  });
}

function isEntrypoint(): boolean {
  const entrypoint = process.argv[1];
  return (
    entrypoint !== undefined &&
    fileURLToPath(import.meta.url) === resolve(entrypoint)
  );
}

if (isEntrypoint()) {
  await runActor();
}
