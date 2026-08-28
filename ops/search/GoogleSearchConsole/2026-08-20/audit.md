---
title: "Google Search Console audit"
property: "sc-domain:gracefulboundaries.dev"
provider: "Google Search Console"
observed: 2026-08-20
lane: console
status: archived
---
# Google Search Console audit, 2026-08-20

Sanitized archive of an authenticated read-only console review of `sc-domain:gracefulboundaries.dev`. Account identity, private queries, authenticated URLs, and browser artifacts are excluded by policy.

This file is append-only. Later evidence may supersede a classification recorded here, but must not rewrite what was observed on this date.

## Scope and authority

The session was audit-only. It made no repository, deployment, or Google Search Console changes. No indexing was requested, no sitemap was submitted, and no validation batch was started.

Property identity was verified from both the visible property selector and the `resource_id=sc-domain:gracefulboundaries.dev` request parameter.

## Repository and deployment state at observation

- Branch `main`, tracking `origin/main`; tracked worktree clean
- Local HEAD, remote `main`, Pages build, and deployment SHA all `759270ea3570275b9a8f7e5fc410e526d8a7b86d`
- Pages build ID `1108137372`, state `built`
- Deployment ID `5548817835`, state `success`
- Deployable artifact: the static repository root; no build script
- No `search-audit.config.json`, deterministic search validators, `ops/search-indexing.md`, dated search evidence, or action ledger existed at observation time

## Repository and production validation completed

| Lane | Result |
|---|---|
| Repository tests | 259 of 259 passed |
| Offline search assertions | 15 of 17 passed |
| Local link checks | 17 of 17 passed |
| JSON-LD parsing | 5 of 5 blocks passed |
| Production HTTP assertions | 23 of 24 passed across 15 requests |
| Sitemap targets | All five returned HTTP 200 with their actual content types |
| Deployed-byte comparison | Homepage, sitemap, robots file, and assistant guide matched |

Two repeatable failures were confirmed:

1. Sitemap `lastmod`, `article:modified_time`, and JSON-LD `dateModified` disagree.
2. Intended first-party search targets do not all have crawl-visible internal sources.

## Console observations

Each row records the report date the console itself supplied. Where the interface supplied no date, that absence is recorded rather than inferred.

### Page indexing

Report last updated 2026-08-16.

- One indexed page
- Three not indexed, all under `Page with redirect`
- Indexed example: `https://gracefulboundaries.dev/`, last crawled 2026-07-30

Redirect examples, all intentional:

| URL | Last crawled |
|---|---|
| `http://www.gracefulboundaries.dev/` | 2026-07-30 |
| `https://www.gracefulboundaries.dev/` | 2026-07-24 |
| `http://gracefulboundaries.dev/` | 2026-07-21 |

### URL Inspection

| Target | Result |
|---|---|
| `https://gracefulboundaries.dev/` | On Google; indexed; successful fetch; crawl and indexing allowed; user canonical and Google canonical identical; no referring sitemap detected |
| `https://gracefulboundaries.dev/spec.md` | Not on Google; unknown to Google; never crawled; no referring sitemap or referring page detected |

The root inspection reported three referring pages.

### Sitemap

Submitted 2026-04-09. Last read 2026-04-25. Status `Success`. One discovered page, zero videos.

The last-read date is stale relative to the July sitemap revision, although the live endpoint is healthy and returns HTTP 200.

### Performance

Through 2026-08-18: 29 impressions, zero clicks, 0 percent CTR, average position 8.9.

### Core Web Vitals

Report last updated 2026-08-18. Insufficient 90-day usage data for both mobile and desktop. This is insufficient field data, not zero good or poor URLs.

### HTTPS

Report last updated 2026-08-18. One HTTPS URL, zero non-HTTPS URLs, no issues.

### Manual actions, security, removals, enhancements

| Report | Observation | Report date |
|---|---|---|
| Manual actions | No issues detected | Not supplied by the interface |
| Security issues | No issues detected | Not supplied by the interface |
| Removals | No requests in the last six months | Six-month window |
| Enhancements | None reported | Not supplied by the interface |

### Links

The undated Links report shows zero internal and zero external links, while the root URL Inspection reports three referring pages. These contradict each other. Classified as inconsistent and unknown, not an authoritative zero.

### Validation batches

None active. The redirect group is `Not Started`, not an active batch.

## Exports

None captured. Recorded as an absence rather than a fabricated export.

## Console actions taken

None.

## Classification summary

| Finding | Class |
|---|---|
| Search policy not recorded in a property-specific repository matrix | Defect |
| Sitemap mixes canonical HTML with machine and document surfaces | Defect and policy decision |
| `/spec.md` declared in sitemap, unknown to Google, no internal source | Defect and policy decision |
| Three freshness signals disagree | Defect |
| Deterministic offline and production search contracts missing | Defect |
| Repository-owned search documentation, dated evidence, and action ledger missing | Defect |
| Three HTTP or `www` redirect exclusions | Expected noise |
| `/spec` returning 404 | Expected noise |
| Synthetic unknown routes returning custom `noindex` 404 | Expected noise |
| External GitHub and ClawHub copies absent from the property | Expected noise |
| Stale sitemap last-read against a healthy live endpoint | External limitation |
| Core Web Vitals insufficient field data | Unknown |
| Links report internally inconsistent and undated | Unknown |
| Historical individual indexing-request acceptance unavailable in the inspected interface | Unknown |

No evidence-backed pending-recrawl item or active validation batch exists.

## Follow-up

The unresolved specification index policy and the current action ledger are maintained in [`ops/search-indexing.md`](../../../search-indexing.md), which is authoritative for disposition. This file records only what was observed on 2026-08-20.
