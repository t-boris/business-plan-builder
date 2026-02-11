import { Outlet, useLocation } from "react-router";
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
import { activeBusinessAtom } from "@/store/business-atoms";

const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/businesses": "Your Businesses",
  "/businesses/new": "New Business",
  "/executive-summary": "Executive Summary",
  "/market-analysis": "Market Analysis",
  "/product-service": "Product & Service",
  "/marketing-strategy": "Marketing Strategy",
  "/operations": "Operations",
  "/financial-projections": "Financial Projections",
  "/risks-due-diligence": "Risks & Due Diligence",
  "/kpis-metrics": "KPIs & Metrics",
  "/launch-plan": "Launch Plan",
  "/scenarios": "Scenarios",
  "/export": "Export",
};

export function DashboardLayout() {
  const location = useLocation();
  const activeBusiness = useAtomValue(activeBusinessAtom);
  const pageTitle = routeTitles[location.pathname] ?? "Page";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 !h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {activeBusiness && (
                <>
                  <BreadcrumbItem>
                    <span className="text-muted-foreground">{activeBusiness.profile.name}</span>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
