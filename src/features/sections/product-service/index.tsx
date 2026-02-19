import { useState, useEffect } from 'react';
import { useSection } from '@/hooks/use-section';
import { useAiSuggestion } from '@/hooks/use-ai-suggestion';
import { isAiAvailable } from '@/lib/ai/gemini-client';
import { AiActionBar } from '@/components/ai-action-bar';
import { AiSuggestionPreview } from '@/components/ai-suggestion-preview';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { normalizeProductService } from './normalize';
import type { ProductService as ProductServiceType, Offering, AddOn } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, AlertCircle, Package as PackageIcon, Gift, Link } from 'lucide-react';

const defaultProductService: ProductServiceType = { offerings: [], addOns: [], overview: '' };

export function ProductService() {
  const { data: rawData, updateData, isLoading, canEdit } = useSection<ProductServiceType>(
    'product-service',
    defaultProductService
  );
  const aiSuggestion = useAiSuggestion<ProductServiceType>('product-service');

  // Track which offering has its add-on selector open (by offering id)
  const [openAddonSelector, setOpenAddonSelector] = useState<string | null>(null);

  // Normalize legacy data on first load
  const [normalized, setNormalized] = useState(false);
  useEffect(() => {
    if (!isLoading && !normalized) {
      const norm = normalizeProductService(rawData);
      if (JSON.stringify(norm) !== JSON.stringify(rawData)) {
        updateData(() => norm);
      }
      setNormalized(true);
    }
  }, [isLoading, normalized, rawData, updateData]);

  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader title="Product & Service" description="Offerings, pricing, and add-ons" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const isPreview = aiSuggestion.state.status === 'preview';
  const displayData = isPreview && aiSuggestion.state.suggested
    ? aiSuggestion.state.suggested
    : rawData;

  function handleAccept() {
    const suggested = aiSuggestion.accept();
    if (suggested) {
      updateData(() => suggested);
    }
  }

  // --- Offering CRUD ---

  function addOffering() {
    updateData((prev) => ({
      ...prev,
      offerings: [
        ...prev.offerings,
        { id: crypto.randomUUID(), name: '', description: '', price: 0, addOnIds: [] },
      ],
    }));
  }

  function removeOffering(index: number) {
    updateData((prev) => ({
      ...prev,
      offerings: prev.offerings.filter((_, i) => i !== index),
    }));
  }

  function updateOffering(index: number, field: keyof Offering, value: string | number | null | string[]) {
    updateData((prev) => {
      const offerings = [...prev.offerings];
      offerings[index] = { ...offerings[index], [field]: value };
      return { ...prev, offerings };
    });
  }

  // --- Add-on CRUD ---

  function addAddOn() {
    updateData((prev) => ({
      ...prev,
      addOns: [...prev.addOns, { id: crypto.randomUUID(), name: '', price: 0 }],
    }));
  }

  function removeAddOn(index: number) {
    updateData((prev) => {
      const removedId = prev.addOns[index]?.id;
      // Clean up references from all offerings
      const offerings = removedId
        ? prev.offerings.map((o) => ({
            ...o,
            addOnIds: o.addOnIds.filter((aid) => aid !== removedId),
          }))
        : prev.offerings;
      return {
        ...prev,
        offerings,
        addOns: prev.addOns.filter((_, i) => i !== index),
      };
    });
  }

  function updateAddOn(index: number, field: keyof AddOn, value: string | number) {
    updateData((prev) => {
      const addOns = [...prev.addOns];
      addOns[index] = { ...addOns[index], [field]: value };
      return { ...prev, addOns };
    });
  }

  function toggleAddOnLink(offeringIndex: number, addOnId: string) {
    updateData((prev) => {
      const offerings = [...prev.offerings];
      const offering = offerings[offeringIndex];
      const ids = offering.addOnIds.includes(addOnId)
        ? offering.addOnIds.filter((id) => id !== addOnId)
        : [...offering.addOnIds, addOnId];
      offerings[offeringIndex] = { ...offering, addOnIds: ids };
      return { ...prev, offerings };
    });
  }

  const sectionContent = (
    <div className="space-y-6">
      {/* Overview */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Overview</label>
        <Textarea
          value={displayData.overview ?? ''}
          onChange={(e) => updateData((prev) => ({ ...prev, overview: e.target.value }))}
          placeholder="Describe your product or service line..."
          rows={4}
          readOnly={!canEdit || isPreview}
        />
      </div>

      {/* Offerings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Offerings</h2>
          {canEdit && !isPreview && (
            <Button variant="outline" size="sm" onClick={addOffering}>
              <Plus className="size-4" />
              Add Offering
            </Button>
          )}
        </div>
        {displayData.offerings.length === 0 ? (
          <EmptyState
            icon={PackageIcon}
            title="No offerings yet"
            description="Use AI Generate to create offerings, or add them manually."
            action={canEdit && !isPreview ? { label: 'Add Offering', onClick: addOffering } : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayData.offerings.map((offering, offeringIndex) => (
              <div key={offering.id ?? offeringIndex} className="card-elevated rounded-lg group">
                <div className="px-5 pt-4 pb-5 space-y-4">
                  {/* Header with name and delete */}
                  <div className="flex items-start justify-between gap-2">
                    <Input
                      value={offering.name}
                      onChange={(e) => updateOffering(offeringIndex, 'name', e.target.value)}
                      placeholder="Offering name"
                      readOnly={!canEdit || isPreview}
                      className="text-base font-semibold border-0 px-0 shadow-none focus-visible:ring-0 h-auto"
                    />
                    {canEdit && !isPreview && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1"
                        onClick={() => removeOffering(offeringIndex)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    )}
                  </div>

                  {/* Price row */}
                  <div className="flex items-center gap-2">
                    {offering.price !== null ? (
                      <>
                        <div className="relative w-[120px] shrink-0">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                          <Input
                            type="number"
                            className="pl-7"
                            value={offering.price}
                            onChange={(e) => updateOffering(offeringIndex, 'price', Number(e.target.value))}
                            readOnly={!canEdit || isPreview}
                          />
                        </div>
                        <Input
                          value={offering.priceLabel ?? ''}
                          onChange={(e) => updateOffering(offeringIndex, 'priceLabel', e.target.value)}
                          placeholder="e.g. per month"
                          readOnly={!canEdit || isPreview}
                          className="flex-1 text-sm"
                        />
                      </>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium">
                        On request
                      </span>
                    )}
                  </div>

                  {/* Image upload — added in Plan 05 */}

                  {/* Description */}
                  <Textarea
                    value={offering.description}
                    onChange={(e) => updateOffering(offeringIndex, 'description', e.target.value)}
                    placeholder="Describe this offering..."
                    rows={4}
                    readOnly={!canEdit || isPreview}
                  />

                  {/* Linked Add-ons */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {offering.addOnIds.length > 0 ? (
                        offering.addOnIds.map((addOnId) => {
                          const addOn = displayData.addOns.find((a) => a.id === addOnId);
                          return addOn ? (
                            <span key={addOnId} className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
                              {addOn.name}
                            </span>
                          ) : null;
                        })
                      ) : (
                        <span className="text-xs text-muted-foreground">No add-ons linked</span>
                      )}
                      {canEdit && !isPreview && (
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-5 px-1.5 text-xs"
                          onClick={() =>
                            setOpenAddonSelector(
                              openAddonSelector === offering.id ? null : offering.id
                            )
                          }
                        >
                          <Link className="size-3" />
                          Link Add-ons
                        </Button>
                      )}
                    </div>
                    {openAddonSelector === offering.id && canEdit && !isPreview && (
                      <div className="rounded-md border bg-background p-2 space-y-1">
                        {displayData.addOns.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-1">
                            Create add-ons first in the catalog below
                          </p>
                        ) : (
                          displayData.addOns.map((addOn) => (
                            <label
                              key={addOn.id}
                              className="flex items-center gap-2 text-sm rounded px-1 py-0.5 hover:bg-accent cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={offering.addOnIds.includes(addOn.id)}
                                onChange={() => toggleAddOnLink(offeringIndex, addOn.id)}
                                className="rounded"
                              />
                              <span>{addOn.name}</span>
                              <span className="text-muted-foreground ml-auto">
                                ${addOn.price}
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add-ons Catalog */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Add-ons</h2>
          {canEdit && !isPreview && (
            <Button variant="outline" size="sm" onClick={addAddOn}>
              <Plus className="size-4" />
              Add Add-on
            </Button>
          )}
        </div>
        {displayData.addOns.length === 0 ? (
          <EmptyState
            icon={Gift}
            title="No add-ons yet"
            description="Create optional extras that can be linked to your offerings."
            action={canEdit && !isPreview ? { label: 'Add Add-on', onClick: addAddOn } : undefined}
          />
        ) : (
          <div className="card-elevated rounded-lg divide-y">
            {displayData.addOns.map((addOn, index) => (
              <div key={addOn.id ?? index} className="flex items-center gap-4 px-5 py-3 group">
                <div className="flex-1">
                  <Input
                    value={addOn.name}
                    onChange={(e) => updateAddOn(index, 'name', e.target.value)}
                    placeholder="Add-on name"
                    readOnly={!canEdit || isPreview}
                    className="border-0 px-0 shadow-none focus-visible:ring-0"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    value={addOn.description ?? ''}
                    onChange={(e) => updateAddOn(index, 'description', e.target.value)}
                    placeholder="Optional description"
                    readOnly={!canEdit || isPreview}
                    className="border-0 px-0 shadow-none focus-visible:ring-0 text-sm"
                  />
                </div>
                <div className="relative w-[120px] shrink-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    type="number"
                    className="pl-7"
                    value={addOn.price}
                    onChange={(e) => updateAddOn(index, 'price', Number(e.target.value))}
                    readOnly={!canEdit || isPreview}
                  />
                </div>
                <div className="w-[100px] shrink-0">
                  <Input
                    value={addOn.priceLabel ?? ''}
                    onChange={(e) => updateAddOn(index, 'priceLabel', e.target.value)}
                    placeholder="e.g. per unit"
                    readOnly={!canEdit || isPreview}
                    className="text-sm"
                  />
                </div>
                {canEdit && !isPreview && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeAddOn(index)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <PageHeader title="Product & Service" description="Offerings, pricing, and add-ons">
        {canEdit && (
          <AiActionBar
            onGenerate={() => aiSuggestion.generate('generate', rawData)}
            onImprove={() => aiSuggestion.generate('improve', rawData)}
            onExpand={() => aiSuggestion.generate('expand', rawData)}
            isLoading={aiSuggestion.state.status === 'loading'}
            disabled={!isAiAvailable}
          />
        )}
      </PageHeader>

      {aiSuggestion.state.status === 'error' && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
          <AlertCircle className="size-4 shrink-0" />
          <span className="flex-1">{aiSuggestion.state.error}</span>
          <Button variant="ghost" size="sm" onClick={aiSuggestion.dismiss}>Dismiss</Button>
        </div>
      )}

      {aiSuggestion.state.status === 'loading' && (
        <AiSuggestionPreview onAccept={handleAccept} onReject={aiSuggestion.reject} isLoading>
          <div />
        </AiSuggestionPreview>
      )}

      {aiSuggestion.state.status === 'preview' ? (
        <AiSuggestionPreview onAccept={handleAccept} onReject={aiSuggestion.reject}>
          {sectionContent}
        </AiSuggestionPreview>
      ) : (
        aiSuggestion.state.status !== 'loading' && sectionContent
      )}
    </div>
  );
}
