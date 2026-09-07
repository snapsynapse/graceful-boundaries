# Comparative Caller Benchmark

Status: Design only. No real-runtime experiment has been executed and no traffic, token, latency, or cost reduction is claimed here.

Scope: Evidence for the caller-behavior hypothesis in [adoption-validation.md](adoption-validation.md). This experiment does not change service conformance requirements.

## Question

When the service state, task, model, tools, and budgets are held constant, does structured refusal guidance change a real agent runtime's retries, use of alternatives, or escalation behavior compared with an unstructured error?

## Paired conditions

Use two or three real agent runtimes, including at least one portable open-source framework. Record and pin the runtime, adapter, model identifier, provider, and all dependencies before executing a run. Use the same model within each runtime's paired comparison where supported. Report different-model comparisons separately. A runtime's native retry policy is part of the observation and must be disclosed.

For each scenario run a bare status response and an equivalent Graceful Boundaries response against the same deterministic mock-service state machine. Keep the task prompt, tool descriptions, business data, available endpoints, release times, and request limits identical. Change only the response representation. Keep a `Retry-After` header either absent in both conditions or identical in both; report header-only controls separately so the body effect is not confused with the header effect. Keep success-response headers identical in the primary comparison.

| Scenario | Fixed service behavior | Behavior to measure |
|---|---|---|
| 429 cooldown | Resource becomes available after a fixed interval | Requests before eligibility, waiting, completion, or escalation |
| 429 cached result | Fresh operation unavailable; same-origin cached result exists in both conditions | Useful cached-result retrieval versus repeated fresh-operation requests |
| 429 alternative endpoint | Primary unavailable; equivalent same-origin alternative exists in both conditions | Successful alternate route, repeated blocked calls, or escalation |
| 500 transient failure | Service recovers on a fixed schedule in both conditions | Recovery, bounded retries, abort, or escalation |
| 500 persistent failure | Service remains unavailable for the entire budget | Repeated requests and terminal behavior under failure |

Separate negative controls should exercise an off-origin guidance URL and instruction-like `why` text. These test safe handling of untrusted guidance; do not blend their results into the primary benefit estimate. The local [agent compliance fixtures](../evals/test-agent-behavior.js) provide starting cases, but their reference-handler results are not real-runtime benchmark measurements.

## Execution protocol

1. Freeze a run manifest containing the source commit, runtime and model versions, scenario fixtures, task prompts, retry settings, temperature/seed where supported, per-run tool and token limits, and a total approved spend ceiling. Unknown or unsupported settings stay explicit.
2. Use a local mock service with a request event log and a virtual clock for wait-tool behavior. Log virtual wait duration separately from real execution time. Include a small wall-clock confirmation set before claiming real latency effects.
3. Run a smoke pair per scenario/runtime to verify the harness. Keep smoke results out of the measurement set.
4. Predeclare paired repetition count and randomized condition order before looking at results. A proposed starting design is 20 pairs per scenario/runtime, subject to the approved budget and smoke feasibility. Reset sessions, service state, and caches between runs.
5. Stop each run at its declared request, token, or time budget. Record exhaustion and failures as outcomes. Do not silently rerun unfavorable outcomes; record infrastructure reruns and exclusions explicitly.
6. Store raw service requests and runtime tool events, response-condition fixtures, terminal outcomes, model usage counters as returned by the provider, and the complete manifest. Record unavailable token usage as null, never zero.
7. Replay aggregation from raw logs and verify paired labels before writing findings. Keep model/provider-specific results separate and report cases with little or no benefit.

## Event and result contract

Every event identifies run, pair, runtime, scenario, condition, sequence, real timestamp, and virtual time. Request events include method, endpoint, response status, and whether the task state advanced. Tool events include the selected action and wait duration or destination where relevant. Model events include provider request ID and original usage counters when exposed, with secrets excluded from retained logs.

Each run reports total service requests, repeated requests that did not advance the task, requests before retry eligibility, input/output tokens or null, real elapsed time, virtual waiting time, task completion, and terminal behavior: proceed, wait, use cached result, use alternative, escalate, abort, or budget exhausted. A terminal wait is not task completion. Define “did not advance” from the mock-service state transition, not from a model's self-report.

Compute within-pair differences for each runtime and scenario. Report sample sizes, distributions, completion and failure rates, and paired uncertainty intervals. A percentage reduction is undefined when its bare-condition denominator is zero. Any aggregate must disclose its weighting, exclusions, and raw component results. Token overhead from richer responses counts in the result.

## Delivery gates

Before paid or hosted-model execution, select runtime adapters and models, approve the total budget, and review the frozen prompts and fixtures. No API calls or spending are authorized by this design document.

The benchmark is ready for publication only when the harness, pinned dependencies, fixtures, prompts, raw event logs, usage availability, aggregation code, and reproduction instructions accompany the report. A headline claim must reproduce from that evidence. External launch and outreach remain governed by `INTENT.md`.
