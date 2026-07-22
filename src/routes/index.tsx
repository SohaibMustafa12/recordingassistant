import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { inviteBot } from "@/lib/auth";
import { User } from "@supabase/supabase-js";
import { ShieldLogo } from "@/components/ShieldLogo";
import { createServerFn } from "@tanstack/react-start";

// Server function to securely validate join code and add user as a member bypassing RLS issues with join codes
const joinServerByCode = createServerFn({ method: "POST" })
  .validator(
    (data: { userId: string; username: string; avatar: string | null; code: string }) => data,
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId, username, avatar, code } = data;

    // 1. Look up code in join_codes table
    const { data: codeData, error: codeError } = await supabaseAdmin
      .from("join_codes")
      .select("*")
      .eq("code", code.trim())
      .maybeSingle();

    if (codeError) {
      console.error("Error looking up join code:", codeError);
      throw new Error("Database error occurred while looking up the invite code.");
    }

    if (!codeData) {
      throw new Error("Invalid join code. Please contact your crew owner/admin.");
    }

    // 2. Check if join code has expired
    if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
      throw new Error("This join code has expired.");
    }

    // 3. Check if join code use count is exceeded
    if (codeData.max_uses && codeData.use_count >= codeData.max_uses) {
      throw new Error("This join code has reached its maximum usage limit.");
    }

    // 4. Verify guild exists
    const { data: guildData, error: guildError } = await supabaseAdmin
      .from("guilds")
      .select("id, name")
      .eq("id", codeData.guild_id)
      .maybeSingle();

    if (guildError) {
      console.error("Error checking guild existence:", guildError);
      throw new Error("Database error checking the recording crew's status.");
    }

    if (!guildData) {
      throw new Error("The recording crew server linked to this invite code does not exist.");
    }

    // 5. Check if user is already a member
    const { data: existingMember, error: memberCheckError } = await supabaseAdmin
      .from("members")
      .select("id")
      .eq("user_id", userId)
      .eq("guild_id", codeData.guild_id)
      .maybeSingle();

    if (memberCheckError) {
      console.error("Error checking existing membership:", memberCheckError);
      throw new Error("Failed to verify membership status.");
    }

    if (existingMember) {
      return { success: true, guildId: codeData.guild_id, alreadyMember: true };
    }

    // 6. Join the user to the guild
    const { error: insertError } = await supabaseAdmin.from("members").insert({
      user_id: userId,
      guild_id: codeData.guild_id,
      username,
      avatar,
      role: codeData.role || "crew",
    });

    if (insertError) {
      console.error("Error inserting member via invite code:", insertError);
      throw new Error("Failed to add user to the crew roster.");
    }

    // 7. Increment code usage count
    const { error: updateError } = await supabaseAdmin
      .from("join_codes")
      .update({ use_count: codeData.use_count + 1 })
      .eq("code", code.trim());

    if (updateError) {
      console.error("Error updating use count for code:", code.trim(), updateError);
    }

    return { success: true, guildId: codeData.guild_id, alreadyMember: false };
  });

import {
  Bot,
  Server,
  UserPlus,
  Key,
  LogOut,
  ChevronRight,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

interface GuildMemberInfo {
  guild_id: string;
  role: string;
  joined_at: string;
  guilds: {
    id: string;
    name: string;
    icon: string | null;
  } | null;
}

function LandingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinedServers, setJoinedServers] = useState<GuildMemberInfo[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Registering server state
  const [newGuildId, setNewGuildId] = useState("");
  const [newGuildName, setNewGuildName] = useState("");
  const [registering, setRegistering] = useState(false);

  // Authentication & Session checking
  useEffect(() => {
    let active = true;

    async function checkUser() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (active) {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchJoinedServers(session.user.id);
          }
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    checkUser();

    // Listen for auth state changes (e.g. login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (active) {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchJoinedServers(session.user.id);
        } else {
          setJoinedServers([]);
        }
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch all servers this user is a member of
  const fetchJoinedServers = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("members")
        .select(`
          guild_id,
          role,
          joined_at,
          guilds!inner (
            id,
            name,
            icon
          )
        `)
        .eq("user_id", userId);

      if (error) throw error;
      if (data) {
        setJoinedServers(data as unknown as GuildMemberInfo[]);
      }
    } catch (err) {
      console.error("Error fetching joined servers:", err);
    }
  };

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          scopes: "identify guilds",
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const isProviderDisabled =
        /provider is not enabled/i.test(raw) || /validation_failed/i.test(raw);
      if (isProviderDisabled) {
        toast.error(
          "Discord sign-in isn't enabled yet. An admin must enable the Discord provider in the backend Auth settings (Authentication → Providers → Discord), then paste this app's callback URL into Discord's OAuth2 redirects.",
          { duration: 10000 },
        );
      } else {
        toast.error(raw || "Failed to initiate Discord login");
      }
      console.error("Discord OAuth error:", err);
    }
  };


  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setJoinedServers([]);
      toast.success("Signed out successfully");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error logging out";
      toast.error(errMsg);
    }
  };

  // Join a server using a unique join code
  const handleJoinByCode = async () => {
    if (!joinCode.trim()) {
      toast.error("Please enter a valid join code.");
      return;
    }

    if (!user) {
      toast.error("Please sign in with Discord first.");
      return;
    }

    setJoining(true);
    try {
      const discordName = user.user_metadata?.full_name || user.user_metadata?.name || "Gamer";
      const discordAvatar = user.user_metadata?.avatar_url || null;

      const result = await joinServerByCode({
        data: {
          userId: user.id,
          username: discordName,
          avatar: discordAvatar,
          code: joinCode.trim(),
        },
      });

      if (result.alreadyMember) {
        toast.info("You are already a member of this server.");
      } else {
        toast.success("Successfully joined server!");
      }

      await fetchJoinedServers(user.id);
      setJoinCode("");

      // Navigate to overview of the newly joined server using string interpolation
      navigate({ to: `/dashboard/$guildId/overview`, params: { guildId: result.guildId } });
    } catch (err) {
      console.error("Join error:", err);
      const errMsg =
        err instanceof Error ? err.message : "An error occurred while joining the crew.";
      toast.error(errMsg);
    } finally {
      setJoining(false);
    }
  };

  // Registering a new server on the platform
  const handleRegisterServer = async () => {
    const trimmedGuildId = newGuildId.trim();
    const trimmedGuildName = newGuildName.trim();

    if (!trimmedGuildId || !trimmedGuildName) {
      toast.error("Please fill out both Server ID and Server Name.");
      return;
    }

    if (!/^\d{5,25}$/.test(trimmedGuildId)) {
      toast.error("Server ID must be a numeric Discord snowflake (5–25 digits).");
      return;
    }

    // Re-check session to ensure we have an authenticated user before inserting
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const authUser = session?.user ?? user;

    if (!authUser) {
      toast.error("Please sign in with Discord first.");
      return;
    }

    setRegistering(true);
    try {
      // 1. Insert guild record (RLS requires owner_id = auth.uid())
      const { error: guildError } = await supabase.from("guilds").insert({
        id: trimmedGuildId,
        name: trimmedGuildName,
        owner_id: authUser.id,
        prefix: "!",
      });

      if (guildError) {
        console.error("Guild insert error:", guildError);
        if (guildError.code === "23505") {
          toast.error("This Server ID is already registered.");
          return;
        }
        toast.error(
          `Failed to register server: ${guildError.message}${
            guildError.details ? ` (${guildError.details})` : ""
          }`,
        );
        return;
      }

      // 2. Insert owner member record
      const discordName =
        authUser.user_metadata?.full_name || authUser.user_metadata?.name || "Owner";
      const discordAvatar = authUser.user_metadata?.avatar_url || "";

      const { error: memberError } = await supabase.from("members").insert({
        user_id: authUser.id,
        guild_id: trimmedGuildId,
        username: discordName,
        avatar: discordAvatar,
        role: "owner",
      });

      if (memberError) {
        console.error("Member insert error:", memberError);
        toast.error(`Server saved but failed to add you as owner: ${memberError.message}`);
        return;
      }

      toast.success("Server registered successfully!");
      setNewGuildId("");
      setNewGuildName("");
      setShowRegister(false);
      await fetchJoinedServers(authUser.id);

      navigate({ to: `/dashboard/$guildId/overview`, params: { guildId: trimmedGuildId } });
    } catch (err) {
      console.error("Unexpected error registering server:", err);
      const errMsg = err instanceof Error ? err.message : "Failed to register server.";
      toast.error(errMsg);
    } finally {
      setRegistering(false);
    }
  };


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <ShieldLogo className="h-12 w-12 animate-pulse mx-auto" />
          <p className="text-sm text-muted-foreground">Synchronizing platform session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden bg-background bg-hero pb-12">
      {/* Decorative top ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navbar Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 py-5 flex items-center justify-between border-b border-border/40 backdrop-blur-sm bg-background/20">
        <div className="flex items-center gap-3">
          <ShieldLogo className="h-9 w-9 rounded-xl object-contain shrink-0" />
          <span className="font-display font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-muted-foreground bg-clip-text text-transparent">
            RecAssistant
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-4 bg-secondary/40 border border-border/40 p-1.5 pl-3 rounded-full">
              <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
                {user.user_metadata?.full_name || user.user_metadata?.name || "Discord User"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleLogin}
              className="bg-[#5865F2] hover:bg-[#4752C4] font-semibold gap-2 shadow-glow text-white"
            >
              <Bot className="h-4 w-4" />
              Sign in with Discord
            </Button>
          )}
        </div>
      </header>

      {/* Main Content Arena */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 py-12 lg:py-20">
        {/* Left Side: Product pitch */}
        <div className="flex-1 space-y-6 max-w-xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs text-primary font-semibold uppercase tracking-wider mb-2">
            <Bot className="h-3.5 w-3.5" />
            Designed for ERLC Recording Crews
          </div>
          <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight">
            Manage your crew with{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-primary to-purple-400 bg-clip-text text-transparent">
              ease
            </span>
            .
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed font-sans">
            RecAssistant is the definitive assistant built specifically for ERLC YouTubers and
            Roblox recording groups. Automate attendance tracking, schedule dynamic sessions, and
            control authorization with pristine precision.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
            <Button
              size="lg"
              onClick={inviteBot}
              variant="outline"
              className="w-full sm:w-auto font-bold border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
            >
              <Bot className="mr-2 h-5 w-5" />
              Invite Bot to Discord
            </Button>
            {!user && (
              <Button
                size="lg"
                onClick={handleLogin}
                className="w-full sm:w-auto bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold shadow-glow"
              >
                Sign In to Platform
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Right Side: Auth flow, user servers, or join card */}
        <div className="w-full max-w-md shrink-0">
          {!user ? (
            /* Call to Action: Log in first */
            <Card className="border-border/60 bg-panel shadow-elevated p-8 text-center space-y-6">
              <ShieldLogo className="h-16 w-16 mx-auto object-contain" />
              <div className="space-y-2">
                <h2 className="font-display font-bold text-2xl tracking-tight">Access Dashboard</h2>
                <p className="text-sm text-muted-foreground">
                  Authenticate using Discord to browse servers you manage or join your crew's
                  private platform.
                </p>
              </div>
              <Button
                onClick={handleLogin}
                size="lg"
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold gap-3 shadow-glow py-6"
              >
                <Bot className="h-5 w-5" />
                Sign in with Discord
              </Button>
              <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                By logging in, you agree to connect your Discord ID and public guild list to secure
                your session.
              </p>
            </Card>
          ) : (
            /* Logged in state: Servers list and Join Crew */
            <div className="space-y-6">
              {/* Joined servers list */}
              <Card className="border-border/60 bg-panel shadow-elevated p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                    <Server className="h-4 w-4 text-primary" />
                    Your Crews
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRegister(!showRegister)}
                    className="h-8 text-xs font-semibold text-primary hover:text-primary/80 hover:bg-primary/10 gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    {showRegister ? "View Crews" : "Register Server"}
                  </Button>
                </div>

                {showRegister ? (
                  /* Register New Guild Section (Owners Only) */
                  <div className="space-y-3 pt-2">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      If you invited the bot to your guild, enter its details below to provision and
                      register it on our dashboard.
                    </p>
                    <div className="space-y-2.5">
                      <Input
                        placeholder="Discord Server ID (e.g., 123456789...)"
                        value={newGuildId}
                        onChange={(e) => setNewGuildId(e.target.value)}
                        className="bg-background/50 text-sm"
                      />
                      <Input
                        placeholder="Server Display Name"
                        value={newGuildName}
                        onChange={(e) => setNewGuildName(e.target.value)}
                        className="bg-background/50 text-sm"
                      />
                      <Button
                        onClick={handleRegisterServer}
                        disabled={registering}
                        className="w-full bg-primary font-bold text-xs"
                      >
                        {registering ? "Registering Server..." : "Provision Server Settings"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Server cards list */
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {joinedServers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center bg-background/20 rounded-xl border border-dashed border-border/40">
                        <AlertTriangle className="h-5 w-5 text-muted-foreground mb-2" />
                        <p className="text-xs font-semibold">No crews connected</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Use a join code below to gain entry
                        </p>
                      </div>
                    ) : (
                      joinedServers.map((srv) => {
                        const guild = srv.guilds;
                        if (!guild) return null;
                        const initials = guild.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase();

                        return (
                          <div
                            key={srv.guild_id}
                            onClick={() =>
                              navigate({
                                to: `/dashboard/$guildId/overview`,
                                params: { guildId: guild.id },
                              })
                            }
                            className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-secondary/20 hover:bg-secondary/40 transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {guild.icon ? (
                                <img
                                  src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                                  alt={guild.name}
                                  className="h-8 w-8 rounded-md object-cover border border-border/40"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-md bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                                  {initials}
                                </div>
                              )}
                              <div className="min-w-0 leading-tight">
                                <p className="text-xs font-bold truncate group-hover:text-primary transition-colors text-foreground">
                                  {guild.name}
                                </p>
                                <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                                  {srv.role === "owner"
                                    ? "👑 Owner"
                                    : srv.role === "admin"
                                      ? "🛡️ Admin"
                                      : "👥 Crew"}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </Card>

              {/* Join Code card */}
              <Card className="border-border/60 bg-panel shadow-elevated p-6 space-y-4">
                <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  Join a Recording Crew
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter your unique crew invite/join code below. This will link your Discord account
                  to the crew database roster.
                </p>

                <div className="flex gap-2.5">
                  <div className="relative flex-1">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="e.g. JOIN-XYZ"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      className="pl-9 bg-background/50 border-border/60 text-xs font-mono uppercase"
                    />
                  </div>
                  <Button
                    onClick={handleJoinByCode}
                    disabled={joining}
                    className="bg-primary font-bold px-4 text-xs"
                  >
                    {joining ? "Joining..." : "Join"}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Modern Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 mt-auto border-t border-border/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} RecAssistant. Built for ERLC Recording Crews. Not
          affiliated with Roblox or Discord.
        </p>
        <div className="flex items-center gap-6">
          <Link
            to="/terms"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            to="/privacy"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
