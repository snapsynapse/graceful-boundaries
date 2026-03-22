#!/usr/bin/env node

/**
 * Graceful Boundaries conformance checker.
 *
 * Tests a live service against the three conformance levels:
 *   N/A:     Not Applicable — no agentic interaction surface
 *   Level 0: Non-Conformant — limits exist but are not described
 *   Level 1: Structured Refusal — 429 responses include required fields
 *   Level 2: Discoverable — a limits discovery endpoint exists
 *   Level 3: Constructive — refusal responses include guidance fields
 *   Level 4: Proactive — successful responses include proactive limit headers
 *
 * Usage:
 *   node evals/check.js https://your-service.com
 *   node evals/check.js https://your-service.com --limits-path /api/limits
 *   node evals/check.js https://your-service.com --json
 */

const REQUIRED_REFUSAL_FIELDS = ["error", "detail", "limit", "retryAfterSeconds", "why"];
const CONSTRUCTIVE_FIELDS = ["cached", "cachedResultUrl", "alternativeEndpoint", "upgradeUrl", "humanUrl"];
const DEFAULT_LIMITS_PATHS = ["/api/limits", "/.well-known/limits"];

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = { baseUrl: null, limitsPath: null, json: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limits-path" && i + 1 < args.length) {
      options.limitsPath = args[++i];
    } else if (args[i] === "--json") {
      options.json = true;
    } else if (!args[i].startsWith("--")) {
      options.baseUrl = args[i].replace(/\/$/, "");
    }
  }

  return options;
}

async function checkLimitsEndpoint(baseUrl, limitsPath) {
  const paths = limitsPath ? [limitsPath] : DEFAULT_LIMITS_PATHS;
  const results = [];

  for (const path of paths) {
    const url = `${baseUrl}${path}`;
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        results.push({ path, status: response.status, found: false });
        continue;
      }

      const body = await response.json();
      const hasService = typeof body.service === "string";
      const hasLimits = body.limits && typeof body.limits === "object";
      const conformance = typeof body.conformance === "string" ? body.conformance : null;
      const limitEntries = hasLimits ? Object.values(body.limits) : [];

      const wellFormed = limitEntries.every((entry) => {
        if (!entry.endpoint || !Array.isArray(entry.limits)) return false;
        return entry.limits.every(
          (l) =>
            typeof l.type === "string" &&
            typeof l.maxRequests === "number" &&
            typeof l.windowSeconds === "number" &&
            typeof l.description === "string"
        );
      });

      const cacheControl = response.headers.get("cache-control") || "";
      const isCacheable = /s-maxage=\d+/.test(cacheControl) || /max-age=\d+/.test(cacheControl);

      results.push({
        path,
        status: response.status,
        found: true,
        hasService,
        hasLimits,
        conformance,
        limitCount: limitEntries.length,
        wellFormed,
        isCacheable,
      });
    } catch (error) {
      results.push({ path, status: 0, found: false, error: error.message });
    }
  }

  return results;
}

function checkDedupResponse(body) {
  if (!body || typeof body !== "object") {
    return { isDedup: false, errors: ["Body is not an object"] };
  }

  const errors = [];
  const hasRescanBlocked = "_rescanBlocked" in body && body._rescanBlocked === true;
  const hasCacheStatus = "_cacheStatus" in body && typeof body._cacheStatus === "string";
  const hasResultData = Object.keys(body).some(
    (k) => !k.startsWith("_") && k !== "error" && k !== "detail"
  );

  if (!hasRescanBlocked) errors.push("Missing '_rescanBlocked: true' flag");
  if (!hasResultData) errors.push("Dedup response should include the original result data");

  return {
    isDedup: hasRescanBlocked,
    hasRescanBlocked,
    hasCacheStatus,
    hasResultData,
    errors,
  };
}

function isStableErrorValue(error) {
  if (typeof error !== "string" || error.length === 0) return false;
  // Must be snake_case or kebab-case: lowercase alphanumeric with underscores or hyphens
  return /^[a-z][a-z0-9]*([_-][a-z0-9]+)*$/.test(error);
}

function checkRefusalBody(body) {
  const checks = {};
  const parsed = typeof body === "string" ? tryParseJson(body) : body;

  if (!parsed) {
    return {
      isJson: false,
      hasRequiredFields: false,
      missingFields: REQUIRED_REFUSAL_FIELDS,
      hasConstructiveFields: false,
      constructiveFields: [],
    };
  }

  const missing = REQUIRED_REFUSAL_FIELDS.filter((f) => !(f in parsed));
  const constructive = CONSTRUCTIVE_FIELDS.filter((f) => f in parsed);

  // Quality checks
  const whyIsNotRestated =
    parsed.why &&
    parsed.error &&
    !parsed.why.toLowerCase().includes(parsed.error.toLowerCase().replace(/_/g, " "));

  const detailIncludesTime =
    parsed.detail && /\d+\s*(second|minute|hour)/i.test(parsed.detail);

  const retryIsNumber =
    typeof parsed.retryAfterSeconds === "number" && parsed.retryAfterSeconds >= 0;

  return {
    isJson: true,
    hasRequiredFields: missing.length === 0,
    missingFields: missing,
    hasConstructiveFields: constructive.length > 0,
    constructiveFields: constructive,
    whyIsNotRestated: whyIsNotRestated !== false,
    detailIncludesTime,
    retryIsNumber,
  };
}

function tryParseJson(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

const VALID_CONFORMANCE_VALUES = [
  "not-applicable", "none", "level-1", "level-2", "level-3", "level-4",
];

const REQUIRED_LIMIT_ENTRY_FIELDS = ["type", "maxRequests", "windowSeconds", "description"];

function checkLimitsBody(body) {
  if (!body || typeof body !== "object") {
    return { isValid: false, errors: ["Body is not an object"] };
  }

  const errors = [];
  const warnings = [];

  const hasService = typeof body.service === "string" && body.service.length > 0;
  const hasDescription = typeof body.description === "string" && body.description.length > 0;
  const hasLimits = body.limits && typeof body.limits === "object" && !Array.isArray(body.limits);
  const conformance = typeof body.conformance === "string" ? body.conformance : null;

  if (!hasService) warnings.push("Missing 'service' field");
  if (!hasDescription) warnings.push("Missing 'description' field");
  if (!hasLimits) errors.push("Missing or invalid 'limits' object");

  // Validate conformance value
  let conformanceValid = true;
  if (conformance !== null && !VALID_CONFORMANCE_VALUES.includes(conformance)) {
    errors.push(`Invalid conformance value: "${conformance}"`);
    conformanceValid = false;
  }

  // Validate limit entries
  const limitEntries = hasLimits ? Object.entries(body.limits) : [];
  const entryErrors = [];

  for (const [key, entry] of limitEntries) {
    if (!entry.endpoint || typeof entry.endpoint !== "string") {
      entryErrors.push(`${key}: missing or invalid 'endpoint'`);
    }
    if (!Array.isArray(entry.limits)) {
      entryErrors.push(`${key}: missing or invalid 'limits' array`);
      continue;
    }
    for (let i = 0; i < entry.limits.length; i++) {
      const limit = entry.limits[i];
      const missing = REQUIRED_LIMIT_ENTRY_FIELDS.filter((f) => {
        if (f === "maxRequests" || f === "windowSeconds") return typeof limit[f] !== "number";
        return typeof limit[f] !== "string" || limit[f].length === 0;
      });
      if (missing.length > 0) {
        entryErrors.push(`${key}.limits[${i}]: missing ${missing.join(", ")}`);
      }
    }
  }

  // Consistency checks
  let conformanceConsistent = true;
  if (conformance === "not-applicable" && limitEntries.length > 0) {
    errors.push("Declares not-applicable but lists limits");
    conformanceConsistent = false;
  }
  if (conformance === "none" && limitEntries.length > 0) {
    // A "none" declaration with populated limits means the site is better than it claims
    warnings.push("Declares 'none' but has populated limits — may understate conformance");
  }

  return {
    isValid: errors.length === 0 && entryErrors.length === 0,
    hasService,
    hasDescription,
    hasLimits,
    conformance,
    conformanceValid,
    conformanceConsistent,
    limitCount: limitEntries.length,
    entryErrors,
    errors,
    warnings,
  };
}

function checkProactiveHeaders(headers) {
  if (!headers || typeof headers !== "object") {
    return { hasProactiveHeaders: false, errors: ["No headers provided"] };
  }

  const errors = [];

  // Normalize header names to lowercase
  const normalized = {};
  for (const [k, v] of Object.entries(headers)) {
    normalized[k.toLowerCase()] = v;
  }

  const ratelimit = normalized["ratelimit"] || null;
  const policy = normalized["ratelimit-policy"] || null;

  if (!ratelimit) {
    return { hasProactiveHeaders: false, errors: ["Missing RateLimit header"] };
  }

  // Parse RateLimit header: "limit=N, remaining=N, reset=N"
  const parts = ratelimit.split(",").map((s) => s.trim());
  const limitPart = parts.find((p) => p.startsWith("limit="));
  const remainingPart = parts.find((p) => p.startsWith("remaining="));
  const resetPart = parts.find((p) => p.startsWith("reset="));

  if (!limitPart) errors.push("RateLimit header missing 'limit' component");
  if (!remainingPart) errors.push("RateLimit header missing 'remaining' component");
  if (!resetPart) errors.push("RateLimit header missing 'reset' component");

  const limitValue = limitPart ? parseInt(limitPart.split("=")[1], 10) : null;
  const remainingValue = remainingPart ? parseInt(remainingPart.split("=")[1], 10) : null;
  const resetValue = resetPart ? parseInt(resetPart.split("=")[1], 10) : null;

  if (limitValue !== null && isNaN(limitValue)) errors.push("RateLimit 'limit' is not a number");
  if (remainingValue !== null && isNaN(remainingValue)) errors.push("RateLimit 'remaining' is not a number");
  if (resetValue !== null && isNaN(resetValue)) errors.push("RateLimit 'reset' is not a number");

  if (limitValue !== null && remainingValue !== null && remainingValue > limitValue) {
    errors.push("RateLimit 'remaining' exceeds 'limit'");
  }

  // Validate RateLimit-Policy if present (advisory, does not block hasProactiveHeaders)
  const warnings = [];
  let policyValid = null;
  if (policy) {
    // Expected format: "N;w=N"
    policyValid = /^\d+;w=\d+$/.test(policy.trim());
    if (!policyValid) warnings.push(`RateLimit-Policy format invalid: "${policy}"`);
  }

  return {
    hasProactiveHeaders: errors.length === 0 && limitPart && remainingPart && resetPart,
    ratelimit,
    policy,
    limitValue,
    remainingValue,
    resetValue,
    policyValid,
    errors,
    warnings,
  };
}

function assessLevel(limitsResults, refusalCheck, proactiveHeaders) {
  const limitsFound = limitsResults.some((r) => r.found && r.wellFormed);

  // Check for a declared conformance of "not-applicable"
  const limitsBody = limitsResults.find((r) => r.found && r.conformance);
  if (limitsBody && limitsBody.conformance === "not-applicable") {
    // N/A is valid only if there are no limits declared
    if (limitsBody.limitCount === 0) return "not-applicable";
    // A site declaring N/A but listing limits is misclassified — fall through
  }

  const level1 = refusalCheck
    ? refusalCheck.isJson && refusalCheck.hasRequiredFields
    : null;

  const level2 = level1 && limitsFound;
  const level3 = level2 && (refusalCheck ? refusalCheck.hasConstructiveFields : false);
  const level4 = level3 && proactiveHeaders && proactiveHeaders.hasProactiveHeaders;

  if (level4) return 4;
  if (level3) return 3;
  if (level2) return 2;
  if (level1) return 1;
  return 0;
}

async function main() {
  const options = parseArgs(process.argv);

  if (!options.baseUrl) {
    console.error("Usage: node evals/check.js <base-url> [--limits-path /path] [--json]");
    console.error("");
    console.error("Examples:");
    console.error("  node evals/check.js https://siteline.snapsynapse.com");
    console.error("  node evals/check.js https://your-api.com --limits-path /.well-known/limits --json");
    process.exit(1);
  }

  const report = {
    target: options.baseUrl,
    checkedAt: new Date().toISOString(),
    limitsDiscovery: null,
    refusalFormat: null,
    conformanceLevel: 0,
    notes: [],
  };

  // Check limits discovery endpoint
  console.error(`Checking limits discovery at ${options.baseUrl}...`);
  const limitsResults = await checkLimitsEndpoint(options.baseUrl, options.limitsPath);
  report.limitsDiscovery = limitsResults;

  const foundLimits = limitsResults.find((r) => r.found);
  if (foundLimits) {
    console.error(`  Found at ${foundLimits.path} (${foundLimits.limitCount} endpoint(s) documented)`);
    if (!foundLimits.wellFormed) {
      report.notes.push("Limits endpoint exists but entries are not well-formed per spec.");
    }
    if (!foundLimits.isCacheable) {
      report.notes.push("Limits endpoint is not cacheable. Consider adding Cache-Control headers.");
    }
  } else {
    console.error("  No limits discovery endpoint found.");
    report.notes.push("No limits discovery endpoint found at standard paths.");
  }

  // Note: We can't easily trigger a real 429 to test refusal format
  // without hammering the service. Instead, we document what to check.
  report.notes.push(
    "Refusal format (Level 1) requires a 429 response to verify. " +
    "Use --json and manually trigger a rate limit to check the response shape."
  );

  // Check for N/A declaration
  if (foundLimits && foundLimits.conformance === "not-applicable") {
    if (foundLimits.limitCount === 0) {
      report.conformanceLevel = "not-applicable";
      report.notes.push("Site declares not-applicable: no agentic interaction surface.");
    } else {
      report.notes.push(
        "Site declares not-applicable but lists limits. Declaration is inconsistent — evaluating as a conforming service."
      );
    }
  }

  // If we found a limits endpoint, we can at least determine Level 2 eligibility
  if (report.conformanceLevel !== "not-applicable") {
    if (foundLimits && foundLimits.wellFormed) {
      report.conformanceLevel = 2;
      report.notes.push("Level 2 (Discoverable) confirmed: limits endpoint exists and is well-formed.");
      report.notes.push("Level 1 and Level 3 require verifying actual 429 response bodies.");
    } else if (foundLimits) {
      report.notes.push("Limits endpoint found but not well-formed. Level 2 not confirmed.");
    }
  }

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log("");
    console.log(`Graceful Boundaries conformance check: ${options.baseUrl}`);
    console.log("=".repeat(60));
    console.log("");

    console.log("Limits Discovery:");
    for (const r of limitsResults) {
      if (r.found) {
        console.log(`  ${r.path}: FOUND (${r.limitCount} endpoints, well-formed: ${r.wellFormed}, cacheable: ${r.isCacheable})`);
      } else {
        console.log(`  ${r.path}: NOT FOUND (${r.status || r.error})`);
      }
    }

    console.log("");
    const levelDisplay = report.conformanceLevel === "not-applicable"
      ? "N/A (Not Applicable)"
      : `Level ${report.conformanceLevel}`;
    console.log(`Confirmed conformance level: ${levelDisplay}`);
    console.log("");

    if (report.notes.length > 0) {
      console.log("Notes:");
      report.notes.forEach((n) => console.log(`  - ${n}`));
    }
  }
}

module.exports = {
  checkRefusalBody,
  checkLimitsBody,
  checkProactiveHeaders,
  checkDedupResponse,
  isStableErrorValue,
  assessLevel,
  REQUIRED_REFUSAL_FIELDS,
  CONSTRUCTIVE_FIELDS,
  VALID_CONFORMANCE_VALUES,
  REQUIRED_LIMIT_ENTRY_FIELDS,
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
