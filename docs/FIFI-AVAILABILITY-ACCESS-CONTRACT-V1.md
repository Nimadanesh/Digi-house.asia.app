# FIFI-AVAILABILITY-ACCESS-CONTRACT-V1 — Service Availability, Limits & User Access

**Status:** AUTHORITATIVE PRODUCT + RUNTIME CONTRACT
**Date:** 2026-09-30

## Core principle
Fifi must never pretend that it can answer when the required capability is unavailable.

Every request has two independent questions:
1. Can the service answer now?
2. Is this user allowed to use this capability now?

## Availability states
- READY
- THINKING
- DEGRADED
- UNAVAILABLE
- RATE_LIMITED
- ACCESS_RESTRICTED
- LIVE_DATA_UNAVAILABLE
- FAILED

These are internal states. User-facing copy must be natural and must not expose state codes.

## Access policy
Access must be policy-driven, not hardcoded into the ChatSheet.

A future policy may consider:
- user tier;
- capability;
- rolling usage;
- daily/monthly allowance;
- temporary promotions;
- platform capacity;
- abuse protection;
- account state.

Do not assume Viewer must have fewer or more messages than Investor. Viewer may intentionally be unlimited/basic; Investor may have a different allowance; Club tiers may have different access.

Changing the policy must not require changing response-generation logic.

## Policy output
Conceptually:
**User → Access Policy → Capability + Limit → Runtime State → UI**

The policy may return:
- allowed;
- capability;
- remaining usage;
- reset time;
- internal reason;
- presentation hints.

The model must never decide authorization.

## State precedence
When several states exist:
1. ACCESS_RESTRICTED
2. RATE_LIMITED
3. UNAVAILABLE
4. DEGRADED
5. LIVE_DATA_UNAVAILABLE
6. READY

## Human-facing behavior
**READY:** normal composer and suggestions.

**THINKING:** subtle processing state.

**DEGRADED:** explain that Fifi is operating with limited availability and offer the supported fallback or retry.

**UNAVAILABLE:** "Fifi is temporarily unavailable. Please try again in a moment." Show Retry when appropriate.

**RATE_LIMITED:** "You've reached your Fifi usage limit for now. You can try again after the limit resets." Show reset time only when approved.

**ACCESS_RESTRICTED:** "This Fifi feature isn't available with your current access." Show a legitimate next action if one exists; never pressure the user.

**LIVE_DATA_UNAVAILABLE:** "I can explain what this value means, but I can't access the current account information right now." Offer a safe next step.

**FAILED:** "Something went wrong while preparing the answer. Please try again." Never expose provider errors or stack traces.

## Fallback hierarchy
When supported:
**Primary answer → approved fallback capability/model → static explanation → useful navigation/help → retry**

A fallback must obey exactly the same truth and safety rules.

## UI requirement
The ChatSheet must support ready, thinking, unavailable, degraded, rate-limited, access-restricted, live-data-unavailable, failed, and retry states without redesign.

## Evaluation
The benchmark must include:
- service unavailable;
- rate limited;
- access restricted;
- live data unavailable;
- degraded fallback;
- retry;
- user-tier changes;
- current-data request while live data is unavailable.

Expected behavior is honest status + useful next step, never a fabricated answer.
