import { Routes, Route, Navigate, Outlet } from "react-router";
import { useAtomValue } from "jotai";
import { DashboardLayout } from "@/app/layout";
import { Dashboard } from "@/features/dashboard";
import { ExecutiveSummary } from "@/features/sections/executive-summary";
import { MarketAnalysis } from "@/features/sections/market-analysis";
import { ProductService } from "@/features/sections/product-service";
import { MarketingStrategy } from "@/features/sections/marketing-strategy";
import { Operations } from "@/features/sections/operations";
import { FinancialProjections } from "@/features/sections/financial-projections";
import { RisksDueDiligence } from "@/features/sections/risks-due-diligence";
import { KpisMetrics } from "@/features/sections/kpis-metrics";
import { LaunchPlan } from "@/features/sections/launch-plan";
import { Scenarios } from "@/features/scenarios";
import { Export } from "@/features/export";
import { BusinessList } from "@/features/businesses";
import { CreateBusiness } from "@/features/businesses/create-business";
import { LoginPage } from "@/features/auth/login-page";
import { authStatusAtom } from "@/store/auth-atoms";
import { activeBusinessIdAtom, businessesLoadedAtom } from "@/store/business-atoms";

function LoadingScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground text-lg font-bold animate-pulse">
          F
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function BusinessListLayout() {
  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto max-w-5xl p-6">
        <Outlet />
      </div>
    </div>
  );
}

export function AppRoutes() {
  const status = useAtomValue(authStatusAtom);
  const activeBusinessId = useAtomValue(activeBusinessIdAtom);
  const businessesLoaded = useAtomValue(businessesLoadedAtom);

  if (status === "loading") {
    return <LoadingScreen />;
  }

  if (status !== "authenticated") {
    return <LoginPage />;
  }

  return (
    <Routes>
      {/* Business management routes (no sidebar layout) */}
      <Route path="/businesses" element={<BusinessListLayout />}>
        <Route index element={<BusinessList />} />
        <Route path="new" element={<CreateBusiness />} />
      </Route>

      {/* Business plan routes (with sidebar layout) — redirect to /businesses if no active business */}
      <Route element={
        !businessesLoaded ? <LoadingScreen /> :
        !activeBusinessId ? <Navigate to="/businesses" replace /> :
        <DashboardLayout />
      }>
        <Route index element={<Dashboard />} />
        <Route path="executive-summary" element={<ExecutiveSummary />} />
        <Route path="market-analysis" element={<MarketAnalysis />} />
        <Route path="product-service" element={<ProductService />} />
        <Route path="marketing-strategy" element={<MarketingStrategy />} />
        <Route path="operations" element={<Operations />} />
        <Route path="financial-projections" element={<FinancialProjections />} />
        <Route path="risks-due-diligence" element={<RisksDueDiligence />} />
        <Route path="kpis-metrics" element={<KpisMetrics />} />
        <Route path="launch-plan" element={<LaunchPlan />} />
        <Route path="scenarios" element={<Scenarios />} />
        <Route path="export" element={<Export />} />
      </Route>
    </Routes>
  );
}
