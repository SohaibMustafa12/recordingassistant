import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth, inviteBot } from "@/lib/auth"; // Added inviteBot here

export const Route = createFileRoute("/_dash")({
  component: DashLayout,
});

function DashLayout() {
  const { authed, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !authed) navigate({ to: "/", replace: true });
  }, [ready, authed, navigate]);

  if (!ready || !authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Checking session…</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/60 bg-background/70 px-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                Bot online
              </div>
            </div>
            
            {/* This is your new invite button */}
            <button 
              onClick={inviteBot}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-md transition-colors"
            >
              Invite Bot to Server
            </button>
          </header>
          <main className="flex-1 p-6 md:p-10">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
