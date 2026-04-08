# Security Policy

## Reporting a vulnerability

If you discover a security issue in the Graceful Boundaries specification or its conformance checker, please report it privately using [GitHub's security advisory feature](https://github.com/snapsynapse/graceful-boundaries/security/advisories/new).

Do not open a public issue for security vulnerabilities.

## Scope

**In scope:**
- Spec requirements that could lead services to disclose sensitive information (e.g., a required field that reveals internal architecture)
- Conformance checker bugs that produce misleading security assessments
- Threat model gaps in [SECURITY-AUDIT.md](SECURITY-AUDIT.md) (SC-1 through SC-9)

**Out of scope:**
- Design philosophy disagreements about what the spec should require
- Vulnerabilities in specific implementations of the spec (report those to the service operator)
- The reference implementation (Siteline) — report those at [siteline.to](https://siteline.to/)

## Threat model

See [SECURITY-AUDIT.md](SECURITY-AUDIT.md) for the full threat model covering rate limit calibration attacks, security posture disclosure, validation oracles, content cloaking, and other considerations.
