import { createFileRoute } from "@tanstack/react-router";
import { Users, Video, TrendingUp, Activity, Bot, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDashboard } from "../$guildId";

export const Route = createFileRoute("/dashboard/$guildId/overview")({
  head: () => ({ meta: [{ title: "Overview — RecAssistant" }] }),
  component: Overview,
});

const stats = [
  { label: "Total Crew", value: 0, icon: Users, hint: "Members in your server roles" },
  { label: "Recordings Hosted", value: 0, icon: Video, hint: "Sessions started with /start" },
  { label: "Attendance Rate", value: "—", icon: TrendingUp, hint: "Average across all shoots" },
] as const;

// Replace this with your actual Discord Bot invite link setup from your Discord Developer Portal
const BOT_INVITE_URL =
  "https://discord.com/oauth2/authorize?client_id=1528299078914543758&permissions=8&scope=bot+applications.commands";

function Overview() {
  const { isAdmin, guild } = useDashboard();
  const activity: { id: string; text: string; time: string }[] = [];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Command center for your ERLC recording crew.
          </p>
        </div>
      </div>

      {/* ADMIN & OWNER BANNER: Invite Bot Action Link */}
      {isAdmin && (
        <Card className="relative overflow-hidden border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-background p-6">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                <Bot className="h-5 w-5 text-primary" />
                Connect RecAssistant Bot
              </div>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Authorize our automation system inside{" "}
                <span className="font-medium text-foreground">
                  {guild?.name || "your Discord server"}
                </span>{" "}
                to auto-announce scheduled recording events, capture dynamic server attendance, and
                run server tools directly.
              </p>
            </div>
            <Button
              asChild
              className="gap-2 shrink-0 bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium"
            >
              <a href={BOT_INVITE_URL} target="_blank" rel="noopener noreferrer">
                Invite Bot
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="relative overflow-hidden border-border/60 bg-panel p-5">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</p>
                <p className="mt-3 font-display text-4xl font-bold tracking-tight">{s.value}</p>
                <p className="mt-2 text-xs text-muted-foreground">{s.hint}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/40 p-2 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 bg-panel p-6">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">Recent Activity</h2>
        </div>

        {activity.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-background/30 px-6 py-16 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
              <Activity className="h-6 w-6" />
            </div>
            <p className="font-medium">No activity yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Invite RecAssistant to your Discord and run{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/start</code> to log your
              first session.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {activity.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                <span>{a.text}</span>
                <span className="text-xs text-muted-foreground">{a.time}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
