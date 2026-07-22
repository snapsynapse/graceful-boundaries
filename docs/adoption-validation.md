# Adoption Validation

Graceful Boundaries 1.5 made the standard easier to adopt. The next phase validates the core model against real services before adding normative fields or changing conformance levels.

## Validation target

The initial adoption sprint is complete when all of the following are true:

1. Five services have been assessed with the published checker.
2. At least three services have implemented Level 1 or higher.
3. At least one registered adopter is independent of the PAICE portfolio.
4. Each implementation records approximate implementation time, framework or integration path, unclear fields, checker discrepancies, and any middleware changes.
5. At least two implementations exercise quota, cost, multi-limit, or Action Boundaries metadata in a real deployment.

These are validation targets, not conformance requirements.

## Evidence to collect

For each implementation, record:

- Service URL and implementation repository when public.
- Target and checker-confirmed conformance levels.
- Limits discovery endpoint.
- Approximate time to reach each level.
- Middleware example, custom integration, or platform adapter used.
- Fields that required interpretation.
- Checker false positives, false negatives, or unverifiable behavior.
- Whether callers changed retry, caching, throttling, or escalation behavior.

Use the adoption report, checker discrepancy, and implementation feedback issue forms. Registry inclusion remains descriptive and does not constitute certification or endorsement.

## Decision gates

Adoption evidence informs future releases as follows:

- Keep quota, cost, size, token, duration, queue, and multi-limit fields optional until at least two deployments validate their names and semantics.
- Keep Action Boundaries and Commercial Boundaries non-normative until at least two implementers validate the field names and threat model.
- Prefer documentation clarifications and checker fixes over new fields when existing shapes can represent the deployment.
- Consider a normative v1.6 change only when evidence identifies a repeated interoperability failure that cannot be resolved by guidance alone.

## Revalidation

Registered services are checked weekly at their passively verifiable level. The workflow retains the checker's JSON report as a GitHub Actions artifact. A scheduled result is evidence about observed behavior at a point in time, not a certificate, safety claim, or endorsement.
