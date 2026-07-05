-- Catalog sectors display ordering (Section 9 seed support)

ALTER TABLE public.sectors
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_sectors_display_order
  ON public.sectors (display_order);
