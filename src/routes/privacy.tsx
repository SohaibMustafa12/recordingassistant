import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ShieldLogo } from "@/components/ShieldLogo";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — RecAssistant" },
      { name: "description", content: "How RecAssistant handles your data." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return <LegalPage title="Privacy Policy" updated="July 19, 2026" sections={sections} />;
}

const sections = [
  {
    h: "1. Overview",
    p: "RecAssistant (\"we\", \"our\", \"the bot\") is a Discord bot built for ERLC recording crews. This Privacy Policy explains what information we collect, how it's used, and the choices you have.",
  },
  {
    h: "2. Information We Collect",
    p: "We collect only what's needed to operate the service: your Discord user ID, server ID, role IDs, channel IDs, and metadata about recording sessions you host or attend (title, timestamps, participants).",
  },
  {
    h: "3. How We Use Data",
    p: "Session data powers the dashboard: rosters, attendance logs, scheduling, and analytics for your server. We do not sell or share your data with third parties for marketing.",
  },
  {
    h: "4. Data Retention",
    p: "Session and attendance data are retained for as long as the bot remains in your server. Removing the bot deletes associated records within 30 days.",
  },
  {
    h: "5. Your Rights",
    p: "You may request export or deletion of your data at any time by contacting the crew owner or opening a ticket in our support server.",
  },
  {
    h: "6. Contact",
    p: "Questions? Reach out via the support channel linked from the dashboard.",
  },
];

function LegalPage({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: { h: string; p: string }[];
}) {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 bg-hero" />
      <div className="relative mx-auto max-w-3xl px-6 py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>

        <div className="mt-8 flex items-center gap-4">
          <ShieldLogo className="h-12 w-12" />
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              RecAssistant · Legal
            </p>
            <h1 className="font-display text-4xl font-bold tracking-tight">{title}</h1>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: {updated}</p>

        <div className="mt-10 space-y-8 rounded-2xl border border-border/60 bg-panel p-8 leading-relaxed">
          {sections.map((s) => (
            <section key={s.h} className="space-y-2">
              <h2 className="font-display text-lg font-semibold text-foreground">
                {s.h}
              </h2>
              <p className="text-sm text-muted-foreground">{s.p}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export { LegalPage };
