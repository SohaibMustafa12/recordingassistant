// onboarding.tsx
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// IMPORTANT: Import the client you defined in supabase.ts
import { supabase } from "@/lib/supabase"; 

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [customKey, setCustomKey] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    setLoading(true);
    
    // This query now uses the centralized 'supabase' instance
    const { data: guild, error: guildError } = await supabase
      .from("guild_setting")
      .select("guild_id")
      .eq("join_code", customKey)
      .maybeSingle();

    if (guild) {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error: insertError } = await supabase
          .from("crew_members")
          .insert({
            user_id: user.id,
            guild_id: guild.guild_id
          });

        if (!insertError) {
          navigate({ to: "/overview" });
        } else {
          alert("Error joining the server. You might already be a member.");
        }
      }
    } else {
      alert("Invalid key. Please check with your server owner.");
    }
    setLoading(false);
  };

  // ... (rest of your component code remains the same)
}
