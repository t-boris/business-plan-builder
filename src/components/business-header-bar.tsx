import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useBusinesses } from "@/hooks/use-businesses";
import { SECTION_SLUGS, SECTION_LABELS } from "@/lib/constants";
import { BUSINESS_TYPE_TEMPLATES } from "@/lib/business-templates";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { BusinessType } from "@/types";

export function BusinessHeaderBar() {
  const { activeBusiness, updateProfile, toggleSection } = useBusinesses();
  const [isOpen, setIsOpen] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Local state for profile fields (controlled inputs)
  const [localName, setLocalName] = useState("");
  const [localType, setLocalType] = useState<BusinessType>("custom");
  const [localIndustry, setLocalIndustry] = useState("");
  const [localLocation, setLocalLocation] = useState("");
  const [localDescription, setLocalDescription] = useState("");

  // Reset local state when activeBusiness changes
  useEffect(() => {
    if (activeBusiness) {
      setLocalName(activeBusiness.profile.name);
      setLocalType(activeBusiness.profile.type);
      setLocalIndustry(activeBusiness.profile.industry);
      setLocalLocation(activeBusiness.profile.location);
      setLocalDescription(activeBusiness.profile.description);
    }
  }, [activeBusiness?.id]);

  // Debounced auto-save for profile fields (500ms)
  useEffect(() => {
    if (!activeBusiness) return;

    const profile = activeBusiness.profile;
    const hasChanges =
      localName !== profile.name ||
      localType !== profile.type ||
      localIndustry !== profile.industry ||
      localLocation !== profile.location ||
      localDescription !== profile.description;

    if (!hasChanges) return;

    const timer = setTimeout(() => {
      updateProfile({
        name: localName,
        type: localType,
        industry: localIndustry,
        location: localLocation,
        description: localDescription,
      });
      // Show "Saved" indicator briefly
      setShowSaved(true);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setShowSaved(false), 2000);
    }, 500);

    return () => clearTimeout(timer);
  }, [localName, localType, localIndustry, localLocation, localDescription]);

  // Cleanup save timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  if (!activeBusiness) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={`border-b transition-colors ${isOpen ? "bg-muted/30" : ""}`}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex h-10 w-full items-center justify-between px-6 text-sm hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium truncate">
                {activeBusiness.profile.name}
              </span>
              {showSaved && (
                <span className="text-xs text-muted-foreground animate-in fade-in duration-200">
                  Saved
                </span>
              )}
            </div>
            <ChevronDown
              className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180"
              data-state={isOpen ? "open" : "closed"}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="grid gap-6 px-6 py-4 md:grid-cols-2">
            {/* Left column: Profile fields */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Business Name
                </label>
                <Input
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  placeholder="Enter business name"
                  className="h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Business Type
                  </label>
                  <Select
                    value={localType}
                    onValueChange={(value: BusinessType) => setLocalType(value)}
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPE_TEMPLATES.map((template) => (
                        <SelectItem key={template.type} value={template.type}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Industry
                  </label>
                  <Input
                    value={localIndustry}
                    onChange={(e) => setLocalIndustry(e.target.value)}
                    placeholder="e.g., Technology"
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Location
                </label>
                <Input
                  value={localLocation}
                  onChange={(e) => setLocalLocation(e.target.value)}
                  placeholder="e.g., New York, NY"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Description
                </label>
                <Textarea
                  value={localDescription}
                  onChange={(e) => setLocalDescription(e.target.value)}
                  placeholder="Brief description of your business"
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Right column: Section toggles */}
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Sections
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Toggle sections for this business
                </p>
              </div>

              <div className="grid gap-1">
                {SECTION_SLUGS.map((slug) => (
                  <div
                    key={slug}
                    className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <label
                      className="text-sm cursor-pointer"
                      htmlFor={`section-${slug}`}
                    >
                      {SECTION_LABELS[slug]}
                    </label>
                    <Switch
                      id={`section-${slug}`}
                      checked={activeBusiness.enabledSections.includes(slug)}
                      onCheckedChange={() => toggleSection(slug)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
