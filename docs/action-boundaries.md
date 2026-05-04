# Action Boundaries Draft

Status: draft for Graceful Boundaries 1.3.0.

Action Boundaries is an optional extension to Graceful Boundaries. It describes what autonomous agents may do, what requires approval, what recourse exists, and what audit trail is produced when an action has real consequences.

The parent concept is Action Boundaries. Commercial Boundaries is the first profile.

For concrete generic payloads, see [Action Boundaries Examples](action-boundaries-examples.md).

## Product Boundary

Graceful Boundaries core answers:

```text
How does this service communicate operational limits, refusals, and useful next steps?
```

Action Boundaries answers:

```text
What may an agent do here, under whose authority, with what approval, and with what recourse?
```

Commercial Boundaries answers:

```text
Can a buyer agent safely understand, evaluate, transact, modify, cancel, and resolve a commercial relationship?
```

Action Boundaries is not a payment rail, checkout protocol, wallet, fraud network, identity provider, marketplace, or merchant certification system. It is the boundary language underneath those systems.

## Non-Goals

Do not build:

- Payment processing
- Token issuance
- Wallets
- Checkout orchestration
- Product catalog distribution
- Merchant-of-record flows
- Settlement
- Stablecoin rails
- Fraud scoring based on payment network signals
- Paid placement or ranking

Action Boundaries should stay portable and vendor-independent.

## Discovery

Services can advertise extension documents from the Graceful Boundaries limits endpoint:

```json
{
  "service": "Example Service",
  "description": "Public API and commercial service.",
  "conformance": "level-4",
  "extensions": {
    "actionBoundaries": "/.well-known/action-boundaries",
    "commercialBoundaries": "/.well-known/commercial-boundaries"
  },
  "limits": {}
}
```

Rules:

- `extensions` is optional.
- Extension URLs must be relative paths or same-origin absolute URLs.
- Unknown extension keys should be ignored.
- Extensions do not affect Level 1 through Level 4 conformance.

## Base Action Boundaries Schema

```json
{
  "service": "Example Service",
  "profile": "action-boundaries",
  "version": "0.1-draft",
  "updatedAt": "2026-05-04T00:00:00Z",
  "actions": {
    "read": {
      "status": "allowed",
      "authorityRequired": "none",
      "description": "Public content may be read by automated agents."
    },
    "create_account": {
      "status": "requires_approval",
      "authorityRequired": "user",
      "approval": {
        "type": "explicit",
        "humanReadable": "A human must approve account creation before the agent submits."
      }
    },
    "change_permissions": {
      "status": "human_only",
      "authorityRequired": "admin",
      "humanUrl": "/support"
    }
  },
  "recourse": {
    "supportUrl": "/support",
    "escalationUrl": "/contact",
    "abuseUrl": "/abuse"
  },
  "audit": {
    "eventLogAvailable": true,
    "receiptAvailable": true,
    "retentionDays": 90
  }
}
```

## Common Fields

| Field | Type | Meaning |
|---|---|---|
| `service` | string | Service or merchant name. |
| `profile` | string | Boundary profile name. |
| `version` | string | Boundary document version. |
| `updatedAt` | string | ISO timestamp for freshness checks. |
| `actions` | object | Action names mapped to action boundary objects. |
| `recourse` | object | Human and machine-readable follow-up paths. |
| `audit` | object | Recordkeeping and confirmation expectations. |

## Action Object

```json
{
  "status": "requires_approval",
  "authorityRequired": "buyer",
  "description": "Purchases require buyer authority.",
  "approval": {
    "type": "explicit",
    "threshold": {
      "maxAmount": 10000,
      "currency": "usd"
    }
  },
  "humanUrl": "/support"
}
```

| Field | Type | Meaning |
|---|---|---|
| `status` | string | Whether the action is allowed, unsupported, blocked, or approval-gated. |
| `authorityRequired` | string | The authority the agent must hold. |
| `description` | string | Human-readable explanation. |
| `approval` | object | Approval requirement, if applicable. |
| `humanUrl` | string | Browser-friendly escalation path. |
| `policyUrl` | string | Policy page governing the action. |

Recommended `status` values:

| Status | Meaning |
|---|---|
| `allowed` | The action may be performed without additional approval beyond normal authentication. |
| `requires_approval` | The action may proceed only after explicit approval. |
| `unsupported` | The service does not support this action by agents. |
| `human_only` | The action requires human handling. |
| `blocked` | The action is disallowed by policy. |

Recommended `authorityRequired` values:

| Value | Meaning |
|---|---|
| `none` | Public action. |
| `user` | User-level delegated authority. |
| `buyer` | Buyer authority for a commercial action. |
| `organization` | Organization-level authority. |
| `admin` | Administrative authority. |
| `legal` | Legal or contractual authority. |

## Action Refusal Responses

Services refusing consequential actions should use Graceful Boundaries response fields:

```json
{
  "error": "approval_required",
  "detail": "A human must approve purchases over 100 USD before the agent can continue.",
  "why": "Purchases above this threshold create financial obligations that require explicit approval.",
  "action": "purchase",
  "approvalUrl": "/approve/purchase/abc123",
  "humanUrl": "/support"
}
```

Recommended action errors:

| Error | When to use |
|---|---|
| `intent_ambiguous` | The requested action cannot be safely mapped to a specific outcome. |
| `approval_required` | The action is supported but needs explicit approval. |
| `authority_insufficient` | The caller lacks delegated authority. |
| `action_unsupported` | The service does not support the action for agents. |
| `recourse_unavailable` | Required recourse paths are unavailable. |
| `audit_unavailable` | Required audit trail cannot be produced. |

## Commercial Boundaries Profile

Commercial Boundaries describes whether buyer agents can safely act with a merchant or commercial service provider. It should describe the commercial path around payment execution, not process payment itself.

```json
{
  "service": "Example Merchant",
  "profile": "commercial-boundaries",
  "version": "0.1-draft",
  "updatedAt": "2026-05-04T00:00:00Z",
  "commercialTasks": {
    "browse_catalog": {
      "status": "allowed",
      "authorityRequired": "none"
    },
    "compare_offer": {
      "status": "allowed",
      "authorityRequired": "none",
      "policyUrl": "/terms"
    },
    "request_quote": {
      "status": "allowed",
      "authorityRequired": "user_or_organization"
    },
    "purchase": {
      "status": "requires_approval",
      "authorityRequired": "buyer",
      "approvalThresholds": [
        {
          "maxAmount": 10000,
          "currency": "usd",
          "approval": "explicit"
        }
      ],
      "payment": {
        "acceptedShapes": ["card", "tokenized_payment", "invoice"],
        "paymentAuthorityRequired": true
      }
    },
    "change_subscription": {
      "status": "requires_approval",
      "authorityRequired": "buyer",
      "policyUrl": "/subscription-terms"
    },
    "cancel": {
      "status": "allowed",
      "authorityRequired": "buyer",
      "policyUrl": "/cancellation"
    },
    "refund": {
      "status": "human_only",
      "authorityRequired": "buyer",
      "policyUrl": "/refunds",
      "humanUrl": "/support"
    }
  },
  "legibility": {
    "catalogUrl": "/products.json",
    "pricingUrl": "/pricing",
    "termsUrl": "/terms",
    "privacyUrl": "/privacy",
    "availabilityUrl": "/availability",
    "supportUrl": "/support"
  },
  "recourse": {
    "refundUrl": "/refunds",
    "cancellationUrl": "/cancellation",
    "supportUrl": "/support",
    "disputeUrl": "/disputes",
    "securityUrl": "/security"
  },
  "audit": {
    "orderConfirmationProvided": true,
    "receiptProvided": true,
    "eventLogAvailable": true,
    "retentionDays": 365
  },
  "fraudBoundary": {
    "automatedBuyerAgentsAllowed": true,
    "abusiveAutomationBlocked": true,
    "policyUrl": "/acceptable-use"
  }
}
```

## Commercial Task Names

Suggested task names:

| Task | Meaning |
|---|---|
| `browse_catalog` | Read product, service, or offer data. |
| `compare_offer` | Compare price, terms, availability, or constraints. |
| `request_quote` | Request a quote or proposal. |
| `purchase` | Commit to a purchase. |
| `subscribe` | Start a recurring commercial relationship. |
| `change_subscription` | Modify an existing subscription. |
| `cancel` | Cancel an order, booking, or subscription. |
| `refund` | Request or initiate a refund. |
| `return` | Start a return workflow. |
| `support` | Open a support case. |

## Relationship to Payment and Checkout Systems

Payment and checkout systems should remain responsible for:

- Payment credentials
- Tokenization
- Authorization
- Capture
- Settlement
- Checkout state
- Payment method availability
- Payment fraud scoring
- Disputes inside payment networks

Commercial Boundaries should describe:

- Whether the agent has enough authority to start the task
- Whether approval is required before payment authority is used
- Whether the offer is legible enough to evaluate
- Whether cancellation, refund, support, and dispute paths exist
- Whether the business can provide confirmations and records
- Whether automated buyer agents are allowed

This keeps the extension underneath payment infrastructure rather than competing with it.

## Security Notes

Commercial boundary documents should avoid revealing enforcement mechanisms. They can say that abusive automation is blocked. They should not list fraud detection rules, thresholds, internal model signals, or bypassable patterns.

Approval thresholds are public policy signals, not exact enforcement internals. Services may apply stricter internal controls.

Recourse and audit links should be same-origin or relative unless clearly intended for human navigation.

Boundary documents should not imply merchant endorsement, ranking, certification, or payment safety by themselves. They describe declared boundaries. External evaluators may verify those declarations separately.
