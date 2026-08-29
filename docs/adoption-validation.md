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

## Comparative caller benchmark

The remaining behavior claim needs framework-level evidence before it becomes promotional copy. Run the same mock-service scenarios through two or three real agent runtimes, including at least one portable open-source framework:

1. Send the caller a bare `429` or `500` with no structured guidance.
2. Repeat with the equivalent Graceful Boundaries response.
3. Record total requests, repeated requests that did not advance the task, input and output tokens when the runtime exposes them, elapsed time, and the terminal behavior: wait, use a cached result, switch endpoints, or escalate to a human.
4. Publish the harness, runtime versions, prompts, raw event logs, and aggregation method alongside `docs/benchmark.md` so the result is reproducible.

Do not publish a headline reduction number unless the scenarios, raw evidence, and aggregation reproduce it. If the measured difference is small or framework-dependent, report that result directly. This benchmark is adoption evidence, not a conformance requirement.

## Decision gates

Adoption evidence informs future releases as follows:

- Keep quota, cost, size, token, duration, queue, and multi-limit fields optional until at least two deployments validate their names and semantics.
- Keep Action Boundaries and Commercial Boundaries non-normative until at least two implementers validate the field names and threat model.
- Prefer documentation clarifications and checker fixes over new fields when existing shapes can represent the deployment.
- Consider a normative v1.6 change only when evidence identifies a repeated interoperability failure that cannot be resolved by guidance alone.

## Revalidation

Registered services are checked weekly at their passively verifiable level. The workflow retains the checker's JSON report as a GitHub Actions artifact. A scheduled result is evidence about observed behavior at a point in time, not a certificate, safety claim, or endorsement.
