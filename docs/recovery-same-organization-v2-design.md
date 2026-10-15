# REOS Autonomous Builder — Trust Domain V2

Status: PROPOSED_OFFLINE_ONLY

## Architecture

Single-organization segregated administration.

A separate legal organization is not required.

## Mandatory controls

- Distinct human builder and administrator operators
- Individually assigned, nonshared privileged identities
- Separately controlled account recovery
- Phishing-resistant MFA
- Two distinct human approvers for critical operations
- No self-approval
- Time-bound privileged access and audit evidence
- Human-reviewed production deployments

A shared business mailbox does not establish an independent
privileged identity.

## Security limitation

This model does not claim isolation from organization-wide
compromise or independent disaster recovery.

## Migration boundary

Existing B1 contracts and validators remain authoritative
until separately reviewed, migrated, and certified.

This document does not authorize IAM changes, billing,
cloud provisioning, deployment, or autonomous recovery.

## Acquisition safety

Automatic MAO or offer authority remains blocked without
comp-supported ARV and adequate repair scope.
