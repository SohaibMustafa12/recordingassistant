// Upgraded Discord OAuth handler for RecAssistant
import { useEffect, useState } from "react";

const AUTH_KEY = "recassistant.authed";
const USER_KEY = "recassistant.user";
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

export function isAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(AUTH_KEY) === "1";
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

export function setAuthed(v: boolean, userData?: DiscordUser, serverData?: DiscordServer) {
  if (typeof window === "undefined") return;
  if (v) {
    window.localStorage.setItem(AUTH_KEY, "1");
    if (userData) window.localStorage.setItem(USER_KEY, JSON.stringify(userData));
    if (serverData) window.localStorage.setItem(SERVER_KEY, JSON.stringify(serverData));
  } else {
    window.localStorage.removeItem(AUTH_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(SERVER_KEY);
  }
  window.dispatchEvent(new Event("recassistant:auth"));
}

export function useAuth() {
  const [authed, setState] = useState(false);
  const [ready, setReady] = useState(false);
  const [currentServer, setServerState] = useState<DiscordServer | null>(null);

  useEffect(() => {
    setState(isAuthed());
    setServerState(getCurrentServer());
    setReady(true);

    const on = () => {
      setState(isAuthed());
      setServerState(getCurrentServer());
    };

    window.addEventListener("recassistant:auth", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("recassistant:auth", on);
      window.removeEventListener("storage", on);
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

// Your actual client credentials URL configuration
export const DISCORD_OAUTH_URL =
  "https://discord.com/oauth2/authorize?client_id=1528299078914543758&response_type=code&scope=identify+guilds&redirect_uri=https://recordingassistant.lovable.app/";
