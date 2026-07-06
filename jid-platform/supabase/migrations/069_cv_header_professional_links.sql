-- Section 7.6 — professional link columns on cvs header

ALTER TABLE public.cvs
  ADD COLUMN IF NOT EXISTS github_url text,
  ADD COLUMN IF NOT EXISTS portfolio_url text,
  ADD COLUMN IF NOT EXISTS custom_link_1_label text,
  ADD COLUMN IF NOT EXISTS custom_link_1_url text,
  ADD COLUMN IF NOT EXISTS custom_link_2_label text,
  ADD COLUMN IF NOT EXISTS custom_link_2_url text;
