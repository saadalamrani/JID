-- Spec 06-B — additive notification categories for Directory correction decisions.
-- Split from the function migration: PG enum ADD VALUE cannot be used in the
-- same transaction that references the new labels.

ALTER TYPE public.notification_category_enum
  ADD VALUE IF NOT EXISTS 'directory.correction_approved';

ALTER TYPE public.notification_category_enum
  ADD VALUE IF NOT EXISTS 'directory.correction_rejected';
