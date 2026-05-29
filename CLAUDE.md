# Graceful Boundaries

A specification for how services communicate their operational limits to humans and autonomous agents. This is a spec project, not a library.

## Key files

- `spec.md` — the full specification (conformance levels, response classes, security considerations)
- `evals/check.js` — live conformance checker and shared validation library
- `evals/test-*.js` — unit tests (200 tests across 9 files)
- `SECURITY-AUDIT.md` — threat model and security analysis (SC-1 through SC-16)
- `SKILL.md` — agentic skill for conformance assessment
- `SKILL-builder.md` — agentic skill for implementing the spec in code
- `AGENTS.md` — contributor protocol for AI agents working on this repo
- `assistant-guide.txt` — GuideCheck assistant guide for bounded contributor work
- `docs/agentic-surfaces.md` — inventory and disclosure for agent-facing surfaces

## Commands

```bash
npm test                                          # run all 200 unit tests
node evals/check.js <url>                         # check a live service
node evals/check.js <url> --json                  # machine-readable output
node evals/check.js <url> --limits-path /custom   # custom limits endpoint path
node evals/check.js <url> --check-cloaking        # advisory agent-signaled content check
python3 /path/to/guidecheck/scripts/guidecheck_verify.py assistant-guide.txt
```

## Conventions

- No npm dependencies. The eval suite is vanilla Node.js.
- Assistant-facing contributor guidance follows GuideCheck 0.3.0 and is served at `https://gracefulboundaries.dev/.well-known/assistant-guide.txt`.
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
