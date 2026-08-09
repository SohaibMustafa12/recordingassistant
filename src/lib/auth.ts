import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
  const {
    data: { session },
  } = await supabase.auth.getSession();
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
    provider: "discord",
    options: {
      scopes: "identify guilds",
      redirectTo: `${window.location.origin}/auth/callback`,
    },
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthedState(!!session);
      setServerState(getCurrentServer());
      if (event === "SIGNED_OUT") {
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
    isCrew: currentServer?.role === "crew",
  };
}
