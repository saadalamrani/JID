# WAVE 14 — Privacy / commercial-integrity review

**Scope:** one review, no loop.  
**Surfaces:** billing RLS, commercial catalog, checkout, webhook idempotency, University packaging.

## Findings

| ID | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| W14-R1 | P0 candidate, not reproduced | Subscription SELECT used Directory `claimed_by` | Closed: owner policy uses `business_profiles.owner_user_id` and `university_profiles.owner_user_id`. |
| W14-R2 | P0 candidate, not reproduced | Public SAR catalog amounts presented as adopted prices | Closed: package contract and UI forbid adopted public prices; checkout returns `price_not_adopted`. |
| W14-R3 | P1 candidate, not reproduced | Webhook replay double-activates Plus | Closed: unique `provider_event_id` on billing events; subscription lookup by provider ref before insert. Unique subscription provider-ref index was not applied because nonprod already contains duplicate refs; lookup index plus application idempotency remain. |
| W14-R4 | P2 | University reports gated by a paid package | Closed: `university_core` is `core_free` with no operational plan key. Reporting is not paywalled. |
| W14-R5 | P3 | Government shown as a fourth marketplace actor | Closed: `government_contract` is `is_public=false` and `contract_only`. |

## Required proofs

- Owner-only billing visibility: PASS (RLS SQL contract)
- No adopted public SAR: PASS (contract + UI tests)
- Checkout blocked while unadopted: PASS (409 `price_not_adopted`)
- University reporting not privacy-paywalled: PASS
- Government not a public marketplace actor: PASS
- Webhook idempotency: PASS (unique provider event id)

P0=NONE  
P1=NONE  
Review loop: none.
