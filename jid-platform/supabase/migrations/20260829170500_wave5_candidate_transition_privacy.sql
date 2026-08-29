-- Candidate truth comes from applications.candidate_visible_status/outcome.
-- The raw employer transition ledger contains private stage ids and reasons.
DROP POLICY hiring_transitions_candidate_read ON public.hiring_stage_transitions;
