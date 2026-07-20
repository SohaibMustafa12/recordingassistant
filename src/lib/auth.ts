import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Permanent keys to bypass environment variable issues
const supabaseUrl = "https://tymnibaiwcyrthqpxffq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bW5pYmFpd2N5cnRocXB4ZmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1MzQxNDMsImV4cCI6MjEwMDExMDE0M30.keoeiHA6OquVObbD9jqBGDFKpzjhkGcFWAIpi30Cvh4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SERVER_KEY = "recassistant.current_server";

export interface DiscordUser {
  id: string;
  username: string;
  avatar: string;
}

export interface DiscordServer {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  role: "owner" | "admin" | "crew";
}

export async function isAuthed(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

export function getCurrentServer(): DiscordServer | null {
  if (typeof window === "undefined") return null;
  const data = window.localStorage.getItem(SERVER_KEY);
  return data ? JSON.parse(data) : null;
}

export function setCurrentServer(server: DiscordServer) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SERVER_KEY, JSON.stringify(server));
  window.dispatchEvent(new Event("recassistant:auth"));
}

export async function logout() {
  await supabase.auth.signOut();
  window.localStorage.removeItem(SERVER_KEY);
  window.dispatchEvent(new Event("recassistant:auth"));
}

export async function loginWithDiscord() {
  await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      scopes: 'identify guilds',
      redirectTo: window.location.origin,
    }
  });
}

// Function to invite the bot to the server
export function inviteBot() {
  const clientId = "1528299078914543758";
  const permissions = "8";
  const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot%20applications.commands&prompt=consent`;
  
  window.open(inviteUrl, "_blank");
}

export function useAuth() {
  const [authed, setAuthedState] = useState(false);
  const [ready, setReady] = useState(false);
  const [currentServer, setServerState] = useState<DiscordServer | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthedState(!!session);
      setServerState(getCurrentServer());
      setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthedState(!!session);
      setServerState(getCurrentServer());
      if (event === 'SIGNED_OUT') {
        window.localStorage.removeItem(SERVER_KEY);
      }
    });

    const onCustomServerChange = () => {
      setServerState(getCurrentServer());
    };

    window.addEventListener("recassistant:auth", onCustomServerChange);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("recassistant:auth", onCustomServerChange);
    };
  }, []);

  return { 
    authed, 
    ready, 
    currentServer,
    isOwner: currentServer?.role === "owner",
    isAdmin: currentServer?.role === "admin" || currentServer?.role === "owner",
    isCrew: currentServer?.role === "crew"
  };
}
