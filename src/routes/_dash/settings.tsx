import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_dash/settings")({
  head: () => ({ meta: [{ title: "Settings — RecAssistant" }] }),
  component: Settings,
});

function EmptySelect({ placeholder }: { placeholder: string }) {
  return (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none" disabled>
          Sync your Discord server to populate
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

function Settings() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wire up RecAssistant to your Discord server.
        </p>
      </div>

      <Card className="border-border/60 bg-panel p-6">
        <h2 className="font-display text-lg font-semibold">Roles</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose who can host recordings and who counts toward attendance.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Crew Staff Role</Label>
            <EmptySelect placeholder="Select a role" />
          </div>
          <div className="space-y-2">
            <Label>Crew Member Role</Label>
            <EmptySelect placeholder="Select a role" />
          </div>
        </div>
      </Card>

      <Card className="border-border/60 bg-panel p-6">
        <h2 className="font-display text-lg font-semibold">Channels</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Where the bot posts announcements and logs.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Announcement Channel</Label>
            <EmptySelect placeholder="Select a channel" />
          </div>
          <div className="space-y-2">
            <Label>Log Channel</Label>
            <EmptySelect placeholder="Select a channel" />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button>Save Changes</Button>
      </div>
    </div>
  );
}
