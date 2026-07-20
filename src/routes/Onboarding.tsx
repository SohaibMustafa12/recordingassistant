import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  const navigate = useNavigate(); // This was missing!

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-3xl font-bold">Welcome to RecAssistant</h1>
        <p className="text-muted-foreground">What would you like to do?</p>
        
        <div className="grid gap-4">
          <Button onClick={() => window.location.href = "YOUR_DISCORD_INVITE_LINK"}>
            Invite Bot to Server
          </Button>
          
          <Button variant="outline" onClick={() => navigate({ to: "/join-request" })}>
            Join an Existing Server
          </Button>
        </div>
      </div>
    </div>
  );
}
