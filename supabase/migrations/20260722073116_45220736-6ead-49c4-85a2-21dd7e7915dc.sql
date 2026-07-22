CREATE OR REPLACE FUNCTION public.guild_role(_guild_id text, _user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.members
  WHERE guild_id = _guild_id
    AND user_id = _user_id
    AND _user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_guild_member(_guild_id text, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members
    WHERE guild_id = _guild_id
      AND user_id = _user_id
      AND _user_id = auth.uid()
  );
$$;