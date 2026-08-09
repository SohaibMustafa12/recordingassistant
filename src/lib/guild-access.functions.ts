import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const profileSchema = z.object({
  username: z.string().trim().min(1).max(100),
  avatar: z.string().url().nullable(),
});

export const provisionGuild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        guildId: z.string().regex(/^\d{5,25}$/),
        name: z.string().trim().min(1).max(100),
      })
      .merge(profileSchema)
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: existing, error: existingError } = await context.supabase
      .from("guilds")
      .select("id, owner_id")
      .eq("id", data.guildId)
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);
    if (existing && existing.owner_id !== context.userId) {
      throw new Error("This Discord server is already registered by another owner.");
    }

    const { error: guildError } = await context.supabase.from("guilds").upsert(
      {
        id: data.guildId,
        name: data.name,
        owner_id: context.userId,
        prefix: "!",
      },
      { onConflict: "id" },
    );
    if (guildError) throw new Error(guildError.message);

    const { error: memberError } = await context.supabase.from("members").upsert(
      {
        user_id: context.userId,
        guild_id: data.guildId,
        username: data.username,
        avatar: data.avatar,
        role: "owner",
      },
      { onConflict: "user_id,guild_id" },
    );
    if (memberError) throw new Error(memberError.message);

    return { guildId: data.guildId };
  });

export const joinGuildByCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({ code: z.string().trim().min(1).max(64) })
      .merge(profileSchema)
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const normalizedCode = data.code.toUpperCase();
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("join_codes")
      .select("guild_id, role, expires_at, max_uses, use_count")
      .eq("code", normalizedCode)
      .maybeSingle();

    if (inviteError) throw new Error("Unable to validate that join code right now.");
    if (!invite) throw new Error("Invalid join code. Please contact your crew owner or admin.");
    if (invite.expires_at && new Date(invite.expires_at).getTime() <= Date.now()) {
      throw new Error("This join code has expired.");
    }
    if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
      throw new Error("This join code has reached its usage limit.");
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("members")
      .select("id")
      .eq("user_id", context.userId)
      .eq("guild_id", invite.guild_id)
      .maybeSingle();
    if (existingError) throw new Error("Unable to verify your crew membership.");

    if (!existing) {
      const { error: insertError } = await supabaseAdmin.from("members").insert({
        user_id: context.userId,
        guild_id: invite.guild_id,
        username: data.username,
        avatar: data.avatar,
        role: invite.role,
      });
      if (insertError) throw new Error("Unable to add you to this recording crew.");

      const { error: usageError } = await supabaseAdmin
        .from("join_codes")
        .update({ use_count: invite.use_count + 1 })
        .eq("code", normalizedCode)
        .eq("use_count", invite.use_count);
      if (usageError) console.error("Failed to update join-code usage", usageError);
    }

    return { guildId: invite.guild_id, alreadyMember: Boolean(existing) };
  });