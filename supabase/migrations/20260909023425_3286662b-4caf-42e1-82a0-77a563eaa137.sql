REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.owns_doctor(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.claim_doctor_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_doctor(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_doctor_profile() TO authenticated;