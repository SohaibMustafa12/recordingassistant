REVOKE EXECUTE ON FUNCTION public.guild_role(text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_guild_member(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.guild_role(text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_guild_member(text, uuid) TO authenticated, service_role;