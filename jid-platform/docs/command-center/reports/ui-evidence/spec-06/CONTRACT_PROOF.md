# Spec 06 — External Contract Proof

**Worktree:** `C:\Users\saada\Downloads\Desktop\JID-1-wt-06e`  
**Range:** `19cb011` … `HEAD` `f6397f2` (+ uncommitted Session E evidence/scripts)  
**Method:** `git log` / `git diff` / `git log -S` / `git log -G` / tree `rg` on migrations `*2026073019*`, notification/claim TS+SQL, and Session E uncommitted paths.  
**Verdict rule:** A contract is **UNCHANGED** if its identifier/signature/format was not renamed, removed, or redefined. Mentions in new docs/tests/migrations that *preserve* the same literal count as UNCHANGED. Spec 06-D changed `action_url` values inside `notify_claim_decision`; that is out of scope for the listed contracts unless noted.

## Spec 06 commits examined

| SHA | Subject |
|-----|---------|
| `19cb011` | docs(ledger): Spec 06-A correction and notification reality reconciliation |
| `45020bb` | feat(directory): harden correction apply path and suggester notify |
| `57ab093` | docs(spec-06): Session C disposable-DB matrix evidence for correction apply |
| `f6397f2` | fix(notifications): route claim decisions to Spec 03 outcome surfaces |

**Uncommitted Session E (at proof time):** `jid-platform/docs/command-center/reports/ui-evidence/spec-06/*`, `jid-platform/scripts/spec-06e-*.mjs` — consume existing claim category / idempotency literals; do not redefine contracts. No dirty files under `src/`, `supabase/`, or `messages/` for these contracts.

**Migrations in scope:**

- `jid-platform/supabase/migrations/20260730190000_directory_correction_notification_categories.sql`
- `jid-platform/supabase/migrations/20260730190001_directory_correction_apply_hardening.sql`
- `jid-platform/supabase/migrations/20260730190002_notify_claim_decision_outcome_urls.sql`

**Removal check:** `git diff 19cb011^..HEAD` on `src` / `supabase` / `messages` / `tests` contains **no** deleted lines that remove `'claim.approved'`, `'claim.rejected'`, `'claim.needs_more_info'`, `send-claim-approval`, `send-claim-rejection`, `verification.decision:`, `claimId`, or `claim_id`.

---

## Per-contract results

### 1. `claim.approved` — **UNCHANGED**

| Check | Evidence |
|-------|----------|
| Pre-Spec 06 | Enum / category in `081_notifications_schema.sql`, `108_verification_service_functions.sql` (`v_category := 'claim.approved'`), `src/lib/notifications/categories.ts`, `notify-verification-decision.ts` |
| Spec 06 | `20260730190002` still assigns `v_category := 'claim.approved'` (lines 63–64). `categories.ts` / `types.ts` keep the literal; only **add** `directory.correction_*` beside it |
| Pickaxe | `-S"claim.approved"` hits `19cb011`, `45020bb`, `f6397f2` because new files *reference* it (ledger, hardening allowlist, REPLACE body, tests) — not because the string was renamed |
| Session E | `spec-06e-setup-fixtures.mjs` and `run-manifest.json` use category `claim.approved` |

---

### 2. `claim.rejected` — **UNCHANGED**

| Check | Evidence |
|-------|----------|
| Pre-Spec 06 | Same surfaces as above with `v_category := 'claim.rejected'` |
| Spec 06 | `20260730190002` preserves `v_category := 'claim.rejected'`. Hardening migration `190001` lists it in an allowlist only |
| Removals | None |
| Session E | Fixtures / manifest use `claim.rejected` |

---

### 3. `claim.needs_more_info` — **UNCHANGED**

| Check | Evidence |
|-------|----------|
| Pre-Spec 06 | Present in schema enum, `108` notify body, app notifier, preference defaults |
| Spec 06 | `20260730190002` still sets `v_category := 'claim.needs_more_info'` (deferred workflow comment; category string preserved). Unit test `claim-notification-action-urls.test.ts` asserts `toContain("'claim.needs_more_info'")` |
| Removals | None |
| Session E | Fixture inserts category `claim.needs_more_info` |

---

### 4. `claim_id` — **UNCHANGED**

| Check | Evidence |
|-------|----------|
| SQL param | Still `p_claim_id uuid` on `notify_claim_decision` in `190002` (same as `108`) |
| App payload | `notify-verification-decision.ts` — **zero** Spec 06 diff; still `claim_id: input.verificationId` in email_outbox payload |
| types.ts | `notify_claim_decision.Args` still `{ p_claim_id: string; p_decision: string; p_reason?: string }` before and after Spec 06 |
| Session E | Does not redefine `claim_id` |

---

### 5. `claimId` — **UNCHANGED**

| Check | Evidence |
|-------|----------|
| Edge invoke body | `notify-verification-decision.ts` still `body: { claimId: input.verificationId }` — file untouched in Spec 06 |
| Edge functions | `send-claim-approval/index.ts`, `send-claim-rejection/index.ts`, `send-claim-decision-email/index.ts` — **no** Spec 06 diff; still `Body = { claimId?: string }` |
| Session E | Does not change `claimId` |

---

### 6. `send-claim-approval` — **UNCHANGED**

| Check | Evidence |
|-------|----------|
| App invoke | Still `functions.invoke('send-claim-approval', …)` in `notify-verification-decision.ts` (untouched) |
| Edge dir | `jid-platform/supabase/functions/send-claim-approval/` unchanged in Spec 06 |
| Spec 06 tests | Explicitly assert notifier still contains `send-claim-approval`; hardening SQL must **not** contain it (`directory-correction-apply.test.ts`) |
| Ledger | Session D: “`send-claim-approval`, `send-claim-rejection` untouched” |

---

### 7. `send-claim-rejection` — **UNCHANGED**

| Check | Evidence |
|-------|----------|
| Same as §6 for rejection | Invoke string, edge function path, and Spec 06 assertions all preserve `send-claim-rejection` |
| Spec 06 diff on edge fn | Empty |

---

### 8. Existing email template identifiers (claim-related) — **UNCHANGED**

Claim-related template / router identifiers found in the tree:

| Identifier | Role | Spec 06 |
|------------|------|---------|
| `claim.approved` | `email_outbox.template` value (= category); React Email route → `ClaimApprovedEmail` | UNCHANGED |
| `claim.rejected` | `email_outbox.template` / category; React Email → `GenericNotificationEmail` via `CLAIM_CATEGORIES` | UNCHANGED |
| `claim.needs_more_info` | `email_outbox.template` / category; React Email → `GenericNotificationEmail` | UNCHANGED |
| `send-claim-approval` | Edge function that sends approval HTML via Resend (inline, no separate Resend template id) | UNCHANGED |
| `send-claim-rejection` | Edge function for rejection HTML | UNCHANGED |
| `send-claim-decision-email` | Combined approve/reject edge function (`claimId` + `decision`) | UNCHANGED (not touched) |
| `ClaimApprovedEmail` | Component under `notification-email-worker/templates/claim-approved-email.tsx` | UNCHANGED (`render.ts` Spec 06 diff empty) |
| `CLAIM_CATEGORIES` set | `['claim.approved','claim.rejected','claim.needs_more_info']` in `render.ts` | UNCHANGED |

**Not claim templates (unchanged / out of claim contract):** `DEFAULT_REJECTION_TEMPLATE_AR` / `DEFAULT_EXPIRY_TEMPLATE_AR` are job-application rejection/expiry SSOT (`email-templates.ts`), not claim decision templates.

**No Resend `template_id` constants** exist for claim mail; delivery is inline HTML + category/`template` string = claim category.

---

### 9. `dispatch_notification` signature — **UNCHANGED**

**Canonical signature** (`082_notification_dispatcher.sql`, still authoritative; Spec 06 did not `CREATE OR REPLACE` it):

```sql
dispatch_notification(
  p_recipient_id uuid,
  p_category public.notification_category_enum,
  p_title_ar text,
  p_title_en text,
  p_body_ar text,
  p_body_en text,
  p_priority public.notification_priority_enum DEFAULT 'normal',
  p_action_url text DEFAULT NULL,
  p_action_label_ar text DEFAULT NULL,
  p_action_label_en text DEFAULT NULL,
  p_related_resource_type text DEFAULT NULL,
  p_related_resource_id uuid DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
```

| Check | Evidence |
|-------|----------|
| Spec 06 CREATE | `git diff -G"CREATE OR REPLACE FUNCTION public\.dispatch_notification"` over range → **empty** |
| Call sites | `190001` / `190002` call with same named args; no new parameters |
| types.ts | `dispatch_notification.Args` identical before/after Spec 06 (Spec 06 only added directory correction enum members) |

---

### 10. `notify_claim_decision` name and parameters — **UNCHANGED**

| Aspect | Pre-Spec 06 (`108`) | Spec 06 (`190002`) |
|--------|---------------------|---------------------|
| Name | `public.notify_claim_decision` | same |
| Params | `p_claim_id uuid, p_decision text, p_reason text DEFAULT NULL` | same |
| Returns | `uuid` | same |
| Security | `SECURITY DEFINER`, privileged-staff gate | same |

**Body change (not part of name/params contract):** Spec 06-D replaces hardcoded `p_action_url := '/settings'` with Spec 03 outcome URLs (`v_action_url`). Comment in migration explicitly: “Preserves notify_claim_decision name, parameters, return type…”. Unit test asserts signature lines and category literals preserved.

`types.ts`: `Args: { p_claim_id: string; p_decision: string; p_reason?: string }` unchanged across Spec 06.

---

### 11. Notification idempotency-key format — **UNCHANGED**

**Claim decision format (contract):**

```text
verification.decision:<claim_id>:<decision>
```

SQL (identical in `108` and `190002`):

```sql
v_idempotency_key := format('verification.decision:%s:%s', p_claim_id, p_decision);
```

| Check | Evidence |
|-------|----------|
| Spec 06-D | Same `format(...)` line preserved |
| Tests | `claim-notification-action-urls.test.ts` regex-asserts that format; RLS test uses `` `verification.decision:${id}:approved` `` etc. |
| Session E | `spec-06e-setup-fixtures.mjs`: `` idempotency_key: `verification.decision:${vrId}:${decision}` `` |

**Related but separate (not a change to the claim contract):** Spec 06-B/C introduced directory-correction keys `directory.correction:<suggestion_id>:approved|rejected` — additive for a different feature, does not alter `verification.decision:…`.

---

## Summary table

| # | Contract | Result |
|---|----------|--------|
| 1 | `claim.approved` | **UNCHANGED** |
| 2 | `claim.rejected` | **UNCHANGED** |
| 3 | `claim.needs_more_info` | **UNCHANGED** |
| 4 | `claim_id` | **UNCHANGED** |
| 5 | `claimId` | **UNCHANGED** |
| 6 | `send-claim-approval` | **UNCHANGED** |
| 7 | `send-claim-rejection` | **UNCHANGED** |
| 8 | Claim email template identifiers | **UNCHANGED** (list in §8) |
| 9 | `dispatch_notification` signature | **UNCHANGED** |
| 10 | `notify_claim_decision` name + parameters | **UNCHANGED** |
| 11 | Idempotency-key format `verification.decision:<id>:<decision>` | **UNCHANGED** |

**Out-of-scope note (honest):** Spec 06-D intentionally changed **notification `action_url` / labels** for claim decisions (away from `/settings`). That does not alter any of the eleven contracts above.

**Proof generated:** 2026-07-31 (worktree HEAD `f6397f2`).
