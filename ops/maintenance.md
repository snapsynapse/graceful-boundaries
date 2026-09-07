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
