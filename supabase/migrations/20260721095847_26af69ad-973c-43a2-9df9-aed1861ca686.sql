DROP POLICY IF EXISTS "Authed users can read codes" ON public.join_codes;
DROP POLICY IF EXISTS "Authenticated users can lookup join codes" ON public.join_codes;