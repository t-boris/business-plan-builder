import { Routes, Route } from "react-router";
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

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
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
