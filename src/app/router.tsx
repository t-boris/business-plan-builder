import { useEffect } from "react";
import { Routes, Route, Navigate, Outlet, useParams, Link } from "react-router";
import { useAtomValue, useSetAtom } from "jotai";
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
import { GrowthTimeline } from "@/features/sections/growth-timeline";
import { Scenarios } from "@/features/scenarios";
import { Export } from "@/features/export";
import { BusinessList } from "@/features/businesses";
import { CreateBusiness } from "@/features/businesses/create-business";
import { LoginPage } from "@/features/auth/login-page";
import { AcceptInvite } from "@/features/sharing/accept-invite";
import { authStatusAtom } from "@/store/auth-atoms";
import {
  activeBusinessIdAtom,
  businessListAtom,
  businessesLoadedAtom,
} from "@/store/business-atoms";
import { Button } from "@/components/ui/button";

function LoadingScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground animate-pulse">
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
          </svg>
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

function BusinessNotFoundPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <div className="mx-auto max-w-md text-center space-y-4">
        <div className="text-4xl font-bold text-muted-foreground">404</div>
        <h1 className="text-xl font-semibold">Business not found</h1>
        <p className="text-sm text-muted-foreground">
          The business you are looking for does not exist or you do not have
          access to it.
        </p>
        <Button asChild>
          <Link to="/businesses">Go to Your Businesses</Link>
        </Button>
      </div>
    </div>
  );
}

function BusinessContextLayout() {
  const { businessId } = useParams<{ businessId: string }>();
  const businesses = useAtomValue(businessListAtom);
  const businessesLoaded = useAtomValue(businessesLoadedAtom);
  const setActiveBusinessId = useSetAtom(activeBusinessIdAtom);

  // Sync URL param -> atom + localStorage (URL is source of truth)
  useEffect(() => {
    if (businessId) {
      setActiveBusinessId(businessId);
      localStorage.setItem("active-business-id", businessId);
    }
  }, [businessId, setActiveBusinessId]);

  // Loading state: businesses not yet loaded from Firestore
  if (!businessesLoaded) return <LoadingScreen />;

  // Validate business exists in user's list
  const businessExists = businesses.some((b) => b.id === businessId);
  if (!businessExists) return <BusinessNotFoundPage />;

  return <DashboardLayout />;
}

function RootRedirect() {
  const businesses = useAtomValue(businessListAtom);
  const businessesLoaded = useAtomValue(businessesLoadedAtom);

  if (!businessesLoaded) return <LoadingScreen />;

  // Try localStorage first, then first business in list
  const storedId = localStorage.getItem("active-business-id");
  const targetId =
    storedId && businesses.some((b) => b.id === storedId)
      ? storedId
      : businesses[0]?.id;

  if (targetId) return <Navigate to={`/business/${targetId}`} replace />;
  return <Navigate to="/businesses" replace />;
}

export function AppRoutes() {
  const status = useAtomValue(authStatusAtom);

  if (status === "loading") {
    return <LoadingScreen />;
  }

  if (status !== "authenticated") {
    // Render routes for unauthenticated users: invite acceptance + login fallback
    return (
      <Routes>
        <Route path="/invite/:inviteId" element={<AcceptInvite />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Root redirect */}
      <Route index element={<RootRedirect />} />

      {/* Invite acceptance (no sidebar layout) */}
      <Route path="/invite/:inviteId" element={<AcceptInvite />} />

      {/* Business management routes (no sidebar layout) */}
      <Route path="/businesses" element={<BusinessListLayout />}>
        <Route index element={<BusinessList />} />
        <Route path="new" element={<CreateBusiness />} />
      </Route>

      {/* Business-scoped routes (with sidebar layout) */}
      <Route path="/business/:businessId" element={<BusinessContextLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="executive-summary" element={<ExecutiveSummary />} />
        <Route path="market-analysis" element={<MarketAnalysis />} />
        <Route path="product-service" element={<ProductService />} />
        <Route path="marketing-strategy" element={<MarketingStrategy />} />
        <Route path="operations" element={<Operations />} />
        <Route path="financial-projections" element={<FinancialProjections />} />
        <Route path="growth-timeline" element={<GrowthTimeline />} />
        <Route path="risks-due-diligence" element={<RisksDueDiligence />} />
        <Route path="kpis-metrics" element={<KpisMetrics />} />
        <Route path="launch-plan" element={<LaunchPlan />} />
        <Route path="scenarios" element={<Scenarios />} />
        <Route path="export" element={<Export />} />
      </Route>

      {/* Catch-all: redirect to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
