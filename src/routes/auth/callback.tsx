import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { syncUserMemberships } from "@/lib/auth-callback.functions";

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

async function readVerifiedSession() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;
  if (!session) return null;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;
  return session;
}

async function resolveOAuthSession(setStatusMessage: (message: string) => void) {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  let exchangeError: unknown = null;

  if (code) {
    setStatusMessage("Exchanging Discord authorization...");
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      exchangeError = error;
    }
  }

  setStatusMessage("Waiting for secure session storage...");
  for (let attempt = 0; attempt < 24; attempt++) {
    const session = await readVerifiedSession();
    if (session) return session;
    await wait(250);
  }

  if (exchangeError instanceof Error) throw exchangeError;
  throw new Error("Unable to establish your Discord session. Please try signing in again.");
}

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Authenticating — RecAssistant" },
      {
        name: "description",
        content: "Completing your Discord sign-in for the RecAssistant crew dashboard.",
      },
      { property: "og:title", content: "Authenticating — RecAssistant" },
      {
        property: "og:description",
        content: "Completing your Discord sign-in for the RecAssistant crew dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
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
        const session = await resolveOAuthSession(setStatusMessage);
        if (active) await processSession(session);
      } catch (err) {
        console.error("Auth callback error:", err);
        if (active) {
          const message =
            err instanceof Error ? err.message : "Authentication failed. Please try again.";
          toast.error(message);
          navigate({ to: "/", replace: true });
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

        setStatusMessage("Linking memberships with registered recording crews...");
        const syncResult = await syncUserMemberships({
          data: { username, avatar, guilds },
        });

        if (active) {
          toast.success("Successfully signed in with Discord!");
          if (syncResult.firstGuildId) {
            navigate({
              to: "/dashboard/$guildId/overview",
              params: { guildId: syncResult.firstGuildId },
              replace: true,
            });
          } else {
            navigate({ to: "/dashboard/", replace: true });
          }
        }
      } catch (err) {
        console.error("Error processing user session:", err);
        if (active) {
          toast.success("Signed in successfully!");
          navigate({ to: "/dashboard/", replace: true });
        }
      }
    }

    handleAuthCallback();

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground">
      <div className="max-w-sm space-y-6 text-center">
        <div className="relative">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-card">
              <svg
                className="h-4 w-4 animate-pulse text-primary"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.03c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.03A19.736 19.736 0 0 0 3.5 2.855a.072.072 0 0 0-.073.03 20.09 20.09 0 0 0-3.1 14.88a.076.076 0 0 0 .046.054 19.843 19.843 0 0 0 5.97 3.013.077.077 0 0 0 .082-.027c.495-.675.922-1.398 1.283-2.155a.075.075 0 0 0-.041-.102 13.02 13.02 0 0 1-1.874-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.103c.36.757.787 1.48 1.284 2.155a.075.075 0 0 0 .082.028 19.837 19.837 0 0 0 6.054-3.012.075.075 0 0 0 .047-.053c3.55-5.323 2.5-12.046-3.11-14.885a.074.074 0 0 0-.073-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">Authenticating...</h1>
          <p className="animate-pulse text-sm text-muted-foreground transition-all duration-300">
            {statusMessage}
          </p>
        </div>
      </div>
    </div>
  );
}
