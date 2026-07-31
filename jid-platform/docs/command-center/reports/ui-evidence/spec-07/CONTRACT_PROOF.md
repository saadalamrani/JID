# Spec 07 — External Contract Proof (Session 07-E)

**Worktree:** `C:\Users\saada\Downloads\Desktop\JID-1-wt-07e`
**Canonical tip at Session E start:** `b77fca0d6083ac24c456696e8e3f1af3dcb65a7c` (`origin/agent/nonprod-signup-fix`)
**Session 07-D source:** `cursor/jid-07d-publication-ui`
**Session 07-C tip:** `738ecaec3a564faf67fa3a44cac0ceb581cafe12`
**Method:** `git diff` / `git log` on migrations and publication/staff surfaces; tree `rg` for completeness metrics and public field exposure; Session E evidence scripts do not redefine SQL contracts.
**Verdict rule:** A contract is **UNCHANGED** if its identifier/signature/grants/behavior boundary was not renamed, removed, weakened, or redefined by Session 07-D or 07-E product edits.

## Spec 07 commits examined (after Session 07-C)

| SHA | Subject |
|-----|---------|
| `b77fca0` | feat(profile): add Spec 07-D publication UI and public Profile routes |

**Session E (this closeout):** evidence pack + fixture scripts + ledger only. No dirty product files under `src/`, `supabase/migrations/`, or `messages/` for these contracts at proof time (scripts under `jid-platform/scripts/spec-07e-*.mjs` consume existing RPC names).

**Migrations:** Session 07-D created **none**. Publication RPC migration remains solely `20260730190003_profile_publication_rpcs.sql` from Session 07-B (promoted via 07-C). `git diff 738ecaec..b77fca0 -- jid-platform/supabase/migrations` is empty.

**Historical mirror:** `agent/nonprod-signup-form` remains `b29846b644ab2d94ec1d88b3a0954f2f30276452` — not updated by Session E.

---

## Per-contract results

### 1. `publish_business_profile` signature — **UNCHANGED**

| Check | Evidence |
|-------|----------|
| Signature | `CREATE OR REPLACE FUNCTION public.publish_business_profile(p_profile_id uuid)` in `20260730190003_profile_publication_rpcs.sql` |
| 07-D/E | No migration diff after 07-C; Session E scripts call the same RPC name via app actions |
| Args | Single `uuid` argument only |

### 2. `unpublish_business_profile` signature — **UNCHANGED**

| Check | Evidence |
|-------|----------|
| Signature | `public.unpublish_business_profile(p_profile_id uuid)` in `20260730190003` |
| 07-D/E | Migration tree untouched after 07-C |

### 3. `publish_university_profile` signature — **UNCHANGED**

| Check | Evidence |
|-------|----------|
| Signature | `public.publish_university_profile(p_profile_id uuid)` in `20260730190003` |
| 07-D/E | Migration tree untouched after 07-C |

### 4. `unpublish_university_profile` signature — **UNCHANGED**

| Check | Evidence |
|-------|----------|
| Signature | `public.unpublish_university_profile(p_profile_id uuid)` in `20260730190003` |
| 07-D/E | Migration tree untouched after 07-C |

### 5. RPC EXECUTE grants — **UNCHANGED**

| Check | Evidence |
|-------|----------|
| Pattern | Each of the four RPCs: `REVOKE ALL … FROM PUBLIC, anon;` then `GRANT EXECUTE … TO authenticated;` |
| Source | `20260730190003` lines for all four functions |
| 07-D/E | No grant migration; no ALTER FUNCTION grant changes |

### 6. Public published-only RLS — **UNCHANGED**

| Check | Evidence |
|-------|----------|
| Policies | `profile_public_read_published` / `university_profile_public_read_published` USING (`status='published'`) from `110_profile_ownership_policies.sql` |
| 07-D | Does not DROP/CREATE those policies (`git log 738ecaec..b77fca0 -- 110_profile_ownership_policies.sql` empty) |
| App | `published-profile.ts` filters published-only; draft/suspended → null / notFound |

### 7. Direct owner status-write prevention — **UNCHANGED**

| Check | Evidence |
|-------|----------|
| Trigger | `enforce_owned_profile_moderation_boundary` + narrow GUC `jid.profile_publication_rpc` escape only inside the four publication RPCs (`20260730190003`) |
| 07-D/E | No change to trigger body after 07-C; owner UI uses server actions → RPCs, never raw status UPDATE |

### 8. Staff suspension mechanism — **UNCHANGED**

| Check | Evidence |
|-------|----------|
| Path | `suspendProfileAction` → `suspendProfile` → `suspend_profile` (`113_profile_moderation_functions.sql`) |
| 07-D/E | No edits to `113_profile_moderation_functions.sql` or suspension redesign; Session E exercised existing staff path for smoke only |

### 9. Staff reinstatement mechanism — **UNCHANGED**

| Check | Evidence |
|-------|----------|
| Path | `reinstateProfileAction` → `reinstateProfile` → `reinstate_profile` in `113` |
| 07-D/E | Untouched; Session E did not redesign reinstate |

### 10. Profile-creation RPCs — **UNCHANGED**

| Check | Evidence |
|-------|----------|
| 07-D/E | No migration after 07-C; Session E fixtures insert Profiles deliberately (service role) and do not invoke Verification approval to create Profiles |
| Browser proof | Publish flows operate on pre-created owned Profile rows only |

### 11. Specification 02 decision RPCs — **UNCHANGED**

| Check | Evidence |
|-------|----------|
| 07-D/E | `git log 738ecaec..b77fca0 -- jid-platform/supabase/migrations` empty — no Spec 02 decision RPC rewrite |

### 12. Directory remains reference-only — **UNCHANGED**

| Check | Evidence |
|-------|----------|
| Lookup | `lookupPublishedProfileLinkByDirectoryId` links Directory id → published Profile href; Directory≠Profile ids recorded distinct in run manifest |
| Ownership | Session E fixture setup does not set `companies.claimed_by`; public query forbids ownership fields |
| Evidence | Directory screenshots + `run-manifest.json` distinct directory vs profile IDs |

### 13. Verification approval does not create or publish a Profile — **UNCHANGED**

| Check | Evidence |
|-------|----------|
| Session E | No Verification approval step in smoke walks; Profiles created as separate rows before publish |
| Contracts | Spec 02 decision RPCs untouched (contract 11) |

### 14. No completeness percentage or score — **UNCHANGED / ABSENT on org publication**

| Check | Evidence |
|-------|----------|
| Org surfaces | Session E screenshots of draft/published owner and public pages show no completeness %, score, or readiness ring |
| Code note | `completeness` strings exist only under individual CV builder (`cv.builder.completeness`), out of Spec 07 org publication scope |
| Publication UI | `DraftPublicationBoundary` / publication messages have no completeness metric keys |

### 15. No public draft visibility — **UNCHANGED**

| Check | Evidence |
|-------|----------|
| RLS + query | Published-only public SELECT; Session E post-unpublish and draft public checks → not-found UI |
| Screenshots | `07-business-*-post-unpublish-not-found.png`, `10-university-*-post-unpublish-not-found.png` |

### 16. No public suspended visibility — **UNCHANGED**

| Check | Evidence |
|-------|----------|
| Staff suspend | Existing suspension path; public route not-found while suspended |
| Screenshots | `12-business-*-suspended-public-not-found.png`, `14-university-*-suspended-public-not-found.png` |

### 17. `agent/nonprod-signup-form` was not updated — **CONFIRMED**

| Check | Evidence |
|-------|----------|
| Tip before Session E work | `b29846b644ab2d94ec1d88b3a0954f2f30276452` |
| Tip after Session E (pre-promotion of fix) | same SHA via `git ls-remote` / `refs/remotes/origin/agent/nonprod-signup-form` |
| Policy | Session E promotes only `agent/nonprod-signup-fix`; mirror must remain untouched |

---

## Summary

All 17 listed contracts are **UNCHANGED** / **CONFIRMED** for Session 07-E. No product migration, RPC, grant, RLS, suspension, Spec 02 decision, or Profile-creation contract was altered to obtain closeout.
