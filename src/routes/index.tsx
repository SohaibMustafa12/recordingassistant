import { useState, useEffect } from "react"; // Add this
import { supabase } from "@/lib/supabase"; // Make sure this path is correct

function LoginPage() {
  const { authed, ready, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleRedirect = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    
    // 1. Check the crew_members table to see if this user is already in a server
    const { data: memberData } = await supabase
      .from('crew_members')
      .select('guild_id')
      .eq('user_id', user.id)
      .maybeSingle(); // Use maybeSingle() to avoid errors if no row is found

    // 2. If they are in a server, send to overview. If not, send to onboarding.
    if (memberData) {
      navigate({ to: "/overview" });
    } else {
      navigate({ to: "/onboarding" });
    }
  };

  useEffect(() => {
    if (ready && authed) {
      handleRedirect();
    }
  }, [ready, authed]);

  // If loading, you might want to show a simple spinner
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    // ... rest of your existing JSX for the Login Page ...
  );
}
