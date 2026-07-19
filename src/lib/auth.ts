// Lightweight client-side auth stub for the pitch/demo.
// Replace with real Discord OAuth callback handling in production.
import { useEffect, useState } from "react";

const KEY = "recassistant.authed";

export function isAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "1";
}

export function setAuthed(v: boolean) {
  if (typeof window === "undefined") return;
  if (v) window.localStorage.setItem(KEY, "1");
  else window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("recassistant:auth"));
}

export function useAuth() {
  const [authed, setState] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setState(isAuthed());
    setReady(true);
    const on = () => setState(isAuthed());
    window.addEventListener("recassistant:auth", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("recassistant:auth", on);
      window.removeEventListener("storage", on);
    };
  }, []);
  return { authed, ready };
}

export const DISCORD_OAUTH_URL =
  "https://discord.com/oauth2/authorize?client_id=1528299078914543758&response_type=code&scope=identify+guilds&redirect_uri=https://recordingassistant.lovable.app";

