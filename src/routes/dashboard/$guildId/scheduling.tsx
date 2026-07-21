import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useDashboard } from "../$guildId";

export const Route = createFileRoute("/dashboard/$guildId/scheduling")({
  head: () => ({ meta: [{ title: "Scheduling Center — RecAssistant" }] }),
  component: Scheduling,
});

type Shoot = { id: string; title: string; when: string; description: string; guildId: string };

const STORAGE_KEY = "recassistant:shoots";

function loadShoots(guildId: string): Shoot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Only return shoots for this active guild/tenant!
    return parsed.filter((s: Shoot) => s.guildId === guildId);
  } catch {
    return [];
  }
}

function formatWhen(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Scheduling() {
  const { guildId } = useDashboard();
  const [title, setTitle] = useState("");
  const [dt, setDt] = useState("");
  const [desc, setDesc] = useState("");

  const [shoots, setShoots] = useState<Shoot[]>(() => loadShoots(guildId));

  // Load shoots when guild changes
  useEffect(() => {
    setShoots(loadShoots(guildId));
  }, [guildId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dt) {
      toast.error("Add a video title and date/time to schedule a shoot.");
      return;
    }
    const shoot: Shoot = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: title.trim(),
      when: dt,
      description: desc.trim(),
      guildId,
    };

    const allRaw = window.localStorage.getItem(STORAGE_KEY);
    let allShoots: Shoot[] = [];
    try {
      allShoots = allRaw ? JSON.parse(allRaw) : [];
      if (!Array.isArray(allShoots)) allShoots = [];
    } catch {
      allShoots = [];
    }

    const updatedAll = [...allShoots, shoot];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAll));

    setShoots((prev) => [...prev, shoot].sort((a, b) => a.when.localeCompare(b.when)));
    setTitle("");
    setDt("");
    setDesc("");
    toast.success("Shoot scheduled");
  };

  const removeShoot = (id: string) => {
    const allRaw = window.localStorage.getItem(STORAGE_KEY);
    let allShoots: Shoot[] = [];
    try {
      allShoots = allRaw ? JSON.parse(allRaw) : [];
      if (!Array.isArray(allShoots)) allShoots = [];
    } catch {
      allShoots = [];
    }

    const updatedAll = allShoots.filter((s) => s.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAll));

    setShoots((prev) => prev.filter((s) => s.id !== id));
    toast.success("Shoot removed");
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold tracking-tight">Scheduling Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">Plan your next ERLC roleplay shoot.</p>
        </div>

        <Card className="border-border/60 bg-panel p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="title">Video Title</Label>
              <Input
                id="title"
                placeholder="e.g. Highway Pursuit — Night Shift"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dt">Date & Time</Label>
              <Input
                id="dt"
                type="datetime-local"
                value={dt}
                onChange={(e) => setDt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                rows={4}
                placeholder="Scene overview, roles needed, key beats…"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Schedule Shoot
            </Button>
          </form>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <div className="mb-6">
          <h2 className="font-display text-xl font-semibold">Upcoming Shoots</h2>
          <p className="mt-1 text-sm text-muted-foreground">Auto-announced to your crew.</p>
        </div>

        <Card className="border-border/60 bg-panel p-6">
          {shoots.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-background/30 px-6 py-14 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                <CalendarClock className="h-6 w-6" />
              </div>
              <p className="font-medium">No shoots scheduled</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your upcoming productions will appear here.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {shoots.map((s) => (
                <li
                  key={s.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{formatWhen(s.when)}</p>
                    {s.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/80">
                        {s.description}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove shoot"
                    onClick={() => removeShoot(s.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
