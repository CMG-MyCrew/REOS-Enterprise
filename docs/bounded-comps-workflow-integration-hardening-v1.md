# Bounded Comps Workflow Integration Hardening v1

## Purpose

This phase hardens existing REOS acquisition workflow behavior so legacy
comparable presence, legacy analysis state, comparable count, ARV values,
repair values, or positive MAO cannot independently progress or recommend a
deal for Offer Generation.

This phase intentionally closes unsafe legacy paths without opening a new
production authority path.

## Existing certified readiness invariant

Offer Generation readiness requires both:

1. adequate comp-supported ARV evidence; and
2. adequate repair-scope evidence.

Both conditions must affirmatively pass the separately certified readiness
gate.

Unknown, missing, stale, contradictory, review-required, or insufficient
evidence fails closed.

## AcquisitionWorkflow hardening

The legacy AcquisitionWorkflow path previously queried DEAL_COMPARABLES and
advanced directly to Offer Generation whenever `comps.length` was nonzero.

That presence-only progression path is removed.

Comparable-row presence is not readiness authority.

Zero, one, or many comparable rows do not independently establish:

- accepted comparable evidence;
- supported ARV evidence;
- sufficient ARV confidence;
- adequate repair scope;
- MAO authority;
- Offer Generation authority.

## DealLifecycleWorkflow hardening

The legacy DealLifecycleWorkflow path previously recommended Offer Generation
from legacy analysis validity, minimum comparable count, and a positive MAO.

That recommendation path is removed.

Legacy analysis, comparable count, raw ARV, repair values, and positive MAO
must not independently establish Offer Generation readiness.

Earlier lifecycle decisions, including Comparable Analysis, remain available.

## No inferred evidence bridge

This phase does not convert legacy production values into certified readiness
evidence.

In particular, it does not infer:

- `evidenceStatus = supported` from a positive ARV;
- `confidenceStatus = sufficient` from comp count;
- accepted comparable evidence IDs from DEAL_COMPARABLES presence;
- `scopeStatus = adequate` from a repair-cost number;
- `scopeComplete = true` from legacy analysis;
- offer authority from positive MAO.

A production evidence bridge/persistence contract must be separately designed,
implemented, validated, reviewed, and authorized.

## Fail-closed behavior

Until that production evidence bridge exists, legacy workflow paths must stop
short of Offer Generation rather than synthesize readiness.

The separately certified readiness gate remains the authority contract for
future readiness evaluation.

Even a future readiness result of `eligible` is not itself authority to:

- calculate MAO;
- generate an offer;
- submit an offer;
- mutate the Qualified Deal Queue;
- mutate acquisition lifecycle state.

Those actions remain separately gated.

## Authority exclusions

This phase grants no authority for:

- comparable provider selection;
- provider credentials;
- provider HTTP;
- scraping;
- MLS access;
- live comparable retrieval;
- production comparable acceptance;
- comparable persistence;
- production ARV calculation;
- production ARV persistence;
- repair-scope mutation;
- MAO calculation;
- offer generation;
- offer submission;
- automatic offer authority;
- Qualified Deal Queue mutation;
- acquisition lifecycle mutation;
- Apps Script deployment;
- RPC execution;
- scheduler or trigger changes.

## Successor

After this bounded hardening is merged and certified, the next comps/ARV
architecture phase is:

`production_readiness_evidence_persistence_bridge_design_v1`

That successor must define how supported comp-backed ARV evidence and adequate
repair-scope evidence are represented, persisted, retrieved, identity-bound,
and supplied to the readiness gate without treating legacy numeric fields as
authority.
