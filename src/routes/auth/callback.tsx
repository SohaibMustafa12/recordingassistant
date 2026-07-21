import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { createServerFn } from "@tanstack/react-start";
import { Session } from "@supabase/supabase-js";

// Server Function to safely sync memberships bypassing RLS using supabaseAdmin
const syncUserMemberships = createServerFn({ method: "POST" })
  .validator(
    (data: {
      userId: string;
      username: string;
      avatar: string | null;
      guilds: Array<{
        id: string;
        name: string;
        icon: string | null;
        owner: boolean;
        permissions: string;
      }>;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId, username, avatar, guilds } = data;

    const guildIds = guilds.map((g) => g.id);
    if (guildIds.length === 0) {
      return { success: true, count: 0 };
    }

    // 1. Get all guilds registered on our platform
    const { data: registeredGuilds, error: guildsError } = await supabaseAdmin
      .from("guilds")
      .select("id")
      .in("id", guildIds);

    if (guildsError) {
      console.error("Error fetching registered guilds:", guildsError);
      throw new Error("Failed to fetch registered guilds");
    }

    const registeredGuildIds = new Set(registeredGuilds.map((g) => g.id));

    // Filter guilds to only those registered in RecAssistant
    const matchingGuilds = guilds.filter((g) => registeredGuildIds.has(g.id));

    if (matchingGuilds.length === 0) {
      return { success: true, count: 0 };
    }

    let joinedCount = 0;

    // 2. For each matching guild, upsert a member record with proper role assignment
    for (const guild of matchingGuilds) {
      // Determine role:
      // - If owner of discord guild: 'owner'
      // - If administrator permissions (0x8 bit set): 'admin'
      // - Else: 'crew'
      let role: "owner" | "admin" | "crew" = "crew";

      const isOwner = guild.owner;
      const isAdmin = (BigInt(guild.permissions) & 0x8n) === 0x8n;

      if (isOwner) {
        role = "owner";
      } else if (isAdmin) {
        role = "admin";
      }

      // Check if membership already exists
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
        // Update user details (username, avatar) if they changed, and upgrade role if appropriate
        const updateData: { username: string; avatar: string | null; role?: string } = {
          username,
          avatar,
        };

        // If they became owner or admin and they had a lower role, upgrade them.
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
        // Insert new membership record
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

    return { success: true, count: joinedCount };
  });

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState(
    "Establishing secure authentication session...",
  );

  useEffect(() => {
    let active = true;

    async function handleAuthCallback() {
      try {
        // Give Supabase client a moment to parse the hash/code from the URL
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session) {
          // If no session found immediately, listen to auth state changes for a brief period
          setStatusMessage("Verifying login details...");
          let checkCount = 0;

          const checkSession = async () => {
            const {
              data: { session: activeSession },
            } = await supabase.auth.getSession();
            if (activeSession) {
              if (active) await processSession(activeSession);
            } else if (checkCount < 10) {
              checkCount++;
              setTimeout(checkSession, 300);
            } else {
              if (active) {
                toast.error("Unable to retrieve session. Please try logging in again.");
                navigate({ to: "/" });
              }
            }
          };

          await checkSession();
          return;
        }

        if (active) {
          await processSession(session);
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        if (active) {
          toast.error("Authentication failed. Please try again.");
          navigate({ to: "/" });
        }
      }
    }

    async function processSession(session: Session) {
      try {
        const user = session.user;
        const providerToken = session.provider_token;

        setStatusMessage("Synchronizing Discord profile and servers...");

        const username =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Gamer";
        const avatar = user.user_metadata?.avatar_url || null;

        let guilds = [];
        if (providerToken) {
          try {
            // Fetch the user's servers directly from Discord API
            const response = await fetch("https://discord.com/api/v10/users/@me/guilds", {
              headers: {
                Authorization: `Bearer ${providerToken}`,
              },
            });

            if (response.ok) {
              guilds = await response.json();
            } else {
              console.warn("Failed to fetch Discord guilds, status:", response.status);
            }
          } catch (discordErr) {
            console.error("Error fetching Discord guilds:", discordErr);
          }
        }

        // Sync memberships with our database via secure server function
        setStatusMessage("Linking memberships with registered recording crews...");
        await syncUserMemberships({
          userId: user.id,
          username,
          avatar,
          guilds,
        });

        if (active) {
          toast.success("Successfully signed in with Discord!");
          navigate({ to: "/" });
        }
      } catch (err) {
        console.error("Error processing user session:", err);
        if (active) {
          toast.success("Signed in successfully!");
          navigate({ to: "/" });
        }
      }
    }

    handleAuthCallback();

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f1020] text-white px-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-[#181930] flex items-center justify-center">
              <svg
                className="w-4 h-4 text-primary animate-pulse"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.03c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.03A19.736 19.736 0 0 0 3.5 2.855a.072.072 0 0 0-.073.03 20.09 20.09 0 0 0-3.1 14.88a.076.076 0 0 0 .046.054 19.843 19.843 0 0 0 5.97 3.013.077.077 0 0 0 .082-.027c.495-.675.922-1.398 1.283-2.155a.075.075 0 0 0-.041-.102 13.02 13.02 0 0 1-1.874-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.103c.36.757.787 1.48 1.284 2.155a.075.075 0 0 0 .082.028 19.837 19.837 0 0 0 6.054-3.012.075.075 0 0 0 .047-.053c3.55-5.323 2.5-12.046-3.11-14.885a.074.074 0 0 0-.073-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">Authenticating...</h2>
          <p className="text-sm text-muted-foreground animate-pulse transition-all duration-300">
            {statusMessage}
          </p>
        </div>
      </div>
    </div>
  );
}
