# Release Checklist

Run this checklist for every tagged release. The release is incomplete until every box is checked.

## Pre-release

- [ ] All tests pass: `npm test` (200/200 expected)
- [ ] `evals/check.js https://siteline.to` reports the expected level (currently Level 4)
- [ ] `spec.md` version, status, and any normative changes are accurate
- [ ] `CHANGELOG.md` has an entry for this release with date and SemVer-correct version
- [ ] `package.json` version matches the tag
- [ ] `llms.txt` reflects current conformance levels and links
- [ ] `assistant-guide.txt` SHA-256 matches `.well-known/assistant-guide.txt` (byte-identical pair)
- [ ] If `assistant-guide.txt` changed: run `python3 /path/to/guidecheck/scripts/guidecheck_verify.py assistant-guide.txt` and confirm Level 3+ pass
- [ ] `docs/agentic-surfaces.md` lists every agent-facing surface in this release
- [ ] `SECURITY-AUDIT.md` reflects any new security considerations introduced

## Security-impacting changes

If this release changes trust semantics, URL handling, agent guidance, conformance language, or public examples, also:

- [ ] Each adversarial-review risk has four artifacts: spec language, checker behavior, eval coverage, public disclosure
- [ ] Agent-facing surfaces (llms.txt, assistant-guide.txt, .well-known/, examples in docs) are treated as untrusted data; this is stated explicitly
- [ ] Security claims are testable as evals, not just prose
- [ ] Release notes carry the security narrative; landing page carries only current version/date

## Release object

- [ ] Tag created: `git tag -a vX.Y.Z -m "..."`
- [ ] Tag pushed: `git push origin vX.Y.Z`
- [ ] GitHub Release created via `gh release create vX.Y.Z`
- [ ] Release notes attached (not just the commit message)
- [ ] Latest-release flag set when appropriate
- [ ] `gh release list --limit 5` shows the new release

## Post-release verification

- [ ] https://gracefulboundaries.dev/ shows the new version
- [ ] https://gracefulboundaries.dev/spec serves updated content
- [ ] https://gracefulboundaries.dev/.well-known/assistant-guide.txt SHA-256 matches the in-repo `.sha256` sidecar (if present)
- [ ] No 5xx or 4xx on the landing page after Pages deploy completes
- [ ] Siteline still conforms to its claimed level

## Reference

This checklist instantiates the workflow in `LocalBrain/0_Across/Security Hardening Release Workflow 2026-05-29.md`. Update both when this checklist changes.
