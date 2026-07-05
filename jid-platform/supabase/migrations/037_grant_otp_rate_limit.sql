-- Grant OTP rate limit RPC to authenticated users (Section 11 Step 6)
GRANT EXECUTE ON FUNCTION public.check_otp_rate_limit(uuid, text) TO authenticated;
