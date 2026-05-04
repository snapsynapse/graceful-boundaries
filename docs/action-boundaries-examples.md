# Action Boundaries Examples

These examples show generic Action Boundaries patterns for services with consequential agent actions. They are declarations, not trust verification, payment execution, or identity proof.

## Ecommerce purchase

Use this pattern when an agent can browse, compare, or request a purchase, but final authority depends on buyer confirmation.

```json
{
  "service": "Example Store",
  "profile": "commercial-boundaries",
  "version": "1.0.0",
  "updatedAt": "2026-05-04T00:00:00Z",
  "commercialTasks": {
    "browse_catalog": {
      "status": "allowed",
      "authorityRequired": "none",
      "catalogUrl": "/catalog"
    },
    "compare_offer": {
      "status": "allowed",
      "authorityRequired": "none",
      "policyUrl": "/boundaries/commercial#compare-offer"
    },
    "purchase": {
      "status": "requires_approval",
      "authorityRequired": "buyer",
      "approvalThresholds": [
        {
          "maxAmount": 100,
          "currency": "USD",
          "approval": "buyer_confirmed"
        }
      ],
      "policyUrl": "/boundaries/commercial#purchase"
    }
  },
  "legibility": {
    "priceAvailable": true,
    "availabilityAvailable": true,
    "taxAndFeeDisclosure": "before_purchase"
  },
  "recourse": {
    "refundAvailable": true,
    "refundUrl": "/support/refunds",
    "disputeUrl": "/support/disputes"
  },
  "audit": {
    "eventLogAvailable": true,
    "auditUrl": "/account/activity"
  },
  "fraudBoundary": {
    "fraudScreeningPerformed": true,
    "fraudDetailsDisclosed": false
  }
}
```

The boundary tells agents when to stop for approval. It does not describe payment rails, authorize charges, or rank the merchant.

## SaaS subscription change

Use this pattern when an agent can inspect current plan state and prepare a change, but upgrades, downgrades, cancellation, and refunds require account authority.

```json
{
  "service": "Example SaaS",
  "profile": "commercial-boundaries",
  "version": "1.0.0",
  "updatedAt": "2026-05-04T00:00:00Z",
  "commercialTasks": {
    "view_subscription": {
      "status": "allowed",
      "authorityRequired": "user",
      "policyUrl": "/boundaries/subscription#view"
    },
    "change_subscription": {
      "status": "requires_approval",
      "authorityRequired": "admin",
      "approvalThresholds": [
        {
          "maxAmount": 50,
          "currency": "USD",
          "approval": "workspace_admin_confirmed"
        }
      ],
      "policyUrl": "/boundaries/subscription#change"
    },
    "cancel": {
      "status": "human_only",
      "authorityRequired": "admin",
      "humanUrl": "https://support.example.com/cancel"
    },
    "refund": {
      "status": "requires_approval",
      "authorityRequired": "admin",
      "policyUrl": "/boundaries/subscription#refund"
    }
  },
  "recourse": {
    "supportAvailable": true,
    "supportUrl": "/support",
    "refundUrl": "/support/refunds"
  },
  "audit": {
    "eventLogAvailable": true,
    "auditUrl": "/account/activity"
  }
}
```

This keeps billing authority separate from payment execution. The agent learns the approval gate before attempting a subscription change.

## Account provisioning

Use this pattern when an agent can request or prepare account changes, but creation, role escalation, deletion, or legal actions need explicit authority.

```json
{
  "service": "Example Admin API",
  "profile": "action-boundaries",
  "version": "1.0.0",
  "updatedAt": "2026-05-04T00:00:00Z",
  "actions": {
    "invite_user": {
      "status": "requires_approval",
      "authorityRequired": "admin",
      "policyUrl": "/boundaries/admin#invite-user"
    },
    "assign_role": {
      "status": "requires_approval",
      "authorityRequired": "admin",
      "policyUrl": "/boundaries/admin#assign-role"
    },
    "delete_account": {
      "status": "human_only",
      "authorityRequired": "legal",
      "humanUrl": "https://support.example.com/account-deletion"
    },
    "read_status": {
      "status": "allowed",
      "authorityRequired": "user"
    }
  },
  "recourse": {
    "supportAvailable": true,
    "supportUrl": "/support",
    "escalationUrl": "/support/escalate"
  },
  "audit": {
    "eventLogAvailable": true,
    "auditUrl": "/account/activity"
  }
}
```

Provisioning boundaries should favor escalation over automation whenever the action changes access, ownership, legal posture, or irreversible state.
