# جِد | JID — خطة التشغيل والتنفيذ المستقلة
## الإصدار 2 — نموذج Codex السريع

**التاريخ:** 2026-07-18
**الهدف النهائي:** الوصول إلى نسخة جِد قابلة للتجربة الفعلية مع الأصدقاء والعائلة، تعمل من البداية إلى النهاية، وليست مجرد شاشات أو مزايا غير مؤكدة.

---

# 1. القرار التشغيلي الجديد

من الآن فصاعدًا:

- **Codex هو المنفذ البرمجي الرئيسي.**
- **ChatGPT / نبراس هو غرفة القيادة والمراجع النهائي.**
- **GitHub هو مصدر الحقيقة والتسليم بين جميع الأطراف.**
- **Supabase وVercel هما بيئتا التشغيل والتحقق.**
- **Claude مراجع استثنائي فقط للتغييرات عالية الخطورة.**
- **Cursor أداة احتياطية أو محرر اختياري، وليس حلقة إلزامية.**
- **المؤسس لا ينقل تقارير بين الوكلاء ولا يكتب Prompts جديدة لكل خطوة.**

مسار العمل القياسي:

```text
خطة موحدة
→ حزمة مهمة واضحة
→ تنفيذ Codex
→ Commit / Pull Request على GitHub
→ تحقق ChatGPT المباشر
→ تحقق non-production
→ إغلاق المهمة
→ المهمة التالية تلقائيًا
```

لا توجد دورة:

```text
Cursor → المؤسس → Claude → المؤسس → ChatGPT → المؤسس
```

---

# 2. تعريف النجاح النهائي

تُعتبر المنصة جاهزة للتجربة فقط عندما يستطيع مستخدم غير تقني تنفيذ الرحلات الأساسية دون تدخل من الفريق.

## 2.1 الفرد

يستطيع:

1. إنشاء حساب وتسجيل الدخول واستعادة الحساب.
2. إكمال Onboarding عربي أو إنجليزي.
3. إنشاء ملفه المهني وتعديله.
4. إدارة التعليم والخبرة والمهارات والشهادات.
5. التحكم بخصوصيته وإظهار البيانات المسموح بها فقط.
6. البحث عن الشركات والفرص.
7. عرض ملف شركة أو فرصة حقيقية.
8. التقديم أو الإفصاح عن التقديم وفق رحلة جِد المعتمدة.
9. متابعة حالة الطلب أو الفرصة.
10. إجراء Screening Interview عندما تكون مطلوبة.
11. استلام الرسائل والتنبيهات ذات الصلة.
12. استخدام CV Builder من بياناته الحقيقية.
13. استخدام المزايا الذكية التي تُعتمد للنسخة التجريبية دون بيانات وهمية.

## 2.2 الشركة

تستطيع:

1. إنشاء حساب شركة.
2. اجتياز رحلة التحقق.
3. إنشاء ملفها التعريفي بعد التحقق.
4. الظهور في الكتالوج دون خلط الكتالوج بالملف التعريفي.
5. إنشاء وإدارة الفرص.
6. استعراض المتقدمين المصرح لهم.
7. الفرز وإدارة المراحل.
8. إرسال أو تشغيل الردود التلقائية المعتمدة.
9. تشغيل Screening Interview.
10. إدارة الرسائل والقوالب والتنبيهات.
11. رؤية بيانات فعلية فقط.
12. الوصول إلى الباقة أو الاستحقاقات المسموح بها.

## 2.3 الجامعة

تستطيع:

1. إنشاء حساب جامعة.
2. اجتياز التحقق المؤسسي.
3. إنشاء ملف الجامعة.
4. إدارة بياناتها المصرح بها.
5. الاطلاع على مخرجات الخريجين المسموح بمشاركتها.
6. استخدام التقارير المؤسسية المعتمدة والمتاحة فعليًا.
7. عدم الوصول إلى أي بيانات فردية دون موافقة صريحة.

## 2.4 الموظفون والإدارة

يستطيعون:

1. مراجعة طلبات التحقق.
2. اعتماد أو رفض الحالات من خلال صلاحيات موثقة.
3. إدارة البيانات المرجعية والكتالوج.
4. مراجعة البلاغات والاقتراحات.
5. إدارة Mentors عند الحاجة.
6. تنفيذ العمليات الحساسة مع سجل تدقيق.
7. عدم رؤية الميزانية أو الدخل إلا للمالك.
8. عدم السماح لأي مستخدم بتغيير دوره الوظيفي ذاتيًا.
9. عدم جعل موافقات Admin أو CEO خاضعة لموافقة شخص آخر.

## 2.5 المنصة

يجب أن تكون:

- عربية أولًا مع تكافؤ إنجليزي كامل.
- صالحة للجوال وسطح المكتب.
- خالية من الشاشات الوهمية والأرقام المصطنعة.
- محمية بـRLS ومسارات قراءة server-side.
- قابلة للنشر على non-production برابط عام.
- مزودة بحسابات اختبار واضحة.
- فيها حالات Loading وEmpty وError وForbidden صحيحة.
- قابلة للاسترجاع أو التراجع قبل أي كتابة إنتاجية.
- لا تعرض مزايا غير جاهزة؛ تُخفى بدل أن تظهر مكسورة.

---

# 3. من يقوم بماذا

## 3.1 المؤسس — Saad

دوره ليس إدارة التنفيذ اليومي.

يتدخل فقط في:

1. قرار منتج جديد غير محسوم في الدستور.
2. الموافقة على حزمة كتابة إنتاجية.
3. ربط حساب أو إدخال Secret لا يستطيع الوكيل إدخاله.
4. قرارات الدفع أو الاشتراكات أو DNS والدومين.
5. قبول النسخة النهائية قبل تجربة الأصدقاء والعائلة.
6. تحديد الأولوية عندما يوجد تعارض تجاري حقيقي.

لا يقوم بـ:

- نسخ ردود بين الأدوات.
- مراجعة كل Commit.
- صياغة Prompts تقنية.
- تحديد الاختبارات.
- متابعة المهام الصغيرة.
- اتخاذ قرار في مسألة حسمها الدستور أو الكود.

---

## 3.2 ChatGPT / نبراس — غرفة القيادة

هو المدير التنفيذي للعمل البرمجي والتشغيلي.

مسؤول عن:

1. حفظ الرؤية والدستور والنطاق الرسمي.
2. تحويل الخطة إلى حزم تنفيذ مرقمة.
3. تحديد مالك كل مهمة ومدخلاتها ومخرجاتها.
4. قراءة GitHub والتحقق من Commits وPRs مباشرة.
5. قراءة Supabase وVercel مباشرة عندما تكون الموصلات متاحة.
6. مقارنة التنفيذ بمعايير القبول.
7. إغلاق المهمة أو إعلان سبب المنع بدقة.
8. إصدار المهمة التالية تلقائيًا.
9. منع إعادة فتح عمل مغلق دون دليل Regression.
10. تحديث لوحة تقدم موحدة.
11. تجميع طلبات الإنتاج في حزمة موافقة واحدة.
12. إعداد تقرير Friends & Family النهائي.

ChatGPT لا ينفذ تغييرات عشوائية في الإنتاج، ولا يطلب من المؤسس نقل تقرير كامل من أداة إلى أخرى.

---

## 3.3 Codex — المنفذ الرئيسي

هو المهندس الرئيسي للمشروع.

مسؤول عن:

1. فحص الكود قبل التعديل.
2. تنفيذ ميزات الواجهة والخلفية.
3. تعديل Supabase migrations والـRLS والوظائف.
4. كتابة الاختبارات وتشغيلها.
5. إصلاح TypeScript وLint وBuild.
6. تحديث i18n بالعربية والإنجليزية.
7. العمل على فروع معزولة أو Worktrees.
8. إنشاء Commits وPull Requests.
9. تشغيل Supabase non-production migrations بعد السماح العام بذلك.
10. نشر Preview على Vercel non-production.
11. توثيق الأدلة داخل المهمة أو PR.
12. التوقف بعد محاولتي إصلاح فاشلتين وإعلان Root Cause.

Codex يستطيع العمل باستقلالية كاملة على:

- الكود.
- الاختبارات.
- GitHub branches وPRs.
- Supabase non-production.
- Vercel preview.
- بيانات الاختبار.
- توثيق التنفيذ.

ولا يكتب في production إلا داخل **حزمة موافقة إنتاجية محددة مسبقًا**.

---

## 3.4 Claude — المراجع الاستثنائي

Claude ليس مرحلة إلزامية.

يُستخدم فقط في:

1. Migration إنتاجية كبيرة أو غير قابلة للعكس بسهولة.
2. مراجعة RLS أو صلاحيات عالية الخطورة.
3. تحليل تعارض معماري يحتاج رأيًا مستقلًا.
4. Postmortem لفشل معقد لم يحله Codex بعد محاولتين.
5. مراجعة نهائية اختيارية قبل إطلاق عام، وليس قبل كل مهمة.

لا يراجع:

- تعديلات UI عادية.
- Copy أو i18n.
- إصلاحات صغيرة.
- كل Commit من Codex.
- المهام التي اجتازت الاختبارات والتحقق المباشر.

GitHub هو الوسيط بين Claude وباقي النظام، وليس المؤسس.

---

## 3.5 Cursor — احتياطي فقط

يُستخدم في حال:

- تعطل Codex.
- الحاجة إلى تحرير يدوي سريع محلي.
- مهمة محدودة يفضل المؤسس تنفيذها داخل Cursor.
- مقارنة نتائج Codex بأداة أخرى.

لا يكون جزءًا من المسار القياسي، ولا يحتاج كل عمل Codex إلى إعادة تنفيذه أو مراجعته في Cursor.

---

## 3.6 GitHub — المصدر الوحيد للحقيقة

يحتوي على:

- الكود.
- الدستور.
- `AGENTS.md`.
- Master Plan.
- Feature Ledger.
- Task Board.
- Commits وPRs.
- تقارير الاختبار.
- قرارات الإغلاق.
- Release manifests.

لا يُعتبر رد أي وكيل دليلًا ما لم يظهر في GitHub أو يُتحقق منه مباشرة في البيئة.

---

## 3.7 Supabase

### Non-production

يسمح للوكلاء بشكل مستقل بـ:

- تطبيق migrations المعتمدة ضمن المهمة.
- إنشاء وتحديث بيانات الاختبار.
- اختبار RLS.
- اختبار Auth.
- تشغيل acceptance tests.
- تنظيف fixtures الخاصة بالمهمة.

### Production

يسمح بـ:

- الفحص read-only دون موافقة متكررة.
- الكتابة فقط بعد موافقة المؤسس على Release Bundle واضح.
- لا تُطلب موافقة جديدة لكل SQL داخل الحزمة إذا لم يتغير نطاقها.

---

## 3.8 Vercel

### `jid-dev`

- نشر Preview تلقائي أو شبه تلقائي.
- اختبار البناء والروابط.
- ربطه ببيئة Supabase non-production.
- استخدامه لاختبارات Friends & Family.

### `jid-platform`

- مرتبط بـ`main`.
- لا نشر إنتاجي إلا بعد Gate نهائي وموافقة المؤسس.
- لا خلط بين متغيرات production وnon-production.

---

## 3.9 ChatGPT Project

يُستخدم كمكتبة استراتيجية طويلة الأجل، ويحتوي على:

- الدستور.
- قرارات المنتج.
- Master Plan.
- ملخصات الإصدارات.
- Feature Ledger النهائي.
- تقارير الإغلاق.

لا يكون هو المكان الوحيد للأدلة البرمجية؛ الأدلة الحية تبقى في GitHub والبيئات.

---

# 4. نموذج الاستقلالية والصلاحيات

## 4.1 أعمال ينفذها النظام دون الرجوع للمؤسس

- فحص الكود.
- إنشاء الفروع.
- تنفيذ الكود.
- كتابة الاختبارات.
- تشغيل Type Check وLint وBuild.
- تحديث النصوص والترجمات.
- إصلاح bugs في non-production.
- تطبيق migrations على non-production.
- إنشاء test fixtures.
- نشر Preview.
- إجراء مراجعات read-only للإنتاج.
- فتح PR.
- إغلاق مهمة اجتازت معايير القبول.
- بدء المهمة التالية حسب ترتيب الخطة.

## 4.2 أعمال تتطلب موافقة واحدة مجمعة

- تطبيق مجموعة migrations على production.
- نشر Release Candidate إلى production.
- تغيير إعداد Auth إنتاجي.
- تعديل سياسات أمان إنتاجية.
- حذف أو تحويل بيانات إنتاجية.
- تفعيل خدمة مدفوعة.
- تعديل DNS أو الدومين.

الموافقة تكون على **حزمة كاملة**، وليس على كل أمر منفصل.

## 4.3 أعمال ممنوعة دون استثناء

- لمس production خارج الحزمة المعتمدة.
- تخزين Secrets في Git.
- إنشاء أرقام أو مؤشرات وهمية.
- إعادة Claim Existing Profile.
- إعادة Commitment Score.
- إنشاء Feed أو Likes أو Comments.
- خلط Directory بالProfile.
- عرض بيانات خاصة ثم إخفاؤها في الواجهة.
- ترقية dependencies دون مبرر وقبول.
- إعادة فتح مهمة مغلقة لمجرد الشك.

---

# 5. شكل حزمة المهمة

كل مهمة يجب أن تحتوي على:

```text
Task ID
الهدف
السبب التجاري
مصادر الحقيقة
النطاق
خارج النطاق
الملفات المتوقعة
البيئة
الصلاحيات
الاختبارات
معايير القبول
أدلة التسليم
شرط التوقف
مالك التنفيذ
مالك التحقق
```

نهاية المهمة تكون واحدة فقط:

```text
CODE_COMPLETE
VERIFIED_COMPLETE
BLOCKED_WITH_EXACT_CAUSE
```

لا توجد حالة "تقريبًا منتهية".

---

# 6. قواعد منع الـEndless Loop

1. **مالك تنفيذ واحد:** Codex افتراضيًا.
2. **مراجع واحد:** ChatGPT افتراضيًا.
3. **لا مراجعة للمراجعة:** Claude لا يراجع إلا عند Trigger محدد.
4. **محاولتان فقط:** بعد محاولتي إصلاح فاشلتين تتوقف المهمة وتُرفع Root Cause.
5. **لا توسيع للنطاق:** أي اكتشاف جديد يُسجل كمهمة مستقلة.
6. **لا إعادة فتح مغلق:** إلا بدليل Regression قابل للتكرار.
7. **لا طلبات صغيرة منفصلة:** تُجمع الإصلاحات المتقاربة في Work Package.
8. **لا نسخ تقارير:** يكفي Task ID أو Commit SHA.
9. **لا انتظار غير ضروري:** Codex يبدأ المهمة التالية غير المتعارضة تلقائيًا.
10. **لا توقف عند أسئلة قابلة للحسم:** الدستور والكود ومصادر الحقيقة تحسمها.
11. **القرار البشري فقط عند التعارض الحقيقي:** لا يُرفع للمؤسس سؤال تقني روتيني.
12. **تعريف الإنجاز قبل التنفيذ:** الاختبارات ومعايير القبول تُكتب أولًا.

---

# 7. آلية السرعة والتوازي

نعمل بثلاثة مسارات متوازية فقط عندما لا تتشارك نفس الجداول أو الملفات الحساسة.

## المسار A — تجربة الفرد

- Auth وOnboarding.
- Individual Profile.
- Privacy.
- CV Builder.
- Search وOpportunities.
- Applications.
- Mentorship.

## المسار B — تجربة الشركة

- Business Auth وVerification.
- Business Profile.
- Company Catalog.
- Opportunity Creation.
- Applicants Pipeline.
- Screening Interview.
- Smart Communication.
- Auto Replies.

## المسار C — المؤسسات والتشغيل

- University.
- Staff/Admin.
- Billing/Entitlements.
- Notifications.
- Security.
- Observability.
- Release infrastructure.

القواعد:

- حد العمل المفتوح: 3 حزم رئيسية فقط.
- لا يعمل وكيلان على نفس migration sequence في الوقت نفسه.
- تغييرات i18n المشتركة تُدمج عبر مالك واحد.
- قاعدة البيانات لها Queue واحدة.
- UI المتباعد يمكن تنفيذه بالتوازي.
- PRs صغيرة بما يكفي للمراجعة، وكبيرة بما يكفي لإغلاق رحلة كاملة.

---

# 8. الحالة المعتمدة حاليًا

مغلقة:

```text
✅ University Lookup
✅ RLS repository/non-production reconciliation
✅ Mentors Reconciliation production
✅ Closure Smoke Test
✅ Production Security Closure
✅ READY FOR UI PHASE
```

لا يُعاد فتح أي منها إلا بوجود Regression مباشر.

---

# 9. برنامج التنفيذ الكامل

## المرحلة 0 — تأسيس غرفة القيادة

**المالك:** ChatGPT + Codex
**الهدف:** جعل المستودع نفسه يدير العمل.

المخرجات:

- `AGENTS.md`.
- Codex operating model.
- Master Plan داخل المستودع.
- Feature Ledger.
- Task Board.
- Environment Map.
- Release Gate Template.
- قواعد التسمية والحالات.
- قائمة مصادر الحقيقة.
- ربط non-production workflows.

**معيار الإغلاق:** يستطيع Codex بدء أي مهمة جديدة من Task ID واحد دون Prompt جديد طويل.

---

## المرحلة 1 — JID-000: جرد الحقيقة الكامل

**المالك:** Codex
**المراجع:** ChatGPT
**لا تعديل سلوكي أو قواعد بيانات.**

يجرد:

- كل Route.
- كل Page.
- كل API/Action.
- كل جدول ومهاجرة.
- كل Edge Function.
- كل ميزة معلنة.
- كل Placeholder.
- كل Feature Flag.
- كل Test.
- كل حساب تجريبي.
- كل اعتماد على بيانات غير موجودة.
- كل مسار مكسور.
- كل عنصر UI غير قابل للنقر.
- كل رابط ميت.
- كل تناقض مع الدستور.

تصنيف كل ميزة:

```text
VERIFIED_WORKING
PRESENT_UNTESTED
BROKEN
PLACEHOLDER
HIDDEN
DEFERRED
FORBIDDEN
MISSING
```

النطاق يشمل، دون حصر:

- الشركات والكتالوج.
- البحث.
- الفرص.
- Screening Interview.
- Smart Communication.
- الردود التلقائية.
- لمّاح.
- ابحثلي.
- SSIS.
- CV Builder.
- Mentors.
- University.
- Billing.
- Admin.
- Notifications.
- Verification.
- Profiles.
- Applications.
- Analytics.
- Privacy.
- RLS.
- Mobile and bilingual behavior.

**معيار الإغلاق:** لا توجد ميزة في جِد بلا حالة ودليل ومالك وخطوة تالية.

---

## المرحلة 2 — الأساسيات الحرجة

تشمل:

- Auth بجميع الأدوار.
- Signup وLogin وLogout وPassword Reset.
- Middleware وRoute Guards.
- Role integrity.
- Verification workflows.
- Profile creation after verification.
- Session consistency.
- Environment variables.
- Seed accounts.
- Error boundaries.
- Audit logging.
- Privacy read paths.
- RLS gaps المكتشفة.
- منع self-role changes.
- صلاحيات Admin وCEO.
- حجب الميزانية والدخل.

**معيار الإغلاق:** جميع الحسابات التجريبية تدخل إلى بواباتها الصحيحة ولا توجد فجوات صلاحيات حرجة.

---

## المرحلة 3 — الرحلة الأساسية للفرد

تشمل:

- Core Identity.
- Career Record.
- Education.
- Experience.
- Skills.
- Certifications.
- Evidence Vault ضمن الدستور.
- Career Timeline.
- Career Canvas.
- Governance and visibility.
- Public/recruiter projections.
- CV Builder.
- Search.
- Saved items إذا كانت معتمدة.
- Applications and declarations.
- Notifications.
- Empty/loading/error states.

**معيار الإغلاق:** مستخدم جديد يكمل الرحلة دون تدخل ويظهر فقط ما سمح به.

---

## المرحلة 4 — الشركات والكتالوج

تشمل:

- Company Directory.
- Directory detail.
- Business verification.
- Business Profile creation.
- Profile editor.
- Public business profile.
- Correction suggestion queue.
- Company search and filters.
- عدم وجود Claim flow.
- Jobs/opportunities anchoring to owned profile.
- Company team permissions.

**معيار الإغلاق:** الشركة تظهر كسجل كتالوج مستقل، وتنشئ ملفًا تشغيليًا منفصلًا بعد التحقق.

---

## المرحلة 5 — الفرص والتوظيف

تشمل:

- Opportunity creation.
- Draft/publish/close.
- Normal/Plus entitlements.
- Opportunity search.
- Opportunity details.
- Application/declaration flow.
- Applicant list.
- Pipeline stages.
- Shortlisting.
- Screening Interview.
- Scheduling where applicable.
- Decisions.
- Candidate communication.
- Privacy and zero-document doctrine.
- Auditability.

**معيار الإغلاق:** شركة تنشر فرصة، فرد يتفاعل معها، الشركة تدير الحالة حتى القرار النهائي.

---

## المرحلة 6 — التواصل الذكي والمزايا الفارقة

تشمل:

- Employer auto replies.
- القوالب.
- الرسائل الموقّتة أو المشروطة.
- Notifications.
- Smart Communication.
- لمّاح.
- ابحثلي.
- SSIS.
- Recommendations.
- Entitlements.
- Usage limits.
- Background jobs.
- Cron/queues.
- Disclosure and explainability.

أي ميزة بلا مصدر بيانات حقيقي:

- تُستكمل.
- أو تُخفى.
- ولا تعرض Placeholder أو نسبة وهمية.

**معيار الإغلاق:** كل ميزة ذكية المعتمدة تعمل من Input حقيقي إلى Output قابل للتحقق.

---

## المرحلة 7 — الجامعة والتقارير المؤسسية

تشمل:

- University signup.
- Verification.
- University Profile.
- Graduate relationship declarations.
- Consent.
- Outcomes tracking.
- Skills-demand insights.
- Institutional reports.
- Aggregation privacy thresholds.
- No University Directory in new UI.
- No mandatory university-email verification workflow.
- Export/report permissions.

**معيار الإغلاق:** الجامعة ترى فقط بيانات مسموحة ومجمعة، وتستطيع استخدام تقرير مؤسسي فعلي.

---

## المرحلة 8 — Mentors والخدمات المساندة

Mentors backend مغلق أمنيًا؛ هذه المرحلة تركز على:

- UI journey.
- Application.
- Staff review.
- Public mentor discovery.
- Profile.
- Request.
- Workshop.
- Scheduling.
- Notifications.
- Accepted/rejected visibility.
- Mobile behavior.
- No feed mechanics.
- Regression tests للمهاجرات 124–126.

**معيار الإغلاق:** رحلة mentor/mentee كاملة وقابلة للاستخدام دون خرق الخصوصية.

---

## المرحلة 9 — الإدارة والفوترة والتشغيل

تشمل:

- Staff portal.
- Admin portal.
- Super-admin behavior إذا كان معتمدًا.
- Verification queues.
- Role approvals.
- Catalog management.
- Reports.
- Audit logs.
- Billing.
- Plans.
- Entitlements.
- Upgrade gates.
- Internal settings.
- Budget/income owner-only.
- No approval above founder/CEO.
- Operational notifications.

**معيار الإغلاق:** التشغيل اليومي ممكن دون SQL يدوي أو تغيير أدوار ذاتي.

---

## المرحلة 10 — الجودة والأمن

تشمل:

- Type Check.
- Lint.
- Build.
- Unit tests.
- Integration tests.
- E2E tests.
- RLS matrix.
- Auth matrix.
- Accessibility.
- RTL/LTR.
- Mobile.
- Performance.
- Broken links.
- Dead buttons.
- Real-data doctrine.
- Security Definer review.
- Search path.
- Grants.
- Storage policies.
- Error logging.
- Backup/restore confirmation.
- Rollback package.

**معيار الإغلاق:** لا توجد ثغرة حرجة أو رحلة أساسية مكسورة أو عنصر واجهة ميت ظاهر للمستخدم.

---

## المرحلة 11 — Friends & Family Release Candidate

تشمل:

- تثبيت النطاق.
- إخفاء Deferred features.
- Seed آمن.
- حسابات اختبار.
- دليل تجربة قصير.
- رابط `jid-dev`.
- Feedback collection.
- Monitoring.
- Support path.
- Release notes.
- Known limitations.
- Go/no-go checklist.

**معيار الإغلاق:**

```text
FRIENDS_AND_FAMILY_READY
```

---

# 10. مصفوفة الاختبار

## كل Commit

- Focused tests.
- Type check.
- Diff check.

## كل PR

- Lint.
- Build.
- Unit/integration relevant tests.
- i18n parity.
- Constitution check.

## كل Work Package

- E2E journey.
- RLS/permissions where relevant.
- Preview deployment.
- Mobile and Arabic check.

## كل Release Candidate

- Full acceptance suite.
- Production-read-only preflight.
- Backup/PITR confirmation.
- Rollback plan.
- Founder approval bundle.
- Post-deployment smoke test.

---

# 11. الموافقة الإنتاجية المجمعة

بدل أن يُطلب من المؤسس الموافقة عشر مرات:

1. يجمع ChatGPT كل التغييرات الجاهزة.
2. يصدر Release Bundle واحدًا يحتوي على:
   - Commits.
   - Migrations.
   - Environment changes.
   - Risk.
   - Backup status.
   - Rollback.
   - Acceptance tests.
3. يوافق المؤسس مرة واحدة.
4. Codex أو المشغل المعتمد ينفذ كامل الحزمة.
5. ChatGPT يتحقق مباشرة.
6. يتم الإغلاق أو التراجع وفق الخطة.

أي اختلاف مادي عن الحزمة يلغي الموافقة ويتطلب قرارًا جديدًا.

---

# 12. لوحة الحالة المختصرة

يُعرض للمؤسس فقط:

```text
المرحلة الحالية
عدد الحزم المغلقة
عدد الحزم الجارية
العوائق التي تحتاج قرارًا بشريًا
المخاطر
رابط Preview
حالة الجاهزية
```

لا تُعرض عليه سجلات طويلة أو تقارير وكلاء إلا عند طلبها.

---

# 13. أول تنفيذ بعد هذه الخطة

الخطوة التالية هي:

```text
JID-000 — Repository and Runtime Truth Audit
```

التنفيذ بواسطة Codex.

الأمر المختصر:

```text
Execute JID-000 from the JID command center.
Audit only.
Read AGENTS.md and the constitution first.
Do not modify databases or production.
Create the complete Feature Ledger and prioritized Task Board.
Return CODE_COMPLETE or BLOCKED_WITH_EXACT_CAUSE.
```

بعد انتهائه، لا ينسخ المؤسس التقرير.

يكتب فقط:

```text
Codex finished JID-000
```

ثم يقوم ChatGPT بـ:

1. قراءة Commit مباشرة.
2. التحقق من الملفات.
3. اعتماد أو رفض الجرد.
4. إنشاء حزم المراحل 2–11.
5. بدء أول ثلاث حزم غير متعارضة بالتوازي.

---

# 14. النتيجة المقصودة من نموذج العمل

دور المؤسس يتحول من:

```text
ناقل رسائل
+ كاتب Prompts
+ مراجع تقني
+ منسق وكلاء
+ متابع اختبارات
```

إلى:

```text
مالك المنتج
+ صاحب القرارات الكبرى
+ صاحب الموافقة الإنتاجية
```

ودور النظام يصبح:

```text
يخطط
→ ينفذ
→ يختبر
→ يتحقق
→ يغلق
→ ينتقل
```

حتى الوصول إلى:

```text
FRIENDS_AND_FAMILY_READY
```
