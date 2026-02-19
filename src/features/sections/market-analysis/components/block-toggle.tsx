import { Switch } from '@/components/ui/switch';
import type { MarketAnalysisBlocks } from '@/types';

const BLOCK_LABELS: Record<keyof MarketAnalysisBlocks, string> = {
  sizing: 'TAM / SAM / SOM',
  competitors: 'Competitors',
  demographics: 'Demographics',
  acquisitionFunnel: 'Acquisition Funnel',
  adoptionModel: 'Adoption Model',
  customMetrics: 'Custom Metrics',
};

interface BlockTogglePanelProps {
  blocks: MarketAnalysisBlocks;
  onChange: (key: keyof MarketAnalysisBlocks, value: boolean) => void;
  disabled?: boolean;
}

export function BlockTogglePanel({ blocks, onChange, disabled }: BlockTogglePanelProps) {
  return (
    <div className="card-elevated rounded-lg p-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Visible Blocks</h2>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {(Object.keys(BLOCK_LABELS) as (keyof MarketAnalysisBlocks)[]).map((key) => (
          <div key={key} className="flex items-center gap-2">
            <Switch
              id={`toggle-${key}`}
              checked={blocks[key]}
              onCheckedChange={(v) => onChange(key, v)}
              disabled={disabled}
            />
            <label htmlFor={`toggle-${key}`} className="text-sm cursor-pointer">
              {BLOCK_LABELS[key]}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
