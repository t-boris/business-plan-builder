import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Cloud,
  Users,
  ShoppingBag,
  UtensilsCrossed,
  PartyPopper,
  Factory,
  Sparkles,
  Plus,
  Trash2,
  Briefcase,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useBusinesses } from "@/hooks/use-businesses";
import { BUSINESS_TYPE_TEMPLATES } from "@/lib/business-templates";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import { DeleteBusinessDialog } from "./delete-business-dialog";
import type { Business, BusinessType } from "@/types";

const ICON_MAP: Record<string, LucideIcon> = {
  Cloud,
  Users,
  ShoppingBag,
  UtensilsCrossed,
  PartyPopper,
  Factory,
  Sparkles,
};

/** Accent color per business type for left-border visual accent */
const TYPE_COLOR_MAP: Record<BusinessType, string> = {
  saas: "border-l-blue-500",
  service: "border-l-emerald-500",
  retail: "border-l-amber-500",
  restaurant: "border-l-orange-500",
  event: "border-l-purple-500",
  manufacturing: "border-l-slate-500",
  custom: "border-l-pink-500",
};

function getTemplateForType(type: BusinessType) {
  return BUSINESS_TYPE_TEMPLATES.find((t) => t.type === type);
}

function getIconForType(type: BusinessType): LucideIcon {
  const template = getTemplateForType(type);
  if (template && ICON_MAP[template.icon]) {
    return ICON_MAP[template.icon];
  }
  return Sparkles;
}

function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return "just now";

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

function LoadingSkeleton() {
  return (
    <div className="page-container">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card-elevated rounded-lg border-l-4 border-l-muted p-5">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-16 mt-1.5" />
              </div>
            </div>
            <Skeleton className="h-3.5 w-full mt-2" />
            <Skeleton className="h-3.5 w-3/4 mt-1" />
            <div className="flex items-center justify-between pt-3 mt-3 border-t">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface BusinessCardProps {
  business: Business;
  onSelect: () => void;
  onDelete: () => void;
}

function BusinessCard({ business, onSelect, onDelete }: BusinessCardProps) {
  const Icon = getIconForType(business.profile.type);
  const template = getTemplateForType(business.profile.type);
  const typeName = template?.name ?? "Custom";
  const sectionCount = business.enabledSections.length;
  const accentColor = TYPE_COLOR_MAP[business.profile.type] ?? "border-l-muted";

  return (
    <Card
      className={cn(
        "card-elevated cursor-pointer group border-l-4 p-5",
        accentColor
      )}
      onClick={onSelect}
    >
      <CardContent className="p-0">
        {/* Top row: icon + name + delete */}
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
            <Icon className="size-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold truncate">
              {business.profile.name}
            </h3>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground mt-0.5">
              {typeName}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>

        {/* Description */}
        {business.profile.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-3">
            {business.profile.description}
          </p>
        )}

        {/* Footer: sections + last updated */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 mt-3 border-t">
          <span>{sectionCount} of 9 sections</span>
          <span>{formatRelativeTime(business.updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function BusinessList() {
  const { businesses, isLoading, removeBusiness } =
    useBusinesses();
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<Business | null>(null);

  if (isLoading) return <LoadingSkeleton />;

  if (businesses.length === 0) {
    return (
      <div className="page-container">
        <PageHeader
          title="Your Businesses"
          description="Manage and access your business plans"
        />
        <EmptyState
          icon={Briefcase}
          title="No businesses yet"
          description="Create your first business plan to get started"
          action={{
            label: "Create Business",
            onClick: () => navigate("/businesses/new"),
          }}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Your Businesses"
        description="Manage and access your business plans"
      >
        <Button asChild>
          <Link to="/businesses/new">
            <Plus className="size-4" />
            New Business
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {businesses.map((business) => (
          <BusinessCard
            key={business.id}
            business={business}
            onSelect={() => {
              navigate(`/business/${business.id}`);
            }}
            onDelete={() => setDeleteTarget(business)}
          />
        ))}
      </div>

      <DeleteBusinessDialog
        business={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={async () => {
          if (deleteTarget) {
            await removeBusiness(deleteTarget.id);
            const remaining = businesses.filter((b) => b.id !== deleteTarget.id);
            if (remaining.length > 0) {
              navigate(`/business/${remaining[0].id}`);
            }
          }
        }}
      />
    </div>
  );
}
