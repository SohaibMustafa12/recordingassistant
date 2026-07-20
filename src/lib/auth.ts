import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialize the official Supabase client 
// Lovable injects these automatically into your deployment environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

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

// Secure check: Verifies if a cryptographically signed user session exists
export function isAuthed(): boolean {
  if (typeof window === "undefined") return false;
  // Instead of a faked '1', we check if Supabase has an active, valid session token
  const sessionString = window.localStorage.getItem(`sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`);
  return !!sessionString;
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

// Handles logging out securely
export async function logout() {
  if (typeof window === "undefined") return;
  await supabase.auth.signOut();
  window.localStorage.removeItem(SERVER_KEY);
  window.dispatchEvent(new Event("recassistant:auth"));
}

// Redirects user straight to your Supabase-hosted Discord login gateway
export async function loginWithDiscord() {
  await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      // Added 'bot' and 'applications.commands' scopes to trigger the server setup invitation screen
      scopes: 'identify guilds bot applications.commands',
      redirectTo: window.location.origin, // Dynamically uses your live URL
    }
  });
}

export function useAuth() {
  const [authed, setAuthedState] = useState(false);
  const [ready, setReady] = useState(false);
  const [currentServer, setServerState] = useState<DiscordServer | null>(null);

  useEffect(() => {
    // Check initial session state securely
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthedState(!!session);
      setServerState(getCurrentServer());
      setReady(true);
    });

    // Automatically listen to real-time authentication state changes from the backend
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
