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
  ArrowLeft,
  Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { BUSINESS_TYPE_TEMPLATES } from "@/lib/business-templates";
import { useBusinesses } from "@/hooks/use-businesses";
import { cn } from "@/lib/utils";
import type { BusinessType } from "@/types";

const iconMap: Record<string, LucideIcon> = {
  Cloud,
  Users,
  ShoppingBag,
  UtensilsCrossed,
  PartyPopper,
  Factory,
  Sparkles,
};

/** Icon background color per business type */
const TYPE_ICON_BG: Record<BusinessType, string> = {
  saas: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  service: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  retail: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  restaurant: "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  event: "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
  manufacturing: "bg-slate-100 text-slate-600 dark:bg-slate-950 dark:text-slate-400",
  custom: "bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-400",
};

export function CreateBusiness() {
  const [selectedType, setSelectedType] = useState<BusinessType | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const { createNewBusiness } = useBusinesses();
  const navigate = useNavigate();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedType || !name.trim()) return;
    setError("");
    setIsCreating(true);
    try {
      const newId = await createNewBusiness(name.trim(), selectedType, description.trim());
      navigate(`/business/${newId}`);
    } catch (err) {
      console.error("Business creation error:", err);
      setError(`Failed to create business: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back link */}
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground">
          <Link to="/businesses">
            <ArrowLeft className="size-4" />
            Back to businesses
          </Link>
        </Button>

        <PageHeader
          title="Create Business"
          description="Choose a template and name your business"
        />

        {/* Template picker */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Business type
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {BUSINESS_TYPE_TEMPLATES.map((template) => {
              const Icon = iconMap[template.icon] ?? Sparkles;
              const isSelected = selectedType === template.type;
              const iconBg = TYPE_ICON_BG[template.type] ?? "bg-muted text-muted-foreground";
              return (
                <button
                  key={template.type}
                  type="button"
                  onClick={() => setSelectedType(template.type)}
                  className={cn(
                    "card-elevated text-left rounded-lg p-4 transition-all",
                    isSelected
                      ? "ring-2 ring-primary border-primary/50 bg-primary/5"
                      : "hover:border-primary/30"
                  )}
                >
                  <div className={cn(
                    "flex size-10 items-center justify-center rounded-full mb-3",
                    iconBg
                  )}>
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-sm font-medium">{template.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {template.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {template.defaultSections.length} sections
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Business details form */}
        {selectedType && (
          <div className="border-t pt-8">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">
              Business details
            </h2>
            <form onSubmit={handleCreate} className="max-w-md space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="business-name"
                  className="text-sm font-medium leading-none"
                >
                  Business Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="business-name"
                  placeholder="e.g. My Coffee Shop"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="business-description"
                  className="text-sm font-medium leading-none"
                >
                  Description{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </label>
                <Textarea
                  id="business-description"
                  placeholder="What does this business do?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  A brief summary helps AI generate better suggestions.
                </p>
              </div>
              {error && (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" className="w-full sm:w-auto" disabled={isCreating || !name.trim()}>
                  {isCreating ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Business"
                  )}
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/businesses">Cancel</Link>
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
