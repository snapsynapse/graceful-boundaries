# Code scanning dispositions

Date: 2026-11-08
Repository: snapsynapse/graceful-boundaries
Scope: every code-scanning alert opened by the first CodeQL and Scorecard analyses of `main`.

## CodeQL

| Alert | Rule | Disposition |
|---|---|---|
| #6, #7, #8, #11 | `js/polynomial-redos`, `js/bad-tag-filter` in `evals/check.js` | Fixed in PR #15 (released in 1.5.7). |
| #9, #10 | `js/incomplete-sanitization` in `evals/test-agentic-surfaces.js` | Fixed in PR #15. |
| #12, #13 | `js/double-escaping` in the vendored search validators | Fixed in PR #15; re-vendored from skill v9 in PR #16. |
| #14, #15 | `js/incomplete-url-substring-sanitization` in `evals/test-agentic-surfaces.js` | Dismissed as false positive: a docs drift test asserts repository files contain the canonical ClawHub URL; no URL is parsed or trusted. |

## Scorecard

| Alert | Check | Disposition |
|---|---|---|
| #1 | Branch-Protection (4) | Dismissed, won't fix. The maintainer approved the `prime` ruleset on 2026-11-08 with pull requests and the strict `test` check required and zero approvals, because the repository has a sole maintainer. Remaining warnings (approvers, code-owner review, stale-review dismissal) require a second reviewer. Revisit when a co-maintainer joins. |
| #2 | SAST (8) | Left open. CodeQL now runs on every push and pull request; the score rises as older unanalyzed commits leave Scorecard's 30-commit window. |
| #3 | Fuzzing (0) | Mitigated, then dismissed as won't fix. The repository forbids npm dependencies, and Scorecard recognizes only fuzzing frameworks such as fast-check, OSS-Fuzz, or ClusterFuzzLite. A dependency-free seeded fuzz harness in `evals/test-security.js` now runs in CI on every push; on its first run it found three crash bugs in the checker, fixed in the same change. |
| #4 | Code-Review (0) | Dismissed, won't fix. Same sole-maintainer decision as #1: changes land through pull requests with required CI, without a second approver. |
| #5 | CII-Best-Practices (0) | Dismissed, won't fix for now. OpenSSF Best Practices enrollment is deferred until the GuideCheck pilot supplies a reusable evidence pattern (`docs/roadmap.md`). |

Dismissals are reversible in the GitHub code-scanning view. Scorecard reopens an alert if a later run produces a new finding for the same check.
