# R1-B — JID Saudi Product Language System

**Status:** Complete, operational, ready for D1/R1-C to apply.
**Not production copy.** Nothing in this document may be pasted directly
into `messages/ar.json` or `messages/en.json` without going through
whichever implementation phase is authorized to do that. The calibration
examples in Section 21 are illustrations of the rules, not approved strings.
**Built on:** `R1B_JID_SAUDI_CONTENT_LANGUAGE_RESEARCH.md` and
`R1A_JID_PRODUCT_USER_HRTECH_RESEARCH.md` (amended, commit `c755b77`). Does
not reopen anything either report already settled.

**How to read this document.** Every rule below is written to be followed
without subjective interpretation — by a writer, a designer, an engineer, or
an AI agent, independently, and still produce copy that is recognizably the
same JID. Where a rule could be read as a vague value statement, it is
paired with a BAD (too vague to act on) / USEFUL (operational) example, per
the brief's own quality bar. A rule with no BAD/USEFUL pair is already
mechanical enough to apply directly (a table, a word list, a template).

---

## 1. JID VOICE

JID's voice is **an institution a professional already trusts, speaking to
them plainly about their own situation.** It is closer to Nafath or Qiwa in
authority than to a media brand or a consumer app in personality (R1-B
research Section 2/3/6).

- BAD: "Be clear, human, and confident."
- USEFUL: *Every sentence states either a fact about the user's own
  situation, an action they can take, or a consequence of that action —
  and nothing else.* A sentence that does none of these three things (a
  slogan, an encouragement, an unattributed claim) does not belong in
  product copy.

JID's voice is not:
- an editorial brand voice (Thmanyah's register — R1-B research Section
  17) — JID does not need to be memorable, it needs to be trusted.
- a startup-casual voice — no exclamation stacking, no rhetorical
  questions as headlines, no "you got this!" register.
- a government-bureaucratic voice — familiar government *vocabulary*
  (Section 3, Section 13) is adopted; government *sentence construction*
  (passive stacking, redundant formal address) is rejected (R1-B research
  Section 6/19).

## 2. JID TONE RANGE

Tone is not fixed platform-wide — it is a **range**, selected by
consequence and register (R1-B research Section 8), not by actor mood.

| Situation | Tone | Not |
|---|---|---|
| Routine action succeeded | Plain confirmation, no celebration | Enthusiastic ("رائع!") |
| Routine action available | Neutral, direct | Encouraging/motivational |
| Consequential action pending (e.g., submitting a verification request) | Calm, procedural, names what happens next | Anxious or overly reassuring |
| Something went wrong | Matter-of-fact, action-first | Apologetic beyond one plain acknowledgment |
| A number/status is unknown or partial | Stated as a normal fact, not a defect (R1-B research Section 12) | Defensive or apologetic |
| AI is suggesting/inferring | Explicitly hedged per its register (Section 14) | As confident as a stated fact |
| Public/marketing surface | Allowed one plain claim about value | Superlative, unverifiable, or emotionally loaded |

- BAD: "Adjust tone based on context."
- USEFUL: *If the action has already happened and cannot fail further
  (e.g., a save), state it in five words or fewer with no adjective. If the
  action is about to have a consequence the user cannot easily undo, name
  the consequence in the same sentence as the action, before asking for
  confirmation.*

## 3. ARABIC REGISTER

**Modern Standard Arabic (MSA) is the default and required register for
all product surfaces**, per R1-B research Section 3/7 and the Constitution's
own word-choice discipline (R1 Article 6). Colloquial (dialectal) influence
is permitted only where it demonstrably improves naturalness without
reducing seriousness — in practice, this means: **almost never in written
UI**, and never in anything operational, legal, verification-related, or
University/Staff-facing.

- BAD: "Sound Saudi."
- USEFUL: *Write the sentence in full MSA first. Read it aloud. If it
  sounds stiff, the fix is shorter clauses and a more direct verb — never
  a dialectal word swap. A dialectal word is permitted only in a
  low-stakes, high-warmth micro-moment (e.g., a rare celebratory
  confirmation) and never in a sentence that also contains a number, a
  legal term, or an instruction.*

**Rhythm rule:** an Arabic sentence composed for JID should read as though
it was thought in Arabic, not converted from an English draft (R1-B
research Section 2). The test: if the Arabic sentence's clause order only
makes sense once you mentally reconstruct the English original, rewrite it
from the intent, not from the English string.

## 4. ACTOR-SPECIFIC LANGUAGE

One register per actor, derived from R1-B research Section 9. Never reuse
one actor's register for another's surface, even when the underlying
concept is shared (e.g., "status" language for Individual vs. Staff).

| Actor | Register | Emphasize | Avoid |
|---|---|---|---|
| Individual | Plain, direct, second-person, non-judgmental | action, evidence, حالة (status), what's next | ranking language, motivational cliché, over-explaining routine actions |
| Employer | Plain, procedural, criteria-and-evidence oriented | role, criteria, evidence, decision, process | HR/"talent intelligence" jargon (R1-A S4), ATS terms leaking to UI, inflated corporate register |
| University | Institutional but not bureaucratic; comfortable stating unknowns | مخرجات (outcomes), coverage, what is known/unknown | fake precision, ranking language, unsupported employment claims |
| Staff | Dense, operational, fast to scan | status, action, risk, audit trail | any warmth-signaling language — Staff does not need to be told the product cares about them |
| Public (unauthenticated) | Institutional trust register, one plain value claim allowed | what JID is, for whom, verifiably | job-board framing (R1-A Section 16), superlatives, "gateway to opportunities"-style cliché (R1-B research Section 14/19) |

## 5. SENTENCE LENGTH

- **Hero/marketing sentences:** 6–12 words in Arabic (already the
  Constitution's own rule, R1 Article 6) — this document does not loosen
  it, only extends it operationally.
- **UI labels:** 1–4 words.
- **Body/explanatory text (empty states, errors, privacy microcopy):** one
  sentence per idea; a second sentence is allowed only if it names a
  distinct next action, never to add nuance to the first sentence.
- **Legal-register text (Section 12):** exempt from these limits, but must
  never appear inline in a UX-microcopy moment (R1-B research Section 8) —
  it lives in the linked full policy, not the action screen.

- BAD: "Be concise."
- USEFUL: *If a sentence contains more than one comma-joined clause and is
  not legal-register text, split it. The second clause is either a separate
  sentence or does not belong on this screen.*

## 6. HEADLINE RULES

A headline states **what this screen is about**, not a value proposition,
unless the screen is public/marketing (Section 4).

- BAD: "Write engaging headlines."
- USEFUL: *A non-marketing headline must be answerable by "what am I
  looking at?" in one reading. If the honest answer to "what am I looking
  at" requires a sentence longer than the headline itself, the headline is
  wrong, not the content below it.*
- A marketing headline (homepage, public landing) may make one claim, and
  that claim must be checkable by the reader against something real on the
  page (R1-A Article 4 applied to headline copy) — never an unverifiable
  superlative ("الأفضل في المملكة").

## 7. CTA RULES

Extending the brief's own instruction directly: a CTA should normally name
the action, using a specific verb plus, where needed, a specific object.

- BAD: "متابعة" / "ابدأ الآن" / "التالي" — used as a generic default
  regardless of what the button actually does (R1-B research Section 15,
  examples 1 and 3 — this is a live JID pattern, not a hypothetical).
- USEFUL: *If the system can truthfully name the action in one to three
  words ("حفظ," "إرسال الطلب," "مراجعة البيانات," "إضافة خبرة"), use that
  name. Reserve a generic verb ("متابعة," "التالي") only for a genuinely
  multi-step wizard where no single action name would be accurate for the
  step boundary itself — and even then, prefer naming what happens next
  ("مراجعة البيانات" for the step that reviews data) over a content-free
  verb.*
- Do not lengthen every button into a sentence — a specific one-to-three-word
  verb phrase is the target, not a fully descriptive clause.

## 8. FORM RULES

Directly implementing R1-B research's onboarding findings (R1-A S17;
R1-B Section 5's Nafath/Tamara procedural-brevity pattern) as Arabic
copy rules:

- A field label states the fact requested, not an instruction to provide it
  — "الاسم الكامل" not "يرجى إدخال اسمك الكامل."
- A field's helper text, if present, states *why* only when the reason is
  not obvious from the label — never restate the label in slightly longer
  words.
- **Staged over front-loaded**, in wording as well as structure: a
  multi-step flow (e.g., the Founder-decided org-onboarding sequence —
  account → email verification → org details → representative verification
  → reconciliation → workspace, per R1-A Section 3) should name each stage
  as its own short step ("تفاصيل المنشأة" as one step's title, not folded
  into a longer combined-step title) — this is a copy-level consequence of
  R1-A's own staged-onboarding finding (R1-A Section 15/17.3), not a new
  decision.
- Required-field marking states itself once at the form level, not per
  field, unless a field's required status is context-dependent.

## 9. EMPTY STATE RULES

Must answer, in this order, per the brief: **what is this? why is it
empty? what can I do?**

- BAD (generic template): "لا توجد بيانات." (states only that it's empty —
  answers none of the three questions fully.)
- USEFUL pattern: *[what this is, if not obvious from the screen title] +
  [why it's empty, stated as a fact not an apology] + [the one action
  available, if any, as a specific CTA per Section 7].* Example shape:
  "لا توجد طلبات بعد. الطلبات التي تقدّم لها ستظهر هنا." ("No applications
  yet. Applications you apply to will appear here.") — states what
  ("applications"), why (none exist yet — implicit, correctly, since "yet"
  already answers it), and sets expectation without inventing a CTA where
  none is needed (the user already knows how they'd create one).
- If the empty state is a genuinely not-yet-built capability (R1-A's
  FUTURE_COMPATIBLE_NOT_FAKE_LIVE constraint, R1-A Section 18), state that
  plainly rather than using the routine "nothing here yet" pattern — JID's
  own current copy already does this correctly for Evidence Vault ("خزنة
  الأدلة غير متاحة بعد," R1-B research Section 15 example 4) — that
  sentence shape (states non-availability as a fact, not an empty-content
  template) is the model to reuse for every other not-yet-live capability,
  not a one-off.

## 10. ERROR RULES

Must answer: **what happened? what can I do now?** — per the brief, and
per this research's own finding that JID's current generic error only
answers the first half generically (R1-B research Section 15, example 2).

- BAD: "حدث خطأ غير متوقع. حاول مرة أخرى." used identically regardless of
  what failed.
- USEFUL: *Name the failed action specifically wherever the system knows
  it ("تعذّر حفظ التغييرات" — "couldn't save your changes" — not "an error
  occurred"), and make the recovery action specific to that failure
  (retry, go back, contact support) rather than a single generic "حاول مرة
  أخرى" reused everywhere.* Reserve a fully generic error only for the
  true catch-all case (an unhandled exception with no specific cause to
  name) — and even then, "حاول مرة أخرى" should be the literal retry
  action, not a placeholder for "we don't know what to tell you."
- Never surface a raw technical error string (a stack trace, an HTTP
  status, a database error) in user-facing copy — this is already implicit
  in JID's engineering conventions and restated here as a language rule:
  every error the user sees must be authored, not passed through.

## 11. STATUS RULES

Extends Section 6's حالة (status) finding into a concrete pattern, and
covers notifications (a status change communicated proactively) under the
same rule set, since a notification is functionally a status update
delivered outside the screen the user would otherwise check it on.

- Status is always named as a specific state from a fixed, known set (e.g.,
  "مسودة / قيد التقديم / مُرسل / قيد المراجعة" — JID's own
  `applicationStatus` set, already a good model, R1-B research Section
  15) — never a vague "قيد المعالجة" ("processing") when a more specific
  state is known.
- A status label is never itself the whole message — it is paired,
  wherever the state has a next action or expected timing, with what
  happens next ("قيد المراجعة — سنُعلمك عند اكتمال المراجعة" — "under
  review — we'll notify you once the review is complete" — this exact
  pairing already exists correctly in JID's staff-claim-review copy,
  R1-B research J1, and should be the model applied consistently
  elsewhere).
- **Notifications follow the same rule, purpose-typed, per the Nafath/
  Absher precedent (R1-A S5; R1-B research Section 6):** a notification
  about a status change states the new status and, where relevant, the one
  action available — never a generic "you have an update" with the detail
  only available after opening it.

## 12. PRIVACY / CONSENT RULES

Implements R1-A's Article 5 consent doctrine and R1-B research Section 11's
"who sees what, for which purpose, whether it can be undone" structure as
concrete copy rules.

- Every consent-relevant moment states, in this order, before asking for a
  decision: **who** gains access, **to what**, **for what purpose**, and
  **whether/how it can be revoked**. A toggle or checkbox with only a
  generic label ("مشاركة البيانات") and no visible answer to these four
  questions is incomplete, regardless of how complete the linked full
  privacy policy is.
- The in-product consent *action* (a toggle, a button, a confirmation) is
  UX microcopy (Section 8's register table) — short, plain, procedural.
  The full legal basis, retention detail, and processing justification
  belong in the linked privacy policy (legal-register copy), never inline
  in the action moment. JID's current consent-withdrawal copy violates this
  by stacking a legal contingency clause into the action sentence itself
  (R1-B research Section 15, example 5; Section 11) — the fix is not
  deleting the legal content, it is relocating it to where legal-register
  copy belongs.
- Revocability is stated as a fact wherever it is true, not implied —
  "يمكنك سحب هذا الإذن لاحقاً من الإعدادات" ("you can withdraw this
  permission later from settings") is a complete, checkable statement; "قد
  تتمكن من التغيير لاحقاً" ("you may be able to change this later") is not.

## 13. VERIFICATION LANGUAGE

Directly modeled on the Nafath/Taqat/Jadarat/Qiwa pattern (R1-B research
Section 5/6) and disambiguating the تحقق/اعتماد/موافقة triad (R1-B research
Section 10):

| Word | Reserved meaning | Never use for |
|---|---|---|
| تحقق (verify) | Confirming an identity or a stated fact is real | A discretionary approval decision, or a user's data-sharing consent |
| اعتماد (accredit/approve) | A formal, often higher-stakes authorization decision (e.g., Staff approving a representative, a University's program accreditation) | Routine identity confirmation, or a user consenting to something about their own account |
| موافقة (consent) | A person agreeing to something happening with their own data/account, always revocable per Article 5 | An institutional approval decision that isn't the user's own consent |

- A verification flow is written as a **sequence of named actions**
  (request → match/confirm → result), per the Nafath model, not as a
  paragraph explaining the verification policy before the action.
- Rejection states the specific reason and the specific next step
  ("سبب الرفض" + "المستندات المطلوبة" — JID's own current copy already
  does this correctly, R1-B research J1 — this is a model to preserve, not
  rewrite).
- **The organization-onboarding sequence's language must never use
  مطالبة/claim vocabulary anywhere** — this is not a style choice, it
  implements R1-A's closed Founder Decision and the Constitution's banned-
  term list (R1 Article 6) directly. The replacement vocabulary for each
  stage: حساب (account) → تحقق من البريد الإلكتروني (email verification) →
  بيانات المنشأة (organization details, using منشأة per Section 3's finding
  for the legal-entity moment specifically) → تحقق من الممثل (representative
  verification) → مطابقة داخلية / مراجعة داخلية (internal reconciliation) →
  مساحة عمل معتمدة (authorized workspace).

## 14. AI LANGUAGE

Restates R1-B research Section 13's four-register table as a direct rule
set, extending R1-A's "assistive, explainable, human-authorized" doctrine
(R1-A Section 12/17.6) into required Arabic markers:

| Register | Required marker | Forbidden |
|---|---|---|
| Fact | No hedge; stated plainly | Any confidence qualifier |
| Suggestion | "اقتراح" label / "نقترح" verb | Instructive imperative phrasing |
| Inference | "يبدو أن…" / "استنتجنا من ملفك أن…" | "وجدنا" (reserve for literal search/match results only) |
| Draft | "مسودة" label + explicit review/approve step | Presenting as final without a review step |

- **Banned outright, in Arabic or English:** any first-person claim of
  independent knowledge about the user beyond their own record ("أنا أعرف
  أنّك…" / "I know you're…") — the honest register is always "بحسب
  بياناتك…" ("based on your data...").
- Every AI-authored string must be visually and lexically distinguishable
  from human-authored product copy — the register markers above are not
  optional flavor text, they are the mechanism (paired with R1-A's
  action-approval tiering, R1-A Section 17.6) that keeps AI output from
  reading as more certain than the evidence behind it.
- Feature names (Abhathli/ابحثلي, Lammah/لمّة) may be distinctive as
  *names* (Section 1's brand-copy allowance) — the sentences around them
  describing what they do must stay in the plain register above, per the
  already-correct model in JID's own current Abhathli teaser copy (R1-B
  research Section 15, example 6).

## 15. UNIVERSITY DATA LANGUAGE

Implements R1-A's Article 4 doctrine and R1-B research Section 12's
coverage-language finding as a fixed phrase system:

| State | Arabic pattern | English pattern |
|---|---|---|
| KNOWN | State the figure plainly with its basis in the same sentence: "بناءً على {n} من أصل {total} خريجاً صرّحوا ببياناتهم، {finding}" | "Based on {n} of {total} graduates who declared their data, {finding}." |
| UNKNOWN | "غير معروف حالياً" | "Not currently known." |
| PARTIAL | Fold into the KNOWN pattern — coverage stated inline, never a separate "partial" label | Same — state the fraction, don't label it "partial" separately |
| SUPPRESSED (privacy floor) | "لا يُعرض لصغر حجم العينة" | "Not shown — sample size too small to display." |
| NOT AVAILABLE (no source exists) | Card/stat does not render (R1-A Article 4) — if context requires stating why: "لا تتوفر بيانات لهذا المؤشر بعد" | "No data available for this indicator yet." |
| NOT YET MEASURED (mechanism doesn't exist) | "لم يُقس هذا المؤشر بعد" | "This indicator has not been measured yet." |

- Never render a percentage without its coverage basis in the same
  sentence or immediately adjacent, drillable element (R1-A Article 4).
- مخرجات (outcomes) is the standard, correct term for this whole concept —
  use it once JID's own graduate-outcomes capability is live; do not
  introduce it as marketing language before the underlying measurement
  exists (this is the FUTURE_COMPATIBLE_NOT_FAKE_LIVE constraint applied to
  this specific term, R1-A Section 18).

## 16. EMPLOYER DECISION LANGUAGE

- Name the **role**, the **criteria**, the **evidence**, and the
  **decision** explicitly as distinct things on any hiring-evidence or
  comparison surface — never collapse "criteria" and "evidence" into one
  undifferentiated block of candidate text.
- متقدم (applicant) is used only from the individual's own point of view
  (their application status); مرشح (candidate) is used only from the
  employer's point of view (their pipeline/comparison view) — same person,
  different word by whose screen it is (R1-B research Section 10) — never
  mix the two within one employer-facing surface.
- Never label a feature "ذكاء" (intelligence) or an English "AI-powered" /
  "talent intelligence" badge as a standalone marketing claim (R1-A S4;
  R1-B research Section 14) — describe plainly what the feature does
  instead ("مطابقة المرشحين حسب معايير الدور" — "matching candidates
  against role criteria" — not "ذكاء التوظيف").
- Any evaluative language (rubric scores, fit assessments) must always be
  drillable to what was actually measured and by whom (R1-A Article 4) —
  never a bare adjective or score with no attached explanation.

## 17. INDIVIDUAL CAREER LANGUAGE

- Career Record language states facts about the person's own record in
  first/second person, never in evaluative third-person ("أنت أضفت خبرة
  جديدة" not "تم رصد نشاط جديد في السجل").
- "What's missing to reach X" framing uses جاهزية (readiness) rather than a
  score or percentage unless a genuine measurement exists behind it (R1-A
  Article 4) — جاهزية can be stated qualitatively ("أضف شهادة لإكمال هذا
  القسم" — "add a certificate to complete this section") without implying
  a hidden numeric ranking.
- مهارة (skill) is the standard term for the skill registry — avoid كفاءة
  (competency/efficiency — ambiguous, and risks reading as an
  unmeasured-score claim, R1-B research Section 10).
- CV Builder language always states that a generated CV is a snapshot,
  never implies it stays live/synced with the profile (R1-A Article 3's
  pure-renderer rule) — e.g., "نسخة بتاريخ {date}" ("a version as of
  {date}") stated on every generated CV, not just in help text.

## 18. BILINGUAL TRANSCREATION

- Arabic and English share **meaning and the specific fact stated**, not
  sentence structure (R1-B research Section 14). Translate the intent, not
  the sentence.
- Both locales carry equal depth — never a shorter or simplified English
  (or Arabic) version of the same screen (R1-A S13's equal-depth finding,
  restated here as a copy rule, not just an IA rule).
- English avoids the SaaS-cliché register listed in Section 20 with the
  same discipline Arabic avoids its own cliché register — a bilingual
  screen that swaps one language's clichés for the other's has not solved
  the problem.
- Where a term is genuinely bidirectional and locked (e.g., بلس/Plus per
  the Constitution's terminology lock, R1 Article 6), keep both forms
  exactly as locked — transcreation does not override an existing
  terminology lock, it works within it.
- Mixed-script terms (an English product/technical term inside an Arabic
  sentence) are acceptable where the term is genuinely technical or has no
  concise Arabic equivalent (R1-B research Section 7) — not acceptable as
  a substitute for an Arabic word that already exists and is already
  familiar (Section 19's AVOID table names specific cases).

## 19. TERMINOLOGY DICTIONARY

Classifications per the brief: PREFERRED / CONTEXTUAL / INTERNAL_ONLY /
AVOID / BANNED_IN_USER_FACING_CONTEXT. Grounded in R1-B research Section 10
and sampled current copy (J1/J2).

### PREFERRED

| Term (AR / EN) | Use for | Why |
|---|---|---|
| فرصة / Opportunity | Default term for a job/opportunity listing | Constitutional lock (R1 Article 6); currently under-followed in live copy (R1-B research Section 10) — reassert as default. |
| ملف تعريفي / Profile | Owned organizational or individual identity | Constitutional lock (R1 Article 6). |
| تحقق / Verification | Confirming identity or a stated fact | Matches the most familiar Saudi government-service vocabulary (Nafath, R1-B research Section 6/13). |
| حالة / Status | "Where do I stand" on anything submitted | Load-bearing word across Taqat/Jadarat/Qiwa; matches the Individual JTBD directly (R1-A Section 5). |
| إثبات / إثباتات / Evidence (singular usage) | A specific piece of evidence-vault content | Resolves the دليل/إثبات collision (R1-B research Section 10) — reserve الدليل for Directory only. |
| جامعة / University | The University actor | Unambiguous. |
| متقدم / Applicant | A person viewing their own application | Distinct, correct perspective word (R1-B research Section 10). |
| مرشح / Candidate | A person as seen from the employer's pipeline view | Distinct, correct perspective word — do not merge with متقدم. |
| مهارة / Skill | Career Record skill registry | Plain, unambiguous; avoid كفاءة. |
| مخرجات / Outcomes | University graduate-outcomes concept, once live | Standard academic Arabic; do not use before the capability exists (Section 15). |
| مساحة عمل معتمدة / Authorized workspace | The end state of org onboarding | Matches R1-A's Founder-decided sequence exactly. |
| مسودة / Draft | AI-generated or unsaved content awaiting approval | Already correctly used in current copy — extend, don't replace. |

### CONTEXTUAL

| Term | Appropriate context | Wrong context |
|---|---|---|
| جهة | Generic reference to "a party/organization" in neutral, registry-adjacent contexts | As the default friendly label for "the employer you represent" in a warm onboarding moment — reads bureaucratic there |
| منشأة | The legal, registered employer entity specifically (verification/workspace-authorization moment, matching Qiwa's own usage) | Routine day-to-day employer-facing copy once the workspace already exists — too formal there |
| مؤسسة | Institutional-scale organizations (a University, a large institutional employer) | A small SME employer — implies a scale that may not fit |
| شركة | Plain reference to a company, once the actor/context is already established | As the platform-wide default label for the Employer actor — JID's employers are not all "شركات" (could be a public-sector body, a non-profit, an SME) |
| وظيفة | A specific, formal job instance where "فرصة" would be ambiguous (e.g., a government-job-application context, matching Jadarat's own usage) | As the platform's default term for an opportunity listing — the Constitution already locks فرصة as default (R1 Article 6) |
| سجل | "Career Record" as a proper noun component | Standing alone as a generic word for any data list — ambiguous with سجل تجاري (commercial registration) in an organizational context |
| اعتماد | A formal, higher-stakes approval decision (Staff approving a representative; institutional accreditation) | Routine identity confirmation (use تحقق) or personal data consent (use موافقة) |
| طلب | Any submitted request/application, always with a qualifier naming its type | Bare, unqualified "طلبك" on a multi-request-type surface — always name which طلب |
| تقييم | Internal Staff/Employer evaluation processes (rubric scoring) | Surfaced to an Individual as an unexplained rating of themselves — must always be paired with what was measured, by whom (Article 4) |
| ذكاء | A plain technical descriptor, internal engineering/architecture discussion only | Any user-facing feature badge or marketing claim ("ذكاء التوظيف," "AI-powered") — see BANNED-adjacent AVOID entry below |

### INTERNAL_ONLY

| Term | Why it stays internal |
|---|---|
| كيان / entity | Valid internal technical abstraction for a Directory row (R1 Article 2) — never a public actor label; a person or organization is never told "your entity," they are told what they specifically are (their profile, their workspace, their account) |
| entity_state / claim_status / claimed_by (schema-level terms, any language) | Internal database/RLS vocabulary; must never leak into any user-facing string in either locale |
| النطاقات المعتمدة / approved domains (Staff-context term for email-domain matching) | Operationally precise for Staff, meaningless (and slightly alarming) if surfaced to a public user without the Staff workflow context |

### AVOID

| Term | Why | Prefer instead |
|---|---|---|
| كفاءة for "skill" | Ambiguous between competency and efficiency; risks reading as an asserted, unmeasured score | مهارة |
| "ذكاء اصطناعي"/"AI-powered" as a standalone badge | Markets the technology rather than describing the outcome (R1-A S4) | Describe the outcome plainly (Section 14/16) |
| "talent intelligence" (EN) | Category jargon flagged directly by R1-A's HR-tech research (R1-A S4) as a phrase to avoid | Name the specific capability |
| Generic catch-all CTA verbs ("متابعة," "التالي," "ابدأ الآن") where a specific verb is available and used elsewhere on the same screen | Vague-CTA anti-pattern (Section 7; a live JID example, R1-B research Section 15 example 3) | The specific action verb |
| English "entity" as a public actor label | Same INTERNAL_ONLY reasoning as كيان, mirrored in English | The specific actor name, or "organization" in truly generic contexts |
| "دليل"/"أدلة" for Evidence Vault content | Collides with the constitutionally-locked meaning of الدليل as Directory (R1-B research Section 10) | إثبات / إثباتات |

### BANNED_IN_USER_FACING_CONTEXT

| Term | Status |
|---|---|
| مطالبة (claim, noun) / استلم / claim (verb, org-ownership sense) | Banned outright per R1 Article 6 and R1-A's closed Founder Decision (R1-A Section 3). Note: استلمنا in the *different* sense of "we received your message" (a contact-form acknowledgment) is a distinct, acceptable usage of the same root — the ban is on the *claim-an-organization* sense specifically, not the word root in every sense (R1-B research J1 already distinguishes these two uses correctly in current copy). |
| "استلم ملفك" / "claim your profile" | Banned outright, explicitly named in the Constitution (R1 Article 6). |
| Any "search for your organization" / "find your entity" framing | Banned as a product moment, not just a phrase — implements R1-A's closed Founder Decision on org onboarding (R1-A Section 3). |
| "الأفضل في المملكة!" and any unverifiable superlative with exclamation | Banned per the Constitution's word-choice discipline (R1 Article 6). |
| "أنا أعرف أنّك…" / "I know you're…" (AI first-person knowledge claim) | Banned per Section 14's AI-language rule. |

## 20. WORDS / PATTERNS TO AVOID

Extending R1-B research Section 14, with the reasoning the brief requires —
not banned merely because AI tools often produce them, but because each
pattern specifically fails one of this system's own rules.

**Arabic:**

| Pattern | Why it's weak |
|---|---|
| "رحلتك نحو مستقبل أفضل" | Vague future-promise with no checkable claim (violates Section 6's headline rule and Article 4's data-truth doctrine — nothing in the sentence is verifiable). |
| "نمكّنك من تحقيق طموحاتك" | Motivational-cliché register JID's non-marketing surfaces never use (Section 2); on a marketing surface, still fails the "one checkable claim" rule (Section 6). |
| "بوابتك نحو الفرص" | Functionally restates the job-board framing R1-A already rejected as JID's front door (R1-A Section 16) — the phrase and the rejected IA pattern are the same problem in two forms. |
| "اكتشف إمكاناتك" | Implies an evaluative claim about the user's potential with no measurement behind it — an Article 4 violation dressed as inspiration. |
| "حلول مبتكرة" | Says nothing checkable about what the product does; the generic-Saudi-content-agency register this research explicitly flagged as weak (R1-B research Section 4/19). |
| "تجربة سلسة" | Claims a quality of the experience instead of demonstrating it — if the experience is actually smooth, the copy doesn't need to assert it. |
| "بكل سهولة" | Same failure as "تجربة سلسة" — an unearned, unverifiable ease-claim. |
| "نحو مستقبل مهني واعد" | Same future-promise vagueness as the first entry — no specific claim, no specific action. |

**English:**

| Pattern | Why it's weak |
|---|---|
| "Unlock your potential" | Same evaluative-claim-with-no-measurement problem as its Arabic mirror above. |
| "Seamless" | Asserts a quality instead of demonstrating it. |
| "Empower" | Vague verb standing in for a specific action the copy should just name. |
| "Revolutionize" | Unverifiable superlative register — the Constitution already bans this register in Arabic (R1 Article 6); apply the same discipline in English. |
| "Next-generation" | Says nothing about what the product actually does. |
| "AI-powered" (as a standalone badge) | Markets the mechanism instead of the outcome (Section 14/16, R1-A S4). |
| "Supercharge" | Same as "Empower" — a vague-intensity verb with no specific referent. |
| "Your journey starts here" | Same future-promise vagueness as "رحلتك نحو مستقبل أفضل" — its literal mirror. |

## 21. BEFORE / BETTER CALIBRATION EXAMPLES

27 examples, sampled from real current JID copy (`messages/ar.json` /
`messages/en.json`, marked **[LIVE]**) or built as illustrative
constructions clearly marked **[ILLUSTRATIVE]** where current copy doesn't
yet cover a needed category. These are calibration material, not
production-approved strings — implementation belongs to a later phase.

---

**1. Public — Homepage claim CTA [LIVE]**
CURRENT: "باحث عن عمل؟ أنشئ حسابك. تمثّل جهة توظيف؟ ابحث عن كيانك وقدّم
مطالبة بالملف."
WHAT IS WRONG: Database-operation language (find a row, claim it) standing
in for a product moment; uses the constitutionally banned مطالبة/كيان
pairing; contradicts R1-A's closed Founder Decision.
INTENT: Tell a representative what happens next if they're here on behalf
of an organization.
BETTER DIRECTION: Name the actual first step (creating a verified account),
not a search-and-claim action.
OPTION A: "تبحث عن عمل؟ أنشئ حسابك. تمثّل جهة توظيف؟ ابدأ بإنشاء حساب
موثّق لمنشأتك."
OPTION B: "للأفراد: أنشئ حسابك. للمنشآت: تحقق من بريدك الإلكتروني الرسمي
لبدء إنشاء مساحة عمل."

**2. Public — Homepage vague CTA [LIVE]**
CURRENT: "ابدأ الآن" (paired with subtitle "منصتك للتوظيف والإرشاد المهني")
WHAT IS WRONG: Generic verb; doesn't tell the visitor what starting
actually does (create an account? browse? something else?).
INTENT: Move a first-time visitor into the flow that matches their
situation.
BETTER DIRECTION: Either split into two situation-specific CTAs (individual
vs. organization, per Section 4's actor split) or name the specific first
action.
OPTION A: Two buttons — "أنشئ حسابك" / "أنشئ مساحة عمل لمنشأتك"
OPTION B: "تصفّح الفرص" (if the true first action is browsing, name that
specifically instead of a content-free "start")

**3. Individual — Signup submit CTA [LIVE]**
CURRENT: "متابعة" (while the same screen's loading state already says
"جاري الإنشاء..." — "creating...")
WHAT IS WRONG: The screen already knows the specific verb is "create" (its
own loading state proves it) but the button doesn't use it — an internal
inconsistency, not just vagueness.
INTENT: Submit the signup form and create the account.
BETTER DIRECTION: Match the button label to the verb the screen already
uses elsewhere.
OPTION A: "إنشاء الحساب"
OPTION B: "إنشاء حسابي"

**4. Individual — Evidence Vault unavailable state [LIVE — model to preserve]**
CURRENT: "خزنة الأدلة غير متاحة بعد — لا يمكن ربط إثباتات خارجية حالياً."
WHAT IS WRONG: Nothing structurally — flagged here as a **positive**
example. The one refinement: "أدلة" collides with the Directory's
constitutional دليل (Section 19's AVOID entry).
INTENT: Tell the user honestly that this capability doesn't exist yet,
without faking an empty state.
BETTER DIRECTION: Keep the sentence shape; resolve the word collision.
OPTION A: "خزنة الإثباتات غير متاحة بعد — لا يمكن ربط إثباتات خارجية
حالياً."
OPTION B: (unchanged structure, same fix) "لم تُفعَّل خزنة الإثباتات بعد."

**5. Individual — Notification preferences subtitle [LIVE]**
CURRENT: "تحكّم في قنوات استلام التحديثات لكل نوع حدث."
WHAT IS WRONG: Slightly abstract ("قنوات... لكل نوع حدث" reads as a system
description rather than a plain statement of what the user is controlling).
INTENT: Tell the user they can choose how they're notified, per type of
update.
BETTER DIRECTION: State the control directly, in the user's terms.
OPTION A: "اختر كيف تصلك التحديثات، حسب نوع كل تحديث."
OPTION B: "لكل نوع تحديث، اختر القناة التي تريد أن يصلك عبرها."

**6. Individual — Application status labels [LIVE — model to preserve]**
CURRENT: draft/saved/pending/submitted set — "مسودة / محفوظ / قيد التقديم
/ مُرسل"
WHAT IS WRONG: Nothing — flagged as a positive model: a fixed, specific
state set, exactly per Section 11's rule.
INTENT: N/A — preserve as-is.
BETTER DIRECTION: Extend this exact pattern (fixed, specific, named states)
to every other status surface in the product rather than introducing new
patterns per surface.
OPTION A: (no change)
OPTION B: (no change)

**7. Individual — Abhathli teaser [LIVE — model to preserve]**
CURRENT: "عرّف مهمتك مرة — واستقبل الفرص المطابقة تلقائياً."
WHAT IS WRONG: Nothing — flagged as a positive AI-language model: plain,
specific, no overclaim, no "ذكاء اصطناعي" badge.
INTENT: N/A — preserve as-is.
BETTER DIRECTION: Use as the reference sentence shape for all future
AI-feature descriptions (Section 14/16).
OPTION A: (no change)
OPTION B: (no change)

**8. Individual — CV export, snapshot honesty [ILLUSTRATIVE]**
CURRENT: (no equivalent sampled in current copy)
WHAT IS WRONG: N/A — this is a gap, not a current defect: nothing in
sampled copy currently states a generated CV's snapshot nature explicitly
on the CV itself.
INTENT: Prevent a user from mistaking a downloaded CV for a live,
auto-updating view of their profile (R1-A Article 3's pure-renderer rule).
BETTER DIRECTION: State the snapshot date plainly wherever a CV is
generated or downloaded.
OPTION A: "نسخة بتاريخ {التاريخ} — لا تتحدث تلقائياً مع ملفك."
OPTION B: "أُنشئت هذه النسخة في {التاريخ}. لتحديثها، أنشئ نسخة جديدة."

**9. Employer — Entity data label (Staff-facing edit screen) [LIVE]**
CURRENT: "بيانات الكيان" (as a Staff-facing section title)
WHAT IS WRONG: Nothing, in its correct Staff/internal context — كيان is
appropriately INTERNAL_ONLY here (Section 19), not a public-facing defect.
Flagged only to confirm the boundary: this label must never appear on any
organization-facing (non-Staff) screen.
INTENT: Label a Directory record's data for Staff review.
BETTER DIRECTION: Keep as-is for Staff; ensure it never migrates to an
organization-facing screen.
OPTION A: (no change, Staff context)
OPTION B: N/A

**10. Employer — Sourcing/boost toggle copy [LIVE]**
CURRENT: "...دون التأثير على ترتيب ابحثلي." (part of a longer sentence
about a "featured" job placement)
WHAT IS WRONG: Buried inside a longer sentence; the important fact (boosted
placement doesn't affect Abhathli's matching order) is stated as an
afterthought rather than the headline of the disclosure.
INTENT: Reassure that paid visibility doesn't distort the matching
algorithm — directly relevant to R1-A's "no pay-to-win visibility" rule
(R1-A amendment, Section 14).
BETTER DIRECTION: State the no-distortion fact as its own clear sentence,
not a trailing clause.
OPTION A: "هذا التمييز لا يغيّر ترتيب الفرص في ابحثلي."
OPTION B: "التمييز يزيد ظهور الوظيفة فقط — لا يؤثر على مطابقة ابحثلي."

**11. Employer — Verification-flow representative language [ILLUSTRATIVE]**
CURRENT: N/A in this exact form — constructed from R1-A's Founder-decided
sequence.
WHAT IS WRONG: N/A — new language for a sequence that isn't yet fully
implemented.
INTENT: Name the "representative verification" stage plainly.
BETTER DIRECTION: Use منشأة (Section 3/13) for the legal-entity moment
specifically, تحقق for the identity-confirmation action.
OPTION A: "تحقق من هويتك كممثل لـ {اسم المنشأة}."
OPTION B: "أكّد أنك مخوّل بتمثيل {اسم المنشأة}."

**12. University — Profile suspended message [LIVE]**
CURRENT: "الملف التعريفي موقوف" (title only, sampled)
WHAT IS WRONG: Cannot fully evaluate from title alone — flagged because a
suspension state is exactly the kind of moment Section 10 (error rules)
requires "what happened, what can I do now" — worth verifying the full
message (not sampled here) meets both halves, not just names the state.
INTENT: Tell a University admin their profile is suspended and what to do.
BETTER DIRECTION: Ensure the full message states the reason category (where
disclosable) and the concrete next step (contact Staff, appeal, etc.), not
only the state name.
OPTION A: "الملف التعريفي موقوف. تواصل مع الدعم لمعرفة السبب والخطوات
التالية."
OPTION B: "تم إيقاف الملف التعريفي مؤقتاً. راجع بريدك الإلكتروني للتفاصيل
والخطوات التالية."

**13. University — Graduate outcomes (future capability) [ILLUSTRATIVE —
FUTURE_COMPATIBLE_NOT_FAKE_LIVE]**
CURRENT: N/A — مخرجات has zero occurrences in current copy (R1-B research
Section 9/10); this capability is not yet live.
WHAT IS WRONG: N/A.
INTENT: Show how a coverage-honest outcomes statement should read once
this capability ships — for calibration only, must not be implemented
before the underlying measurement exists.
BETTER DIRECTION: Apply Section 15's KNOWN pattern exactly.
OPTION A: "بناءً على 62 من أصل 90 خريجاً صرّحوا ببياناتهم، معظمهم التحقوا
بفرص خلال ستة أشهر."
OPTION B: "من أصل 90 خريجاً، صرّح 62 ببيانات ما بعد التخرج. لا تتوفر
بيانات عن الباقين."

**14. Verification — Submission confirmation [LIVE — model to preserve]**
CURRENT: "تم إرسال طلب التوثيق"
WHAT IS WRONG: Nothing — clear, specific, uses طلب correctly qualified
("طلب التوثيق," not a bare "طلبك").
INTENT: N/A — preserve.
BETTER DIRECTION: Reuse this exact qualified-طلب pattern everywhere a
request type needs naming (Section 19's طلب CONTEXTUAL entry).
OPTION A: (no change)
OPTION B: (no change)

**15. Verification — Rejection detail [LIVE — model to preserve]**
CURRENT: "تم رفض طلب التوثيق" + "سبب الرفض" + "المستندات المطلوبة"
WHAT IS WRONG: Nothing — already states the outcome, the reason, and the
concrete next step, exactly per Section 10's error-rule pattern.
INTENT: N/A — preserve.
BETTER DIRECTION: Use as the reference model for every other
rejection/decline surface in the product (e.g., hiring-decision
communication to candidates, if/when that surface is designed).
OPTION A: (no change)
OPTION B: (no change)

**16. Staff — Command palette placeholder [LIVE]**
CURRENT: "ابحث عن المستخدمين، الكيانات، أو المطالبات…"
WHAT IS WRONG: كيانات is correctly INTERNAL_ONLY here (Staff context, fine)
— but المطالبات (claims) is the exact banned term appearing in a live
Staff-facing string, confirming R1-A's finding that the claim system is
still architecturally live (R1-A Section 10.1), now with direct copy
evidence.
INTENT: Let Staff search across the entities/requests they manage.
BETTER DIRECTION: Once the claim system is replaced per R1-A's Founder
Decision, replace المطالبات with the verification-queue equivalent term.
OPTION A: "ابحث عن المستخدمين، الكيانات، أو طلبات التحقق…"
OPTION B: (post-migration) "ابحث عن المستخدمين، الكيانات، أو المساحات
المعتمدة…"

**17. Staff — Dashboard claims card [LIVE]**
CURRENT: "مراجعة طلبات ملكية الشركات والجامعات" (claims-card description)
WHAT IS WRONG: "ملكية" (ownership) reinforces the claim-model's "ownership"
framing R1-A's Founder Decision has already moved away from — this is a
conceptual leak, not just a word choice (R1-B research Section 10's
term-collision logic applies to concepts too, not only single words).
INTENT: Let Staff review pending organization verification/reconciliation
requests.
BETTER DIRECTION: Reframe around verification/reconciliation, not
ownership.
OPTION A: "مراجعة طلبات التحقق من الشركات والجامعات"
OPTION B: "مراجعة طلبات تحقق الممثلين للمنشآت والجامعات"

**18. Errors — Generic unexpected error [LIVE]**
CURRENT: "حدث خطأ غير متوقع. حاول مرة أخرى."
WHAT IS WRONG: Answers "what happened" only generically; "حاول مرة أخرى"
is reused identically regardless of what failed (Section 10).
INTENT: Tell the user something failed and what to do.
BETTER DIRECTION: Reserve this exact string for the true unhandled-
exception catch-all only; every named failure should use a specific
variant per Section 10.
OPTION A (true catch-all, kept as-is): (no change — this is the correct
fallback, not every case)
OPTION B (specific failure, e.g. a save): "تعذّر حفظ التغييرات. حاول مرة
أخرى، أو تواصل مع الدعم إذا تكررت المشكلة."

**19. Errors — Portal loading failure [LIVE]**
CURRENT: "تعذّر تحميل صفحة بوابة الموظفين." + "إعادة المحاولة"
WHAT IS WRONG: Nothing structurally — names the specific failed action
(loading this page) rather than a generic error; a reasonably good model,
flagged to confirm the pattern is already partially right in this corner
of the product.
INTENT: N/A — mostly preserve.
BETTER DIRECTION: Confirm this specific-failure pattern (not the fully
generic one in example 18) is the one applied by default across the
product, not the exception.
OPTION A: (no change)
OPTION B: (no change)

**20. Errors — Forbidden [LIVE]**
CURRENT: "ليس لديك صلاحية للوصول إلى هذه الصفحة"
WHAT IS WRONG: States what happened but not what the user can do now (no
next step — go back, request access, contact an admin).
INTENT: Tell the user why they can't see this page and what to do.
BETTER DIRECTION: Add the missing second half per Section 10's rule.
OPTION A: "ليس لديك صلاحية للوصول إلى هذه الصفحة. عد إلى لوحتك الرئيسية."
OPTION B: "هذه الصفحة تتطلب صلاحية غير متوفرة لحسابك. تواصل مع مدير حسابك
إذا كنت تحتاج الوصول."

**21. Empty states — Search no results [LIVE]**
CURRENT: "لا توجد نتائج"
WHAT IS WRONG: Answers only "what" (no results), not "what can I do" —
acceptable for a search box specifically (the action is implicitly "try a
different search"), but worth confirming it's only used where that implicit
action is genuinely obvious.
INTENT: Tell the user a search returned nothing.
BETTER DIRECTION: Keep as-is for live search-as-you-type contexts (implicit
action is clear); add an explicit suggestion only where the empty state is
a landing/destination page, not a live search box.
OPTION A (live search, unchanged): (no change)
OPTION B (destination-page empty state): "لا توجد نتائج لهذا البحث. جرّب
كلمات مختلفة أو أزل بعض الفلاتر."

**22. Empty states — Assigned claims/queue empty [LIVE]**
CURRENT: "لا توجد مطالبات مُسندة إليك" (Staff queue empty state, sampled
in context)
WHAT IS WRONG: Correctly Staff-register (dense, no warmth needed, per
Section 4); flagged only for the same المطالبات term-migration note as
example 16 — once the claim system changes, this label changes with it.
INTENT: N/A structurally — preserve the register, update the term when the
underlying system changes.
BETTER DIRECTION: Post-migration equivalent.
OPTION A: (pre-migration, no change) "لا توجد مطالبات مُسندة إليك"
OPTION B: (post-migration) "لا توجد طلبات تحقق مُسندة إليك"

**23. AI — Lammah teaser bilingual pair [LIVE]**
CURRENT (AR): "لمّة" as feature name; (EN): "Lammah — Plus-exclusive
external opportunities"
WHAT IS WRONG: The English side states the commercial gate ("Plus-
exclusive") as the headline fact rather than what the feature does — a
minor register mismatch with Section 18's bilingual-meaning-parity rule if
the Arabic side leads with function instead (worth checking at
implementation, not resolvable from this sample alone).
INTENT: Introduce the external-opportunities feed feature and its tier
gate.
BETTER DIRECTION: Lead both locales with what the feature does; state the
tier gate as a second, equally clear fact, not the headline.
OPTION A (EN): "Lammah — external opportunities matched to your profile
(Plus)"
OPTION B (EN): "External job listings, matched automatically. Included
with Plus."

**24. AI — Hypothetical overclaim risk [ILLUSTRATIVE — anti-pattern to
avoid, not current copy]**
CURRENT: N/A — constructed to demonstrate Section 14's rule.
WHAT IS WRONG (if this were shipped): "ذكاء جِد الاصطناعي يعرف أفضل الفرص
لك" ("JID's AI knows the best opportunities for you") — banned
first-person-knowledge-claim register (Section 14, Section 19's BANNED
table) plus an unmeasured superlative ("أفضل").
INTENT: Show what NOT to write when describing Abhathli/Lammah.
BETTER DIRECTION: The already-correct model is example 7 (Abhathli
teaser) — reuse that shape instead.
OPTION A: N/A (do not ship the CURRENT text)
OPTION B: N/A

**25. Privacy — Consent withdrawal [LIVE]**
CURRENT: "سحب موافقتك على المعالجة القائمة على الموافقة متى كان ذلك
متاحاً دون الإخلال بمعالجة سابقة مشروعة."
WHAT IS WRONG: Legal-register clause stacking used in what should be a
UX-microcopy consent action (Section 8/12) — accurate as law, unusable as
an action label.
INTENT: Let a user withdraw consent for consent-based processing.
BETTER DIRECTION: Split — a short action label/button in microcopy
register, with the full legal statement linked, not inline.
OPTION A (action label): "سحب الموافقة" (button) + linked note: "لمزيد من
التفاصيل القانونية، راجع سياسة الخصوصية."
OPTION B (short inline statement): "يمكنك سحب موافقتك في أي وقت. هذا لا
يؤثر على المعالجة التي تمت قبل السحب."

**26. Privacy — Terms acceptance banner [LIVE]**
CURRENT: "استخدام جِد بعد تاريخ سريان السياسة المحدّثة يُعد قبولاً للشروط
المعدّلة، ما لم يتطلب النظام موافقة صريحة لأنشطة معالجة محددة."
WHAT IS WRONG: Same legal-register-in-a-microcopy-moment issue as example
25 — a single sentence carrying two legal contingencies.
INTENT: Notify the user of updated terms and what continuing to use JID
means.
BETTER DIRECTION: State the plain fact in the banner; move the contingency
detail to the linked policy page.
OPTION A: "حدّثنا سياساتنا. استمرارك في استخدام جِد يعني موافقتك على
الشروط الجديدة."
OPTION B: "راجعنا شروط الاستخدام. اطّلع على التغييرات قبل المتابعة."

**27. Public — University landing pitch fragment [LIVE — model to
preserve in its register]**
CURRENT: "شريحة واسعة من الخريجين... لا تعرف حالة طلبها لأسابيع"
WHAT IS WRONG: Nothing in register (this is correctly marketing/pitch
copy naming the problem JID solves, per Section 4's Public register
allowance) — flagged only to confirm حالة is being used correctly here
(Section 6/19), and that this sentence's register should not migrate into
an actual in-product status screen (which needs Section 11's fixed-state
pattern instead, not pitch language).
INTENT: N/A — preserve in its landing-page context.
BETTER DIRECTION: Keep as marketing copy; do not reuse this sentence shape
inside the authenticated product's own status surfaces.
OPTION A: (no change, in its current context)
OPTION B: N/A

---

*End of the R1-B Language System. This document establishes authority; it
does not deploy it. No `messages/ar.json`, `messages/en.json`, component,
route, or design decision was changed to produce it.*
