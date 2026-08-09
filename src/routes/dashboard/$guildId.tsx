import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createFileRoute, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { inviteBot } from "@/lib/auth";
import { Shield, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Session, User } from "@supabase/supabase-js";

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

async function waitForAvailableSession(): Promise<Session | null> {
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

interface GuildInfo {
  id: string;
  name: string;
  icon: string | null;
  prefix: string;
  recording_channel_id: string | null;
  attendance_channel_id: string | null;
  announcement_channel_id: string | null;
  settings: Record<string, unknown>;
}

interface DashboardContextType {
  guildId: string;
  guild: GuildInfo | null;
  role: "owner" | "admin" | "crew" | null;
  isOwner: boolean;
  isAdmin: boolean;
  isCrew: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error(
      "useDashboard must be used within a DashboardProvider (under /dashboard/$guildId)",
    );
  }
  return ctx;
};

export const Route = createFileRoute("/dashboard/$guildId")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { guildId } = useParams({ from: "/dashboard/$guildId" });
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [guild, setGuild] = useState<GuildInfo | null>(null);
  const [role, setRole] = useState<"owner" | "admin" | "crew" | null>(null);
  const [loading, setLoading] = useState(true);
  const [notAMember, setNotAMember] = useState(false);
  const sessionResolved = useRef(false);

  const fetchDashboardData = async (userId: string) => {
    try {
      setLoading(true);
      // Fetch user's membership and the guild details in one block
      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select(
          `
          role,
          guilds (
            id,
            name,
            icon,
            prefix,
            recording_channel_id,
            attendance_channel_id,
            announcement_channel_id,
            settings
          )
        `,
        )
        .eq("guild_id", guildId)
        .eq("user_id", userId)
        .maybeSingle();

      if (memberError) throw memberError;

      if (!memberData) {
        // Not a member of this server's assistant roster
        setNotAMember(true);
        setGuild(null);
        setRole(null);
      } else {
        setNotAMember(false);
        setRole(memberData.role as "owner" | "admin" | "crew");
        setGuild(memberData.guilds as unknown as GuildInfo);
      }
    } catch (err) {
      console.error("Error fetching dashboard credentials:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const session = await waitForAvailableSession();
        if (!active) return;

        if (!session) {
          navigate({ to: "/", replace: true });
          return;
        }

        setUser(session.user);
        sessionResolved.current = true;
        await fetchDashboardData(session.user.id);
      } catch (error) {
        console.error("Error checking dashboard session:", error);
        if (active) navigate({ to: "/", replace: true });
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "SIGNED_OUT" && sessionResolved.current) {
        navigate({ to: "/", replace: true });
      } else if (session) {
        sessionResolved.current = true;
        setUser(session.user);
        fetchDashboardData(session.user.id);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]);

  const triggerRefresh = async () => {
    if (user) {
      await fetchDashboardData(user.id);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground font-sans">
            Checking credentials & loading crew settings...
          </p>
        </div>
      </div>
    );
  }

  // 2. Access Denied State (Not a member of this guild)
  if (notAMember) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md w-full border border-border/60 bg-panel rounded-2xl p-8 text-center space-y-6">
          <div className="h-14 w-14 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display font-extrabold text-2xl text-foreground tracking-tight">
              Access Denied
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You are not a registered member of this crew's platform roster. Please join using an
              invite code or contact a server administrator.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/" })}
              className="flex-1 text-xs"
            >
              Back to Home
            </Button>
            <Button onClick={triggerRefresh} className="flex-1 bg-primary text-xs">
              Retry Login Check
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Context Provider value
  const contextValue: DashboardContextType = {
    guildId,
    guild,
    role,
    isOwner: role === "owner",
    isAdmin: role === "admin" || role === "owner",
    isCrew: role === "crew",
    loading,
    refresh: triggerRefresh,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex flex-1 flex-col">
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/40 bg-background/70 px-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                  Bot Connected
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-secondary border border-border/40 text-muted-foreground px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                  {role === "owner"
                    ? "👑 Owner View"
                    : role === "admin"
                      ? "🛡️ Admin View"
                      : "👥 Crew Hub"}
                </span>
                <Button
                  onClick={inviteBot}
                  size="sm"
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs px-3 font-semibold transition-colors h-8"
                >
                  Invite Bot
                </Button>
              </div>
            </header>
            <main className="flex-1 p-6 md:p-10">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </DashboardContext.Provider>
  );
}
