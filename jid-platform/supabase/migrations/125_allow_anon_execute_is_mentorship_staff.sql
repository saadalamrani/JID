-- Allow anonymous mentor-directory RLS policies to evaluate staff access.
GRANT EXECUTE ON FUNCTION public.is_mentorship_staff() TO anon;
