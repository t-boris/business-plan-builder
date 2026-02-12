import { useSection } from '@/hooks/use-section';
import { useAiSuggestion } from '@/hooks/use-ai-suggestion';
import { isAiAvailable } from '@/lib/ai/gemini-client';
import { AiActionBar } from '@/components/ai-action-bar';
import { AiSuggestionPreview } from '@/components/ai-suggestion-preview';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import type { ProductService as ProductServiceType, Package, AddOn } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, AlertCircle, Star, Crown, Sparkles, Clock, Users, Check, Package as PackageIcon, Gift } from 'lucide-react';

const defaultProductService: ProductServiceType = {
  packages: [],
  addOns: [],
};

export function ProductService() {
  const { data, updateData, isLoading, canEdit } = useSection<ProductServiceType>(
    'product-service',
    defaultProductService
  );
  const aiSuggestion = useAiSuggestion<ProductServiceType>('product-service');

  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader title="Product & Service" description="Packages, pricing, and add-on offerings" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const isPreview = aiSuggestion.state.status === 'preview';
  const displayData = isPreview && aiSuggestion.state.suggested
    ? aiSuggestion.state.suggested
    : data;

  function handleAccept() {
    const suggested = aiSuggestion.accept();
    if (suggested) {
      updateData(() => suggested);
    }
  }

  function updatePackage(index: number, field: keyof Package, value: string | number | string[]) {
    updateData((prev) => {
      const packages = [...prev.packages];
      packages[index] = { ...packages[index], [field]: value };
      return { ...prev, packages };
    });
  }

  function updatePackageInclude(pkgIndex: number, includeIndex: number, value: string) {
    updateData((prev) => {
      const packages = [...prev.packages];
      const includes = [...packages[pkgIndex].includes];
      includes[includeIndex] = value;
      packages[pkgIndex] = { ...packages[pkgIndex], includes };
      return { ...prev, packages };
    });
  }

  function addPackageInclude(pkgIndex: number) {
    updateData((prev) => {
      const packages = [...prev.packages];
      const includes = [...packages[pkgIndex].includes, ''];
      packages[pkgIndex] = { ...packages[pkgIndex], includes };
      return { ...prev, packages };
    });
  }

  function removePackageInclude(pkgIndex: number, includeIndex: number) {
    updateData((prev) => {
      const packages = [...prev.packages];
      const includes = packages[pkgIndex].includes.filter((_, i) => i !== includeIndex);
      packages[pkgIndex] = { ...packages[pkgIndex], includes };
      return { ...prev, packages };
    });
  }

  function updateAddOn(index: number, field: keyof AddOn, value: string | number) {
    updateData((prev) => {
      const addOns = [...prev.addOns];
      addOns[index] = { ...addOns[index], [field]: value };
      return { ...prev, addOns };
    });
  }

  function addAddOn() {
    updateData((prev) => ({
      ...prev,
      addOns: [...prev.addOns, { name: '', price: 0 }],
    }));
  }

  function removeAddOn(index: number) {
    updateData((prev) => ({
      ...prev,
      addOns: prev.addOns.filter((_, i) => i !== index),
    }));
  }

  function addPackage() {
    updateData((prev) => ({
      ...prev,
      packages: [...prev.packages, { name: '', price: 0, duration: '', maxParticipants: 0, includes: [], description: '' }],
    }));
  }

  function removePackage(index: number) {
    updateData((prev) => ({
      ...prev,
      packages: prev.packages.filter((_, i) => i !== index),
    }));
  }

  // Tier styling: subtle colored top border with small icon circles
  const tierStyles = [
    { borderColor: 'border-t-blue-500', iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400', icon: Star, label: 'Starter' },
    { borderColor: 'border-t-purple-500', iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400', icon: Sparkles, label: 'Popular' },
    { borderColor: 'border-t-amber-500', iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400', icon: Crown, label: 'Premium' },
  ];

  const sectionContent = (
    <div className="space-y-6">
      {/* Packages Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Packages</h2>
          {canEdit && !isPreview && (
            <Button variant="outline" size="sm" onClick={addPackage}>
              <Plus className="size-4" />
              Add Package
            </Button>
          )}
        </div>
        {displayData.packages.length === 0 ? (
          <EmptyState
            icon={PackageIcon}
            title="No packages yet"
            description="Use AI Generate to create initial packages, or add them manually."
            action={canEdit && !isPreview ? { label: 'Add Package', onClick: addPackage } : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayData.packages.map((pkg, pkgIndex) => {
              const tier = tierStyles[pkgIndex % tierStyles.length];
              const TierIcon = tier.icon;
              return (
                <div key={pkgIndex} className={`card-elevated rounded-lg border-t-2 ${tier.borderColor} group`}>
                  {/* Header area */}
                  <div className="px-5 pt-4 pb-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center justify-center size-8 rounded-full ${tier.iconBg}`}>
                          <TierIcon className="size-3.5" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{tier.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {pkg.duration && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" />{pkg.duration}
                          </span>
                        )}
                        {pkg.maxParticipants > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="size-3" />{pkg.maxParticipants}
                          </span>
                        )}
                        {canEdit && !isPreview && (
                          <Button variant="ghost" size="icon-xs" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removePackage(pkgIndex)}>
                            <Trash2 className="size-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div>
                      <Input
                        value={pkg.name}
                        onChange={(e) => updatePackage(pkgIndex, 'name', e.target.value)}
                        placeholder="Package name"
                        readOnly={!canEdit || isPreview}
                        className="text-base font-semibold border-0 px-0 shadow-none focus-visible:ring-0 h-auto"
                      />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-normal text-muted-foreground">$</span>
                      <span className="text-2xl font-bold tabular-nums">{pkg.price.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="px-5 pb-5 space-y-4 border-t pt-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium">Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                          <Input
                            type="number"
                            className="pl-7"
                            value={pkg.price}
                            onChange={(e) => updatePackage(pkgIndex, 'price', Number(e.target.value))}
                            readOnly={!canEdit || isPreview}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Duration</label>
                        <Input
                          value={pkg.duration}
                          onChange={(e) => updatePackage(pkgIndex, 'duration', e.target.value)}
                          readOnly={!canEdit || isPreview}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Max Guests</label>
                        <Input
                          type="number"
                          value={pkg.maxParticipants}
                          onChange={(e) => updatePackage(pkgIndex, 'maxParticipants', Number(e.target.value))}
                          readOnly={!canEdit || isPreview}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={pkg.description}
                        onChange={(e) => updatePackage(pkgIndex, 'description', e.target.value)}
                        rows={3}
                        readOnly={!canEdit || isPreview}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Includes</label>
                        {canEdit && !isPreview && (
                          <Button variant="ghost" size="xs" onClick={() => addPackageInclude(pkgIndex)}>
                            <Plus className="size-3" />
                            Add
                          </Button>
                        )}
                      </div>
                      {pkg.includes.map((item, includeIndex) => (
                        <div key={includeIndex} className="flex items-center gap-2">
                          <Check className="size-3.5 shrink-0 text-green-500" />
                          <Input
                            value={item}
                            onChange={(e) => updatePackageInclude(pkgIndex, includeIndex, e.target.value)}
                            className="text-sm"
                            readOnly={!canEdit || isPreview}
                          />
                          {canEdit && !isPreview && (
                            <Button variant="ghost" size="icon-xs" onClick={() => removePackageInclude(pkgIndex, includeIndex)}>
                              <Trash2 className="size-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add-Ons Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Add-Ons</h2>
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
            description="Click 'Add Add-on' to create optional extras for your packages."
            action={canEdit && !isPreview ? { label: 'Add Add-on', onClick: addAddOn } : undefined}
          />
        ) : (
          <div className="card-elevated rounded-lg divide-y">
            {displayData.addOns.map((addOn, index) => (
              <div key={index} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1">
                  <Input
                    value={addOn.name}
                    onChange={(e) => updateAddOn(index, 'name', e.target.value)}
                    placeholder="Add-on name"
                    readOnly={!canEdit || isPreview}
                    className="border-0 px-0 shadow-none focus-visible:ring-0"
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
                {canEdit && !isPreview && (
                  <Button variant="ghost" size="icon-xs" onClick={() => removeAddOn(index)}>
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
      <PageHeader title="Product & Service" description="Packages, pricing, and add-on offerings">
        {canEdit && (
          <AiActionBar
            onGenerate={() => aiSuggestion.generate('generate', data)}
            onImprove={() => aiSuggestion.generate('improve', data)}
            onExpand={() => aiSuggestion.generate('expand', data)}
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
