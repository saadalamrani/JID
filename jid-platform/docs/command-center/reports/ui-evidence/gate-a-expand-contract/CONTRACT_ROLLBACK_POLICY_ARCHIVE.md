# Gate A CONTRACT — archived pre-CONTRACT policy/grant definitions

Source: canonical `e876060` migration history.
Purpose: make non-production rollback executable.
This is **not** a downgrade migration and must not be applied as product history.

## profiles_select_public

From `028_profile_rls_policies.sql`:

```sql
CREATE POLICY profiles_select_public
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND profile_state = 'active'
    AND visibility = 'public'
  );
```

## profiles_select_verified_hr_discoverable

From `028_profile_rls_policies.sql`:

```sql
CREATE POLICY profiles_select_verified_hr_discoverable
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND profile_state = 'active'
    AND visibility = 'discoverable'
    AND show_profile_to_companies = true
    AND public.viewer_has_approved_company_claim()
  );
```

## profiles_select_university_stats

From `028_profile_rls_policies.sql`:

```sql
CREATE POLICY profiles_select_university_stats
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND profile_state = 'active'
    AND show_profile_in_university_stats = true
    AND visibility IN ('discoverable', 'public')
    AND public.viewer_approved_university_id() IS NOT NULL
  );
```

## profile_skills_public_read

From `123_harden_risky_tables_rls.sql`:

```sql
CREATE POLICY profile_skills_public_read ON public.profile_skills
  FOR SELECT TO anon, authenticated USING (true);
```

## mentor_profiles_select_public

Final form from `124_reconcile_mentor_domain.sql`:

```sql
CREATE POLICY mentor_profiles_select_public ON public.mentor_profiles FOR SELECT TO anon, authenticated
  USING (status = 'approved' OR user_id = auth.uid() OR public.is_mentorship_staff());
```

## mentor_reviews_select_public

Final form from `124_reconcile_mentor_domain.sql`:

```sql
CREATE POLICY mentor_reviews_select_public ON public.mentor_reviews FOR SELECT TO anon, authenticated
  USING (
    visibility IN ('public_named', 'public_anonymous')
    AND EXISTS (SELECT 1 FROM public.mentor_profiles mp WHERE mp.user_id = mentor_reviews.mentor_id AND mp.status = 'approved')
  );
```

## Affected table grants immediately before CONTRACT

```sql
-- mentor_profiles (124)
REVOKE ALL ON public.mentor_profiles FROM anon, authenticated;
GRANT SELECT ON public.mentor_profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.mentor_profiles TO authenticated;

-- mentor_reviews (124)
REVOKE ALL ON public.mentor_reviews FROM anon, authenticated;
GRANT SELECT ON public.mentor_reviews TO anon, authenticated;
GRANT INSERT, UPDATE ON public.mentor_reviews TO authenticated;

-- profile_skills (123)
REVOKE ALL ON public.profile_skills FROM anon, authenticated;
GRANT SELECT ON public.profile_skills TO anon, authenticated;
GRANT INSERT, DELETE ON public.profile_skills TO authenticated;

-- profiles
-- anon/authenticated SELECT was authorized by the three public/discovery/university policies above.
-- Owner/staff INSERT/UPDATE policies remain after CONTRACT; CONTRACT removes anon table privilege.

-- applications
-- Product intent before CONTRACT: authenticated applicant/owner/staff RLS only.
-- CONTRACT makes REVOKE ALL FROM anon, authenticated then GRANT SELECT, INSERT, UPDATE TO authenticated explicit.
```

## Rollback guidance

1. Prefer fixing the application/projection path.
2. If a compensating migration must temporarily restore a dropped policy for non-prod emergency recovery, copy the exact archived definition above into a **new** forward migration.
3. Do **not** reintroduce `profile_skills_public_read USING (true)` into the shipping Gate A intent.
4. Do **not** edit applied migration history.
