#!/usr/bin/env node

/**
 * Graceful Boundaries JSON Schema tests.
 *
 * Validates the published schemas in schema/ against spec examples
 * (positive cases) and malformed bodies (negative cases), using a
 * minimal embedded JSON Schema validator (no dependencies).
 *
 * The embedded validator supports the subset of JSON Schema 2020-12
 * the published schemas use: type, required, properties, pattern,
 * enum, minimum, minLength, items, additionalProperties (schema form),
 * $defs, and $ref (local "#/..." and the known cross-file $id).
 *
 * Usage: node evals/test-schemas.js
 */

const fs = require("fs");
const path = require("path");

const SCHEMA_DIR = path.join(__dirname, "..", "schema");

const schemas = {};
for (const file of ["refusal.schema.json", "refusal-429.schema.json", "limits.schema.json"]) {
  const parsed = JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, file), "utf8"));
  schemas[parsed.$id] = parsed;
}

function resolveRef(ref, rootSchema) {
  if (ref.startsWith("#/")) {
    let node = rootSchema;
    for (const part of ref.slice(2).split("/")) {
      node = node[part];
      if (node === undefined) throw new Error(`Unresolvable local $ref: ${ref}`);
    }
    return { schema: node, root: rootSchema };
  }
  const [base, fragment] = ref.split("#");
  const target = schemas[base];
  if (!target) throw new Error(`Unresolvable external $ref: ${ref}`);
  if (fragment) return resolveRef(`#${fragment}`, target);
  return { schema: target, root: target };
}

function jsonType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  return typeof value;
}

function typeMatches(declared, value) {
  const actual = jsonType(value);
  const accepted = Array.isArray(declared) ? declared : [declared];
  return accepted.some((t) => t === actual || (t === "number" && actual === "integer"));
}

function validate(value, schema, root, errors, location) {
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, root);
    validate(value, resolved.schema, resolved.root, errors, location);
    // Sibling keywords next to $ref still apply (2020-12 behavior).
  }

  if (schema.type && !typeMatches(schema.type, value)) {
    errors.push(`${location}: expected type ${JSON.stringify(schema.type)}, got ${jsonType(value)}`);
    return;
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${location}: value not in enum`);
  }

  if (typeof value === "string") {
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${location}: does not match pattern ${schema.pattern}`);
    }
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${location}: shorter than minLength ${schema.minLength}`);
    }
  }

  if (typeof value === "number" && schema.minimum !== undefined && value < schema.minimum) {
    errors.push(`${location}: below minimum ${schema.minimum}`);
  }

  if (Array.isArray(value) && schema.items) {
    value.forEach((item, i) => validate(item, schema.items, root, errors, `${location}[${i}]`));
  }

  if (jsonType(value) === "object") {
    for (const field of schema.required || []) {
      if (!(field in value)) errors.push(`${location}: missing required field "${field}"`);
    }
    for (const [key, propSchema] of Object.entries(schema.properties || {})) {
      if (key in value) validate(value[key], propSchema, root, errors, `${location}.${key}`);
    }
    if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
      for (const [key, propValue] of Object.entries(value)) {
        if (!(schema.properties && key in schema.properties)) {
          validate(propValue, schema.additionalProperties, root, errors, `${location}.${key}`);
        }
      }
    }
  }
}

function validateAgainst(schemaId, value) {
  const schema = schemas[schemaId];
  const errors = [];
  validate(value, schema, schema, errors, "$");
  return errors;
}

const REFUSAL = "https://gracefulboundaries.dev/schema/refusal.schema.json";
const REFUSAL_429 = "https://gracefulboundaries.dev/schema/refusal-429.schema.json";
const LIMITS = "https://gracefulboundaries.dev/schema/limits.schema.json";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`PASS  ${name}`);
    passed++;
  } catch (error) {
    console.log(`FAIL  ${name}: ${error.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || "Assertion failed");
}

// ─── Schema file integrity ───────────────────────────────────────

test("All three schemas parse and declare 2020-12", () => {
  for (const schema of Object.values(schemas)) {
    assert(schema.$schema === "https://json-schema.org/draft/2020-12/schema", `${schema.$id} wrong $schema`);
    assert(schema.$id.startsWith("https://gracefulboundaries.dev/schema/"), `${schema.$id} wrong $id base`);
  }
});

// ─── Refusal core (positive) ─────────────────────────────────────

test("Spec input-class 400 example validates against refusal schema", () => {
  const errors = validateAgainst(REFUSAL, {
    error: "invalid_input",
    detail: "This URL is outside the scanner's accepted public-target policy.",
    why: "Siteline accepts only public scan targets to prevent the scanner from being used as a proxy.",
    field: "url",
    expected: "A public URL with a resolvable hostname.",
  });
  assert(errors.length === 0, errors.join("; "));
});

test("Spec access-class 403 example validates against refusal schema", () => {
  const errors = validateAgainst(REFUSAL, {
    error: "forbidden",
    detail: "API key required for batch operations. Free scans are available at the public endpoint.",
    why: "Batch access requires authentication to prevent abuse and track usage.",
    authUrl: "https://example.com/api/keys",
    alternativeEndpoint: "/api/scan",
  });
  assert(errors.length === 0, errors.join("; "));
});

test("Spec not-found 404 example validates against refusal schema", () => {
  const errors = validateAgainst(REFUSAL, {
    error: "result_not_found",
    detail: "No scan result exists for example.com. This domain has not been scanned yet.",
    why: "Results are kept for 30 days after scanning.",
    scanAvailable: true,
    scanUrl: "/api/scan?url=https://example.com",
    humanUrl: "https://siteline.to/?url=example.com",
  });
  assert(errors.length === 0, errors.join("; "));
});

test("Spec availability 503 example validates against refusal schema", () => {
  const errors = validateAgainst(REFUSAL, {
    error: "service_unavailable",
    detail: "Result storage is temporarily unavailable.",
    why: "The storage backend is unreachable. This is usually transient.",
    retryAfterSeconds: 60,
    humanUrl: "https://siteline.to/",
  });
  assert(errors.length === 0, errors.join("; "));
});

// ─── Refusal core (negative) ─────────────────────────────────────

test("Missing why fails refusal schema", () => {
  const errors = validateAgainst(REFUSAL, {
    error: "invalid_input",
    detail: "Bad input.",
  });
  assert(errors.some((e) => e.includes('"why"')), "should report missing why");
});

test("Non-snake_case error fails refusal schema", () => {
  const errors = validateAgainst(REFUSAL, {
    error: "Rate-Limit-Exceeded",
    detail: "x",
    why: "y",
  });
  assert(errors.some((e) => e.includes("pattern")), "should report pattern violation");
});

test("Negative retryAfterSeconds fails refusal schema", () => {
  const errors = validateAgainst(REFUSAL, {
    error: "rate_limit_exceeded",
    detail: "x",
    why: "y",
    retryAfterSeconds: -5,
  });
  assert(errors.some((e) => e.includes("minimum")), "should report minimum violation");
});

test("Non-integer retryAfterSeconds fails refusal schema", () => {
  const errors = validateAgainst(REFUSAL, {
    error: "rate_limit_exceeded",
    detail: "x",
    why: "y",
    retryAfterSeconds: 2.5,
  });
  assert(errors.some((e) => e.includes("retryAfterSeconds")), "should report type violation");
});

// ─── 429 refusal (positive and negative) ─────────────────────────

test("Spec 429 example validates against refusal-429 schema", () => {
  const errors = validateAgainst(REFUSAL_429, {
    error: "rate_limit_exceeded",
    detail: "You can run up to 10 scans per hour. Try again in 2400 seconds.",
    limit: "10 scans per IP per hour",
    retryAfterSeconds: 2400,
    why: "Siteline is a free service. Rate limits keep it available for everyone and prevent abuse.",
    alternativeEndpoint: "/api/result?id=example.com",
  });
  assert(errors.length === 0, errors.join("; "));
});

test("429 body without limit fails refusal-429 schema", () => {
  const errors = validateAgainst(REFUSAL_429, {
    error: "rate_limit_exceeded",
    detail: "Try again in 60 seconds.",
    why: "Keeps the service available.",
    retryAfterSeconds: 60,
  });
  assert(errors.some((e) => e.includes('"limit"')), "should report missing limit");
});

test("429 body without retryAfterSeconds fails refusal-429 schema", () => {
  const errors = validateAgainst(REFUSAL_429, {
    error: "rate_limit_exceeded",
    detail: "Try again later.",
    why: "Keeps the service available.",
    limit: "10 per hour",
  });
  assert(errors.some((e) => e.includes('"retryAfterSeconds"')), "should report missing retryAfterSeconds");
});

test("429 with optional multi-limit metadata validates", () => {
  const errors = validateAgainst(REFUSAL_429, {
    error: "rate_limit_exceeded",
    detail: "Try again in 60 seconds.",
    why: "Keeps the service available.",
    limit: "10 per hour",
    retryAfterSeconds: 60,
    limitId: "scan-ip-hourly",
    limitType: "ip-rate",
    scope: "ip",
    windowResetAt: 1750000000,
  });
  assert(errors.length === 0, errors.join("; "));
});

// ─── Limits discovery (positive) ─────────────────────────────────

test("Spec discovery example validates against limits schema", () => {
  const errors = validateAgainst(LIMITS, {
    service: "Siteline",
    description: "AI agent readiness scanner.",
    conformance: "level-4",
    limits: {
      scan: {
        endpoint: "/api/scan",
        method: "GET",
        limits: [
          {
            type: "ip-rate",
            maxRequests: 10,
            windowSeconds: 3600,
            description: "10 scans per IP per hour.",
          },
        ],
      },
    },
  });
  assert(errors.length === 0, errors.join("; "));
});

test("Not-applicable declaration with empty limits validates", () => {
  const errors = validateAgainst(LIMITS, {
    service: "Example Blog",
    description: "Personal blog. No API or agentic services.",
    conformance: "not-applicable",
    limits: {},
  });
  assert(errors.length === 0, errors.join("; "));
});

test("Extensions and change discovery fields validate", () => {
  const errors = validateAgainst(LIMITS, {
    service: "Example Merchant",
    description: "Public commerce API.",
    conformance: "level-4",
    changelog: "/api/limits/changelog",
    feed: "/api/limits/feed.json",
    extensions: {
      actionBoundaries: "/.well-known/action-boundaries",
      commercialBoundaries: "/.well-known/commercial-boundaries",
    },
    limits: {},
  });
  assert(errors.length === 0, errors.join("; "));
  assert(
    !("agentCapable" in schemas[LIMITS].$defs.endpointEntry.properties),
    "roadmap-only fields must not be reserved in the published schema before admission to the spec"
  );
});

test("Resource-dedup entry with returnsCached and quota metadata validates", () => {
  const errors = validateAgainst(LIMITS, {
    service: "Example LLM API",
    description: "Token-metered inference API.",
    limits: {
      infer: {
        endpoint: "/api/infer",
        method: "POST",
        limits: [
          {
            type: "cost-limit",
            maxRequests: 1000000,
            windowSeconds: 2592000,
            costMetric: "tokens",
            maxInputTokens: 200000,
            description: "1M tokens per month.",
          },
          {
            type: "resource-dedup",
            maxRequests: 1,
            windowSeconds: 86400,
            returnsCached: true,
            description: "One scan per domain per calendar day.",
          },
        ],
      },
    },
  });
  assert(errors.length === 0, errors.join("; "));
});

// ─── Worked examples in examples/limits/ ─────────────────────────

const EXAMPLES_DIR = path.join(__dirname, "..", "examples", "limits");
for (const file of fs.readdirSync(EXAMPLES_DIR).filter((f) => f.endsWith(".json"))) {
  test(`Worked example ${file} validates against limits schema`, () => {
    const body = JSON.parse(fs.readFileSync(path.join(EXAMPLES_DIR, file), "utf8"));
    const errors = validateAgainst(LIMITS, body);
    assert(errors.length === 0, errors.join("; "));
  });
  test(`Worked example ${file} passes the checker's discovery validation`, () => {
    const { checkLimitsBody } = require("./check.js");
    const body = JSON.parse(fs.readFileSync(path.join(EXAMPLES_DIR, file), "utf8"));
    const result = checkLimitsBody(body);
    assert(result.isValid, `checker rejected ${file}: ${JSON.stringify(result.problems || result)}`);
  });
}

// ─── Limits discovery (negative) ─────────────────────────────────

test("Discovery body missing service fails limits schema", () => {
  const errors = validateAgainst(LIMITS, {
    description: "x",
    limits: {},
  });
  assert(errors.some((e) => e.includes('"service"')), "should report missing service");
});

test("Invalid conformance value fails limits schema", () => {
  const errors = validateAgainst(LIMITS, {
    service: "x",
    description: "y",
    conformance: "level-5",
    limits: {},
  });
  assert(errors.some((e) => e.includes("enum")), "should report enum violation");
});

test("Limit entry missing windowSeconds fails limits schema", () => {
  const errors = validateAgainst(LIMITS, {
    service: "x",
    description: "y",
    limits: {
      scan: {
        endpoint: "/api/scan",
        method: "GET",
        limits: [{ type: "ip-rate", maxRequests: 10, description: "z" }],
      },
    },
  });
  assert(errors.some((e) => e.includes('"windowSeconds"')), "should report missing windowSeconds");
});

test("Endpoint entry missing method fails limits schema", () => {
  const errors = validateAgainst(LIMITS, {
    service: "x",
    description: "y",
    limits: {
      scan: { endpoint: "/api/scan", limits: [] },
    },
  });
  assert(errors.some((e) => e.includes('"method"')), "should report missing method");
});

// ─── Schema / checker agreement ──────────────────────────────────

test("Schema required limit-entry fields match checker REQUIRED_LIMIT_ENTRY_FIELDS", () => {
  const { REQUIRED_LIMIT_ENTRY_FIELDS } = require("./check.js");
  const schemaRequired = schemas[LIMITS].$defs.limitEntry.required;
  assert(
    JSON.stringify([...schemaRequired].sort()) === JSON.stringify([...REQUIRED_LIMIT_ENTRY_FIELDS].sort()),
    `schema requires ${schemaRequired}, checker requires ${REQUIRED_LIMIT_ENTRY_FIELDS}`
  );
});

test("Schema conformance enum matches checker VALID_CONFORMANCE_VALUES", () => {
  const { VALID_CONFORMANCE_VALUES } = require("./check.js");
  const schemaEnum = schemas[LIMITS].properties.conformance.enum;
  assert(
    JSON.stringify([...schemaEnum].sort()) === JSON.stringify([...VALID_CONFORMANCE_VALUES].sort()),
    `schema enum ${schemaEnum}, checker ${VALID_CONFORMANCE_VALUES}`
  );
});

test("Schema required refusal fields match checker REQUIRED_REFUSAL_FIELDS for 429s", () => {
  const { REQUIRED_REFUSAL_FIELDS } = require("./check.js");
  const schemaRequired = schemas[REFUSAL_429].required;
  assert(
    JSON.stringify([...schemaRequired].sort()) === JSON.stringify([...REQUIRED_REFUSAL_FIELDS].sort()),
    `schema requires ${schemaRequired}, checker requires ${REQUIRED_REFUSAL_FIELDS}`
  );
});

test("Schemas disclose origin-aware SC-6 validation limits for machine-actionable URLs", () => {
  const refusalUrlFields = ["cachedResultUrl", "alternativeEndpoint", "scanUrl"];
  for (const field of refusalUrlFields) {
    const comment = schemas[REFUSAL].properties[field].$comment || "";
    assert(comment.includes("origin-dependent"), `${field} must disclose origin-dependent validation`);
    assert(comment.includes("evals/check.js"), `${field} must point schema consumers to the checker`);
  }

  for (const field of ["changelog", "feed", "extensions"]) {
    const comment = schemas[LIMITS].properties[field].$comment || "";
    assert(comment.includes("origin-dependent"), `${field} must disclose origin-dependent validation`);
    assert(comment.includes("evals/check.js"), `${field} must point schema consumers to the checker`);
  }
});

test("Schema validation is shape-only while checker enforces SC-6 URL origin", () => {
  const body = {
    error: "rate_limit_exceeded",
    detail: "Try again in 60 seconds.",
    why: "Rate limits keep the service available.",
    limit: "10 per hour",
    retryAfterSeconds: 60,
    cachedResultUrl: "https://attacker.example/cache",
  };
  const schemaErrors = validateAgainst(REFUSAL_429, body);
  assert(schemaErrors.length === 0, `schema should only validate shape: ${schemaErrors.join("; ")}`);

  const { checkRefusalBody } = require("./check.js");
  const checkerResult = checkRefusalBody(body, "https://example.com");
  assert(!checkerResult.hasConstructiveFields, "off-origin cachedResultUrl must not count as constructive");
  assert(
    checkerResult.warnings.some((warning) => warning.includes("cachedResultUrl")),
    "checker must warn about off-origin cachedResultUrl"
  );
});

// ─── Summary ─────────────────────────────────────────────────────

console.log("");
console.log(`${passed + failed} tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
