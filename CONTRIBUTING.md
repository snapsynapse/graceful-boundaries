# Contributing to Graceful Boundaries

Graceful Boundaries is a specification, not a library. Contributions improve the spec text, the eval suite, or the documentation. If you're an AI agent, see [AGENTS.md](AGENTS.md) for contributor guidelines specific to your workflow.

## Getting started

Clone the repo and run the tests:

```bash
git clone https://github.com/snapsynapse/graceful-boundaries.git
cd graceful-boundaries
npm test
```

There are no dependencies to install. The eval suite is vanilla Node.js.

## Running the live conformance checker

```bash
node evals/check.js https://your-service.com
node evals/check.js https://your-service.com --json
node evals/check.js https://your-service.com --limits-path /.well-known/limits
```

## How to contribute

1. Fork the repo and create a branch.
2. Make your changes.
3. Run `npm test` to verify all tests pass.
4. Open a PR with a clear description of what changed and why.

## Spec changes

Changes to `spec.md` should:

- Reference the specific section being changed (e.g., "Section 2: Structured Refusal Response").
- Include the rationale — what problem does this solve or what ambiguity does it resolve?
- Include an eval test case in `evals/` when the change introduces a new requirement or field.
- Not break existing conformance levels. A Level 2 service today should still be Level 2 after the change unless the change is intentionally raising the bar (which requires discussion).

## Eval suite conventions

- All test files live in `evals/` and follow the pattern `test-*.js`.
- Tests use a simple `test(name, fn)` / `assert(condition, message)` pattern.
- Shared validation functions live in `evals/check.js` and are exported via `module.exports`.
- No external dependencies. Keep it that way.
- Each test file runs independently: `node evals/test-refusal.js`.
- `npm test` runs all test files sequentially.

## What not to change

- Don't add npm dependencies.
- Don't change the license (CC-BY-4.0).
- Don't modify `spec.md` formatting conventions (MUST/SHOULD/MAY follow RFC 2119).

## License

By contributing, you agree that your contributions are licensed under CC-BY-4.0.
