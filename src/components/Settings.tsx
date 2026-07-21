import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Settings() {
  const [channelId, setChannelId] = useState("");
  const [roleId, setRoleId] = useState("");

  const saveSettings = async () => {
    // This talks to the 'guild_settings' table you created!
    const { error } = await supabase
      .from("guild_settings")
      .update({
        announcement_channel_id: channelId,
        attendance_role_id: roleId,
      })
      .eq("guild_id", "YOUR_SERVER_ID"); // Replace this with the actual ID

    if (error) alert("Error saving: " + error.message);
    else alert("Settings saved!");
  };

  return (
    <div>
      <h1>Server Settings</h1>
      <input placeholder="Channel ID" onChange={(e) => setChannelId(e.target.value)} />
      <input placeholder="Role ID" onChange={(e) => setRoleId(e.target.value)} />
      <button onClick={saveSettings}>Save Settings</button>
    </div>
  );
}
