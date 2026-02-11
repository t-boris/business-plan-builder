import { Link, useLocation } from "react-router";
import { useCallback, useSyncExternalStore } from "react";
import {
  LayoutDashboard,
  FileText,
  TrendingUp,
  Package,
  Megaphone,
  Settings,
  DollarSign,
  ShieldAlert,
  BarChart3,
  Rocket,
  GitBranch,
  Download,
  Moon,
  Sun,
  LogOut,
  ChevronsUpDown,
  Plus,
  LayoutList,
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useBusinesses } from "@/hooks/use-businesses";
import { BUSINESS_TYPE_TEMPLATES } from "@/lib/business-templates";
import type { BusinessType } from "@/types";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  SidebarSeparator,
} from "@/components/ui/sidebar";

function useIsDark() {
  const subscribe = useCallback((cb: () => void) => {
    const obs = new MutationObserver(cb);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return useSyncExternalStore(subscribe, () =>
    document.documentElement.classList.contains("dark"),
  );
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

const overviewItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
];

const businessPlanItems = [
  { title: "Executive Summary", url: "/executive-summary", icon: FileText },
  { title: "Market Analysis", url: "/market-analysis", icon: TrendingUp },
  { title: "Product & Service", url: "/product-service", icon: Package },
  { title: "Marketing Strategy", url: "/marketing-strategy", icon: Megaphone },
  { title: "Operations", url: "/operations", icon: Settings },
  { title: "Financial Projections", url: "/financial-projections", icon: DollarSign },
  { title: "Risks & Due Diligence", url: "/risks-due-diligence", icon: ShieldAlert },
  { title: "KPIs & Metrics", url: "/kpis-metrics", icon: BarChart3 },
  { title: "Launch Plan", url: "/launch-plan", icon: Rocket },
];

const toolsItems = [
  { title: "Scenarios", url: "/scenarios", icon: GitBranch },
  { title: "Export", url: "/export", icon: Download },
];

function getTemplateName(type: BusinessType): string {
  const template = BUSINESS_TYPE_TEMPLATES.find((t) => t.type === type);
  return template?.name ?? "Business";
}

export function AppSidebar() {
  const location = useLocation();
  const isDark = useIsDark();
  const { user, signOut } = useAuth();
  const { businesses, activeBusiness, switchBusiness } = useBusinesses();
  const templateName = activeBusiness
    ? getTemplateName(activeBusiness.profile.type)
    : "";

  const isActive = (url: string) => {
    if (url === "/") {
      return location.pathname === "/";
    }
    return location.pathname === url;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-sm font-semibold">
                    {activeBusiness?.profile.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {activeBusiness?.profile.name ?? "Select Business"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {activeBusiness ? templateName : "No business selected"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="start" className="w-64">
                {businesses.map((business) => (
                  <DropdownMenuItem
                    key={business.id}
                    onClick={() => switchBusiness(business.id)}
                    className={cn(activeBusiness?.id === business.id && "bg-accent")}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded bg-muted text-xs font-medium">
                        {business.profile.name[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="grid text-sm leading-tight">
                        <span className="truncate font-medium">{business.profile.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{getTemplateName(business.profile.type)}</span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/businesses/new" className="flex items-center gap-2">
                    <Plus className="size-4" />
                    <span>New Business</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/businesses" className="flex items-center gap-2">
                    <LayoutList className="size-4" />
                    <span>All Businesses</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {overviewItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Business Plan</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {businessPlanItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip={user?.displayName ?? user?.email ?? "Account"}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-medium">
                    {(user?.displayName?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.displayName ?? "User"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.displayName ?? "User"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleTheme} tooltip={isDark ? "Light mode" : "Dark mode"}>
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton disabled className="cursor-default opacity-60">
              <span className="text-xs text-muted-foreground">v1.0.0</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
