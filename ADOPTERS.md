# Adopters

Services that implement Graceful Boundaries. Self-declared, checker-verified.

Implementation feedback is tracked through the [adoption validation plan](docs/adoption-validation.md). Registered services are passively revalidated each week, with JSON checker output retained as workflow evidence.

## Registry

| Service | Level | Discovery endpoint | Declared | Verify |
|---|---|---|---|---|
| [Siteline](https://siteline.to/) | 4 | `/api/limits` | 2026-05 | `npx graceful-boundaries check https://siteline.to` |

## Add your service

1. Implement the spec. The [implementation guide](docs/implementation-guide.md), [middleware examples](examples/middleware/), and [worked limits.json examples](examples/limits/) cover the common paths.
2. Verify your level:
```bash
npx graceful-boundaries check https://your-service.example
```
3. Open a pull request adding one row to the table above, in level order (highest first), including the verify command. PRs are accepted when the checker confirms the discovery endpoint and the declared level is consistent with what can be verified passively (Levels 2 and 4; Levels 1 and 3 are taken on declaration since they require observing a live refusal).

Listing is descriptive, not an endorsement. Entries that stop verifying may be removed at any time. The conformance level reflects the service at the date declared; services are responsible for keeping their row current.

## Badges

Embed a conformance badge in your README or docs via the shields.io endpoint:

```markdown
![Graceful Boundaries Level 4](https://img.shields.io/endpoint?url=https://gracefulboundaries.dev/badges/level-4.json)
```

Available endpoints:

| Level | Endpoint |
|---|---|
| Level 4 | `https://gracefulboundaries.dev/badges/level-4.json` |
| Level 3 | `https://gracefulboundaries.dev/badges/level-3.json` |
| Level 2 | `https://gracefulboundaries.dev/badges/level-2.json` |
| Level 1 | `https://gracefulboundaries.dev/badges/level-1.json` |
| N/A | `https://gracefulboundaries.dev/badges/not-applicable.json` |

The badge is a claim, not a certificate. Anyone can verify the claim with the checker; a badge above the verifiable level is grounds for removal from the registry.
