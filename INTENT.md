# INTENT

Status: Authoritative for the Graceful Boundaries standard.
Scope: Standards-level strategy for this component. Portfolio-level strategy lives in the PAICE Foundation INTENT. Where this document and a higher-scope document disagree, the higher scope wins for portfolio questions and this document wins for standard-level questions.

## What this standard is

Graceful Boundaries specifies how services communicate operational limits to humans and autonomous agents. It combines three requirements that existing standards address separately but no specification combines: proactive discovery (limits readable before they are hit), structured refusal (when a limit is exceeded, the response explains what happened, which limit applies, when to retry, and why), and constructive guidance (the refusal includes a useful next step).

The specification is transport-agnostic but provides concrete HTTP conventions. It defines a five-level conformance ladder (N/A, 0, 1, 2, 3, 4) and ships an executable conformance checker at `evals/check.js`.

## Why it exists

Every unclear response generates follow-up traffic. A vague `429` causes blind retries. A vague `403` causes credential rotation. A vague `404` causes path probing. A generic `500` causes indefinite retries. Autonomous agents amplify the waste: they retry faster, probe more systematically, and lack the human judgment to know when to stop. PAICE agents needed a structured way for services to communicate their limits, and Siteline needed a conformance target. No existing standard combined the three requirements. Graceful Boundaries fills that gap.

## Design invariants

These are the non-negotiable commitments of the standard. Changing any of them is a major-version decision.

1. The conformance ladder is additive and honest. Each level adds capability without weakening prior levels. A consumer reading "Level 3" can assume Level 0, 1, 2 also hold. Reordering levels is a major version.
2. Structured refusal fields are stable. `error`, `detail`, `why`, `limit`, `retryAfterSeconds`, `cachedResultUrl`, `alternativeEndpoint`, `upgradeUrl` are normative names. Renaming any of them is a major version.
3. Transport-agnostic by intent, HTTP-concrete by example. The spec defines an abstract response class model and gives HTTP-specific bindings. New transports (gRPC, WebSocket close codes, etc.) extend by binding, not by re-spec.
4. Limits are discoverable, not secret. A Level 2+ service exposes a limits discovery endpoint. Hiding limits as anti-abuse measure breaks the spec; design fair limits and publish them.
5. Constructive guidance is honest. `alternativeEndpoint` MUST point to a working alternative. `cachedResultUrl` MUST point to a usable cached result. Pointing callers at dead ends is a Level 3 violation.
6. Proactive headers do not replace structured refusal. Level 4 adds RateLimit headers on success responses; it does not remove the obligation to send structured bodies on refusal.

## Scope boundaries

In scope: the response class model, the structured refusal body, the limits discovery endpoint, the proactive header set, the constructive guidance fields, the HTML refusal binding, the dedup-response binding, and the conformance ladder.

Out of scope: rate-limit enforcement algorithms (token bucket, sliding window, etc.), authentication or authorization decisions about whether to enforce a limit, billing or upgrade flows beyond pointing at them, multi-tenancy isolation, transport-layer security, and any aspect of fairness or quota allocation policy. The standard says how to communicate a limit; it does not say what the limit should be.

## Conformance philosophy

The conformance ladder is additive. Each level is testable in isolation against the eval suite. A conformant verifier (`evals/check.js`) is the conformance target; any implementation that passes the eval suite is conformant. No central registry, no oracle, no hosted-only verifier as root of trust.

Siteline is the live Level 4 reference implementation (https://siteline.to/). The spec ships a 200-test suite covering response classes, agentic surfaces, action boundaries, refusals, discovery, proactive headers, HTML refusal, and security cases.

## Admission criteria for changes

A proposed change is admitted only if it satisfies all of the following:

1. It does not weaken a design invariant without an explicit, documented justification.
2. It updates `spec.md`, `evals/`, the test suite, and `CHANGELOG.md` in the same change.
3. It records a `CHANGELOG.md` entry and, for normative changes, follows SemVer.
4. It does not introduce a central registry, an oracle, a single point of trust, or a dependency on one hosted service.
5. It does not break Siteline conformance unless Siteline is updated in coordination.

## Relationship to other PAICE standards

- **HardGuard25**: Limit identifiers in GB-formatted responses MAY use HardGuard25 for the human-facing portion when an ID will be read aloud or transcribed.
- **GuideCheck**: GB ships a GuideCheck-conformant `assistant-guide.txt` for bounded contributor work. Assistant-facing contributor guidance follows GuideCheck 0.3.0.
- **Skill Provenance**: The `graceful-boundaries-audit` skill (SKILL.md at repo root) is governed by Skill Provenance. See "Exceptions to Repo Standards" below for the layout exception.
- **Siteline**: Siteline is the canonical Level 4 reference implementation. Coordinated releases when normative changes affect Level 4 behavior.
- **Turnfile**: Out of scope; GB is transport-level limit communication, Turnfile is peer collaboration.

## Exceptions to Repo Standards

Per `0_Across/Repo Standards.md`, the following deviations are recorded:

- **Root SKILL.md instead of `skills/<bundle>/SKILL.md`**. graceful-boundaries is the canonical home for the `graceful-boundaries-audit` skill (and `graceful-boundaries-builder` via `SKILL-builder.md`). The skill is the repo, not a sub-bundle. v0.3 of the standards doc resolves "where do skill bundles live in their canonical home" with two patterns (`skills/<bundle>/` in hardguard25, `skill/` legacy in siteline) but does not address "the skill IS the repo". This is a third pattern. Flagged as v0.4 open question; meanwhile this layout is treated as compliant via this exception.
- **llms.txt is link-heavy, not fully comprehensive standalone**. By the v0.3 criterion ("inlines all referenced content, not just links"), `llms.txt` here is link-summary, not comprehensive. `llms-full.txt` is not yet generated. Status: open — either inline spec.md into llms-full.txt or accept that llms.txt is intentionally a navigation index and the spec itself is the comprehensive artifact.
- **Single CC-BY-4.0 LICENSE was used for all content historically**. As of 2026-06-03, split into `LICENSE` (MIT, for code) and `LICENSE-SPEC` (CC BY 4.0, for spec text) to match the hardguard25 pattern. Re-licensing applies prospectively; prior commits remain under CC-BY-4.0 per their git history.

## Changelog

- 2026-06-03 — Initial INTENT.md per `0_Across/Repo Standards.md` v0.3 layout matrix. Recorded license-split, root-SKILL.md, and llms.txt-comprehensiveness exceptions.
