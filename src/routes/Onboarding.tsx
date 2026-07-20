import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [customKey, setCustomKey] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    setLoading(true);
    // Finds the server where the entered key matches
    const { data, error } = await supabase
      .from("guilds")
      .select("guild_id")
      .eq("custom_key", customKey)
      .maybeSingle();

    if (data) {
      // Logic to add user to crew_members goes here
      navigate({ to: "/overview" });
    } else {
      alert("Invalid key. Please check with your server owner.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-3xl font-bold">Welcome to RecAssistant</h1>
        <p className="text-muted-foreground">Please join a server or invite RecAssistant to your server.</p>
        
        <div className="grid gap-4 p-4 border rounded-lg bg-card">
          <Input 
            placeholder="Enter server key to join" 
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value)}
          />
          <Button onClick={handleJoin} disabled={loading}>
            {loading ? "Joining..." : "Join Server"}
          </Button>
        </div>

        <div className="grid gap-4">
          <Button onClick={() => window.open("https://discord.com/oauth2/authorize?client_id=1528299078914543758&permissions=8&integration_type=0&scope=bot", "_blank")}>
            Invite Bot to Server
          </Button>
        </div>
      </div>
    </div>
  );
}
