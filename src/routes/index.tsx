import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth, loginWithDiscord } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ShieldLogo } from "@/components/ShieldLogo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleRedirect = async () => {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    const { data: memberData } = await supabase
      .from('crew_members')
      .select('guild_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberData) {
      navigate({ to: "/overview" });
    } else {
      // Pointing to the new /join route instead of /onboarding
      navigate({ to: "/join" });
    }
  };

  useEffect(() => {
    if (ready && authed) {
      handleRedirect();
    }
  }, [ready, authed]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background">Loading...</div>;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-hero" />
      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-border/70 bg-panel p-8 shadow-elevated backdrop-blur-xl">
          <div className="flex flex-col items-center text-center">
            <ShieldLogo className="h-24 w-24 drop-shadow-[0_10px_30px_rgba(88,101,242,0.45)]" />
            <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">RecAssistant</h1>
            <Button
              onClick={loginWithDiscord}
              className="mt-8 h-12 w-full bg-discord text-discord-foreground transition-all hover:brightness-110"
            >
              <DiscordIcon className="mr-2 h-5 w-5" />
              Log In with Discord
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
