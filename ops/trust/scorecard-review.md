# OpenSSF Scorecard and repository security review

Date: 2026-09-07
Repository: [snapsynapse/graceful-boundaries](https://github.com/snapsynapse/graceful-boundaries)
Reviewed commit: `fc2d2e20cd04056fa1cb18ec394155722bc8310c`
Scope: This read-only lane wrote only the evidence and report under `ops/trust/`. Other workspace changes were outside this lane.

## Per-check result and disposition

The network-enabled scan of an archive of the exact reviewed commit returned 11 check rows. Its aggregate is 5.2/10 across that 11-row set, with Packaging reported as not scored (`-1`). This total is retained only as Scorecard output context. The actionable per-check findings follow.

- `Branch-Protection`: direct GitHub evidence shows only deletion and non-fast-forward protection. Add a pull-request requirement and the required `test` status check to the `prime` ruleset. Do not require peer approval solely to satisfy a heuristic because the repository has a sole maintainer.
- `Dependency-Update-Tool`: Scorecard found no update configuration. GitHub also reports Dependabot alerts and Dependabot security updates disabled. Enable alerts and security updates, then add a Dependabot version-update configuration after the repository owner approves those settings.
- `Pinned-Dependencies`: the reviewed commit uses five version-tagged GitHub Actions references and Scorecard scored this 0. Pending local workflow changes are outside this review and show the intended commit-pinned remediation, but are not evidence about the reviewed commit.
- `Token-Permissions`: the reviewed commit has no top-level permissions declaration in `test.yml`, producing a 0. Pending local workflow changes are outside this review and show the intended `contents: read` remediation, but are not evidence about the reviewed commit.
- `SAST`: no CodeQL or other static-analysis workflow exists, and the GitHub code-scanning endpoint reports no analysis. Add an appropriately scoped CodeQL or other SAST workflow as a separate implementation decision.
- `Packaging`: no GitHub publishing workflow was detected. The npm package is published and has matching `gitHead`, integrity data, and an npm registry signature, but the package-to-CI provenance path is not established. Add a release/publication workflow and provenance or attestation evidence if CI-origin proof is required.
- `Signed-Releases`: current GitHub releases provide no qualifying signature or provenance assets. Add release-attached provenance or signature assets if the project wants to satisfy Scorecard's asset-based heuristic.
- `Fuzzing`: with public network access, Scorecard completed this check and reported no fuzzer integration. Treat it as a coverage decision for this small Node.js specification/checker project, not as proof of a vulnerability. Record an explicit decision to add property-based or fuzz testing, or to accept the gap with rationale.
- `License`: Scorecard awarded 9 and warned that `LICENSE` did not contain an FSF or OSI license. This is a scanner heuristic miss, not an actual license defect: `LICENSE` begins with the MIT License and explains the repository's MIT code and CC-BY-4.0 specification split, while `LICENSE-SPEC` contains the CC-BY-4.0 text. No license correction is recommended from this finding.
- `Security-Policy`, `Binary-Artifacts`, `Dangerous-Workflow`, and `Vulnerabilities`: the exact-archive local scan reported passing results. These local findings do not establish hosted GitHub security settings.

## GitHub settings evidence and recommended policy

The active `prime` ruleset applies to the default branch, blocks deletion and non-fast-forward updates, has no bypass actors, and reports `current_user_can_bypass: never`. The classic branch-protection endpoint is absent because the repository uses a ruleset. Raw response: [github-ruleset-prime.json](2026-09-07/github-ruleset-prime.json).

Recommended GitHub settings policy for an owner-approved follow-up:

- Keep the existing deletion and non-fast-forward rules.
- Require pull requests and require the `test` status check before merge.
- Do not add a peer-review requirement merely to raise a Scorecard result for a sole-maintainer repository.
- Enable Dependabot alerts, Dependabot security updates, and vulnerability alerts; add a version-update configuration.
- Require immutable full-SHA GitHub Action references at the repository Actions policy level.

The parent-owned [proposed GitHub settings payload](proposed-github-settings.json) applies this policy to the current `prime` ruleset baseline. The exact required context is `test`; its GitHub Actions app ID is `15368`.

Repository settings report secret scanning and push protection enabled. Actions defaults are read-only and cannot approve pull-request reviews. The Actions policy still allows all actions and does not require SHA pinning, so a future workflow can add an unpinned action even after the pending source remediation. Raw responses: [github-repository.json](2026-09-07/github-repository.json), [github-actions-permissions.json](2026-09-07/github-actions-permissions.json), and [github-actions-workflow-permissions.json](2026-09-07/github-actions-workflow-permissions.json).

The authenticated GitHub API reports Dependabot alerts disabled, Dependabot security updates disabled, vulnerability alerts disabled, and no code-scanning analysis. Secret-scanning alert listing was unavailable because the available credential lacks `admin:repo_hook`; this does not change the enabled configuration evidence.

## Release and package evidence

The inspected GitHub releases have no assets except `v1.4.0`, which has only archive and ZIP assets. [Scorecard's Signed-Releases check](https://github.com/ossf/scorecard/blob/main/docs/checks.md#signed-releases) looks for qualifying signature or provenance files in release assets. It does not evaluate Git commit or tag signing.

The session baseline separately establishes that historical release objects are unsigned. That fact is recorded as Git object history, not as a Scorecard result. The npm registry signature on `graceful-boundaries@1.5.4` is useful integrity evidence, but it does not make the GitHub releases meet Scorecard's artifact-based Signed-Releases heuristic.

Public npm metadata for `graceful-boundaries@1.5.4` reports `gitHead` `fc2d2e20cd04056fa1cb18ec394155722bc8310c`, matching the reviewed commit, plus an integrity hash and registry signature. `npm pack --dry-run --json` reported the expected 11 publishable files. This supports package identity and integrity, not a CI provenance claim.

## Evidence limits

The public Scorecard API returned 404 for this repository on 2026-09-07. No badge is present or recommended until a published Scorecard result exists and its remote output is reviewed.

The exact archive scan is the authoritative local result for this review. Its raw output is [scorecard-head-fc2d2e2-network-v5.5.0.json](2026-09-07/scorecard-head-fc2d2e2-network-v5.5.0.json). An earlier sandboxed exact-archive attempt is preserved in [scorecard-head-fc2d2e2-v5.5.0.json](2026-09-07/scorecard-head-fc2d2e2-v5.5.0.json), where Fuzzing failed solely because sandbox networking was blocked. A separate mutable-working-tree scan is retained in [scorecard-local-v5.5.0.json](2026-09-07/scorecard-local-v5.5.0.json); it evaluates different input and a different check set and must not be compared to the exact-archive aggregate.

Remote Scorecard was not run because its GitHub-hosted checks require a token and this lane did not extract, print, or reuse one. Direct authenticated GitHub API reads supplemented the local scan. Those reads are point-in-time configuration evidence, not proof of future enforcement.

## Commands and tool verification

The scanner was downloaded from the [official OpenSSF Scorecard v5.5.0 release](https://github.com/ossf/scorecard/releases/tag/v5.5.0) and checked against its published `scorecard_checksums.txt` before execution. The archive checksum passed. Scanner identity: v5.5.0, commit `c395761df6afe1a69e476bc60a013a94bcbc153f`, clean tree, Go 1.26.2, darwin/arm64.

Literal
```text
mkdir -p /tmp/scorecard-5.5.0
curl -sS -L -o /tmp/scorecard-5.5.0/scorecard_5.5.0_darwin_arm64.tar.gz https://github.com/ossf/scorecard/releases/download/v5.5.0/scorecard_5.5.0_darwin_arm64.tar.gz
curl -sS -L -o /tmp/scorecard-5.5.0/scorecard_checksums.txt https://github.com/ossf/scorecard/releases/download/v5.5.0/scorecard_checksums.txt
cd /tmp/scorecard-5.5.0
shasum -a 256 -c scorecard_checksums.txt --ignore-missing
tar -xzf scorecard_5.5.0_darwin_arm64.tar.gz
./scorecard version
```
The exact source archive SHA-256 was `222c1b324c707f8479e008f7038f8d3b894a6c6846beee46fc284e3455b48ebb`.

Literal
```text
audit_root=$(mktemp -d /tmp/graceful-boundaries-scorecard-network.XXXXXX)
mkdir "$audit_root/source"
git archive --format=tar fc2d2e20cd04056fa1cb18ec394155722bc8310c -o "$audit_root/source-fc2d2e2.tar"
shasum -a 256 "$audit_root/source-fc2d2e2.tar"
tar -xf "$audit_root/source-fc2d2e2.tar" -C "$audit_root/source"
/tmp/scorecard-5.5.0/scorecard --local "$audit_root/source" --format json --show-details --output /Users/snap/Git/graceful-boundaries/ops/trust/2026-09-07/scorecard-head-fc2d2e2-network-v5.5.0.json
```
Literal
```text
gh api repos/snapsynapse/graceful-boundaries/rulesets/21771007
gh api repos/snapsynapse/graceful-boundaries/actions/permissions
gh api repos/snapsynapse/graceful-boundaries/actions/permissions/workflow
gh api repos/snapsynapse/graceful-boundaries
gh api repos/snapsynapse/graceful-boundaries/releases --paginate
gh api repos/snapsynapse/graceful-boundaries/dependabot/alerts --paginate
gh api repos/snapsynapse/graceful-boundaries/code-scanning/alerts --paginate
gh api repos/snapsynapse/graceful-boundaries/vulnerability-alerts
gh api repos/snapsynapse/graceful-boundaries/automated-security-fixes
gh api repos/snapsynapse/graceful-boundaries/secret-scanning/alerts --paginate
gh api repos/snapsynapse/graceful-boundaries/branches/main/protection
```
## Primary sources

- [OpenSSF Scorecard README and CLI](https://github.com/ossf/scorecard)
- [OpenSSF Scorecard check definitions](https://github.com/ossf/scorecard/blob/main/docs/checks.md)
- [OpenSSF Scorecard probe definitions](https://github.com/ossf/scorecard/blob/main/docs/probes.md)
- [GitHub repository rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [GitHub Actions permissions syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#permissions)
- [GitHub Dependabot alerts](https://docs.github.com/en/code-security/dependabot/dependabot-alerts/about-dependabot-alerts)
- [GitHub code scanning](https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning)
- [npm registry signatures](https://docs.npmjs.com/about-registry-signatures)
