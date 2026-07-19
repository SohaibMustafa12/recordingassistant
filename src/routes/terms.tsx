import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "./privacy";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — RecAssistant" },
      { name: "description", content: "Terms governing your use of RecAssistant." },
    ],
  }),
  component: Terms,
});

const sections = [
  {
    h: "1. Acceptance",
    p: "By adding RecAssistant to your Discord server or signing into the dashboard, you agree to these Terms of Service.",
  },
  {
    h: "2. Acceptable Use",
    p: "You may not use RecAssistant to harass members, evade Discord's Terms of Service, or automate abuse. We reserve the right to remove the bot from servers that violate these rules.",
  },
  {
    h: "3. Service Availability",
    p: "RecAssistant is provided \"as is\". We aim for high uptime but do not guarantee uninterrupted service.",
  },
  {
    h: "4. Content Ownership",
    p: "You retain full rights to your recordings and crew data. The bot facilitates coordination; it does not claim ownership of your content.",
  },
  {
    h: "5. Limitation of Liability",
    p: "To the maximum extent permitted by law, RecAssistant and its operators are not liable for indirect or consequential damages arising from use of the service.",
  },
  {
    h: "6. Changes",
    p: "We may update these terms as the product evolves. Continued use after changes constitutes acceptance.",
  },
];

function Terms() {
  return <LegalPage title="Terms of Service" updated="July 19, 2026" sections={sections} />;
}
