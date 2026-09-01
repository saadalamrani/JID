# R1-B — Saudi Content, Product Language & Arabic UX Writing Intelligence

**Phase:** R1-B (Research + language system only — no visual design, no frontend
implementation, no product code, no database changes)
**Status:** Complete
**Required input:** `R1A_JID_PRODUCT_USER_HRTECH_RESEARCH.md` and
`R1A_SOURCE_LEDGER.md`, amended version at commit `c755b77a92bb47ee4bcb272bc5099cdfcbc0be68`.
This report treats R1-A's governing conclusions as settled and does not
reopen them.
**Companion files:** `R1B_SOURCE_LEDGER.md` (every `[Tx]`/`[Jx]` citation
below is defined there); `R1B_JID_SAUDI_PRODUCT_LANGUAGE_SYSTEM.md` (the
operational rules and terminology tables this research produces)

This report is not a translation exercise. Its job is to establish how JID
should *speak* — natively, as a product built in Saudi Arabia, not as an
English product with Arabic strings attached. It does not touch
`messages/ar.json`, `messages/en.json`, any component, any route, or any
design decision. Those belong to R1-C and D1.

**Evidence confidence key (carried from R1-A):** every external finding
below is graded PRIMARY/HIGH-CONFIDENCE or DIRECTIONAL/SECONDARY-SOURCE in
`R1B_SOURCE_LEDGER.md`. No figure or claim from a DIRECTIONAL source may be
promoted into marketing copy, a KPI, an investor claim, or a stated
Saudi-market fact without independent verification first.

---

## 1. EXECUTIVE FINDING

Current JID copy is not broken because it lacks Arabic vocabulary. It is
broken because it was authored the way most bilingual products are authored
under deadline: **the database schema gave a concept its name first, and the
Arabic string is that name's translation, not a native description of what
the user is actually experiencing.**

The clearest evidence for this is JID's own live homepage subtitle, sampled
directly from `messages/ar.json` (J1):

> باحث عن عمل؟ أنشئ حسابك. تمثّل جهة توظيف؟ **ابحث عن كيانك وقدّم مطالبة بالملف.**

*("Job seeker? Create your account. Represent an employer? Find your entity
and submit a claim on the profile.")*

This sentence is grammatically correct Arabic. It is also a direct
transliteration of a database operation — `SELECT`, then `INSERT INTO
claim_requests` — spoken in the imperative. A user reading it has to
translate it back into intent: *"I think this means I should look for my
company in a list and then ask to own it."* That is the translationese
failure mode this phase exists to fix, and it is exactly the example the
task brief itself names. The fix is not replacing كيان with شركة. The fix is
recognizing this entire sentence describes a product moment (a
representative proving who they are) using the vocabulary of a database
operation (finding and claiming a row) — and R1-A has already replaced that
moment with a different one (account → verification → reconciliation →
workspace). The language for the *new* moment does not yet exist anywhere in
JID's copy, because the moment itself has not shipped. This report's job is
to define what that language should sound like once it does — and to show,
with real current examples, the pattern that produces this failure
everywhere else it appears in the product.

The second finding, equally load-bearing: **JID does not need to invent a
Saudi voice from nothing.** Real, familiar, trusted Arabic vocabulary
already exists for almost every moment JID needs to describe — because
Saudi Arabia already runs large-scale digital services in this exact domain
(national employment platforms, identity verification, commerce). JID's
job is to use that existing, trusted vocabulary honestly, not to invent a
distinctive "brand voice" that competes with it for the user's attention.

---

## 2. WHAT "SAUDI PRODUCT LANGUAGE" ACTUALLY MEANS

Per the brief's own governing principle, restated because it is the spine
of every section below: **Saudi does not mean dialect, does not mean "يا
هلا," and does not mean forced slang.** Saudi product language is produced
by five compounding choices, none of which are about vocabulary alone:

1. **Word choice** — reaching for the word a Saudi institution or product
   already uses for this exact concept (Section 5, Section 10), not the
   most literal dictionary equivalent of the English term.
2. **Directness** — saying what happens and what the user should do next,
   in that order, without a preamble that explains the system's internal
   logic first (T6, T7; corroborated by R1-A S17's onboarding-friction
   findings).
3. **Rhythm** — short, complete Arabic sentences that read the way Arabic is
   actually spoken and written by a fluent professional, not sentences whose
   clause order and connector density reveal they were assembled from an
   English source string (T1, T8).
4. **Familiar professional vocabulary** — the register a Saudi professional
   already uses at work and in government-service interactions (Section 6),
   which is Modern Standard Arabic used plainly, not colloquial and not
   ornate classical Arabic.
5. **Absence of translationese** — the actual test (Section 15's "logo
   removed" quality check): does the sentence's structure reveal it was
   composed in English first? A sentence that needs its English counterpart
   to be understood has already failed, regardless of whether every word in
   it is correct Arabic.

None of these five require an editorial personality, a slogan, or a
recognizable "voice" the way a media brand needs one. JID is closer to
Nafath or Qiwa in its register than it is to Thmanyah (Section 3) — the
authority to speak plainly is more valuable here than the authority to
sound distinctive.

---

## 3. THAMANYAH ANALYSIS

Thmanyah (ثمانية) is studied here as a *principle* reference, not a voice to
imitate — the brief's rule against creating "ثمانية لكن HR Tech" is treated
as absolute throughout.

**What was found (T1, DIRECTIONAL — `thmanyah.com` itself was blocked by
network egress this session; findings are built from third-party coverage
of the company, not a direct read of its copy):** Thmanyah was founded in
Riyadh in 2016, is now majority-owned by the Saudi Research and Media Group,
and states its mission as building an internet-native Arabic writing and
reading experience — explicitly framed as *not* an adaptation of a
foreign-language product pattern into Arabic, but a product designed for
Arabic from its first principle. Its portfolio (podcasts, documentaries, a
widely-read newsletter, a dedicated Arabic font project) is evidence of
scale and cultural reach, not something this research studied for content
itself, per the brief's copyright discipline.

**Why the underlying pattern (not the sentences) feels Saudi, natural, and
confident — inferred from the stated mission and general Arabic-UX-writing
consensus (T1, T8), not verified against Thmanyah's own copy directly:**

- **Arabic is the starting point, not the destination.** A sentence composed
  in Arabic from the beginning has different clause order, different
  omission choices, and a different natural rhythm than a sentence composed
  in English and then converted — this is the single most transferable
  principle for JID.
- **Confidence is expressed by what is left out.** A native-feeling Arabic
  sentence trusts the reader to infer context rather than stating it
  explicitly — the opposite instinct of a translated sentence, which tends
  to over-explain because the source sentence had to be self-contained for
  a different audience.
- **Directness is not the same as terseness.** A short sentence isn't
  automatically confident; a short sentence with the exact right verb is.

**What JID should learn (elaborated in Section 16) is the discipline behind
this, not the register itself** — JID is a professional/operational
product, not an editorial one, and needs a different register entirely
(Section 7).

---

## 4. SAUDI CONTENT / CREATIVE INDUSTRY FINDINGS

The visible Saudi "content agency" market (T2) is, on inspection, mostly
generic marketing-content production — SEO-oriented agencies offering
"professional content for all platforms," largely interchangeable in their
own self-description. This is itself a finding: **the credible bar for
disciplined Saudi *product*-language work is set by a small number of
genuine references, not a broad agency market.** This research retained
five such references, spanning content/editorial and applied
UX/product-language work, rather than padding the count with commodity
agencies that produced no independent insight:

1. **Thmanyah (T1)** — editorial/media reference for Arabic-native
   composition (Section 3). Register: too editorial for JID's operational
   surfaces; principle only.
2. **UXBERT Labs (T3)** — Riyadh-headquartered, Saudi Arabia's first
   dedicated CX/UX/usability research lab; publishes Arabic-UX-specific
   research (an F-shaped Arabic reading-pattern finding from their own
   eye-tracking work, and a two-part practitioner series on what Arabic UX
   actually requires beyond mirroring). Register: applied, research-backed,
   directly relevant to JID's product surfaces — the strongest single
   reference for *how* to design Arabic UX writing, as distinct from
   Thmanyah's *why*.
3. **Salla (سلة) (T4)** — a genuinely Arabic-native Saudi SaaS product
   (e-commerce platform builder), not a translated one; its own positioning
   is built around Arabic being the default, not an add-on. Register: plain,
   commerce-operational — useful precedent for "professional Arabic SaaS
   that doesn't feel translated," distinct from both Thmanyah's editorial
   register and government register.
4. **The Saudi national employment-platform set — طاقات / جدارات / قوى
   (T5)** — studied in depth in Section 6 and Section 10; the single most
   relevant reference set found in this research, because it operates in
   JID's exact domain.
5. **Nafath (T6)** — the shared identity-verification layer nearly every
   Saudi digital service (including the platforms above) is built on top
   of; studied in depth in Section 11.

**What JID can learn from this set collectively:** the strongest available
Saudi product-language references are either genuinely editorial (Thmanyah
— wrong register for JID) or genuinely operational/institutional (UXBERT's
research, Salla, the government employment/identity platforms — closer to
JID's own register). JID's voice sits nearer the second group.

**What JID must avoid:** treating the generic Saudi content-agency market
(T2) as a language authority. Its output is fluent, grammatical Arabic that
is nonetheless generic — professional Arabic without a specific product
truth behind it is exactly the "internally-oriented, generic SaaS" failure
mode the brief opened by naming.

---

## 5. SAUDI DIGITAL PRODUCT FINDINGS

Studied across categories, per the brief's instruction not to treat fame as
a proxy for good UX writing.

**Government employment domain — طاقات / جدارات / قوى (T5):** three
distinct government platforms, sharing the Nafath identity layer, each
serving a clearly different audience within employment: Taqat (private-
sector jobseeker support programs, operated by the HRDF/هدف fund), Jadarat
(government-job applications, Ministry of Human Resources), Qiwa (employer/
establishment workforce and contract management, also Ministry of Human
Resources). **Strong pattern:** each platform's name and scope map to one
real job-to-be-done rather than one database table — a jobseeker never has
to wonder which of the three they need once they know their own situation
(private-sector support vs. government application vs. being an employer).
**What to learn:** JID's own actor-specific language (Section 9) should
achieve the same clarity — an Individual, an Employer, and a University
should each recognize immediately which surface is theirs, the way a Saudi
user already recognizes which of Taqat/Jadarat/Qiwa is theirs.

**Identity verification — Nafath (T6):** the live approval interaction is a
short, sequential script: a request arrives, the user opens the app,
matches a displayed number against the requesting service, confirms with a
personal code. **Strong pattern:** verification language names the action
(match, confirm) rather than the policy behind it (why verification is
required) at the moment of the action itself — policy explanation, where
needed, happens before or after the action step, never inside it. **What to
learn:** JID's own verification flows (Section 11) should follow the same
shape — a script of named actions, not a paragraph.

**Commerce SaaS — Salla (T4):** Arabic-first by default, not a secondary
locale; recent product messaging frames improvement in terms users feel
directly (navigation time cut in half) rather than in terms of feature
count. **Strong pattern:** a plain claim backed by something the user can
verify against their own experience. **Legacy pattern to avoid:** none
identified strongly enough to report — Salla was retained specifically
because it did not exhibit the translated-SaaS failure mode this research
was screening for.

**Fintech — Tamara / STC Pay (T7):** registration copy is procedural and
short — stated as "what you need to have ready" (a phone number; an ID, only
on a first request) rather than as an explanation of the underlying
compliance requirement. **Strong pattern:** minimize the distance between
"why we're asking" and "what to do" — when both are needed, the action
comes first. **Legacy/weaker pattern noted:** some surrounding support
documentation (not the product copy itself) reverts to a more
translated-feeling register once it moves from the transaction flow into
explanatory help-center content — a useful warning that a product's
in-flow copy and its help-center copy can drift into different registers
if not governed by the same system.

**Category attempted and found low-value:** education (Noon Academy, T11)
is a pan-Arab product, not Saudi-specific, and produced no incremental
finding beyond the above — recorded per the brief's source-discipline
instruction rather than pursued further.

---

## 6. MODERN GOVERNMENT LANGUAGE — LEARN / REJECT

**What Saudi users already recognize and trust (LEARN), evidenced across
T5/T6 and corroborating R1-A's independent Absher/Tawakkalna finding
(R1-A S5):**

- تحقق (verify/verification) as the default word for confirming identity or
  status — not a JID invention to introduce carefully; it is already the
  most familiar word in this domain.
- طلب (request/application) as the generic word for something a user has
  submitted and is waiting on — familiar and appropriately neutral, as long
  as it always carries a qualifier naming *what kind* of طلب (Section 10
  flags this as a term needing discipline, not removal).
- حالة (status) as the word for "where does this stand right now" — this is
  the word Saudi users expect when checking on something they submitted,
  and is worth JID standardizing on explicitly for the "where do I stand on
  my application" job-to-be-done (R1-A Section 5's Individual JTBD).
- موافقة (consent/approval) and منشأة (the registered legal employer entity,
  as used by Qiwa) as institution-grade, trusted vocabulary for consent and
  organizational-identity moments respectively.
- A short, sequential action script at the moment of verification itself
  (Section 5's Nafath finding) — trust is built by what the user does next,
  not by how much is explained first.

**What to reject — bureaucratic patterns that should not be copied even
though they are familiar:** long, passive-voice sentences stacking multiple
legal contingencies into one clause (a pattern visible in JID's own current
consent copy, Section 15); goodwill-signaling formal address that adds
words without adding information ("عزيزي المستفيد، نأمل التكرم بـ..." — the
exact stiff-translated register the brief names as the failure mode to
avoid, Section 7); explaining a rule's legal basis before telling the user
what to do about it. **The distinction that matters:** familiar
*vocabulary* (تحقق, طلب, حالة, موافقة) should be adopted; familiar
*bureaucratic sentence construction* should not — these are separable, and
conflating them is exactly how a product ends up sounding like "a
government portal," which the brief explicitly warns against.

---

## 7. YOUNGER SAUDI PROFESSIONAL LANGUAGE

**Evidence (converging across T8 and R1-A's independently-sourced global
Gen Z findings, R1-A S1):** business/professional Arabic products lean on
Modern Standard Arabic as the expected formal baseline (T8); the strongest
practitioner guidance found frames warmth as a function of word choice and
directness, not of relaxing into a more casual or colloquial register.
Globally, younger professional users have low tolerance for long,
unskippable explanation and high sensitivity to anything that reads as
condescending (R1-A S1, S17) — this pass could not independently verify a
Saudi-specific version of this finding (no Saudi-specific younger-user
language study was found that met the source-quality bar), so it is carried
forward as **inference, not verified Saudi-specific evidence**, consistent
with R1-A's own honest gap on this point (R1-A Section 18, item 1).

**What this pass can respond to responsibly, distinguishing evidence from
inference:**

- *(Evidence, T8/T5/T6)* MSA is the correct baseline register for JID's
  operational surfaces — this is not in tension with feeling native or
  contemporary; the government and commerce platforms studied are all MSA
  and none of them read as old-fashioned to a fluent Saudi professional.
- *(Inference, consistent with global Gen Z evidence R1-A S1/S17, not
  independently Saudi-verified)* what likely makes Arabic product copy feel
  old to a younger Saudi professional is not the register (MSA) but the
  *sentence construction* — passive voice, redundant honorifics, and
  over-explanation of routine actions are the more likely offenders than
  formality itself.
- *(Inference)* mixed Arabic/English professional vocabulary — a term like
  "تحقق" sitting next to "OTP," or a Latin product name inside an Arabic
  sentence — is a real and normal register for Saudi professional and
  technical contexts (consistent with the RTL/bidirectional-input finding
  R1-A already carried, R1-A S13), and should not be treated as a defect to
  eliminate; JID's own copy already does this naturally (e.g., "ابحثلي" as
  a coined Arabic product name, English "Plus"/"بلس" as a locked term pair
  per the Constitution).
- *(Inference)* English terminology is more likely to be accepted where it
  is a genuine technical/product term without an equally concise Arabic
  equivalent (e.g., a file format, a platform name) and more likely to
  create friction where it substitutes for an Arabic word that already
  exists and is already familiar (e.g., using "entity" instead of جهة/كيان
  in a sentence otherwise in Arabic).

This section's inference-heavy findings are the strongest argument in this
entire report for not treating R1-B as the final word on younger-Saudi
language specifically — a genuine Saudi-market user-research gap remains
here even after this pass, and should be named honestly rather than papered
over with global data relabeled as Saudi-specific.

---

## 8. PRODUCT VS EDITORIAL VS MARKETING LANGUAGE

JID cannot use one voice everywhere — this section defines the boundary
between registers so later phases don't default to whichever register
whoever writes a given screen happens to reach for.

| Register | Where it belongs on JID | Governing rule |
|---|---|---|
| **Editorial copy** | Nowhere on core product surfaces (Thmanyah's register, deliberately not JID's — Section 3) | If a sentence would work equally well in a newsletter, it does not belong in the product. |
| **Marketing copy** | Homepage, public landing sections only | Allowed to make a claim about value; every claim must still pass Article 4's data-truth doctrine — no unverifiable superlative. |
| **Brand copy** | App name, tagline, actor-facing product names (Career Record, Abhathli) | Names are allowed to be distinctive; sentences around them are not. |
| **Product copy** | Feature descriptions, section headers inside the authenticated product | States what a thing is and what it does, plainly — no persuasion register. |
| **UX microcopy** | Buttons, labels, empty states, inline hints | Shortest truthful phrase that answers the user's immediate question (Section 11 defines this per-pattern). |
| **Operational copy** | Status, notifications, staff-facing surfaces | Denser, faster, less warm by design — Section 9's Staff rules. |
| **Institutional copy** | University reporting surfaces, methodology notes | Must state coverage/basis alongside any figure — Section 12. |
| **Legal / privacy copy** | Terms, privacy policy, consent screens | Must be accurate and complete as a legal document, but the *product-facing* consent moment (Section 11) is not this register — it is UX microcopy that then links out to this register for full detail. |
| **AI-generated assistance copy** | Anywhere Abhathli/Lammah or another AI surface produces text | Its own register, defined fully in Section 13 — must always be distinguishable from human-authored product copy by its certainty markers. |

The current JID consent-flow sample (Section 15, example 7) is a case of
legal-register language leaking into a UX-microcopy moment — the two
registers are not wrong individually, they are wrong when the legal
register is used where the microcopy register belongs.

---

## 9. ACTOR-SPECIFIC FINDINGS

Consistent with R1-A's actor model (Individual, Employer, University; Staff
internal) and this brief's Part 8, refined with the terminology/register
evidence above.

**Individual:** language should name the action, the evidence behind it,
and the next decision — never a judgment. The Nafath/Taqat/Jadarat
precedent (Section 6) supports حالة (status) as the load-bearing word for
"where do I stand." Avoid: motivational language JID's own Constitution
already forbids implicitly (Article 3's anti-feed doctrine rules out
engagement-bait copy) and explicitly avoid over-explaining routine actions
— the "explain the action, not the policy, at the moment of the action"
rule from Section 6 applies here directly.

**Employer:** language should name the role, the criteria, the evidence,
and the decision — R1-A's HR-tech research (R1-A S4) already flagged
"talent intelligence"-style jargon as a pattern to avoid; the Arabic
equivalent risk is a term like ذكاء used as a badge-word rather than a
plain description of what a feature does (Section 10 formalizes this as
AVOID). منشأة (Section 6) is the correct register for the legal-entity
moment specifically (verification, workspace authorization); it is too
formal for routine day-to-day employer-facing copy once the workspace
exists.

**University:** language should center غير معروف/جزئي (unknown/partial) as
first-class, expected states, not exceptions to apologize for — directly
implementing R1-A's Article 4 data-truth doctrine (R1-A Section 12/17) in
Arabic. مخرجات (outcomes) is the correct, standard academic-Arabic term for
this concept and is currently entirely absent from JID's copy (zero hits in
`messages/ar.json`), consistent with R1-A's finding that this capability is
largely aspirational (R1-A Section 18).

**Staff:** denser, faster, unapologetically operational — Section 6's
government-platform register (short action scripts, حالة/طلب vocabulary)
is the right model here specifically, more than anywhere else in the
product, because staff users are the audience government digital services
were originally built for.

---

## 10. TERMINOLOGY FINDINGS

Beyond the individual PREFERRED/CONTEXTUAL/AVOID classifications (given in
full in the Language System document's terminology tables), this research
surfaced three **term collisions** inside JID's current vocabulary that are
worth naming explicitly, because a collision is a harder problem than a
single wrong word — it means the same Arabic root is currently doing two
different constitutional jobs, and no amount of word-swapping fixes that
without a decision about which job each word keeps.

1. **دليل / أدلة is doing two different jobs.** Per the Constitution
   (R1 Article 2/6), الدليل is the required term for the platform-owned
   **Directory** (companies/universities catalog). But JID's own sampled
   copy also uses أدلة (the plural) for **Evidence Vault** artifacts
   ("خزنة الأدلة" — "the evidence vault," literally "the vault of evidence/
   proofs," J1). These are two unrelated constitutional concepts (a public
   reference catalog vs. an individual's private proof-of-work assets)
   sharing one root word. **Recommendation carried to the Language System:**
   reserve الدليل exclusively for the Directory/Catalog concept (as the
   Constitution already requires) and standardize Evidence Vault language on
   إثبات/إثباتات (singular/plural "proof"), which JID's own copy already
   uses in places (`"kinds": {"education": ...}` under an "إثبات" key, J1) —
   this is a matter of consistent application, not new-word invention.
2. **تحقق / اعتماد / موافقة are three related but distinct actions currently
   at risk of blending.** تحقق (verify) should mean confirming an identity
   or fact is real; اعتماد (accredit/approve) should mean a formal,
   often higher-stakes authorization decision (e.g., Staff approving a
   representative's verification, or a University's own program
   accreditation); موافقة (consent) should mean a person agreeing to
   something happening with their own data or account, revocable per
   R1-A's Article 5 consent doctrine. Current copy uses all three across
   different flows (J1) without an explicit rule keeping them apart —
   Section 11/13 of the Language System makes the boundary explicit.
3. **متقدم vs. مرشح mark a real, useful distinction that should be kept, not
   collapsed.** متقدم ("applicant") is the same person seen from their own
   point of view — "my application." مرشح ("candidate") is the same person
   seen from the employer's point of view — "this candidate in my
   pipeline." Current copy already uses both (10 and 16 hits respectively,
   J1) in roughly the right places; this is a pattern to formalize and
   protect going forward, not a problem to fix.

**A fourth finding — current inconsistency, not a collision:** فرصة
(opportunity, the Constitution's required default term, R1 Article 6) and
وظيفة (job) appear at similar frequency in current copy (8 and 10
occurrences respectively, J1) including in primary nav/section labels
("لوحة الوظائف" — "jobs board" — as a title). This means the constitutional
terminology lock is **not currently being followed consistently in the live
product**, independent of any register question — a straightforward
terminology-conformance gap for a later phase to close, not a new decision
this research needs to make (the decision — فرصة as default — is already
made, per the Constitution).

---

## 11. TRUST / VERIFICATION / PRIVACY LANGUAGE

Building directly on Section 6/9's findings and R1-A's Article 5 privacy
doctrine (consent is specific, revocable, never inferred from silence):

**The core pattern this research recommends, derived from Nafath (T6) and
R1-A's own stated principle:** every disclosure-relevant moment should
answer three things in order — **who** sees **what**, **for which
purpose**, and **whether it can be undone** — before asking for a decision,
not after. This is a structural pattern, not a specific sentence; the exact
wording is a Language-System-document concern (Section 11 there), not this
report's.

**What to learn from Nafath specifically:** verification is a sequence of
short, named actions (a request arrives → matched → confirmed), with policy
explanation available but not inline. **What to reject from the current
JID sample:** the sampled consent-withdrawal copy (Section 15, example 7)
stacks a legal contingency clause into the same sentence as the action
itself ("سحب موافقتك... متى كان ذلك متاحاً دون الإخلال بمعالجة سابقة
مشروعة" — "withdraw your consent... whenever available, without prejudice to
prior lawful processing") — this is accurate as a legal statement and wrong
as a UX-microcopy moment (Section 8's register-boundary finding applied
concretely).

---

## 12. DATA / UNIVERSITY LANGUAGE

Applying R1-A's Article 4 data-truth doctrine to wording specifically, per
this brief's Part 14. The finding is not just "state coverage" (R1-A
already established that structurally) — it is **how to state it without
the UI feeling defensive**, which is a language question this report is
positioned to answer:

- Coverage should be stated as a plain fact **inside** the number's own
  sentence, not as a caveat appended after it — "بناءً على 62 من أصل 90
  خريجاً صرّحوا ببياناتهم" ("based on 62 of 90 graduates who declared their
  data") reads as one honest statement, not a number followed by an
  apology.
- Absence should be named plainly rather than hedged — "لم يُقس هذا
  المؤشر بعد" ("this indicator has not been measured yet") is more honest
  and, per R1-A's Article 4, more trustworthy than a dash, a zero, or a
  vague "قريباً" ("coming soon").
- Suppression for privacy (a sample too small to disclose without risking
  re-identification) should be named as what it is, not disguised as a
  missing value — "لا يُعرض لصغر حجم العينة" ("not shown due to small sample
  size") is a statement about a *rule being correctly applied*, and should
  read that way, not like an error.

The full KNOWN/UNKNOWN/PARTIAL/SUPPRESSED/NOT-AVAILABLE/NOT-YET-MEASURED
phrase set is defined operationally in the Language System document
(Section 15 there), since this is exactly the kind of rule that needs to be
usable by an engineer or an AI agent without interpretation, per the
brief's own quality bar.

---

## 13. AI LANGUAGE

Directly extending R1-A's AI-experience findings (R1-A Section 12/17.6) into
Arabic wording. R1-A already established the mechanism (tiered
approval by reversibility, staged confidence disclosure); this section
establishes the **vocabulary** that mechanism needs in Arabic, distinguishing
four registers that must never be visually or verbally interchangeable:

| Register | Arabic marker pattern | What it must never do |
|---|---|---|
| **Fact** (from Career Record / verified data) | Stated plainly, no hedge — e.g. "خبرتك في {X} مسجّلة منذ {تاريخ}" | Never carry a confidence qualifier — if it's a fact, it doesn't need one; if it needs one, it isn't a fact. |
| **Suggestion** (AI recommends, human decides) | Explicit "اقتراح" label or "نقترح" as the verb | Never phrased as an instruction ("افعل كذا") — always phrased as an offer the user can ignore. |
| **Inference** (AI concluded something the user didn't directly state) | "يبدو أن…" / "استنتجنا من ملفك أن…" | Never phrased as "وجدنا" (a word that implies a factual discovery) — reserve "وجدنا" for literal search/match results (e.g. Abhathli's actual found opportunities), never for a conclusion about the person. |
| **Draft** (AI-generated content awaiting human approval) | "مسودة" label (JID's own copy already uses this word correctly elsewhere, J1) | Never presented without an explicit next step for the human to review/edit/approve before it becomes real. |

**Absolute prohibition, restated in Arabic-specific terms:** no
anthropomorphic overclaim — "أنا أعرف أنّك…" ("I know that you...") is banned
outright, because JID's AI does not know things about a person beyond what
their own record states; the honest register is always "بحسب بياناتك…"
("based on your data...") or "استنتجنا…" ("we inferred..."), never a
first-person claim of independent knowledge. This is the Arabic-specific
implementation of R1-A's "AI never sounds more certain than the evidence"
principle (R1-A Section 17.6).

---

## 14. ENGLISH / BILINGUAL FINDINGS

**English must be native product English, not a rendering of the Arabic
sentence's structure.** The two locales should share *meaning* and often
share *which fact is stated*, but not necessarily sentence structure — 
Arabic's comfort with topic-fronting and omission does not map onto English
sentence rhythm, and forcing it to produces exactly the stiff,
foreign-feeling English that mirrors the stiff, translated Arabic this
whole report is trying to eliminate in the other direction.

**English clichés to flag (extending the brief's own list with the same
domain-expertise standard used to draft it, not sourced as an external
finding since this is well-established SaaS-copywriting-critique
consensus):** "Unlock your potential," "Seamless," "Empower," "Revolutionize,"
"Next-generation," "AI-powered" (as a stand-alone badge rather than a plain
description of what the AI does), "Supercharge," "Your journey starts
here" — plus JID-specific risks: "talent intelligence" (already flagged by
R1-A's HR-tech research, R1-A S4, as a phrase to avoid because it markets a
capability rather than describing it), and "smart" as a prefix applied to
a feature name without the feature actually being explainable per Article
4.

**Arabic clichés to flag (same standard — these are the exact patterns the
brief names, confirmed against this research's own findings about
translationese and over-explanation, Section 2/3):** "رحلتك نحو مستقبل
أفضل" ("your journey to a better future"), "نمكّنك من تحقيق طموحاتك" ("we
empower you to achieve your ambitions"), "بوابتك نحو الفرص" ("your gateway
to opportunities" — notably, this is close to a literal rendering of "job
board," the exact category-frame R1-A already rejected as JID's front door,
R1-A Section 16), "اكتشف إمكاناتك" ("discover your potential"), "حلول
مبتكرة" ("innovative solutions"), "تجربة سلسة" ("a seamless experience" —
the Arabic mirror of the English "Seamless" cliché above), "بكل سهولة"
("with total ease"), "نحو مستقبل مهني واعد" ("toward a promising
professional future"). Full treatment, including *why* each is weak (not
merely that it is common), is in the Language System document's dedicated
avoid-list (Section 20 there).

---

## 15. CURRENT JID COPY DIAGNOSIS

A focused sample from `messages/ar.json`/`messages/en.json` (J1/J2),
selected to span the registers in Section 8, not an exhaustive audit —
full calibration treatment (current → what's wrong → intent → better
direction → two options) for each of these is in the Language System
document's calibration set (Section 21 there). This section states the
*pattern* each example reveals.

1. **Homepage claim CTA** ("ابحث عن كيانك وقدّم مطالبة بالملف," Section 1) —
   pattern: database-operation language standing in for product-moment
   language; also directly contradicts R1-A's closed Founder Decision on
   organization onboarding (R1-A Section 3) and the Constitution's own
   banned-term list (R1 Article 6, "claim" is explicitly banned).
2. **Generic error** ("حدث خطأ غير متوقع. حاول مرة أخرى" — "an unexpected
   error occurred. try again") — pattern: states what happened to the
   *system*, not what the *user* should do differently; passes the "what
   happened" half of the brief's error rule but not the "what can I do
   now" half in any specific way — "حاول مرة أخرى" is the same generic
   instruction regardless of what failed.
3. **Vague CTA** ("ابدأ الآن" on the homepage; "متابعة" as the signup submit
   button) — pattern: exactly the vague-CTA anti-pattern the brief names —
   a truthful, specific verb ("إرسال" / "إنشاء الحساب" — noting the signup
   screen's own loading state, "جاري الإنشاء...," already knows the specific
   verb is "create," making "متابعة" on the same screen's submit button an
   inconsistency, not just a vague choice) is available and not used.
4. **Evidence Vault unavailable state** ("خزنة الأدلة غير متاحة بعد — لا
   يمكن ربط إثباتات خارجية حالياً" — "the evidence vault is not available
   yet — external proof cannot be linked currently") — pattern: this is
   actually a **good** example of R1-A's FUTURE_COMPATIBLE_NOT_FAKE_LIVE
   constraint (R1-A Section 18) already being honored in copy — it states
   plainly that the capability doesn't exist yet rather than faking an
   empty state. Worth preserving as a model, not just critiquing others.
5. **Consent withdrawal** ("سحب موافقتك على المعالجة القائمة على الموافقة
   متى كان ذلك متاحاً دون الإخلال بمعالجة سابقة مشروعة") — pattern: legal
   register used in what should be a UX-microcopy moment (Section 8/11);
   accurate as a legal statement, unusable as an in-product consent action
   label.
6. **Abhathli teaser** ("عرّف مهمتك مرة — واستقبل الفرص المطابقة تلقائياً" —
   "define your task once — and receive matching opportunities
   automatically") — pattern: this is also a **good** example — plain,
   direct, describes what the feature does without an "AI-powered" badge
   word or an overclaim about certainty. Worth preserving as a model for
   Section 13's AI-language rules.
7. **University landing fragment** ("شريحة واسعة من الخريجين... لا تعرف
   حالة طلبها لأسابيع" — "a wide segment of graduates... don't know their
   application's status for weeks") — pattern: this is pitch/marketing
   copy describing the *problem* JID solves, correctly using حالة (status)
   as identified in Section 6 as the right word — but sits in a landing/
   pitch context, so its marketing register (Section 8) is appropriate
   here specifically, unlike examples 1 and 5 which misapply a register.

**The overall diagnosis:** JID's copy is not uniformly bad. It contains
both the exact failure this phase exists to fix (examples 1, 3, 5) and
existing, already-correct models of the target register (examples 4, 6, 7)
sitting side by side in the same file. This means the fix is not "rewrite
everything from a blank page" — it is **applying the discipline already
visible in the product's own best moments consistently across the rest of
it**, which is a materially different and more tractable problem for
whichever phase eventually implements this (explicitly not R1-B, per the
brief).

---

## 16. WHAT TO LEARN FROM THAMANYAH

- Arabic composed from its own first principles, not converted from an
  English source sentence (Section 2/3).
- Confidence expressed by disciplined omission — trusting the reader/user
  to infer what a translated sentence would over-explain.
- A stated, absolute commitment that Arabic deserves a native-quality
  experience, not an adapted one — the attitude, not the specific
  editorial output, is what's transferable.
- Willingness to let a short sentence be the whole answer, where JID's own
  current copy instead often reaches for an extra explanatory clause
  (Section 15, examples 1 and 5).

## 17. WHAT NOT TO COPY FROM THAMANYAH

- Its editorial voice and personality — appropriate for a media brand,
  wrong for JID's operational/professional register (Section 8).
- Cleverness where clarity is required — an error message, a consent
  action, or a verification step is not the place for a memorable turn of
  phrase; Section 6/11's government-platform register (plain, sequential,
  named actions) is the correct model for exactly these moments, not an
  editorial one.
- Any slogan-like construction, recognizable rhythm, or sentence pattern
  that would read as derivative if a reader who knows Thmanyah's voice
  encountered it inside JID — this research deliberately did not read
  enough of Thmanyah's actual copy to be able to imitate it even
  accidentally, and the Language System document (next file) was written
  without reference to any specific Thmanyah sentence.
- Personality-heavy language on operational screens (Staff, verification,
  errors) — these are exactly the surfaces where Section 6's plainer,
  government-platform-adjacent register is correct instead.

---

## 18. SAUDI PATTERNS TO ADOPT

1. **Name the action, not the policy, at the moment of the action**
   (Nafath, Section 5/6/11) — policy explanation belongs before or after
   the action step, never inside it.
2. **حالة (status) as the load-bearing word for "where do I stand"**
   (Section 6/9) — standardize on it rather than inventing a JID-specific
   synonym.
3. **State coverage inside the number's own sentence, not as an appended
   caveat** (Section 12) — "based on X of Y," not a number followed by a
   footnote.
4. **Arabic-first as structural default, not a translated second locale**
   (Salla, Section 5) — matches and reinforces R1-A's own Arabic-first
   architecture finding (R1-A S13).
5. **Distinct, familiar vocabulary per real distinction — متقدم vs مرشح,
   طاقات vs جدارات vs قوى** (Section 6/10) — Saudi digital services already
   demonstrate that naming things precisely, rather than reusing one word
   everywhere, is itself a trust signal, not added complexity.
6. **MSA as the professional baseline, with warmth carried by word choice
   and directness, not by relaxing into colloquial register** (Section 7).
7. **Natural Arabic/English mixing where a term is genuinely technical or a
   product name** (Section 7) — not a defect to eliminate.

## 19. SAUDI PATTERNS TO REJECT

1. **Bureaucratic sentence construction, independent of vocabulary**
   (Section 6) — passive voice stacking, excessive formal address, legal
   contingency clauses inside an action moment (Section 11/15 example 5).
2. **Overexplaining routine actions** (Section 6/9) — a Nafath-style
   confirm action does not need its policy basis restated every time.
3. **The literal "gateway to opportunities" framing** (Section 14) — this
   is functionally a job-board-homepage framing in Arabic dress, and R1-A
   already rejected the job-board homepage pattern outright (R1-A Section
   16) — the language and the IA finding are the same rejection seen from
   two angles.
4. **Vague, catch-all CTAs where a specific verb is available and already
   used elsewhere on the same screen** (Section 15, example 3).
5. **Any Arabic sentence that requires its English counterpart to be
   understood** (Section 2) — the concrete, checkable version of "don't
   translate."
6. **Generic Saudi content-agency register** (Section 4) — fluent but
   generic Arabic with no specific product truth behind it is a subtler
   version of the same translationese failure, not an acceptable fallback
   when a writer is unsure what to say.

---

## 20. IMPLICATIONS FOR R1-C / D1

- **This report does not resolve the younger-Saudi-language evidence gap
  R1-A already named (R1-A Section 18, item 1).** Section 7 above narrows
  it (MSA-as-baseline is evidenced; sentence-construction-not-register is
  the likely offender for feeling "old," but only as inference) — R1-C, if
  scoped to include targeted Saudi user research, is the right place to
  close this with primary evidence rather than further desk research.
- **The three term collisions and one terminology-conformance gap (Section
  10) are concrete enough to hand directly to implementation** once a
  later phase is authorized to touch `messages/*.json` — they are not
  design decisions, they are consistency corrections against rules that
  already exist (the Constitution's own terminology lock, R1 Article 6).
- **The Language System document (next file) is written to be usable
  immediately by D1** for any screen decision that needs copy-register
  guidance — D1 should treat it as a constraint on option-generation the
  same way R1-A's Section 15/16 (patterns to adopt/reject) already
  constrains IA and interaction decisions.
- **Two current-copy examples (Section 15, examples 4 and 6) are already
  correct** and should be preserved as reference models rather than
  rewritten for their own sake once implementation begins — not everything
  in current copy needs to change equally.
- **This report and the Language System file are authority, not
  deployment** — per the brief, no `messages/*.json` file, component, or
  screen was touched to produce them; R1-C and D1 are where this authority
  gets applied.

---

*End of R1-B research report. No product code, database, messages file, or
UI was changed to produce this report. Ready for the companion Language
System document.*
