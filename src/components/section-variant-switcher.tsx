import { useState, useEffect, useCallback } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { scenarioVariantRefsAtom } from '@/store/scenario-atoms';
import { activeBusinessIdAtom } from '@/store/business-atoms';
import {
  listSectionVariants,
  saveSectionVariant,
  type SectionVariant,
} from '@/lib/business-firestore';
import { useCanEdit } from '@/hooks/use-business-role';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Camera, Layers } from 'lucide-react';
import type { SectionSlug } from '@/types/plan';

const VARIANT_SECTIONS: SectionSlug[] = [
  'product-service',
  'operations',
  'marketing-strategy',
];

interface SectionVariantSwitcherProps {
  sectionSlug: SectionSlug;
}

export function SectionVariantSwitcher({ sectionSlug }: SectionVariantSwitcherProps) {
  const businessId = useAtomValue(activeBusinessIdAtom);
  const [variantRefs, setVariantRefs] = useAtom(scenarioVariantRefsAtom);
  const canEdit = useCanEdit();
  const [variants, setVariants] = useState<SectionVariant[]>([]);
  const [loading, setLoading] = useState(true);

  const isSupported = VARIANT_SECTIONS.includes(sectionSlug);

  const loadVariants = useCallback(async () => {
    if (!businessId || !isSupported) {
      setVariants([]);
      setLoading(false);
      return;
    }
    try {
      const list = await listSectionVariants(businessId, sectionSlug);
      setVariants(list);
    } catch {
      // Silently handle — empty list
    } finally {
      setLoading(false);
    }
  }, [businessId, sectionSlug, isSupported]);

  useEffect(() => {
    loadVariants();
  }, [loadVariants]);

  const handleSelect = useCallback((value: string) => {
    if (value === '__base__') {
      setVariantRefs((prev) => {
        const next = { ...prev };
        delete next[sectionSlug];
        return next;
      });
    } else {
      setVariantRefs((prev) => ({ ...prev, [sectionSlug]: value }));
    }
  }, [sectionSlug, setVariantRefs]);

  const handleSnapshot = useCallback(async () => {
    if (!businessId) return;
    const name = window.prompt('Variant name:');
    if (!name?.trim()) return;

    try {
      const snap = await getDoc(
        doc(db, 'businesses', businessId, 'sections', sectionSlug)
      );
      if (!snap.exists()) {
        window.alert('No section data to snapshot.');
        return;
      }

      const variant: SectionVariant = {
        id: crypto.randomUUID(),
        name: name.trim(),
        data: snap.data() as Record<string, unknown>,
        createdAt: new Date().toISOString(),
      };

      await saveSectionVariant(businessId, sectionSlug, variant);
      setVariantRefs((prev) => ({ ...prev, [sectionSlug]: variant.id }));
      await loadVariants();
    } catch {
      window.alert('Failed to create snapshot.');
    }
  }, [businessId, sectionSlug, setVariantRefs, loadVariants]);

  if (!isSupported || loading) return null;

  const selectedVariantId = variantRefs[sectionSlug];

  return (
    <div className="flex items-center gap-1.5">
      <Layers className="size-3.5 text-muted-foreground" />
      <Select
        value={selectedVariantId ?? '__base__'}
        onValueChange={handleSelect}
        disabled={!canEdit}
      >
        <SelectTrigger className="h-7 text-xs w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__base__">
            Base data
          </SelectItem>
          {variants.map((v) => (
            <SelectItem key={v.id} value={v.id}>
              {v.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {canEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSnapshot}
          className="h-7 text-xs px-2"
          title="Snapshot current data as variant"
        >
          <Camera className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
