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
    
    // 1. Find the guild that matches the join_code
    const { data: guild, error: guildError } = await supabase
      .from("guild_setting")
      .select("guild_id")
      .eq("join_code", customKey)
      .maybeSingle();

    if (guild) {
      // 2. Get the current logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 3. Add user to the crew_members table
        const { error: insertError } = await supabase
          .from("crew_members")
          .insert({
            user_id: user.id,
            guild_id: guild.guild_id
          });

        if (!insertError) {
          navigate({ to: "/overview" });
        } else {
          console.error("Insert error:", insertError);
          alert("Error joining the server. You might already be a member.");
        }
      }
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
