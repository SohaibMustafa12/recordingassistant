import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

// THIS IS THE MISSING PIECE FOR ERROR #419
export const Route = createFileRoute("/join")({
  component: JoinPage,
});

function JoinPage() {
  const navigate = useNavigate();
  const [customKey, setCustomKey] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    setLoading(true);
    
    const { data: guild } = await supabase
      .from("guild_setting")
      .select("guild_id")
      .eq("join_code", customKey)
      .maybeSingle();

    if (guild) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: insertError } = await supabase
          .from("crew_members")
          .insert({ user_id: user.id, guild_id: guild.guild_id });

        if (!insertError) navigate({ to: "/overview" });
        else alert("Error joining. You might already be a member.");
      }
    } else {
      alert("Invalid key.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <h1 className="text-3xl font-bold">Join Server</h1>
        <Input 
          placeholder="Enter server key" 
          value={customKey}
          onChange={(e) => setCustomKey(e.target.value)}
        />
        <Button onClick={handleJoin} disabled={loading}>
          {loading ? "Joining..." : "Join Server"}
        </Button>
      </div>
    </div>
  );
}
