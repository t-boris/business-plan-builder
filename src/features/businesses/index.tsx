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
  type LucideIcon,
} from "lucide-react";
import { useBusinesses } from "@/hooks/use-businesses";
import { BUSINESS_TYPE_TEMPLATES } from "@/lib/business-templates";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="py-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-32" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto max-w-md text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome to Business Planner
          </h1>
          <p className="text-muted-foreground">
            Create your first business plan to get started. Each business gets
            its own sections, scenarios, and financial projections.
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/businesses/new">Create Your First Business Plan</Link>
        </Button>
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

  return (
    <Card
      className="py-4 cursor-pointer transition-colors hover:bg-accent/50"
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
          <CardTitle className="truncate text-base">
            {business.profile.name}
          </CardTitle>
        </div>
        <CardAction>
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <span
          className={cn(
            "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
            "bg-secondary text-secondary-foreground"
          )}
        >
          {typeName}
        </span>
        {business.profile.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {business.profile.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>{sectionCount} of 9 sections</span>
          <span>{formatRelativeTime(business.updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function BusinessList() {
  const { businesses, isLoading, switchBusiness, removeBusiness } =
    useBusinesses();
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<Business | null>(null);

  if (isLoading) return <LoadingSkeleton />;
  if (businesses.length === 0) return <EmptyState />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Your Businesses</h1>
        <Button asChild>
          <Link to="/businesses/new">
            <Plus className="h-4 w-4" />
            New Business
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {businesses.map((business) => (
          <BusinessCard
            key={business.id}
            business={business}
            onSelect={() => {
              switchBusiness(business.id);
              navigate("/");
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
          }
        }}
      />
    </div>
  );
}
