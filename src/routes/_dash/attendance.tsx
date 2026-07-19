import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Download } from "lucide-react";
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

export const Route = createFileRoute("/_dash/attendance")({
  head: () => ({ meta: [{ title: "Attendance Logs — RecAssistant" }] }),
  component: Attendance,
});

function Attendance() {
  const logs: {
    id: string;
    title: string;
    date: string;
    host: string;
    attended: number;
    total: number;
  }[] = [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Attendance Logs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every recording session your crew has hosted.
          </p>
        </div>
        <Button variant="secondary" className="gap-2">
          <Download className="h-4 w-4" />
          Export to Excel / CSV
        </Button>
      </div>

      <Card className="border-border/60 bg-panel p-0">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
            <div className="mb-5 rounded-full bg-primary/10 p-5 text-primary">
              <ClipboardList className="h-7 w-7" />
            </div>
            <h3 className="font-display text-lg font-semibold">
              No recordings hosted yet
            </h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Invite the bot and use{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/start</code> in your
              Discord to host your first shoot!
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Host</TableHead>
                <TableHead className="text-right">Attendance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.title}</TableCell>
                  <TableCell>{l.date}</TableCell>
                  <TableCell>{l.host}</TableCell>
                  <TableCell className="text-right">
                    {l.attended} / {l.total}
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
