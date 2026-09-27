import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { log } from "node:console";
import { cwd } from "node:process";

const root = cwd();
const actorConfigPath = resolve(root, ".actor/actor.json");

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not read valid JSON from ${path}: ${message}`);
  }
}

if (!existsSync(resolve(root, "dist/index.js"))) {
  throw new Error("Built Actor entry point is missing: dist/index.js");
}

const actorConfig = readJson(actorConfigPath);
if (actorConfig.actorSpecification !== 1 || !actorConfig.name) {
  throw new Error(".actor/actor.json must declare specification 1 and a name");
}

for (const key of ["dockerfile", "readme", "input", "output"]) {
  if (typeof actorConfig[key] !== "string") {
    throw new Error(`.actor/actor.json must declare a ${key} path`);
  }
  const path = resolve(root, ".actor", actorConfig[key].replace(/^\.\//, ""));
  if (!existsSync(path))
    throw new Error(`Actor ${key} file is missing: ${path}`);
  if (key === "input" || key === "output") readJson(path);
}

if (!actorConfig.storages?.dataset) {
  throw new Error(".actor/actor.json must declare the default dataset schema");
}
const datasetPath = resolve(
  root,
  ".actor",
  actorConfig.storages.dataset.replace(/^\.\//, ""),
);
if (!existsSync(datasetPath)) {
  throw new Error(`Actor dataset schema is missing: ${datasetPath}`);
}
readJson(datasetPath);

log("Actor package smoke check passed.");
