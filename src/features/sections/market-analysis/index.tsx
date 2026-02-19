import { useSection } from '@/hooks/use-section';
import { useAiSuggestion } from '@/hooks/use-ai-suggestion';
import { isAiAvailable } from '@/lib/ai/gemini-client';
import { AiActionBar } from '@/components/ai-action-bar';
import { AiSuggestionPreview } from '@/components/ai-suggestion-preview';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import type { MarketAnalysis as MarketAnalysisType, Competitor, MarketAnalysisBlocks } from '@/types';

import { defaultMarketAnalysis } from './defaults';
import { migrateLegacy } from './migrate';
import { BlockTogglePanel } from './components/block-toggle';
import { SizingBlock } from './components/sizing-block';
import { CompetitorsBlock } from './components/competitors-block';
import { DemographicsBlock } from './components/demographics-block';
import { FunnelBlock } from './components/funnel-block';
import { AdoptionBlock } from './components/adoption-block';
import { CustomMetricsBlock } from './components/custom-metrics-block';

export function MarketAnalysis() {
  const { data: rawData, updateData, isLoading, canEdit } = useSection<MarketAnalysisType>(
    'market-analysis',
    defaultMarketAnalysis,
  );
  const aiSuggestion = useAiSuggestion<MarketAnalysisType>('market-analysis');

  // Migrate legacy data on first load
  const data = rawData.enabledBlocks ? migrateLegacy(rawData as unknown as Record<string, unknown>) : migrateLegacy(rawData as unknown as Record<string, unknown>);

  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader title="Market Analysis" description="Market sizing, demographics, competitive landscape, and adoption modeling" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const isPreview = aiSuggestion.state.status === 'preview';
  const displayData = isPreview && aiSuggestion.state.suggested
    ? aiSuggestion.state.suggested
    : data;
  const readOnly = !canEdit || isPreview;
  const blocks = displayData.enabledBlocks;

  function handleAccept() {
    const suggested = aiSuggestion.accept();
    if (suggested) updateData(() => suggested);
  }

  function toggleBlock(key: keyof MarketAnalysisBlocks, value: boolean) {
    updateData((prev) => ({
      ...prev,
      enabledBlocks: { ...prev.enabledBlocks, [key]: value },
    }));
  }

  const sectionContent = (
    <div className="space-y-6">
      {canEdit && !isPreview && (
        <BlockTogglePanel blocks={blocks} onChange={toggleBlock} />
      )}

      {blocks.sizing && (
        <SizingBlock
          sizing={displayData.marketSizing}
          narrative={displayData.marketNarrative}
          onChange={(marketSizing) => updateData((prev) => ({ ...prev, marketSizing }))}
          onNarrativeChange={(v) => updateData((prev) => ({ ...prev, marketNarrative: v }))}
          readOnly={readOnly}
          sectionData={data as unknown as Record<string, unknown>}
        />
      )}

      {blocks.competitors && (
        <CompetitorsBlock
          competitors={displayData.competitors}
          onUpdate={(i, field, value) =>
            updateData((prev) => {
              const competitors = [...prev.competitors];
              competitors[i] = { ...competitors[i], [field]: value };
              return { ...prev, competitors };
            })
          }
          onAdd={() =>
            updateData((prev) => ({
              ...prev,
              competitors: [...prev.competitors, { name: '', pricing: '', strengths: '', weaknesses: '' } as Competitor],
            }))
          }
          onRemove={(i) =>
            updateData((prev) => ({ ...prev, competitors: prev.competitors.filter((_, idx) => idx !== i) }))
          }
          readOnly={readOnly}
        />
      )}

      {blocks.demographics && (
        <DemographicsBlock
          data={displayData.demographics}
          onChange={(demographics) => updateData((prev) => ({ ...prev, demographics }))}
          readOnly={readOnly}
        />
      )}

      {blocks.acquisitionFunnel && (
        <FunnelBlock
          stages={displayData.acquisitionFunnel}
          onChange={(stages) => updateData((prev) => ({ ...prev, acquisitionFunnel: stages }))}
          readOnly={readOnly}
        />
      )}

      {blocks.adoptionModel && (
        <AdoptionBlock
          model={displayData.adoptionModel}
          onChange={(model) => updateData((prev) => ({ ...prev, adoptionModel: model }))}
          readOnly={readOnly}
        />
      )}

      {blocks.customMetrics && (
        <CustomMetricsBlock
          metrics={displayData.customMetrics}
          onChange={(metrics) => updateData((prev) => ({ ...prev, customMetrics: metrics }))}
          readOnly={readOnly}
        />
      )}
    </div>
  );

  return (
    <div className="page-container">
      <PageHeader title="Market Analysis" description="Market sizing, demographics, competitive landscape, and adoption modeling">
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
