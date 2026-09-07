#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(repoRoot, "build", "clawhub-graceful-boundaries");

const packageJson = JSON.parse(await readFile(path.join(repoRoot, "package.json"), "utf8"));
const spec = await readFile(path.join(repoRoot, "spec.md"), "utf8");
const skill = await readFile(path.join(repoRoot, "SKILL.md"), "utf8");

const specDate = spec.match(/^\*\*Date:\*\* (\d{4}-\d{2}-\d{2})$/m)?.[1];
const skillVersion = skill.match(/^  version: (\d+)$/m)?.[1];
if (!specDate || !skillVersion) throw new Error("Could not derive release date or audit skill version");

const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim();
const trackedStatus = execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], {
  cwd: repoRoot,
  encoding: "utf8",
}).trim();
const sourceState = trackedStatus ? "working-tree" : "commit";
const skillHash = createHash("sha256").update(skill).digest("hex");

const manifest = `# Derived ClawHub consumer manifest for the audit-only skill.
# The canonical multi-skill repository manifest remains at /MANIFEST.yaml.

bundle: graceful-boundaries-audit
bundle_version: ${skillVersion}
bundle_date: ${specDate}
license: MIT-0
license_text: MIT-0
license_code_examples: MIT-0
description: >
  Audit APIs and websites for Graceful Boundaries conformance and provide
  evidence-based guidance for improving operational-limit communication.

origin:
  repository: https://github.com/snapsynapse/graceful-boundaries
  repository_commit: ${commit}
  repository_release: ${packageJson.version}
  source_state: ${sourceState}
  canonical_url: https://gracefulboundaries.dev
  source_file: SKILL.md
  license_text: CC-BY-4.0
  license_code_examples: MIT

distribution:
  target: ClawHub
  listing_slug: graceful-boundaries
  registry_version: ${packageJson.version}
  release_tag: latest

files:
  - path: SKILL.md
    role: skill
    version: ${skillVersion}
    hash: sha256:${skillHash}
`;

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, "SKILL.md"), skill);
await writeFile(path.join(outputDir, "MANIFEST.yaml"), manifest);

console.log(`Built ClawHub audit package ${packageJson.version} (${sourceState}) at ${outputDir}`);
