# Absentee-Owner Enrichment Contract v1

## Purpose

Absentee-owner enrichment augments an existing acquisition lead with
owner evidence without becoming an acquisition authority.

The underlying acquisition record remains authoritative.

Enrichment failure, ambiguity, absence of a match, malformed provider
data, or malicious/overbroad provider data MUST NOT corrupt or advance
the acquisition record.

## Authority Boundary

This contract grants no authority to:

- create a distress lead;
- replace Distress Lead ID;
- replace canonical property identity;
- alter acquisition source/provenance;
- create a deal;
- alter Imported Deal ID;
- advance acquisition lifecycle or Status;
- generate or alter ARV;
- generate or alter Estimated Repairs;
- generate or alter Suggested Offer;
- generate or alter MAO;
- grant automatic offer authority;
- invoke offer automation;
- invoke deal creation;
- invoke scheduler/checkpoint/collapse authority;
- perform arbitrary acquisition-record writes.

Absentee-owner enrichment is subordinate evidence only.

## Required Input

An enrichment request MUST identify an already-existing acquisition
record.

Required identity inputs:

- Distress Lead ID
- Canonical Property Key

The enrichment operation MAY receive a read-only snapshot containing
address and existing owner evidence.

Missing or inconsistent required identity MUST fail closed.

## Outcomes

Exactly four terminal enrichment outcomes are permitted:

- MATCHED
- NO_MATCH
- AMBIGUOUS
- FAILED

No other terminal outcome may silently acquire write authority.

### MATCHED

A sufficiently supported owner match was obtained.

Only enrichment-owned fields may be proposed for persistence.

### NO_MATCH

No sufficiently supported absentee-owner match was obtained.

No owner identity may be manufactured.

Only enrichment-owned status/evidence metadata may change.

### AMBIGUOUS

Multiple plausible results exist or available evidence does not support
automatic owner selection.

No candidate may be promoted automatically into authoritative owner
fields.

Only enrichment-owned evidence/status metadata may change.

### FAILED

Provider, transport, parser, validation, or internal enrichment failure.

The acquisition record remains unchanged except for explicitly
enrichment-owned operational/status metadata.

## Enrichment-Owned Fields

The v1 persistence boundary MUST use an explicit allowlist.

Permitted acquisition-record enrichment fields are:

- Owner Name
- Owner Mailing Address

A future implementation MAY persist dedicated enrichment provenance,
status, observation time, provider, confidence, or evidence fields only
after those fields are explicitly added to the schema and this contract
is amended or extended.

No unspecified field is implicitly enrichment-owned.

## Protected Acquisition Fields

The following fields are explicitly protected:

- Distress Lead ID
- Canonical Property Key
- Address
- City
- State
- Zip
- Distress Type
- Distress Score
- Estimated Value
- Estimated Repairs
- Suggested Offer
- Lead Source
- Status
- Notes
- Imported Deal ID
- Created At
- ARV
- MAO
- offer authority fields

Updated At is not owner evidence and MUST NOT be used as a path for
semantic acquisition mutation. A future persistence implementation may
update it only as an ordinary timestamp consequence of an otherwise
authorized enrichment write.

All fields not explicitly listed as enrichment-owned are fail-closed
for enrichment persistence.

## Persistence Boundary

The implementation MUST NOT pass a generic provider row directly to
Database.update(), Database.insert(), a Sheet range writer, or another
general-purpose acquisition writer.

Persistence MUST:

1. accept an existing canonical record identity;
2. accept an enrichment result;
3. construct a new patch from the enrichment-owned allowlist;
4. discard or reject every non-owned key;
5. validate identity before any write;
6. fail before any write when identity is missing or inconsistent.

Provider payloads are evidence, not write patches.

## Existing Generic Absentee CSV Connector

The historical function:

    reosConnectorHandleAbsenteeOwners

currently delegates to the generic CSV connector/import path.

That historical ingestion surface is NOT the v1 enrichment persistence
boundary and does not gain enrichment authority from this contract.

Phase 1 MUST NOT retrofit, invoke, deploy, or mutate that production
connector.

## Acquisition Safety Gate

Absentee-owner enrichment MUST NOT grant automatic MAO or offer
authority.

Comp-supported ARV and adequate repair scope remain independently
required by the acquisition safety boundary.

Owner enrichment cannot substitute for either requirement.

Missing or weak ARV/repair evidence MUST continue to route the deal to
research/review rather than manufacture an offer.

## Required Offline Certification Cases

The implementation validator MUST eventually prove at least:

1. MATCHED clear owner.
2. NO_MATCH.
3. AMBIGUOUS multiple plausible owners.
4. FAILED provider/network/parser failure.
5. malformed provider response.
6. missing Distress Lead ID.
7. missing Canonical Property Key.
8. malicious payload containing protected acquisition fields.
9. malicious payload attempting MAO/offer-authority mutation.
10. malicious payload attempting deal/lifecycle mutation.

For every case, protected/non-owned fields must remain value-equivalent
before and after enrichment.

The malicious-payload cases must prove that allowlist reconstruction,
not provider intent, determines the permitted write set.

## Phase 1 Operational Exclusions

Phase 1 certification is offline only.

It grants no authority for:

- clasp execution;
- Apps Script RPC;
- deployment;
- trigger installation/removal;
- scheduler changes;
- production spreadsheet writes;
- live provider calls;
- deal creation;
- MAO generation;
- offer generation;
- automatic offer authority.

Controlled production certification is a separate later phase.
