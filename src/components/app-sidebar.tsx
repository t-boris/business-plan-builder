import { Link, useLocation, useNavigate, useParams } from "react-router";
import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
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
  Milestone,
  GitBranch,
  Download,
  Upload,
  FileJson,
  Moon,
  Sun,
  LogOut,
  ChevronsUpDown,
  Plus,
  LayoutList,
  Share2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useBusinesses } from "@/hooks/use-businesses";
import { ShareDialog } from "@/features/sharing/share-dialog";
import { BUSINESS_TYPE_TEMPLATES } from "@/lib/business-templates";
import {
  exportBusinessData,
  downloadJson,
  generateExportSchema,
  importBusinessData,
  validateExportBundle,
} from "@/lib/business-json";
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

interface NavItem {
  title: string;
  slug: string;
  icon: LucideIcon;
}

const businessPlanItemDefs: NavItem[] = [
  { title: "Executive Summary", slug: "executive-summary", icon: FileText },
  { title: "Market Analysis", slug: "market-analysis", icon: TrendingUp },
  { title: "Product & Service", slug: "product-service", icon: Package },
  { title: "Marketing Strategy", slug: "marketing-strategy", icon: Megaphone },
  { title: "Operations", slug: "operations", icon: Settings },
  { title: "Financial Projections", slug: "financial-projections", icon: DollarSign },
  { title: "Growth Timeline", slug: "growth-timeline", icon: Milestone },
  { title: "Risks & Due Diligence", slug: "risks-due-diligence", icon: ShieldAlert },
  { title: "KPIs & Metrics", slug: "kpis-metrics", icon: BarChart3 },
  { title: "Launch Plan", slug: "launch-plan", icon: Rocket },
];

const toolsItemDefs: NavItem[] = [
  { title: "Scenarios", slug: "scenarios", icon: GitBranch },
  { title: "Export", slug: "export", icon: Download },
];

function getTemplateName(type: BusinessType): string {
  const template = BUSINESS_TYPE_TEMPLATES.find((t) => t.type === type);
  return template?.name ?? "Business";
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { businessId } = useParams<{ businessId: string }>();
  const isDark = useIsDark();
  const { user, signOut } = useAuth();
  const { businesses, activeBusiness } = useBusinesses();
  const templateName = activeBusiness
    ? getTemplateName(activeBusiness.profile.type)
    : "";

  // Current user's role for the active business
  const userRole = activeBusiness && user ? activeBusiness.roles[user.uid] : null;

  // JSON import/export state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  async function handleExportData() {
    if (!businessId || !activeBusiness) return;
    try {
      const bundle = await exportBusinessData(businessId);
      const safeName = activeBusiness.profile.name.replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'business';
      downloadJson(bundle, `${safeName}-export.json`);
    } catch {
      alert('Failed to export business data.');
    }
  }

  function handleExportSchema() {
    const schema = generateExportSchema();
    downloadJson(schema, 'business-plan-schema.json');
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;
    // Reset input so the same file can be re-selected
    e.target.value = '';

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!validateExportBundle(data)) {
        alert('Invalid file format. Please select a valid business plan export file.');
        return;
      }

      const confirmed = window.confirm(
        'This will overwrite all current business data (profile, sections, variables, and scenarios). This action cannot be undone.\n\nContinue?'
      );
      if (!confirmed) return;

      setImporting(true);
      await importBusinessData(businessId, data);
      // Force full reload to pick up all changes
      window.location.reload();
    } catch {
      alert('Failed to import business data. Please check the file format.');
    } finally {
      setImporting(false);
    }
  }

  // Filter business plan items by enabledSections
  const filteredBusinessPlanItems = useMemo(() => {
    if (!activeBusiness) return businessPlanItemDefs;
    const enabled = activeBusiness.enabledSections;
    return businessPlanItemDefs.filter((item) => enabled.includes(item.slug));
  }, [activeBusiness]);

  // Build URLs with business prefix
  const dashboardUrl = `/business/${businessId}`;

  const isActive = (slug: string | null) => {
    if (slug === null) {
      // Dashboard: exact match on /business/:id
      return location.pathname === `/business/${businessId}`;
    }
    return location.pathname === `/business/${businessId}/${slug}`;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="transition-colors duration-150">
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
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="start" className="w-64">
                {businesses.map((business) => (
                  <DropdownMenuItem
                    key={business.id}
                    onClick={() => {
                      navigate(`/business/${business.id}`);
                    }}
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
                {activeBusiness && userRole === "owner" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleExportData}>
                      <Download className="size-4" />
                      <span>Export Data</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportSchema}>
                      <FileJson className="size-4" />
                      <span>Export Schema</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => fileInputRef.current?.click()}
                      disabled={importing}
                    >
                      <Upload className="size-4" />
                      <span>{importing ? "Importing..." : "Import Data"}</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(null)}
                  tooltip="Dashboard"
                  className="transition-colors duration-150"
                >
                  <Link to={dashboardUrl}>
                    <LayoutDashboard className="size-4" />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Business Plan
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredBusinessPlanItems.map((item) => (
                <SidebarMenuItem key={item.slug}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.slug)}
                    tooltip={item.title}
                    className="transition-colors duration-150"
                  >
                    <Link to={`/business/${businessId}/${item.slug}`}>
                      <item.icon className="size-4" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsItemDefs.map((item) => (
                <SidebarMenuItem key={item.slug}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.slug)}
                    tooltip={item.title}
                    className="transition-colors duration-150"
                  >
                    <Link to={`/business/${businessId}/${item.slug}`}>
                      <item.icon className="size-4" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {userRole === "owner" && (
                <SidebarMenuItem>
                  <ShareDialog>
                    <SidebarMenuButton tooltip="Share" className="transition-colors duration-150">
                      <Share2 className="size-4" />
                      <span className="font-medium">Share</span>
                    </SidebarMenuButton>
                  </ShareDialog>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-3 pb-1 group-data-[collapsible=icon]:hidden">
          <span className="text-[10px] text-muted-foreground/50">v{__APP_VERSION__}</span>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip={user?.displayName ?? user?.email ?? "Account"}
                  className="transition-colors duration-150"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
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
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.displayName ?? "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleTheme}>
                  {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  {isDark ? "Light Mode" : "Dark Mode"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      {/* Hidden file input for JSON import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportFile}
      />
    </Sidebar>
  );
}
