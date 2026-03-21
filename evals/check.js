#!/usr/bin/env node

/**
 * Graceful Boundaries conformance checker.
 *
 * Tests a live service against the three conformance levels:
 *   Level 1: Structured Refusal — 429 responses include required fields
 *   Level 2: Discoverable — a limits discovery endpoint exists
 *   Level 3: Constructive — refusal responses include guidance fields
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

function assessLevel(limitsResults, refusalCheck) {
  const limitsFound = limitsResults.some((r) => r.found && r.wellFormed);

  const level1 = refusalCheck
    ? refusalCheck.isJson && refusalCheck.hasRequiredFields
    : null;

  const level2 = level1 && limitsFound;
  const level3 = level2 && (refusalCheck ? refusalCheck.hasConstructiveFields : false);

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

  // If we found a limits endpoint, we can at least determine Level 2 eligibility
  if (foundLimits && foundLimits.wellFormed) {
    report.conformanceLevel = 2;
    report.notes.push("Level 2 (Discoverable) confirmed: limits endpoint exists and is well-formed.");
    report.notes.push("Level 1 and Level 3 require verifying actual 429 response bodies.");
  } else if (foundLimits) {
    report.notes.push("Limits endpoint found but not well-formed. Level 2 not confirmed.");
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
    console.log(`Confirmed conformance level: ${report.conformanceLevel}`);
    console.log("");

    if (report.notes.length > 0) {
      console.log("Notes:");
      report.notes.forEach((n) => console.log(`  - ${n}`));
    }
  }
}

module.exports = { checkRefusalBody, assessLevel, REQUIRED_REFUSAL_FIELDS, CONSTRUCTIVE_FIELDS };

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
