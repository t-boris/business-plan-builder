import { useSection } from '@/hooks/use-section';
import { useAiSuggestion } from '@/hooks/use-ai-suggestion';
import { isAiAvailable } from '@/lib/ai/gemini-client';
import { AiActionBar } from '@/components/ai-action-bar';
import { AiSuggestionPreview } from '@/components/ai-suggestion-preview';
import { DEFAULT_PACKAGES } from '@/lib/constants';
import type { ProductService as ProductServiceType, Package, AddOn } from '@/types';
import {
  Card,
  CardHeader,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

const defaultProductService: ProductServiceType = {
  packages: DEFAULT_PACKAGES,
  addOns: [
    { name: 'Extra 30 minutes', price: 150 },
    { name: 'Face painting', price: 100 },
    { name: 'Balloon artist', price: 120 },
  ],
};

export function ProductService() {
  const { data, updateData, isLoading } = useSection<ProductServiceType>(
    'product-service',
    defaultProductService
  );
  const aiSuggestion = useAiSuggestion<ProductServiceType>('product-service');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Product & Service</h1>
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

  const sectionContent = (
    <div className="space-y-6">
      {/* Packages Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Packages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayData.packages.map((pkg, pkgIndex) => (
            <Card key={pkgIndex}>
              <CardHeader>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Package Name</label>
                    <Input
                      value={pkg.name}
                      onChange={(e) => updatePackage(pkgIndex, 'name', e.target.value)}
                      readOnly={isPreview}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input
                        type="number"
                        className="pl-7"
                        value={pkg.price}
                        onChange={(e) => updatePackage(pkgIndex, 'price', Number(e.target.value))}
                        readOnly={isPreview}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Duration</label>
                    <Input
                      value={pkg.duration}
                      onChange={(e) => updatePackage(pkgIndex, 'duration', e.target.value)}
                      readOnly={isPreview}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Max Participants</label>
                    <Input
                      type="number"
                      value={pkg.maxParticipants}
                      onChange={(e) => updatePackage(pkgIndex, 'maxParticipants', Number(e.target.value))}
                      readOnly={isPreview}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Description</label>
                  <Textarea
                    value={pkg.description}
                    onChange={(e) => updatePackage(pkgIndex, 'description', e.target.value)}
                    rows={3}
                    readOnly={isPreview}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">Includes</label>
                    {!isPreview && (
                      <Button variant="ghost" size="xs" onClick={() => addPackageInclude(pkgIndex)}>
                        <Plus className="size-3" />
                        Add
                      </Button>
                    )}
                  </div>
                  {pkg.includes.map((item, includeIndex) => (
                    <div key={includeIndex} className="flex items-center gap-2">
                      <Input
                        value={item}
                        onChange={(e) => updatePackageInclude(pkgIndex, includeIndex, e.target.value)}
                        className="text-sm"
                        readOnly={isPreview}
                      />
                      {!isPreview && (
                        <Button variant="ghost" size="icon-xs" onClick={() => removePackageInclude(pkgIndex, includeIndex)}>
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Add-Ons Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add-Ons</h2>
          {!isPreview && (
            <Button variant="outline" size="sm" onClick={addAddOn}>
              <Plus className="size-4" />
              Add Add-on
            </Button>
          )}
        </div>

        <Card>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_120px_40px] gap-3 items-center">
                <span className="text-xs font-medium text-muted-foreground">Name</span>
                <span className="text-xs font-medium text-muted-foreground">Price</span>
                <span />
              </div>
              {displayData.addOns.map((addOn, index) => (
                <div key={index} className="grid grid-cols-[1fr_120px_40px] gap-3 items-center">
                  <Input
                    value={addOn.name}
                    onChange={(e) => updateAddOn(index, 'name', e.target.value)}
                    placeholder="Add-on name"
                    readOnly={isPreview}
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      type="number"
                      className="pl-7"
                      value={addOn.price}
                      onChange={(e) => updateAddOn(index, 'price', Number(e.target.value))}
                      readOnly={isPreview}
                    />
                  </div>
                  {!isPreview && (
                    <Button variant="ghost" size="icon-xs" onClick={() => removeAddOn(index)}>
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              ))}
              {displayData.addOns.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">No add-ons yet. Click "Add Add-on" to get started.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Product & Service</h1>
        <AiActionBar
          onGenerate={() => aiSuggestion.generate('generate', data)}
          onImprove={() => aiSuggestion.generate('improve', data)}
          onExpand={() => aiSuggestion.generate('expand', data)}
          isLoading={aiSuggestion.state.status === 'loading'}
          disabled={!isAiAvailable}
        />
      </div>

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
