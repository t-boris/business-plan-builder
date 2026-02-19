import { useSection } from '@/hooks/use-section';
import { PageHeader } from '@/components/page-header';
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

  // Migrate legacy data on first load
  const data = rawData.enabledBlocks ? migrateLegacy(rawData as unknown as Record<string, unknown>) : migrateLegacy(rawData as unknown as Record<string, unknown>);

  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader showScenarioBadge title="Market Analysis" description="Market sizing, demographics, competitive landscape, and adoption modeling" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const readOnly = !canEdit;
  const blocks = data.enabledBlocks;

  function toggleBlock(key: keyof MarketAnalysisBlocks, value: boolean) {
    updateData((prev) => ({
      ...prev,
      enabledBlocks: { ...prev.enabledBlocks, [key]: value },
    }));
  }

  const sectionContent = (
    <div className="space-y-6">
      {canEdit && (
        <BlockTogglePanel blocks={blocks} onChange={toggleBlock} />
      )}

      {blocks.sizing && (
        <SizingBlock
          sizing={data.marketSizing}
          narrative={data.marketNarrative}
          onChange={(marketSizing) => updateData((prev) => ({ ...prev, marketSizing }))}
          onNarrativeChange={(v) => updateData((prev) => ({ ...prev, marketNarrative: v }))}
          readOnly={readOnly}
          sectionData={data as unknown as Record<string, unknown>}
        />
      )}

      {blocks.competitors && (
        <CompetitorsBlock
          competitors={data.competitors}
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
          data={data.demographics}
          onChange={(demographics) => updateData((prev) => ({ ...prev, demographics }))}
          readOnly={readOnly}
        />
      )}

      {blocks.acquisitionFunnel && (
        <FunnelBlock
          stages={data.acquisitionFunnel}
          onChange={(stages) => updateData((prev) => ({ ...prev, acquisitionFunnel: stages }))}
          readOnly={readOnly}
        />
      )}

      {blocks.adoptionModel && (
        <AdoptionBlock
          model={data.adoptionModel}
          onChange={(model) => updateData((prev) => ({ ...prev, adoptionModel: model }))}
          readOnly={readOnly}
        />
      )}

      {blocks.customMetrics && (
        <CustomMetricsBlock
          metrics={data.customMetrics}
          onChange={(metrics) => updateData((prev) => ({ ...prev, customMetrics: metrics }))}
          readOnly={readOnly}
        />
      )}
    </div>
  );

  return (
    <div className="page-container">
      <PageHeader showScenarioBadge title="Market Analysis" description="Market sizing, demographics, competitive landscape, and adoption modeling" />
      {sectionContent}
    </div>
  );
}
