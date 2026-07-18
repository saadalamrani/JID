-- Remove unsafe table-level TRUNCATE privileges from the deprecated commitment-score table.
REVOKE TRUNCATE ON TABLE public._deprecated_commitment_scores FROM anon, authenticated;
