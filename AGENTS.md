# Agent Contributor Protocol

Guidelines for AI agents working on the Graceful Boundaries repository.

## Repository structure

| Path | Role |
|------|------|
| `spec.md` | Source of truth. All normative requirements live here. |
| `evals/check.js` | Live conformance checker and shared validation library. |
| `evals/test-*.js` | Unit tests (131 tests across 7 files). |
| `SECURITY-AUDIT.md` | Threat model (SC-1 through SC-9). |
| `docs/implementation-guide.md` | Level-by-level code samples. |
| `SKILL.md` | Audit skill (inspects live URLs). |
| `SKILL-builder.md` | Builder skill (generates code in projects). |
| `index.html` | Landing page for gracefulboundaries.dev. |
| `CHANGELOG.md` | Version history. Append-only. |

## Before making changes

1. Read `spec.md` — understand the conformance levels and response classes.
2. Read `SECURITY-AUDIT.md` — understand the threat model. Any spec change that affects security considerations requires updating the audit.
3. Read the existing tests in `evals/` — understand what's already covered.

## After making changes

1. Run `npm test` — all 131+ tests must pass.
2. If you changed `spec.md`: update `CHANGELOG.md` with the change.
3. If you added new spec requirements: add corresponding tests in `evals/`.
4. If you changed the checker (`evals/check.js`): verify against a live service with `node evals/check.js https://siteline.to`.
5. If you changed `index.html`: verify the page renders correctly.

## Key rules

- **RFC 2119 language**: the spec uses MUST, SHOULD, MAY per RFC 2119. Use them precisely.
- **`error` field**: always `snake_case` — lowercase alphanumeric and underscores only.
- **All error classes** (400, 401, 403, 404, 429, 500, 503) MUST include `error`, `detail`, and `why`.
- **No external dependencies**: the eval suite is vanilla Node.js. Do not add npm packages.
- **Tests use `test(name, fn)` with `assert(condition, message)`**: no test framework.
- **Security-sensitive changes**: if a change could affect what information is disclosed in error responses, review SC-1 through SC-9 and update SECURITY-AUDIT.md.

## Version bumping

- **PATCH** (1.2.x): typo fixes, documentation clarifications, test additions.
- **MINOR** (1.x.0): new spec sections, new conformance checker features, new skills.
- **MAJOR** (x.0.0): breaking changes to required fields, conformance level definitions, or response format.

Update version in: `spec.md`, `package.json`, `README.md` (badge), `index.html` (footer), `CHANGELOG.md`.

## Files outside the spec bundle

These files are repo infrastructure, not part of the specification:
- `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, `SECURITY.md`
- `index.html`, `CNAME`, `.nojekyll`, `imgs/`
- `.github/`, `.claude/`, `.gitignore`, `.gitattributes`
- `package.json` (metadata only — no runtime dependencies)
