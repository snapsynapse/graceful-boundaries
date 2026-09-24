#!/usr/bin/env node

/**
 * npx entry point for the Graceful Boundaries conformance checker.
 *
 * Usage:
 *   npx graceful-boundaries check <base-url> [--limits-path /path] [--json] [--check-cloaking] [--min-level N]
 *   npx graceful-boundaries <base-url>          # "check" subcommand is optional
 *
 * Thin wrapper around evals/check.js. All flags pass through unchanged.
 */

const { main } = require("../evals/check.js");

// Strip the optional "check" subcommand so check.js sees the URL as the first arg.
if (process.argv[2] === "check") {
  process.argv.splice(2, 1);
}

main({ command: "npx graceful-boundaries check" }).catch((error) => {
  console.error(error);
  process.exit(1);
});
