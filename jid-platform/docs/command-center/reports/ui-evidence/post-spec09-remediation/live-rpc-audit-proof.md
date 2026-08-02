# Live RPC / Audit Proof (Post-Spec 09 Remediation)

**RUN_ID:** `jid-rem-20260802-7535ec`
**Completed:** `2026-08-02T07:17:02.722Z`
**Result:** **PASS**

- PASS 015 approve_verification_request staffSelf — cannot_review_own_verification
- PASS 015 reject_verification_request staffSelf — cannot_review_own_verification
- PASS 015 no mutation after self-review attempts — pending_review
- PASS 015 no success audit for self-review — 0
- PASS 015 approve_verification_request_override superAdmin own — cannot_review_own_verification
- PASS 015 reject_verification_request_override superAdmin own — cannot_review_own_verification
- PASS 017 approve correction — ok
- PASS 017 directory city mutated on approve — Riyadh
- PASS 017 no prior city when null — before=null
- PASS 017 one+ approve audit — 0->1
- PASS 017 reject correction
- PASS 017 reject audit — 0->1
- PASS 017 reject no directory mutation — Riyadh
- PASS 017 unauthorized apply denied — insufficient_privileges
- PASS 017 business unpublish
- PASS 017 business unpublish audit — 0->1
- PASS 017 business status draft after unpublish — draft
- PASS 017 business publish
- PASS 017 business publish audit — 0->1
- PASS 017 business published_at set — published/Sun Aug 02 2026 10:16:58 GMT+0300 (التوقيت العربي الرسمي)
- PASS 017 business unauthorized unpublish denied — not_profile_owner
- PASS 017 university unpublish
- PASS 017 university unpublish audit — 0->1
- PASS 017 university status draft after unpublish — draft
- PASS 017 university publish
- PASS 017 university publish audit — 0->1
- PASS 017 university published_at set — published/Sun Aug 02 2026 10:17:01 GMT+0300 (التوقيت العربي الرسمي)
- PASS 017 university unauthorized unpublish denied — not_profile_owner
