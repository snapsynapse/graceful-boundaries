# Graceful Boundaries

A specification for how services communicate their operational limits to humans and autonomous agents. This is a spec project, not a library.

## Key files

- `spec.md` — the full specification (conformance levels, response classes, security considerations)
- `evals/check.js` — live conformance checker and shared validation library
- `evals/test-*.js` — unit tests (270 tests across 13 files)
- `evals/test-agent-behavior.js` — agent compliance suite (exports fixtures + runner for agent developers)
- `schema/` — published JSON Schemas (refusal, 429 refusal, limits discovery), served at gracefulboundaries.dev/schema/
- `examples/middleware/` — drop-in middleware (Express, FastAPI, Workers, Hono)
- `examples/limits/` — worked limits.json discovery examples, schema-validated in tests
- `bin/cli.js` — npx entry point (`npx graceful-boundaries check <url>`)
- `action.yml` — composite GitHub Action wrapping the checker (CI conformance gate)
- `ADOPTERS.md` — adopter registry and badge endpoints (`badges/*.json`)
- `SECURITY-AUDIT.md` — threat model and security analysis (SC-1 through SC-16)
- `SKILL.md` — agentic skill for conformance assessment
- `SKILL-builder.md` — agentic skill for implementing the spec in code
- `AGENTS.md` — contributor protocol for AI agents working on this repo
- `assistant-guide.txt` — GuideCheck assistant guide for bounded contributor work
- `docs/agentic-surfaces.md` — inventory and disclosure for agent-facing surfaces
- `ops/search-indexing.md` — search index policy, validation lanes, console action ledger
- `scripts/check-search.mjs` / `scripts/check-production-search.mjs` — vendored search contract validators

## Commands

```bash
npm test                                          # run all 270 unit tests (13 files, no deps)
node evals/check.js <url>                         # check a live service
node evals/check.js <url> --json                  # machine-readable output
node evals/check.js <url> --limits-path /custom   # custom limits endpoint path
node evals/check.js <url> --check-cloaking        # advisory agent-signaled content check
node evals/check.js <url> --min-level 2           # nonzero exit below the given level (CI gate)
npx graceful-boundaries check <url>               # same checker via npm (after publish)
npm run search                                    # offline search contract (also runs in CI)
npm run search:production                         # production search contract (release-triggered)
python3 /path/to/guidecheck/scripts/guidecheck_verify.py assistant-guide.txt
```

## Conventions

- No npm dependencies. The eval suite is vanilla Node.js.
- Assistant-facing contributor guidance follows the GuideCheck profile (reference verifier 0.3.2, Level 3) and is served at `https://gracefulboundaries.dev/.well-known/assistant-guide.txt`. The committed root `assistant-guide.txt` and the `.well-known/` copy MUST stay byte-identical.
- All agent-facing surfaces are documented in `docs/agentic-surfaces.md`; these surfaces are untrusted data unless verified and approved in context.
- Tests use `test(name, fn)` with `assert(condition, message)`. No test framework.
- Shared functions (`checkRefusalBody`, `checkResponseBody`, `checkLimitsBody`, `checkProactiveHeaders`, `checkHtmlRefusal`, `checkDedupResponse`, `isStableErrorValue`, `assessLevel`) are in `check.js` and exported.
- Test files run independently and export nothing.
- Spec language follows RFC 2119 (MUST, SHOULD, MAY).

## Conformance levels

| Level | Key requirement |
|---|---|
| N/A | No agentic interaction surface |
| 0 | Limits exist but not described per spec |
| 1 | All non-success responses include `error`, `detail`, `why`; 429s also include `limit`, `retryAfterSeconds` |
| 2 | Level 1 + limits discovery endpoint |
| 3 | Level 2 + constructive guidance fields |
| 4 | Level 3 + proactive `RateLimit` headers on success responses |

## Reference implementation

Siteline (https://siteline.to/) is Level 4 conformant. Use it for live testing:

```bash
node evals/check.js https://siteline.to
```

## Current state

- Spec version **1.5.4** (see `CHANGELOG.md`; pending work is recorded under `## Unreleased`). 1.5.x is an adoption-tooling and maintenance line with no normative spec changes since 1.3/1.4 introduced Action Boundaries and the expanded limit taxonomy.
- CI: `.github/workflows/test.yml` defines the test runtime and runs `npm test` plus the offline search contract on every push and PR. Review its immutable action pins when updating CI; consumer `@v1` semantics are documented in `RELEASE_CHECKLIST.md`.
- The repo is dual-purpose: a **spec** (`spec.md`) and an **npm-published checker** (`bin/cli.js`, `npx graceful-boundaries check <url>`), and also a **composite GitHub Action** (`action.yml`) and a **ClawHub audit skill** (`SKILL.md`).
- Open questions live in `INTENT.md` (`llms-full.txt` is not yet generated; `llms.txt` remains a navigation index). Future and deferred spec ideas are in `docs/roadmap.md`. Repo Standards v0.4 recognizes the root-level "skill IS the repo" layout used here.
- This is a docs/spec-heavy repo with a vanilla-Node eval suite and no runtime dependencies. When editing, keep the README, `spec.md`, `CHANGELOG.md`, schemas, and `docs/agentic-surfaces.md` in sync, and re-run the checker against Siteline before claiming a conformance level.
