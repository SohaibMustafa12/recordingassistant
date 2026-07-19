import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarClock, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_dash/scheduling")({
  head: () => ({ meta: [{ title: "Scheduling Center — RecAssistant" }] }),
  component: Scheduling,
});

function Scheduling() {
  const [title, setTitle] = useState("");
  const [dt, setDt] = useState("");
  const [desc, setDesc] = useState("");
  const shoots: { id: string; title: string; when: string }[] = [];

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold tracking-tight">Scheduling Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan your next ERLC roleplay shoot.
          </p>
        </div>

        <Card className="border-border/60 bg-panel p-6">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
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
                <li key={s.id} className="rounded-lg border border-border/60 p-3">
                  <p className="font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.when}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
