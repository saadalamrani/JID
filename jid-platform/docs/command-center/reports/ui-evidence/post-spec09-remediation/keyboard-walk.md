# Staff keyboard decision walk (post-Spec09 remediation)

**Base:** `http://127.0.0.1:3000`
**RUN_ID:** `jid-rem-20260802-7535ec`
**Result:** **PASS**

- PASS authenticated past MFA — http://127.0.0.1:3000/staff/verification
- PASS queue loaded — http://127.0.0.1:3000/staff/verification
- PASS focus visible after tab — A
- PASS request open — http://127.0.0.1:3000/staff/verification/b6bd2b83-e5fe-424c-9b27-df22aac35164
- PASS validation surfaced or reason focused — hintCount=0
- PASS 375 en capture — http://127.0.0.1:3000/en/login?next=%2Fstaff
- PASS self-review UI messaging — matches=1
- PASS local /sys/claims not login funnel — 404 http://127.0.0.1:3000/ar/sys/claims

Captures under `captures/KB-*`.
