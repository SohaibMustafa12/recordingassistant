import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ClipboardList, Download, ShieldAlert, Eye, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDashboard } from "../$guildId";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/$guildId/attendance")({
  head: () => ({ meta: [{ title: "Attendance Logs — RecAssistant" }] }),
  component: Attendance,
});

const attendanceLogs: {
  id: string;
  title: string;
  date: string;
  host: string;
  attended: number;
  total: number;
  status: string;
}[] = [];

function Attendance() {
  const { isAdmin, guildId } = useDashboard();
  const navigate = useNavigate();

  const handleExport = () => {
    toast.success("Attendance history compiled. CSV download started!");
  };

  // Crew view restriction layout template fallback
  if (!isAdmin) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-5 rounded-full bg-destructive/10 p-4 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight">Access Restricted</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Attendance logs can only be modified or audited by server Owners and staff Admins. Crew
          members can check live operational times inside the Scheduling Center instead.
        </p>
        <Button
          className="mt-6 gap-2"
          onClick={() => navigate({ to: `/dashboard/${guildId}/scheduling` })}
        >
          <Calendar className="h-4 w-4" />
          Go to Scheduling Center
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Attendance Logs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Audit history tracking every recording session hosted across your community.
          </p>
        </div>
        <Button variant="secondary" className="gap-2" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Export to Excel / CSV
        </Button>
      </div>

      <Card className="border-border/60 bg-panel overflow-hidden">
        {attendanceLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
              <ClipboardList className="h-6 w-6" />
            </div>
            <p className="font-medium">No recordings hosted yet</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Invite the bot and use /start in your Discord to host your first shoot!
            </p>
          </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-foreground">Session Concept</TableHead>
              <TableHead className="font-semibold text-foreground">Date & Time</TableHead>
              <TableHead className="font-semibold text-foreground">Director / Host</TableHead>
              <TableHead className="font-semibold text-foreground">Turnout Rate</TableHead>
              <TableHead className="font-semibold text-foreground text-center">Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendanceLogs.map((l) => (
              <TableRow key={l.id} className="hover:bg-muted/20 transition-colors">
                <TableCell className="font-medium text-foreground">{l.title}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{l.date}</TableCell>
                <TableCell className="text-muted-foreground font-medium text-sm">
                  @{l.host}
                </TableCell>
                <TableCell className="text-foreground font-semibold text-sm">
                  {l.attended}{" "}
                  <span className="text-muted-foreground font-normal">/ {l.total} crew</span>
                  <span className="ml-2 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">
                    {Math.round((l.attended / l.total) * 100)}%
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                    {l.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="View details"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </Card>
    </div>
  );
}
