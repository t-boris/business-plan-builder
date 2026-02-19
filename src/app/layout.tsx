import { Outlet, useLocation, useParams } from "react-router";
import { useAtomValue } from "jotai";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { BusinessHeaderBar } from "@/components/business-header-bar";
import { SyncStatusIndicator } from "@/components/sync-status-indicator";
import { activeBusinessAtom } from "@/store/business-atoms";

// Slug-to-title mapping for business-scoped sections
const sectionTitles: Record<string, string> = {
  "executive-summary": "Executive Summary",
  "market-analysis": "Market Analysis",
  "product-service": "Product & Service",
  "marketing-strategy": "Marketing Strategy",
  "operations": "Operations",
  "financial-projections": "Financial Projections",
  "risks-due-diligence": "Risks & Due Diligence",
  "kpis-metrics": "KPIs & Metrics",
  "launch-plan": "Launch Plan",
  "scenarios": "Scenarios",
  "export": "Export",
};

export function DashboardLayout() {
  const location = useLocation();
  const { businessId } = useParams<{ businessId: string }>();
  const activeBusiness = useAtomValue(activeBusinessAtom);

  // Extract section slug from URL by stripping the /business/:id/ prefix
  const prefix = `/business/${businessId}`;
  const remainder = location.pathname.startsWith(prefix)
    ? location.pathname.slice(prefix.length).replace(/^\//, "")
    : "";
  const pageTitle = remainder
    ? sectionTitles[remainder] ?? "Page"
    : "Dashboard";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-6">
          <SidebarTrigger className="-ml-1 size-7" />
          <Separator orientation="vertical" className="mr-2 !h-4" />
          <Breadcrumb>
            <BreadcrumbList className="text-sm">
              {activeBusiness && (
                <>
                  <BreadcrumbItem>
                    <span className="text-muted-foreground font-normal">
                      {activeBusiness.profile.name}
                    </span>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="text-muted-foreground/50" />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">{pageTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            <SyncStatusIndicator />
          </div>
        </header>
        <BusinessHeaderBar />
        <div className="flex-1 px-6 py-5">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
