import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth, setAuthed, DISCORD_OAUTH_URL } from "@/lib/auth";
import { ShieldLogo } from "@/components/ShieldLogo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RecAssistant — Login" },
      {
        name: "description",
        content:
          "The Ultimate Recording Crew Assistant for ERLC YouTubers. Sign in with Discord to manage your crew.",
      },
      { property: "og:title", content: "RecAssistant — Login" },
      {
        property: "og:description",
        content:
          "The Ultimate Recording Crew Assistant for ERLC YouTubers. Sign in with Discord to manage your crew.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LoginPage,
});

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.369A19.79 19.79 0 0 0 16.885 3.3a.075.075 0 0 0-.079.038c-.34.6-.719 1.384-.984 2.001a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.996-2.001.077.077 0 0 0-.079-.038 19.74 19.74 0 0 0-3.432 1.069.07.07 0 0 0-.032.027C2.533 8.045 1.79 11.61 2.147 15.13a.083.083 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.028.077.077 0 0 0 .084-.027c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.104 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.128 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.105c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.029.077.077 0 0 0 .032-.054c.5-4.177-.838-7.719-3.549-10.734a.06.06 0 0 0-.031-.028zM8.02 14.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.955 2.418-2.157 2.418zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function LoginPage() {
  const { authed, ready } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;

    setAuthed(true);
    window.history.replaceState(null, "", "/overview");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  if (ready && authed) return <Navigate to="/overview" replace />;

  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("code")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-sm text-muted-foreground">Completing Discord login…</div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 bg-hero" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-border/70 bg-panel p-8 shadow-elevated backdrop-blur-xl">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="absolute inset-0 -z-10 rounded-full bg-primary/30 blur-2xl" />
              <ShieldLogo className="h-24 w-24 drop-shadow-[0_10px_30px_rgba(88,101,242,0.45)]" />
            </div>

            <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
              RecAssistant
            </h1>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The Ultimate Recording Crew Assistant for ERLC YouTubers.
            </p>

            <div className="mt-8 w-full">
              <a
                href={DISCORD_OAUTH_URL}
                className="group relative inline-flex h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-discord font-semibold text-discord-foreground shadow-[0_10px_30px_-8px_rgba(88,101,242,0.7)] transition-all hover:brightness-110 active:scale-[0.98]"
              >
                <DiscordIcon className="h-5 w-5" />
                <span>Log In with Discord</span>
              </a>

              <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                <span className="uppercase tracking-widest">Demo</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button
                variant="ghost"
                className="mt-3 h-10 w-full text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setAuthed(true)}
              >
                Preview the dashboard →
              </Button>
            </div>

            <div className="mt-8 grid w-full grid-cols-3 gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              <div className="rounded-lg border border-border/60 bg-background/40 px-2 py-3">
                Scheduling
              </div>
              <div className="rounded-lg border border-border/60 bg-background/40 px-2 py-3">
                Attendance
              </div>
              <div className="rounded-lg border border-border/60 bg-background/40 px-2 py-3">
                Roster
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By signing in you agree to our{" "}
          <Link to="/terms" className="text-foreground/80 underline underline-offset-4 hover:text-foreground">
            Terms
          </Link>{" "}
          &{" "}
          <Link to="/privacy" className="text-foreground/80 underline underline-offset-4 hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
