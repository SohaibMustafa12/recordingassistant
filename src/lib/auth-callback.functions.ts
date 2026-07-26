import { createServerFn } from "@tanstack/react-start";

type DiscordGuild = {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
};

export const syncUserMemberships = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      userId: string;
      username: string;
      avatar: string | null;
      guilds: DiscordGuild[];
    }) => data,
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId, username, avatar, guilds } = data;

    const guildIds = guilds.map((guild) => guild.id);
    if (guildIds.length === 0) {
      return { success: true, count: 0, guildIds: [], firstGuildId: null };
    }

    const { data: registeredGuilds, error: guildsError } = await supabaseAdmin
      .from("guilds")
      .select("id")
      .in("id", guildIds);

    if (guildsError) {
      console.error("Error fetching registered guilds:", guildsError);
      throw new Error("Failed to fetch registered guilds");
    }

    const registeredGuildIds = new Set(registeredGuilds.map((guild) => guild.id));
    const matchingGuilds = guilds.filter((guild) => registeredGuildIds.has(guild.id));
    const matchingGuildIds = matchingGuilds.map((guild) => guild.id);

    if (matchingGuilds.length === 0) {
      return { success: true, count: 0, guildIds: [], firstGuildId: null };
    }

    let joinedCount = 0;

    for (const guild of matchingGuilds) {
      let role: "owner" | "admin" | "crew" = "crew";
      const isAdmin = (BigInt(guild.permissions) & 0x8n) === 0x8n;

      if (guild.owner) {
        role = "owner";
      } else if (isAdmin) {
        role = "admin";
      }

      const { data: existingMember, error: memberCheckError } = await supabaseAdmin
        .from("members")
        .select("role")
        .eq("user_id", userId)
        .eq("guild_id", guild.id)
        .maybeSingle();

      if (memberCheckError) {
        console.error(`Error checking membership for guild ${guild.id}:`, memberCheckError);
        continue;
      }

      if (existingMember) {
        const updateData: { username: string; avatar: string | null; role?: string } = {
          username,
          avatar,
        };

        if (role === "owner" && existingMember.role !== "owner") {
          updateData.role = "owner";
        } else if (role === "admin" && existingMember.role === "crew") {
          updateData.role = "admin";
        }

        const { error: updateError } = await supabaseAdmin
          .from("members")
          .update(updateData)
          .eq("user_id", userId)
          .eq("guild_id", guild.id);

        if (updateError) {
          console.error(`Error updating membership for guild ${guild.id}:`, updateError);
        }
      } else {
        const { error: insertError } = await supabaseAdmin.from("members").insert({
          user_id: userId,
          guild_id: guild.id,
          username,
          avatar: avatar || null,
          role,
        });

        if (insertError) {
          console.error(`Error inserting membership for guild ${guild.id}:`, insertError);
        } else {
          joinedCount++;
        }
      }
    }

    return {
      success: true,
      count: joinedCount,
      guildIds: matchingGuildIds,
      firstGuildId: matchingGuildIds[0] ?? null,
    };
  });