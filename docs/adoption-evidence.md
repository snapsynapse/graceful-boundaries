# Adoption Evidence

Scope: Graceful Boundaries implementation validation. This ledger records evidence toward [adoption-validation.md](adoption-validation.md), not certification or directory visibility.

## Baseline

Reconciled 2026-09-07 against repository commit `fc2d2e20cd04056fa1cb18ec394155722bc8310c`, the public adopter registry, and GitHub issues. There were no open repository issues at that check. Absence of an issue is not evidence that no unregistered implementation exists.

| Target | Recorded evidence | Gap |
|---|---|---|
| Five assessed services | One registered service: Siteline | Four additional service assessments with retained reports |
| Three Level 1+ implementations | Siteline declares Level 4; fresh packed-consumer passive check passed on 2026-09-07 | Two additional implementations; retain direct refusal evidence for requirements passive checking cannot establish |
| One independent registered adopter | None in `ADOPTERS.md` | One implementation outside the PAICE portfolio; a directory listing or skill install does not qualify |
| Implementation feedback for every implementation | No structured implementation-time and ambiguity report in this ledger | Capture framework, time, unclear fields, checker discrepancies, and middleware changes for Siteline and each new implementation |
| Two deployments exercising advanced metadata | Deployment-specific quota, cost, multi-limit, or Action Boundaries evidence not yet recorded here | Two real deployment reports; separate this from the two-implementer Action Boundaries gate |

Siteline evidence: [registered Level 4 service](../ADOPTERS.md), [discovery endpoint](https://siteline.to/api/limits), and [successful scheduled revalidation](https://github.com/snapsynapse/graceful-boundaries/actions/runs/33397245919) at the baseline commit. A passive Level 4 result reflects observable discovery and proactive headers; it does not independently exercise all refusal paths or certify safety. A fresh packed-consumer check on 2026-09-07 also confirmed passive Level 4; see [maintenance validation evidence](../ops/maintenance.md). Workflow artifacts expire after 30 days, so preserve reviewed reports with durable implementation evidence before expiry.

## Next assessments

1. Obtain a structured implementation report for Siteline using the existing issue-form fields. Record unavailable historical implementation time as unknown.
2. Identify four additional services with an appropriate public endpoint or assessment permission. Check for existing registrations before adding a row.
3. Record the published checker version, invocation, UTC timestamp, service URL, discovery path, raw JSON report, observed versus declared level, and report hash for every assessment.
4. For Level 1 or 3 claims, collect operator-provided or safely observed refusal evidence. Do not force rate limits or outages to raise a score.
5. Request feedback and registrations only through approved outreach. Keep unanswered directory scoping threads and independent-adopter recruitment separate.

## Implementation record

Each future record must name the service and ownership relationship, implementation repository if public, framework or integration path, target and observed conformance, evidence location and timestamp, approximate implementation time or unknown, unclear fields, checker discrepancies, middleware changes, and caller behavior observed. Advanced-metadata claims must include the actual deployment fields and an implementer account of their semantics.

Update target counts only from linked records. Superseded observations remain dated evidence; they do not establish current conformance. Candidate services, downloads, citations, directory listings, and accepted integrations without a conforming deployed service do not increase the implementation count.
