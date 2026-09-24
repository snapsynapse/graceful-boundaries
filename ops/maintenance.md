# Maintenance and Delivery Queue

Scope: Graceful Boundaries repository maintenance, trust evidence, and adoption validation. Reconciled and locally prepared on 2026-09-07.

## Baseline and local preparation

The preparation started from clean `main` at `fc2d2e20cd04056fa1cb18ec394155722bc8310c`, also the public `main` at that checkpoint and the v1.5.4 release commit. GitHub, npm, ClawHub, and the live specification were independently checked at version 1.5.4. ClawHub reported six versions and MIT-0 for its latest artifact. At that checkpoint, the release commit, annotated `v1.5.4`, and moving `v1` tag were unsigned. Versioned historical release objects remain unchanged.

The maintainer authorized the recommended local work and subsequently signed commit, branch push, and PR delivery on 2026-09-07. The local maintenance checkpoint kept changes under `CHANGELOG.md` `Unreleased`, provisionally targeting 1.5.5. At the local validation checkpoint, no version bump, commit, push, GitHub configuration change, tag movement, registry upload, DOI publication, or deployment had occurred. That checkpoint authorized commit/push/PR delivery. The subsequent release authorization is recorded below; GitHub settings remain a separate follow-up.

| Work | Local disposition | Remaining delivery condition |
|---|---|---|
| ClawHub producer | Generates exactly `SKILL.md` and `MANIFEST.yaml`; stale card/builder inputs are removed and regression-tested | Rebuild from the approved release commit; verify actual registry upload and generated card |
| License correction | Already accepted MIT-0 consumer grant is documented, with canonical CC-BY-4.0 text / MIT code origin metadata | Confirm registry metadata matches at publication; preserve the historical 1.5.4 changelog |
| Actions runtime | Both workflows use verified current action release SHAs and Node 24; token permissions and credential persistence are explicit | Exact-candidate GitHub runs and annotations must confirm runtime warnings are gone |
| npm metadata | `repository.url` matches npm's normalized form; package inventory remains 11 intended files | Repack and smoke the final versioned release candidate |
| Signing prerequisite | Global SSH commit/tag signing is enabled, and the configured public key matches a GitHub-registered signing key | Verify actual future delivery objects using [release procedures](../RELEASE_CHECKLIST.md); configuration is not a signature |
| Scorecard | Local checks and authenticated read-only settings review are captured in the [trust review](trust/scorecard-review.md) | Approve any proposed settings/workflow changes, then verify hosted results against the delivered commit |
| Citation | Schema-valid CFF cites the specification at its immutable released source; organizational author follows existing project metadata | Deliver to default branch and verify GitHub citation rendering; see [archive decisions](../docs/citation.md) |
| Adoption | [Evidence ledger](../docs/adoption-evidence.md) and [benchmark design](../docs/benchmark.md) now define the next work | Collect implementation reports; select runtime/model/budget before paid benchmark execution |

## Validation evidence

- Full suite: 270 tests passed on Node 26.7.0 and on the checksum-verified official Node 24.20.0 runtime used to check CI compatibility.
- Offline search contract: one canonical HTML sitemap target, zero defects.
- ClawHub build: exact two-file inventory; generated manifest reports `source_state: working-tree`, which is review evidence rather than a publishable commit artifact.
- npm dry-run: 11 intended package files; a tarball installed into a clean temporary consumer. Usage and invalid-argument handling passed with the normalized metadata intact. The CLI has no dedicated `--help` success contract; missing-URL usage returns exit 1.
- Packed consumer on Node 24.20.0 checked Siteline at `2026-09-07T06:29:50.489Z`: passive Level 4, discovery present and well formed, proactive headers observed. Refusal format was not observed. This is one service assessment, not another adopter.
- Live production search contract: one page, zero defects, zero infrastructure failures. This checkpoint is evidence about the then-current 1.5.4 deployment, not deployment of these changes.
- Official actionlint 1.7.12 validated both workflows. The binary was verified against the release's SHA-256 digest. ShellCheck was not available, so its optional integration was disabled.
- Official `cffconvert` validated CFF 1.2.0. Root and preferred-citation versions/dates are included in repository release-consistency checks.
- Read-only second-agent review found no actionable maintenance-patch defects; it was a review of the visible candidate, not a blind independent position.

Temporary raw package and runtime evidence is under ignored `build/maintenance-*` paths. The durable Scorecard/settings evidence is under `ops/trust/2026-09-07/`. Re-run local gates after any candidate changes; hosted acceptance and signing remain separate evidence.

## Release 1.5.5 authorization

PR #6 was merged as `371efe658487f6b1b4dbd90ef33d8e445b618c6f`. The maintainer then authorized SemVer propagation, documentation/web/agentic updates, tagging, packages, and release publication on 2026-09-07. Version 1.5.5 is selected as a maintenance patch. Delivery includes signed versioned and stable `v1` tags, GitHub Release, npm, ClawHub, and Pages verification. GitHub settings, DOI publication, and paid benchmark execution remain separate. Provider completion evidence is recorded in the release and `build/release-state-1.5.5.json`; authorization alone does not establish publication.

## Release 1.5.6 delivery

A Moonshots presentation-readiness assessment on 2026-09-23 found that the checker reported invalid or unreachable targets as Level 0 with discovery advice, that next-step example paths did not exist in npm installs, and that the landing page overflowed a 390px viewport and attributed unserved fields to Siteline. The maintainer authorized the site corrections, a 1.5.6 patch release, signed tags, GitHub Release, npm and ClawHub publication, and the `v1` move on 2026-09-23.

- Site corrections: `f6a42ee` (Siteline examples, estimate labels, README drift) and `f4b82b3` (grid overflow), both GitHub-verified and deployed; live width 375px at a 390px viewport.
- Release: PR #8 merged as `e9664e8ada877bf0e0571fb186a5cf0f5f44e2dc`; 274 tests; Tests and Pages passed on the exact commit with no action-runtime warnings.
- Tags: signed `v1.5.6` object `05b7d4e0634e2ecca97406cc6f485d0f2e2fda3e`; `v1` moved from object `88104401e9cb26ff8d35d23ac0138ee956c19d8b` (`e2d4f4b`) to `0441b8c2ce9b2b7321f61e8dbb798531600a1d18` (`e9664e8`). GitHub reports both valid.
- Assets: `SHA256SUMS` and its detached SSH signature cover the npm tarball, the ClawHub ZIP, and `spec.md`; the local signature verified against the registered key `SHA256:e01ClOG6x4+h/LA0nobyQrQpCRrAYmFSIF2DmLR93pM`.
- Assistant guide 1.1.2 changes applicability only; GuideCheck reference verifier 0.3.0 reports Level 3, 0 blocking findings, 0 warnings.
- npm: 1.5.6 published by the maintainer (2FA) and `latest`; registry integrity equals the signed release tarball. A fresh `npx` install returns exit 0 for Siteline (Level 4) and google.com, 1 for an invalid URL, and 3 for an unreachable host with no level.
- ClawHub: 1.5.6 public and `latest` under MIT-0 (eight versions), published with CLI 0.23.3, which sends the publisher's standing MIT-0 acceptance with each publish. Uploaded file hashes match the release bundle. The provider security scan reports clean (LLM verdict benign, no warnings); the 1.5.5 warning about internal network targets did not recur. Registry snapshot: ignored `build/clawhub-registry-1.5.6.json`.
- Hosted assessment: a Siteline scan of https://gracefulboundaries.dev/ (scanner 2.1.1, rubric 2.4.0) scored all SNAP pillars 100 and capped the grade at C on agentic-enablement resources (5/16). Candidate follow-ups are `security.txt` and the open `llms-full.txt` question; do not add unrelated surfaces to raise the grade.

## Ongoing delivery and validation queue

1. Deliver the reviewed local diff as an explicitly authorized signed commit and branch PR. Verify its actual signature and exact-commit CI. Preserve unrelated work and stage only approved paths.
2. Decide the bounded GitHub settings proposal in [proposed-github-settings.json](trust/proposed-github-settings.json). It preserves `prime` deletion/force-push protections and no bypass actors; adds PRs, resolved review threads, and an up-to-date successful `test` check from GitHub Actions app 15368; sets zero mandatory approvals; enables dependency alerts/security updates and action SHA enforcement. The current full ruleset is retained in the [baseline evidence](trust/2026-09-07/github-ruleset-prime.json). Re-read provider values before any apply.
3. Review a separate implementation proposal for GitHub Actions dependency-update automation, JS/TS SAST, and a non-publication Scorecard workflow. Do not enable result publication or display a badge from the partial local scores.
4. When a release is authorized, reconcile registries, propagate the selected version and date, and follow [RELEASE_CHECKLIST.md](../RELEASE_CHECKLIST.md). Preserve v1.5.4. Verify signed delivery objects, exact-commit CI, npm and ClawHub artifacts, the authorized `v1` update, and Pages/live routes separately.
5. For Zenodo, confirm archive creators and specification payload/license scope before connecting or publishing. Prefer one specification record with versioned releases. Do not create separate npm/ClawHub DOI records without an explicit relation model. Add a DOI only after its immutable record resolves correctly.
6. Continue the [roadmap](../docs/roadmap.md) through real adoption evidence. Keep Action Boundaries and expanded taxonomy optional under existing implementation gates. Best Practices waits for the GuideCheck pilot; profile edits and external outreach stay with their owning scopes and approval gates.

## Handoff reconciliation

The temporary August 28 post-release handoff is transferred into the corrected producer, regression checks, agentic-surface licensing disclosure, release checklist, and delivery queue above. The September 1 signing/Scorecard/citation handoff is transferred into the release signing policy, trust review and proposed settings, citation guidance, and roadmap. Its account-signing prerequisite path no longer exists; current signing configuration and registered-key agreement replace that stale prerequisite. Future-object signature verification remains open.

Both temporary handoffs were removed on 2026-09-07 after these destinations were verified. Their removal closes the handoff-processing task; it does not claim that the patch is published or that every delivery and adoption item is complete.
