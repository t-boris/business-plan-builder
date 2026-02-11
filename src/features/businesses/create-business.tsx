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
      await createNewBusiness(name.trim(), selectedType, description.trim());
      navigate("/");
    } catch {
      setError("Failed to create business. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="size-4" />
            Back to businesses
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            Create a new business plan
          </h1>
          <p className="mt-1 text-muted-foreground">
            Choose a business type to get started with a tailored template.
          </p>
        </div>

        {/* Step 1: Template picker */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">
            Business type
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BUSINESS_TYPE_TEMPLATES.map((template) => {
              const Icon = iconMap[template.icon] ?? Sparkles;
              return (
                <button
                  key={template.type}
                  type="button"
                  onClick={() => setSelectedType(template.type)}
                  className={cn(
                    "text-left rounded-lg border p-4 transition-all hover:border-primary/50",
                    selectedType === template.type
                      ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                      : "border-border"
                  )}
                >
                  <Icon className="size-8 mb-3 text-primary" />
                  <h3 className="font-semibold">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
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

        {/* Step 2: Business details form */}
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
                  Business name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="business-name"
                  placeholder="e.g. My Coffee Shop"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="business-description"
                  className="text-sm font-medium leading-none"
                >
                  Brief description{" "}
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
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={isCreating || !name.trim()}>
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
                  <Link to="/">Cancel</Link>
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
