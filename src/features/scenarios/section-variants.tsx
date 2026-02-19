import { useState, useEffect, useCallback } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { scenarioVariantRefsAtom } from '@/store/scenario-atoms';
import { activeBusinessIdAtom } from '@/store/business-atoms';
import {
  listSectionVariants,
  saveSectionVariant,
  deleteSectionVariant,
  type SectionVariant,
} from '@/lib/business-firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Camera, X, Layers } from 'lucide-react';
import type { SectionSlug } from '@/types/plan';

// --- Supported section config ---

interface SupportedSection {
  slug: SectionSlug;
  label: string;
}

const SUPPORTED_SECTIONS: SupportedSection[] = [
  { slug: 'product-service', label: 'Product & Service' },
  { slug: 'operations', label: 'Operations' },
  { slug: 'marketing-strategy', label: 'Marketing Strategy' },
];

// --- Component ---

interface SectionVariantsProps {
  canEdit: boolean;
}

export function SectionVariants({ canEdit }: SectionVariantsProps) {
  const businessId = useAtomValue(activeBusinessIdAtom);
  const [variantRefs, setVariantRefs] = useAtom(scenarioVariantRefsAtom);

  // Variants loaded per section: sectionSlug -> SectionVariant[]
  const [variantsBySection, setVariantsBySection] = useState<
    Record<string, SectionVariant[]>
  >({});
  const [loading, setLoading] = useState(true);

  // Load variants for all supported sections on mount
  const loadVariants = useCallback(async () => {
    if (!businessId) {
      setVariantsBySection({});
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const entries = await Promise.all(
        SUPPORTED_SECTIONS.map(async (s) => {
          const variants = await listSectionVariants(businessId, s.slug);
          return [s.slug, variants] as [string, SectionVariant[]];
        })
      );
      setVariantsBySection(Object.fromEntries(entries));
    } catch {
      // Silently handle — variants will show as empty
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadVariants();
  }, [loadVariants]);

  // Snapshot current section data as a named variant
  const handleSnapshot = async (sectionSlug: string) => {
    if (!businessId) return;
    const name = window.prompt('Variant name:');
    if (!name?.trim()) return;

    try {
      // Load current section data from Firestore
      const snap = await getDoc(
        doc(db, 'businesses', businessId, 'sections', sectionSlug)
      );
      if (!snap.exists()) {
        window.alert('No section data found to snapshot.');
        return;
      }

      const sectionData = snap.data() as Record<string, unknown>;

      const variant: SectionVariant = {
        id: crypto.randomUUID(),
        name: name.trim(),
        data: sectionData,
        createdAt: new Date().toISOString(),
      };

      await saveSectionVariant(businessId, sectionSlug, variant);
      await loadVariants();
    } catch {
      window.alert('Failed to create variant snapshot.');
    }
  };

  // Select a variant for a section
  const handleSelect = (sectionSlug: string, variantId: string) => {
    setVariantRefs({ ...variantRefs, [sectionSlug]: variantId });
  };

  // Clear variant selection for a section
  const handleClear = (sectionSlug: string) => {
    const next = { ...variantRefs };
    delete next[sectionSlug];
    setVariantRefs(next);
  };

  // Delete a variant
  const handleDelete = async (sectionSlug: string, variantId: string) => {
    if (!businessId) return;
    if (!window.confirm('Delete this variant? This cannot be undone.')) return;

    try {
      await deleteSectionVariant(businessId, sectionSlug, variantId);

      // If this variant was selected, clear the selection
      if (variantRefs[sectionSlug] === variantId) {
        handleClear(sectionSlug);
      }

      await loadVariants();
    } catch {
      window.alert('Failed to delete variant.');
    }
  };

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Loading section variants...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Layers className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">Section Variants</h3>
      </div>

      <p className="text-xs text-muted-foreground">
        Snapshot current section data as named variants and select them per
        scenario to model different business configurations.
      </p>

      {/* Section cards */}
      {SUPPORTED_SECTIONS.map((section) => {
        const variants = variantsBySection[section.slug] ?? [];
        const selectedVariantId = variantRefs[section.slug];
        const selectedVariant = variants.find((v) => v.id === selectedVariantId);

        return (
          <Card key={section.slug} className="p-4 space-y-3">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">{section.label}</h4>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSnapshot(section.slug)}
                  className="h-7 text-xs"
                >
                  <Camera className="size-3.5 mr-1" />
                  Snapshot current
                </Button>
              )}
            </div>

            {/* Current selection */}
            <div className="flex items-center gap-2">
              {selectedVariant ? (
                <>
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {selectedVariant.name}
                  </span>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClear(section.slug)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-3" />
                    </Button>
                  )}
                </>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Using base data
                </span>
              )}
            </div>

            {/* Variant picker */}
            {variants.length > 0 && (
              <div className="flex items-center gap-2">
                <Select
                  value={selectedVariantId ?? ''}
                  onValueChange={(v) => {
                    if (v) handleSelect(section.slug, v);
                  }}
                  disabled={!canEdit}
                >
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue placeholder="Select a variant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {variants.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Variant list with delete buttons */}
            {canEdit && variants.length > 0 && (
              <div className="border-t pt-2 mt-2 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                  Available variants
                </p>
                {variants.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between text-xs py-1"
                  >
                    <span className={v.id === selectedVariantId ? 'font-medium text-primary' : 'text-muted-foreground'}>
                      {v.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(section.slug, v.id)}
                      className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state for no variants */}
            {variants.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                No variants yet.{' '}
                {canEdit && 'Use "Snapshot current" to create one.'}
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
