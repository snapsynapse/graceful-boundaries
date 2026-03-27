# Graceful Boundaries

A specification for how services communicate their operational limits to humans and autonomous agents. This is a spec project, not a library.

## Key files

- `spec.md` — the full specification (conformance levels, response classes, security considerations)
- `evals/check.js` — live conformance checker and shared validation library
- `evals/test-*.js` — unit tests (131 tests across 7 files)
- `SECURITY-AUDIT.md` — threat model and security analysis (SC-1 through SC-8)
- `SKILL.md` — agentic skill for conformance assessment

## Commands

```bash
npm test                                          # run all 131 unit tests
node evals/check.js <url>                         # check a live service
node evals/check.js <url> --json                  # machine-readable output
node evals/check.js <url> --limits-path /custom   # custom limits endpoint path
```

## Conventions

- No npm dependencies. The eval suite is vanilla Node.js.
- Tests use `test(name, fn)` with `assert(condition, message)`. No test framework.
- Shared functions (`checkRefusalBody`, `checkResponseBody`, `checkLimitsBody`, `checkProactiveHeaders`, `checkHtmlRefusal`, `checkDedupResponse`, `isStableErrorValue`, `assessLevel`) are in `check.js` and exported.
- Test files run independently and export nothing.
- Spec language follows RFC 2119 (MUST, SHOULD, MAY).

## Conformance levels

| Level | Key requirement |
|---|---|
| N/A | No agentic interaction surface |
| 0 | Limits exist but not described per spec |
| 1 | Structured refusal: `error`, `detail`, `limit`, `retryAfterSeconds`, `why` |
| 2 | Level 1 + limits discovery endpoint |
| 3 | Level 2 + constructive guidance fields |
| 4 | Level 3 + proactive `RateLimit` headers on success responses |

## Reference implementation

Siteline (https://siteline.snapsynapse.com/) is Level 4 conformant. Use it for live testing:

```bash
node evals/check.js https://siteline.snapsynapse.com
```
