import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarClock,
  ClipboardList,
  Settings as SettingsIcon,
  LogOut,
  Server,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
// Updated import: Removed setAuthed, added logout
import { useAuth, logout } from "@/lib/auth";

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  
  // Grab the authenticated user's active Discord server and permission states
  const { currentServer, isAdmin, isOwner } = useAuth();

  // Helper to extract server name initials if no custom icon logo exists
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // Setup navigation options labeled with strict role restrictions
  const allItems = [
    { title: "Overview", url: "/overview", icon: LayoutDashboard, requiresAdmin: false },
    { title: "Scheduling Center", url: "/scheduling", icon: CalendarClock, requiresAdmin: false },
    { title: "Attendance Logs", url: "/attendance", icon: ClipboardList, requiresAdmin: true },
    { title: "Settings", url: "/settings", icon: SettingsIcon, requiresAdmin: true },
  ];

  // Filter items: Crew only sees non-admin routes; Owners/Admins see everything
  const visibleItems = allItems.filter(item => !item.requiresAdmin || isAdmin);

  // Secure logout handler
  const handleLogout = async () => {
    await logout();
    navigate({ to: "/" });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          {/* Dynamic Profile Branding Image or Placeholder initials */}
          {currentServer?.icon ? (
            <img 
              src={`https://cdn.discordapp.com/icons/${currentServer.id}/${currentServer.icon}.png`}
              alt={currentServer.name}
              className="h-9 w-9 rounded-md object-cover shrink-0 border border-sidebar-border"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary font-bold text-sm">
              {currentServer ? getInitials(currentServer.name) : <Server className="h-4 w-4" />}
            </div>
          )}
          
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden min-w-0">
            <span className="font-display text-sm font-bold tracking-tight truncate">
              {currentServer?.name || "RecAssistant"}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mt-0.5">
              {isOwner ? "👑 Owner View" : isAdmin ? "🛡️ Admin View" : "👥 Crew Hub"}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout} // Updated to use the secure logout handler
              tooltip="Sign out"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
