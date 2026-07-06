-- Section 5.4 — authenticated users may fetch others' public keys for E2EE messaging

DROP POLICY IF EXISTS user_encryption_keys_select_public ON public.user_encryption_keys;

CREATE POLICY user_encryption_keys_select_public
  ON public.user_encryption_keys FOR SELECT TO authenticated
  USING (true);
