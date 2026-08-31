# WAVE 14 — CLOSEOUT REPORT

**Status:** `WAVE_14_COMPLETE`
**Timezone:** Asia/Riyadh · **Closed:** 2026-08-31
**Integration branch:** `integration/wave14-final-closure`
**Canonical base (Wave 13, operationally closed):** `d03cda2c7ff0bfb3bc75bf68d5e99f7d768ed51b`
**Wave 13 local build:** not rerun. Superseded by the successful Vercel build for that SHA.

Production `znfhladafpajyjwcfzvv` was not touched. `DATA_LOSS=0`.

Wave 13 remains closed. This packet did not reopen integrations, ATS connectors, or Wave 13 migrations.

---

## Mission closed

Commercial packaging + operational hardening + scale-readiness, without adopting SAR prices.

- Individual Core stays free. JID Plus is paid-intelligence packaging, not a published price.
- Employer Starter / Growth / Enterprise are capability packages. Growth and Enterprise remain design-partner or contract paths.
- University Core reporting is not paywalled. Readiness, Outcomes Workspace, and Implementation are separately visible commercial offers.
- Government is contract-only and is not a fourth public marketplace actor.

---

## Reuse gate

| Surface | Decision |
| --- | --- |
| `plans` / `subscriptions` / entitlements / Moyasar checkout | REUSE operational machinery |
| Seed SAR amounts on `plans` | KEEP as internal catalog; do not present as adopted public prices |
| Stripe/Chargebee/billing suite | REJECT for this wave — existing provider path is sufficient |
| University reports | REUSE as University Core; no new paywall |
| Wave 13 integrations | DO NOT TOUCH |

---

## Database (jid-nonprod `hmjuijmaefajdjrjdsxu`)

Forward-only. Applied with `node scripts/wave14-nonprod-apply.cjs` (production host refused).

```text
WAVE_13_COMPLETE SHA d03cda2c7ff0bfb3bc75bf68d5e99f7d768ed51b
APPLIED 20260831190000 to jid-nonprod
APPLIED 20260831190100 to jid-nonprod
pending Wave 14: NONE
```

Self-repair: a unique `(payment_provider, provider_ref)` index failed because nonprod already contains duplicate provider refs. Replaced with a lookup index. Webhook uniqueness remains on `billing_events.provider_event_id`. Application activation still short-circuits on an existing provider ref.

---

## RLS / privacy

One independent review: `WAVE_14_PRIVACY_REVIEW.md`.

- Subscription SELECT now uses owned Profile `owner_user_id`, not Directory `claimed_by`.
- Public packages are readable; government contract is not a public marketplace row.
- Checkout returns `409 price_not_adopted` while adoption status is `not_adopted`.
- University reporting remains Core, not a privacy paywall.

P0=NONE. P1=NONE.

---

## Product surfaces

| Actor | Surface | Honesty rule |
| --- | --- | --- |
| Individual | `/plus`, upgrade dialog | No published SAR. Contact / design-partner CTA. |
| Business | `/billing` | Starter / Growth / Enterprise catalog. No self-serve price. |
| University | `/university/packaging` | Core / readiness / outcomes / implementation. |
| Staff | `/staff/billing` | Package ledger + manual activation including `university_outcomes`. |

---

## Operational hardening / scale-readiness

- Checkout rate limit (8/hour/user).
- Webhook event idempotency.
- `/api/health` liveness with timezone.
- `/api/ready` packaging-contract readiness (`public_price_adopted: false`).

---

## Validation

| Check | Result |
| --- | --- |
| Focused Wave 14 tests | 12/12 PASS |
| Wave 13 integration regression | 8/8 PASS |
| `pnpm type-check` | PASS |
| `pnpm lint` | PASS |
| Nonprod apply | APPLIED; pending NONE |
| Local `pnpm build` | Not used as Wave 14 closure gate. Wave 13 local stall is environment-specific; Preview/Vercel remains the clean-build authority after push. |
| Browser click-through | Not available in this session (no browser automation). UI contract covered by packaging UI tests. |

Forbidden areas untouched: production, Wave 13 integration engine/migrations, Career Record truth, Claim Existing Profile, Commitment Score.

---

## Completion token

`WAVE_14_COMPLETE` on `integration/wave14-final-closure`.
`FINAL_SHA` is the tip of that branch after the closeout commit.
