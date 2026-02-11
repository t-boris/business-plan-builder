import { useSection } from '@/hooks/use-section';
import { useAiSuggestion } from '@/hooks/use-ai-suggestion';
import { isAiAvailable } from '@/lib/ai/gemini-client';
import { AiActionBar } from '@/components/ai-action-bar';
import { AiSuggestionPreview } from '@/components/ai-suggestion-preview';
import type { MarketAnalysis as MarketAnalysisType, Competitor } from '@/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Info, AlertCircle } from 'lucide-react';

const defaultMarketAnalysis: MarketAnalysisType = {
  targetDemographic: {
    ageRange: '28-50',
    location: 'Miami Metro',
    radius: 25,
  },
  marketSize: 'Miami-Dade County -- 2.7M population. Premium kids birthday party market with museum-based experiences priced in the $575-$1,250 range.',
  competitors: [
    {
      name: 'Museum Party Co.',
      pricing: '$575-$800',
      strengths: 'Established brand, multiple museum partnerships',
      weaknesses: 'No mobile option, limited to museum hours',
    },
    {
      name: 'Party Bus Miami',
      pricing: '$800-$1,250',
      strengths: 'Mobile concept, strong social media presence',
      weaknesses: 'No educational component, generic themes',
    },
    {
      name: 'Kids Fun Factory',
      pricing: '$600-$950',
      strengths: 'Affordable pricing, large capacity',
      weaknesses: 'Fixed location only, no premium tier',
    },
  ],
  demographics: {
    population: 2700000,
    languages: ['English', 'Spanish', 'Haitian Creole'],
    income: 'Median household $55,000',
  },
};

export function MarketAnalysis() {
  const { data, updateData, isLoading } = useSection<MarketAnalysisType>(
    'market-analysis',
    defaultMarketAnalysis
  );
  const aiSuggestion = useAiSuggestion<MarketAnalysisType>('market-analysis');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Market Analysis</h1>
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

  function updateDemographic(field: keyof MarketAnalysisType['targetDemographic'], value: string | number) {
    updateData((prev) => ({
      ...prev,
      targetDemographic: { ...prev.targetDemographic, [field]: value },
    }));
  }

  function updateDemographics(field: keyof MarketAnalysisType['demographics'], value: number | string | string[]) {
    updateData((prev) => ({
      ...prev,
      demographics: { ...prev.demographics, [field]: value },
    }));
  }

  function updateCompetitor(index: number, field: keyof Competitor, value: string) {
    updateData((prev) => {
      const competitors = [...prev.competitors];
      competitors[index] = { ...competitors[index], [field]: value };
      return { ...prev, competitors };
    });
  }

  function addCompetitor() {
    updateData((prev) => ({
      ...prev,
      competitors: [
        ...prev.competitors,
        { name: '', pricing: '', strengths: '', weaknesses: '' },
      ],
    }));
  }

  function removeCompetitor(index: number) {
    updateData((prev) => ({
      ...prev,
      competitors: prev.competitors.filter((_, i) => i !== index),
    }));
  }

  const sectionContent = (
    <div className="space-y-6">
      {/* Deep research insight callout */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/50">
        <Info className="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-blue-400" />
        <div>
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Deep Research Insight
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            75.3% of Miami-Dade speaks non-English at home -- bilingual marketing opportunity.
            Consider Spanish and Haitian Creole marketing materials for maximum reach.
          </p>
        </div>
      </div>

      {/* Target Demographic + Market Size */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Target Demographic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Age Range</label>
              <Input
                value={displayData.targetDemographic.ageRange}
                onChange={(e) => updateDemographic('ageRange', e.target.value)}
                readOnly={isPreview}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Location</label>
              <Input
                value={displayData.targetDemographic.location}
                onChange={(e) => updateDemographic('location', e.target.value)}
                readOnly={isPreview}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Radius (miles)</label>
              <div className="relative">
                <Input
                  type="number"
                  value={displayData.targetDemographic.radius}
                  onChange={(e) => updateDemographic('radius', Number(e.target.value))}
                  readOnly={isPreview}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">miles</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market Size</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={displayData.marketSize}
              onChange={(e) => updateData((prev) => ({ ...prev, marketSize: e.target.value }))}
              rows={6}
              readOnly={isPreview}
            />
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Competitors Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Competitors</h2>
          {!isPreview && (
            <Button variant="outline" size="sm" onClick={addCompetitor}>
              <Plus className="size-4" />
              Add Competitor
            </Button>
          )}
        </div>

        <Card>
          <CardContent>
            <div className="space-y-3">
              {/* Table Header */}
              <div className="hidden sm:grid grid-cols-[1fr_100px_1fr_1fr_40px] gap-3 items-center">
                <span className="text-xs font-medium text-muted-foreground">Name</span>
                <span className="text-xs font-medium text-muted-foreground">Pricing</span>
                <span className="text-xs font-medium text-muted-foreground">Strengths</span>
                <span className="text-xs font-medium text-muted-foreground">Weaknesses</span>
                <span />
              </div>

              {displayData.competitors.map((competitor, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_100px_1fr_1fr_40px] gap-3 items-start border-b pb-3 last:border-0 last:pb-0 sm:border-0 sm:pb-0">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground sm:hidden">Name</span>
                    <Input
                      value={competitor.name}
                      onChange={(e) => updateCompetitor(index, 'name', e.target.value)}
                      placeholder="Competitor name"
                      readOnly={isPreview}
                    />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground sm:hidden">Pricing</span>
                    <Input
                      value={competitor.pricing}
                      onChange={(e) => updateCompetitor(index, 'pricing', e.target.value)}
                      placeholder="$XXX-$XXX"
                      readOnly={isPreview}
                    />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground sm:hidden">Strengths</span>
                    <Input
                      value={competitor.strengths}
                      onChange={(e) => updateCompetitor(index, 'strengths', e.target.value)}
                      placeholder="Key strengths"
                      readOnly={isPreview}
                    />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground sm:hidden">Weaknesses</span>
                    <Input
                      value={competitor.weaknesses}
                      onChange={(e) => updateCompetitor(index, 'weaknesses', e.target.value)}
                      placeholder="Key weaknesses"
                      readOnly={isPreview}
                    />
                  </div>
                  {!isPreview && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="mt-1 sm:mt-0"
                      onClick={() => removeCompetitor(index)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              ))}

              {displayData.competitors.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">No competitors added yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Demographics */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Demographics</h2>
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Population</label>
                <Input
                  type="number"
                  value={displayData.demographics.population}
                  onChange={(e) => updateDemographics('population', Number(e.target.value))}
                  readOnly={isPreview}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Languages (comma-separated)</label>
                <Input
                  value={displayData.demographics.languages.join(', ')}
                  onChange={(e) =>
                    updateDemographics(
                      'languages',
                      e.target.value.split(',').map((l) => l.trim()).filter(Boolean)
                    )
                  }
                  readOnly={isPreview}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Median Income</label>
                <Input
                  value={displayData.demographics.income}
                  onChange={(e) => updateDemographics('income', e.target.value)}
                  readOnly={isPreview}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Market Analysis</h1>
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
