REVOKE EXECUTE ON FUNCTION public.guild_role(text, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_guild_member(text, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.guild_role(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_guild_member(text, uuid) TO service_role;