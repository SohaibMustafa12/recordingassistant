import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDashboard } from "../$guildId";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Key,
  Trash2,
  Plus,
  Lock,
  Settings2,
  RefreshCw,
  ShieldAlert,
  Eye,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/$guildId/settings")({
  head: () => ({ meta: [{ title: "Settings — RecAssistant" }] }),
  component: Settings,
});

interface JoinCodeInfo {
  code: string;
  role: string;
  use_count: number;
  max_uses: number | null;
}

function Settings() {
  const { guildId, guild, isOwner, isAdmin, refresh } = useDashboard();

  // Settings Form State
  const [prefix, setPrefix] = useState(guild?.prefix || "!");
  const [recChannel, setRecChannel] = useState(guild?.recording_channel_id || "");
  const [attChannel, setAttChannel] = useState(guild?.attendance_channel_id || "");
  const [annChannel, setAnnChannel] = useState(guild?.announcement_channel_id || "");
  const [saving, setSaving] = useState(false);

  // Join Codes State
  const [joinCodes, setJoinCodes] = useState<JoinCodeInfo[]>([]);
  const [targetRole, setTargetRole] = useState<"crew" | "admin">("crew");
  const [generating, setGenerating] = useState(false);
  const [loadingCodes, setLoadingCodes] = useState(true);

  // Fetch existing join codes
  const fetchJoinCodes = async () => {
    try {
      setLoadingCodes(true);
      const { data, error } = await supabase
        .from("join_codes")
        .select("code, role, use_count, max_uses")
        .eq("guild_id", guildId);

      if (error) throw error;
      if (data) {
        setJoinCodes(data as JoinCodeInfo[]);
      }
    } catch (err) {
      console.error("Error fetching join codes:", err);
    } finally {
      setLoadingCodes(false);
    }
  };

  useEffect(() => {
    fetchJoinCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]);

  // Sync state if guild context updates
  useEffect(() => {
    if (guild) {
      setPrefix(guild.prefix);
      setRecChannel(guild.recording_channel_id || "");
      setAttChannel(guild.attendance_channel_id || "");
      setAnnChannel(guild.announcement_channel_id || "");
    }
  }, [guild]);

  // Save server configurations
  const handleSaveSettings = async () => {
    if (!prefix.trim()) {
      toast.error("Prefix cannot be empty.");
      return;
    }

    // Role Enforcement (RBAC):
    // Only Owners can change sensitive settings (prefix, logging channels).
    // Admins can change non-critical settings like recording channel.
    if (!isOwner && prefix !== guild?.prefix) {
      toast.error("Sensitive Change Blocked: Only server Owners can modify the command prefix.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("guilds")
        .update({
          prefix: prefix.trim(),
          recording_channel_id: recChannel.trim() || null,
          attendance_channel_id: attChannel.trim() || null,
          announcement_channel_id: annChannel.trim() || null,
        })
        .eq("id", guildId);

      if (error) throw error;

      toast.success("Settings updated successfully!");
      await refresh();
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Failed to update configurations.";
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  // Generate a new join code
  const handleGenerateCode = async () => {
    setGenerating(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      // Generate a clean, 6-character random code with prefix
      const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const code = `REC-${suffix}`;

      const { error } = await supabase.from("join_codes").insert({
        code,
        guild_id: guildId,
        role: targetRole,
        created_by: session.user.id,
      });

      if (error) throw error;

      toast.success(`Generated invite code: ${code}`);
      await fetchJoinCodes();
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Failed to generate invite code.";
      toast.error(errMsg);
    } finally {
      setGenerating(false);
    }
  };

  // Delete/Revoke a join code
  const handleDeleteCode = async (code: string) => {
    try {
      const { error } = await supabase.from("join_codes").delete().eq("code", code);

      if (error) throw error;

      toast.success("Invite code revoked");
      setJoinCodes((prev) => prev.filter((jc) => jc.code !== code));
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Failed to revoke code.";
      toast.error(errMsg);
    }
  };

  // Non-admin Access Restriction template fallback
  if (!isAdmin) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-5 rounded-full bg-destructive/10 p-4 text-destructive">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight">Access Restricted</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Settings are restricted to server Owners and Staff Admins. Please contact your crew
          manager if you need help with bot routing.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Server Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure integrations, commands, and secure invite keys for {guild?.name}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOwner ? (
            <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 animate-pulse" />
              Full Owner Access
            </span>
          ) : (
            <span className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Eye className="h-3 w-3" />
              Staff Administrator (Limited)
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Settings Configurations Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Guild settings */}
          <Card className="border-border/60 bg-panel p-6 space-y-5">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              Bot Configurations
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="prefix"
                  className="text-xs font-semibold flex items-center justify-between"
                >
                  <span>Command Prefix</span>
                  {!isOwner && (
                    <span className="text-[10px] text-destructive flex items-center gap-1">
                      <Lock className="h-2 w-2" /> Owner Only
                    </span>
                  )}
                </Label>
                <Input
                  id="prefix"
                  placeholder="e.g. !"
                  value={prefix}
                  disabled={!isOwner}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="bg-background/50 border-border/60 font-mono"
                />
                <p className="text-[10px] text-muted-foreground">
                  Used for triggering bot commands in text chats.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ann-channel">Announcement Channel ID</Label>
                  <Input
                    id="ann-channel"
                    placeholder="e.g. 10987654321..."
                    value={annChannel}
                    onChange={(e) => setAnnChannel(e.target.value)}
                    className="bg-background/50 border-border/60 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rec-channel">Recording Log Channel ID</Label>
                  <Input
                    id="rec-channel"
                    placeholder="e.g. 10987654321..."
                    value={recChannel}
                    onChange={(e) => setRecChannel(e.target.value)}
                    className="bg-background/50 border-border/60 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="att-channel">Attendance Logs Channel ID</Label>
                <Input
                  id="att-channel"
                  placeholder="e.g. 10987654321..."
                  value={attChannel}
                  onChange={(e) => setAttChannel(e.target.value)}
                  className="bg-background/50 border-border/60 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="font-bold bg-primary px-6"
              >
                {saving ? "Saving configurations..." : "Save Settings"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Join Codes Column */}
        <div className="space-y-6">
          <Card className="border-border/60 bg-panel p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              Invite Keys
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Generate invite codes to onboard crew members or sub-administrators onto the dashboard
              roster.
            </p>

            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Role Target</Label>
                <div className="flex gap-2">
                  <Button
                    variant={targetRole === "crew" ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setTargetRole("crew")}
                    className="flex-1 text-[11px] font-bold"
                  >
                    Crew Member
                  </Button>
                  <Button
                    variant={targetRole === "admin" ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setTargetRole("admin")}
                    className="flex-1 text-[11px] font-bold"
                  >
                    Administrator
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleGenerateCode}
                disabled={generating}
                className="w-full bg-primary font-bold text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                {generating ? "Generating..." : "Generate Code"}
              </Button>
            </div>

            <div className="border-t border-border/40 pt-4 space-y-2.5">
              <h3 className="text-xs font-bold text-foreground">Active Join Codes</h3>
              {loadingCodes ? (
                <div className="flex items-center gap-2 py-3 justify-center text-xs text-muted-foreground">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Loading keys...
                </div>
              ) : joinCodes.length === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center py-4 bg-background/30 rounded-lg border border-dashed border-border/40">
                  No active codes. Generate one above!
                </p>
              ) : (
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {joinCodes.map((jc) => (
                    <div
                      key={jc.code}
                      className="flex items-center justify-between p-2 rounded-lg border border-border/40 bg-background/40"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-bold text-primary tracking-wider">
                          {jc.code}
                        </p>
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mt-0.5">
                          Role:{" "}
                          <span
                            className={
                              jc.role === "admin"
                                ? "text-indigo-400 font-bold"
                                : "text-muted-foreground"
                            }
                          >
                            {jc.role}
                          </span>{" "}
                          &bull; Uses: {jc.use_count}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCode(jc.code)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                        title="Revoke code"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
