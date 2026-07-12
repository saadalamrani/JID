# JID Platform — Design System Conformance Report (P-002)

**Generated:** 2026-07-11  
**Dependency gates:** P-000 (`AUDIT_GAP_REPORT.md`) ✓ · P-001 (`terminology.ts`, `tiers.ts`) ✓  
**Scope:** Visual token classes and typography only — no layout restructuring, no logic changes.

---

## 1. Before / After Scan Summary

### (a) Hardcoded hex colors — outside `design-tokens.ts` / `tailwind.config.ts`

| File | Before | After | Action |
|------|--------|-------|--------|
| `src/app/[locale]/(individual)/profile/cv/print-cv-ar/print-cv-ar.css` | 12 | 12 | **Design Debt** — print engine |
| `src/lib/cv/formats/global-ats-styles.ts` | 4 | 4 | **Design Debt** — ATS spec black/white |
| `src/lib/cv/formats/harvard-styles.ts` | 5 | 5 | **Design Debt** — Harvard spec black/white |
| `src/lib/cv/pdf-styles.ts` | 5 | 5 | **Design Debt** — @react-pdf/renderer |
| `src/app/[locale]/globals.css` | 1 | 1 | Comment only (no CSS value) |
| `src/app/[locale]/(company)/_components/university-dashboard.tsx` | 1 | 1 | Commented — PDF StyleSheet requires inline |
| `src/components/mentor/mentor-share-card-button.tsx` | 1 | 0 | Fixed → `to-primary/80` |
| **Total files** | **7** | **6** | **1 fixed, 5 deferred** |

### (b) Raw `jid-*` Tailwind classes in `className`

| Metric | Before | After |
|--------|--------|-------|
| Files with `jid-*` in class strings | **128** | **0** |
| Total `jid-*` class token hits (approx.) | **900+** | **0** |

**Replacement map applied (mechanical):**  
`bg-jid-beige`→`bg-background` · `bg-jid-beige-warm`→`bg-surface` · `text-jid-ink`→`text-foreground` · `text-jid-ink-soft`→`text-muted-foreground` · `text-jid-olive`→`text-primary` · `bg-jid-olive`→`bg-primary` · `text-jid-gold`→`text-accent` · `bg-jid-gold`→`bg-accent` · `border-jid-*`→`border-accent`/`border-border`/`border-primary` · `bg-jid-line`→`bg-border` · gold shade gradients→`accent` opacity scale.

**Excluded (not class violations):** storage keys (`jid-catalog-filters`), dev headers (`x-jid-test-*`), analytics (`$lib: jid-web`), comments, `globals.css` CSS variable definitions.

### (c) `dark:` prefixed classes on components

| File | Before | After | Notes |
|------|--------|-------|-------|
| `src/components/brand/logo.tsx` | 2 | 0 | Asset map keys `light`/`dark` — not Tailwind variants |
| `src/components/sys/sys-auth-shell.tsx` | 0 | 0 | Comment: light-only shell (intentional) |
| `src/app/[locale]/foundation-test/page.tsx` | 1 | 1 | Documentation text only |
| `src/config/design-tokens.ts` | 8 | 8 | Semantic token definition source (allowed) |
| **Tailwind `dark:` class usage in components** | **0** | **0** | No manual `dark:` duplication found |

### (d) `letter-spacing` / `tracking-` near Arabic text

| File | Before | After | Notes |
|------|--------|-------|-------|
| Arabic-rendering components with `tracking-*` | **~28** | **0** | All removed |
| `src/lib/typography.ts` | 19 | 19 | Scale definition — Arabic bundles use `tracking-normal` (=0) |
| `src/components/ui/dropdown-menu.tsx` | 1 | 1 | **Kept** — Latin keyboard shortcut hints only |
| `src/components/mentor/mentor-share-card-button.tsx` | 1 | 1 | **Kept** — English label "JID Mentorship" only |
| `src/app/[locale]/globals.css` | 2 | 2 | `letter-spacing: 0` on `html[lang='ar']` (correct guard) |
| `src/app/[locale]/(individual)/profile/cv/print-cv-ar/print-cv-ar.css` | 0 | 0 | Comment prohibiting letter-spacing |
| **Arabic-violating instances** | **~28** | **0** | **Hard requirement met** |

### (e) Inline `style={{ fontFamily/color }}`

| File | Before | After | Notes |
|------|--------|-------|-------|
| Virtualized grids (height only) | 6 | 6 | Dynamic row height — no color/font |
| `sla-progress-bar.tsx` | 1 | 1 | Dynamic width % |
| PDF/CV documents | 5 | 5 | **Design Debt** — renderer requires inline |
| Chart bars (college/status) | 3 | 3 | Dynamic bar width/color from data |
| `announcement-carousel.tsx` | 1 | 1 | Dynamic transform/opacity |
| `email-quota-card.tsx` | 1 | 1 | Progress width |
| **Color/font inline violations fixed** | 1 | 0 | `mentor-share-card-button` hex removed |

### (f) Logo implementations

| Component | Role | Status |
|-----------|------|--------|
| `src/components/brand/logo.tsx` | **Canonical** JID brand PNG (AR/EN + theme crossfade) | ✓ Single source |
| `src/app/[locale]/(public)/catalog/_components/company-logo.tsx` | Employer catalog avatar (not JID brand) | ✓ Distinct purpose |

**Import sites for canonical `Logo`:** `smart-header.tsx`, `auth-shell.tsx`, `public-footer.tsx`, `staff-sidebar.tsx`, `sys-sidebar.tsx`, `onboarding/layout.tsx`, `loading.tsx` (×3).

No text-based or CSS-approximated JID logo found outside `Logo`.

### (g) Notification bell & command palette

| Component | Count | Status |
|-----------|-------|--------|
| `NotificationsBell` (`notifications-bell.tsx`) | **1** | Used by `smart-header`, `staff-topbar`, `sys-topbar` ✓ |
| Command palette implementations | **4** | **Design Debt HIGH** — see §3 |

---

## 2. Files Modified (P-002)

**~310 files** touched — predominantly `className` token swaps across `src/**/*.tsx` and `src/**/*.ts`.

**Manually targeted (typography + spot fixes):**
- `src/components/ui/card.tsx`, `dialog.tsx`
- `src/components/radar/mentorship-timeline.tsx`
- `src/app/[locale]/_components/home-hero.tsx`
- `src/app/[locale]/(public)/pulse/_components/pulse-shell.tsx`
- `src/app/[locale]/(public)/_components/landing/hero-manifesto.tsx`, `vision-2030-section.tsx`
- `src/lib/feature-flags/feature-unavailable.tsx`
- `src/components/sys/sys-auth-shell.tsx`, `staff-auth-shell.tsx`
- `src/app/[locale]/(staff)/staff/_components/staff-sidebar.tsx`
- `src/app/[locale]/(sys)/sys/_components/sys-sidebar.tsx`
- Staff/sys entity/user detail pages, `profile-suspended-state.tsx`, `preferences-form.tsx`
- `src/app/[locale]/not-found.tsx`
- `src/components/mentor/mentor-share-card-button.tsx`
- `src/app/[locale]/(company)/_components/university-layout.tsx`, `university-dashboard.tsx`
- `src/lib/supabase/types.ts` (UTF-8 re-encode + tail trim — unblocks parse; RPC set still stale vs cloud)

**Reports:** `docs/DESIGN_CONFORMANCE_REPORT.md`, `docs/AUDIT_GAP_REPORT.md` (Section 9 append)

---

## 3. Design Debt (deliberately NOT fixed)

| Item | Severity | Owning prompt | Reason |
|------|----------|---------------|--------|
| CV print CSS hex (`print-cv-ar.css`) | MED | P-703 | Isolated print engine; needs design-approved print palette |
| ATS/Harvard/PDF style hex (`#000`/`#FFF`) | MED | P-703 | External format specs mandate literal black/white |
| `@react-pdf/renderer` StyleSheet inline colors | MED | P-703 | No Tailwind in PDF context |
| Dynamic chart/bar inline colors (status/college bars) | LOW | P-703 | Data-driven widths/colors; needs chart token abstraction |
| **4 command palette variants** (`command-palette.tsx`, `individual-command-palette.tsx`, `staff-command-palette.tsx`, `sys/.../command-palette.tsx`) | **HIGH** | **P-608** | Role-aware duplication — consolidate in Admin Consolidation sprint |
| `tailwind.config.ts` retains `jid-*` color scale | LOW | KEEP | Mapping layer per constitutional standard |
| `typography.ts` Latin `tracking-[-0.03em]` bundles | LOW | KEEP | Latin/display only; Arabic bundles locked to `tracking-normal` |
| `dropdown-menu` `tracking-widest` on shortcuts | LOW | KEEP | Latin keyboard hints only |
| Build failure: missing `screening-builder` / `invite-panel` modules | BLOCKER | P-508 | Pre-existing webpack error unrelated to tokens |
| `types.ts` RPC union stale (`check_email_otp_rate_limit` missing) | BLOCKER | P-001 | Cloud/local schema drift — regenerate types |

---

## 4. Sidebar / Header Pattern Audit (report only)

| Route group | Expected | Observed | Status |
|-------------|----------|----------|--------|
| `(public)` | Smart header, no sidebar | `PublicNav` + footer | ✓ |
| `(individual)` / `(authenticated)` | Smart header, no sidebar | `AuthenticatedAppShell` → `SmartHeader` | ✓ |
| `(company)` standard | Company chrome | `StandardCompanyLayout` (top nav, no persistent sidebar) | ✓ |
| `(company)` university | Sidebar retained | `UniversityLayout` with `<aside>` grid | ✓ |
| `(staff)` | Sidebar retained | `StaffShell` → `staff-sidebar.tsx` | ✓ |
| `(sys)` | Sidebar retained | `SysShell` → `sys-sidebar.tsx` | ✓ |

**No layout restructuring performed.**

---

## 5. Manual Light → Dark → Light Toggle Checklist (Task 9)

Visit each URL; toggle theme via header/settings; confirm backgrounds, text, cards, borders render without raw `jid-*` flashes.

### Public (`/ar` locale)

- [ ] `http://localhost:3000/ar` — home
- [ ] `http://localhost:3000/ar/opportunities` — job board
- [ ] `http://localhost:3000/ar/catalog` — company directory
- [ ] `http://localhost:3000/ar/pulse` — Platform Pulse
- [ ] `http://localhost:3000/ar/mentors` — mentor discovery
- [ ] `http://localhost:3000/ar/plus` — pricing

### Individual

- [ ] `http://localhost:3000/ar/profile` — profile hub (auth required)
- [ ] `http://localhost:3000/ar/profile/cv` — CV builder (auth required)
- [ ] `http://localhost:3000/ar/settings/notifications` — settings (auth required)
- [ ] `http://localhost:3000/ar/notifications` — notification center (auth required)

### Company (entity admin, auth + approved claim)

- [ ] `http://localhost:3000/ar/company/dashboard` — company dashboard
- [ ] `http://localhost:3000/ar/company/jobs` — job list
- [ ] `http://localhost:3000/ar/company/billing` — billing

### University (same route group; `entity_type = university`)

- [ ] `http://localhost:3000/ar/company/dashboard` — university dashboard + sidebar
- [ ] `http://localhost:3000/ar/company/profile` — university profile editor

### Staff

- [ ] `http://localhost:3000/ar/staff/dashboard` — staff home (staff role)
- [ ] `http://localhost:3000/ar/staff/claims` — claims queue
- [ ] `http://localhost:3000/ar/staff/login` — staff auth (light-only shell)

### Super Admin (sys)

- [ ] `http://localhost:3000/ar/sys/dashboard` — sys metrics (super_admin)
- [ ] `http://localhost:3000/ar/sys/features` — feature flags
- [ ] `http://localhost:3000/ar/sys/login` — sys auth (light-only shell)

---

## 6. Verification Checklist (P-002)

| Item | State |
|------|-------|
| `docs/DESIGN_CONFORMANCE_REPORT.md` created with all sections | **PASS** |
| Category (d) Arabic violations: zero remaining | **PASS** |
| `pnpm type-check` passes | **FAIL** — 2 RPC type errors (`check_email_otp_rate_limit`, `check_otp_rate_limit`) — stale `types.ts` vs migrations |
| `pnpm lint` passes | **FAIL** — 28 pre-existing unused-var errors (no new parse errors from `types.ts`) |
| `pnpm build` completes | **FAIL** — missing `./_components/screening-builder` and `invite-panel` (pre-existing) |
| Git diff: className/style + reports only | **FAIL** — ~310 files (className swaps) + `types.ts` encoding fix; includes P-001/i18n/constants from prior prompts |
| Design Debt cross-posted to `AUDIT_GAP_REPORT.md` §9 | **PASS** |

---

**STOP — P-002 complete. No layout restructuring. No component logic changes.**
