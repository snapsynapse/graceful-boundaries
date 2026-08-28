<!-- Upstream template: portfolio-search-indexing-audit repository contract v5; validator schema v4 -->
---
title: "Search indexing"
purpose: "Property-specific index policy, validation lanes, deployment gate, and console follow-up."
status: active
updated: 2026-08-28
owner: "Snap Synapse LLC"
open_tasks:
  - "Optional: one sitemap resubmission in Google Search Console, now that the changed inventory is live and verified."
---
# Search indexing

Canonical origin: `https://gracefulboundaries.dev/`

Provider property: Google Search Console `sc-domain:gracefulboundaries.dev`

Property type: website, domain property

Generated output: none. The deployable artifact is the static repository root, served by GitHub Pages from `main:/`. There is no build script and no separate output directory.

The repository is authoritative for property policy, validators, sanitized dated evidence, and the console action ledger. The installed `portfolio-search-indexing-audit` skill owns the shared method and templates. LocalBrain's Search Property Queue owns only cross-property sequencing.

## Index policy

The portfolio search contract reserves HTML sitemap membership for canonical HTML search targets. This property satisfies that contract as of the 2026-08-28 Option B repair.

| Surface | Policy | Reason |
|---|---|---|
| `/` | Index and include in sitemap; JSON-LD required | The only canonical HTML search target |
| `/spec.md` | Crawlable document surface; omit from HTML sitemap; not a search index target | Raw Markdown, not an HTML page. Option B, decided 2026-08-28 |
| `/404.html` and unknown routes | `noindex` and omit from sitemap | Error surfaces are not content destinations |
| `/.well-known/assistant-guide.txt`, `/assistant-guide.txt`, `/llms.txt`, `/robots.txt`, `/sitemap.xml`, `/schema/*.json`, `/badges/*.json` | Crawlable machine surfaces; omit from HTML sitemap | Machine consumption, not canonical HTML index targets |
| `/docs/*.md` | Crawlable document surfaces; omit from HTML sitemap | Raw Markdown documents, not canonical HTML index targets |
| `/spec` | Intentional HTTP 404 | Not a published route; the specification is served at `/spec.md` |
| HTTP and `www` variants | Redirect to the matching bare HTTPS canonical URL | Canonical host and protocol normalization |
| External GitHub, npm, and ClawHub copies | Omit from sitemap | Distribution and reference copies are not site canonical pages |

### Resolved: specification index policy

Decided 2026-08-28. **Option B**: `/spec.md` remains a public machine and document surface that is deliberately not a Google index target, and is removed from the HTML sitemap.

The specification is published as raw Markdown and served as `text/markdown`. It is not an HTML page, cannot carry a canonical link element or JSON-LD, and so cannot satisfy the HTML search-target contract. Making it an index target would have required publishing a parallel canonical HTML specification page (Option A), which was rejected.

Consequences of the decision, all implemented in the same change:

- The HTML sitemap lists exactly one URL, `https://gracefulboundaries.dev/`.
- `/spec.md`, `/llms.txt`, `/docs/agentic-surfaces.md`, and `/.well-known/assistant-guide.txt` left the sitemap. They stay crawlable under `robots.txt` and reachable at stable URLs.
- The prior expectation that `/spec.md` should be indexed is retired. Its `unknown to Google` status is now policy-consistent, not a defect.
- The 1.5.3 release eval that required the spec URL in the sitemap was inverted to enforce the new policy, and now asserts the sitemap lists exactly the canonical HTML search targets.
- GitHub Pages serves static files without response-header control, so `noindex` cannot be set on a raw Markdown surface. Sitemap exclusion is the available lever and the intended one.

The decision does not change what is published, only what is declared as a search target. Nothing was removed from the site.

## Validation lanes

Scaffolded 2026-08-28 from the skill's `assets/` templates, vendored so CI does not depend on a user-specific skill installation path. `outputDir` is `.` because the deployable artifact is the repository root.

- Offline, in normal CI: `node scripts/check-search.mjs`
- Production, release-triggered only: `node scripts/check-production-search.mjs`
- Machine-readable output: add `--json`
- Alternate config: add `--config=<path>`

Exit code `0` is pass, `1` is a site or generated-output defect, and `2` is configuration or infrastructure failure. Exit code `2` is unknown. It is neither a passing site nor evidence of a defect, and a monitoring system must preserve that distinction.

`.github/workflows/test.yml` runs `npm test` (270 tests) and then the offline search contract on every push and pull request. The production contract is deliberately not wired into pull-request CI: it asserts against the deployed origin, which lags the branch under test.

`search-audit.config.json` sets `lastmodAgreementPaths: ["/"]`, so the offline validator fails if sitemap `lastmod`, `article:modified_time`, and JSON-LD `dateModified` for the homepage drift apart again. `requireJsonLd` is `true`, and `expectedNotFoundPaths` includes `/spec` so the intentional 404 is affirmative rather than incidental.

## Deployment and console sequence

1. Run `npm test` and, once scaffolded, the offline search contract.
2. Push to `main`. GitHub Pages deploys the repository root.
3. Wait for the Pages build and deployment to report success.
4. Run the production search contract.
5. Confirm the deployed sitemap URL set matches the repository sitemap.
6. Refresh discovery surfaces only after the production check passes.
7. Inspect or request indexing for canonical HTML pages only.
8. Start issue-group validation only when matching production behavior is live.
9. Record console state under `ops/search/<provider>/YYYY-MM-DD/`.

## Expected noise

- `Page with redirect` for the HTTP and `www` variants is intentional and must not receive `Validate fix`.
- `/spec` returning HTTP 404 is intentional.
- Unknown routes return the custom `noindex` 404 by design.
- Machine-readable text, XML, JSON schema, and badge surfaces are crawlable but are not HTML sitemap targets.
- External GitHub, npm, and ClawHub copies are not sitemap targets and their absence from the property is not a defect.

## Evidence governance

- Repository truth is the tracked static root, and (once scaffolded) `search-audit.config.json` with the offline validator.
- Production truth is direct HTTP evidence captured after deployment by the production validator.
- Console observations are lagging provider evidence and never override a repository or production contradiction.
- Sanitized console observations live under `ops/search/GoogleSearchConsole/YYYY-MM-DD/`. Account identity, private queries, raw exports, screenshots, traces, authenticated browser state, and unreviewed downloads must remain outside Git under `.search-evidence-private/`.
- Missing, stale, insufficient, unknown, and zero are distinct states. No state may be inferred from an absent report. A report that contradicts itself is unknown, not an authoritative zero.
- Historical dated observations are append-only. Later evidence may supersede a prior classification, but must not rewrite what was observed on the earlier date.

## Current classified state

Reconciled from the 2026-08-20 audit. See [`audit.md`](search/GoogleSearchConsole/2026-08-20/audit.md).

| Observation | Classification | Current disposition |
|---|---|---|
| Sitemap mixed one canonical HTML page with four machine or document surfaces | Defect, repaired and deployed 2026-08-28 | Option B applied; deployed sitemap lists `/` only |
| `/spec.md` was declared in the sitemap, unknown to Google, never crawled, and had no first-party internal source | Resolved by policy 2026-08-28 | Option B makes `unknown to Google` policy-consistent. Never request indexing for it |
| Sitemap `lastmod` `2026-07-21`, `article:modified_time` `2026-05-29`, JSON-LD `dateModified` `2026-06-09` disagreed | Defect, repaired and deployed 2026-08-28 | All three now `2026-08-28`; regression-locked by `lastmodAgreementPaths` |
| Production contract reported 18 defects against the pre-repair deployed sitemap | Resolved by deployment 2026-08-28 | Zero defects at deployed SHA `b799b71`; all excluded surfaces verified still HTTP 200 |
| Root is indexed with exact user and Google canonical | Policy-consistent indexed page | No indexing request justified |
| Three HTTP or `www` examples appear as `Page with redirect` | Expected policy-consistent exclusion | Do not start `Validate fix` |
| Sitemap reports `Success`, one discovered page, last read 2026-04-25 | Stale provider evidence against a healthy live endpoint | Do not resubmit merely to force a refresh |
| Deterministic offline and production search contracts were absent | Defect, repaired 2026-08-28 | Both scaffolded; offline lane wired into CI |
| Core Web Vitals reports insufficient 90-day field data for mobile and desktop | Unknown due to insufficient provider data, not a defect | No performance remediation or `web-perf` audit justified |
| Links report shows zero internal and external links while root URL Inspection reports three referring pages | Unknown; provider evidence is internally inconsistent and undated | Do not treat as an authoritative zero |
| Manual actions, security issues, and HTTPS were explicitly reported clear; removals had no requests in six months | Policy-consistent or explicit zero | No action |
| No enhancement report was present | Missing or unavailable report surface, not an inferred zero | No action |
| Performance through 2026-08-18: 29 impressions, zero clicks, average position 8.9 | Low-volume baseline, not a defect | No action; a single indexed page cannot support more |

## Console action ledger

| Provider and property | Action and target | Accepted time | Observed confirmation | Result class | Repeat policy | Next-review condition |
|---|---|---|---|---|---|---|
| Google Search Console `sc-domain:gracefulboundaries.dev` | Historical submission of `https://gracefulboundaries.dev/sitemap.xml` | 2026-04-09, exact time unavailable | `Success`; last read 2026-04-25; one discovered page; zero videos | Accepted console action; provider reporting stale relative to the July sitemap revision | Do not resubmit while the sitemap remains healthy | When last read advances beyond 2026-04-25, or after a verified material sitemap deployment |
| Same | Root URL inspection | Read-only on 2026-08-20 | On Google, indexed, successful fetch, crawl and indexing allowed, exact canonical, no referring sitemap detected | Healthy | Do not request indexing | After a material deployed source change |
| Same | `/spec.md` URL inspection | Read-only on 2026-08-20 | Not on Google, unknown to Google, never crawled, no referring sitemap or page detected | Defect and policy decision | Do not request indexing yet | After the policy decision and a verified deployment |
| Same | Redirect exclusion group | No action taken | `Not Started`; three intentional redirects | Expected noise | Never validate while intentional | Only if the redirect policy changes |

No indexing requests, sitemap submissions, or validation batches were started during the 2026-08-20 audit. No console exports were captured.

## Do not repeat

- Do not resubmit the successful sitemap merely to force a refresh.
- Do not start `Validate fix` for the intentional redirect group.
- Do not request indexing for the already-indexed root.
- Do not request indexing for raw `/spec.md`. Option B makes it a non-index target permanently; its absence from Google is the intended state, not a defect to chase.
- Do not validate the intentional `/spec` or unknown-route 404s.
- Do not create removal requests.
- Do not infer an accepted console action from a click; require an observed confirmation.
- Do not recapture authenticated console state merely to restate the unchanged 2026-08-20 observation.

## Next review

The index policy is settled and the repair is deployed and verified. The property now waits on provider evidence only.

Repository and production gates both pass at deployed SHA `b799b71`. The one remaining permitted console action is a single sitemap resubmission: the inventory materially changed from five URLs to one, which is exactly the condition the repeat policy allows. It is optional. The endpoint is healthy and Google will re-read it unprompted; resubmission only shortens the wait on a last-read date stuck at 2026-04-25. If taken, record it in the ledger with an observed confirmation, not an inferred one.

Do not request indexing for anything. `/` is already indexed, and `/spec.md` is now a non-index target by policy.

Recheck provider evidence when the sitemap last-read date advances beyond 2026-04-25, when Page indexing advances beyond its 2026-08-16 report date, or on 2026-09-03 if neither has happened. Expect the three redirect exclusions to persist; they are intentional. Before any console mutation, rerun both gates and reconcile this ledger.
