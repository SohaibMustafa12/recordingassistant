import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { AlertTriangle, Bot, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldLogo } from "@/components/ShieldLogo";
import { supabase } from "@/lib/supabase";
import { inviteBot } from "@/lib/auth";
import { toast } from "sonner";

type DashboardStatus = "loading" | "empty" | "error";

type FirstMembership = {
  guild_id: string;
  guilds: { id: string; name: string; icon: string | null } | null;
};

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

async function waitForDashboardSession(): Promise<Session | null> {
  for (let attempt = 0; attempt < 24; attempt++) {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;
    if (session) return session;
    await wait(250);
  }

  return null;
}

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Dashboard — RecAssistant" },
      {
        name: "description",
        content: "Choose or connect a Discord recording crew in the RecAssistant dashboard.",
      },
      { property: "og:title", content: "Dashboard — RecAssistant" },
      {
        property: "og:description",
        content: "Choose or connect a Discord recording crew in the RecAssistant dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardEntry,
});

function DashboardEntry() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<DashboardStatus>("loading");

  useEffect(() => {
    let active = true;

    async function routeToDashboard() {
      try {
        const session = await waitForDashboardSession();
        if (!active) return;

        if (!session) {
          toast.error("Please sign in with Discord first.");
          navigate({ to: "/", replace: true });
          return;
        }

        const { data, error } = await supabase
          .from("members")
          .select("guild_id, guilds!inner(id, name, icon)")
          .eq("user_id", session.user.id)
          .order("joined_at", { ascending: true })
          .limit(1);

        if (error) throw error;

        const firstMembership = data?.[0] as unknown as FirstMembership | undefined;
        const guildId = firstMembership?.guilds?.id ?? firstMembership?.guild_id;

        if (guildId) {
          navigate({ to: "/dashboard/$guildId/overview", params: { guildId }, replace: true });
          return;
        }

        setStatus("empty");
      } catch (error) {
        console.error("Dashboard routing error:", error);
        if (!active) return;
        toast.error(error instanceof Error ? error.message : "Unable to load your dashboard.");
        setStatus("error");
      }
    }

    routeToDashboard();

    return () => {
      active = false;
    };
  }, [navigate]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="space-y-4 text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Opening your crew dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-hero px-4">
      <Card className="w-full max-w-md space-y-6 border-border/60 bg-panel p-8 text-center shadow-elevated">
        <ShieldLogo className="mx-auto h-16 w-16 object-contain" />
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {status === "empty" ? "No crews connected yet" : "Dashboard unavailable"}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {status === "empty"
              ? "Your Discord sign-in is active. Register a server, join with an invite code, or invite the bot to start managing a crew."
              : "We could not load your crew dashboard. Return home and try again."}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline" className="flex-1">
            <Link to="/">Home</Link>
          </Button>
          {status === "empty" && (
            <Button onClick={inviteBot} className="flex-1 gap-2 bg-discord text-discord-foreground">
              <Bot className="h-4 w-4" />
              Invite Bot
            </Button>
          )}
          {status === "error" && (
            <Button onClick={() => window.location.reload()} className="flex-1">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Retry
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}