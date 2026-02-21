import type { FunnelStage } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { MdPreview } from '@/components/md';

interface FunnelBlockProps {
  stages: FunnelStage[];
  onChange: (stages: FunnelStage[]) => void;
  readOnly: boolean;
}

/** Custom SVG funnel visualization */
function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  if (stages.length === 0) return null;
  const maxVolume = Math.max(...stages.map((s) => s.volume), 1);
  const barHeight = 36;
  const gap = 4;
  const svgWidth = 400;
  const svgHeight = stages.length * (barHeight + gap);
  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

  return (
    <div className="flex justify-center overflow-x-auto">
      <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        {stages.map((stage, i) => {
          const widthPct = stage.volume / maxVolume;
          const barW = Math.max(widthPct * (svgWidth - 120), 20);
          const x = (svgWidth - 120 - barW) / 2;
          const y = i * (barHeight + gap);
          const fill = colors[i % colors.length];

          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barHeight} rx={4} fill={fill} opacity={0.8} />
              <text x={svgWidth - 115} y={y + barHeight / 2 + 4} fontSize="11" fontWeight="600" className="fill-foreground">
                {stage.label}
              </text>
              <text x={x + barW / 2} y={y + barHeight / 2 + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="white">
                {stage.volume.toLocaleString()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function FunnelBlock({ stages, onChange, readOnly }: FunnelBlockProps) {
  function updateStage(index: number, field: keyof FunnelStage, value: string | number) {
    const updated = [...stages];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-cascade volumes downward
    if (field === 'volume' || field === 'conversionRate') {
      for (let i = index; i < updated.length - 1; i++) {
        const rate = Math.min(Math.max(updated[i].conversionRate, 0), 100);
        updated[i + 1] = { ...updated[i + 1], volume: Math.round(updated[i].volume * rate / 100) };
      }
    }

    onChange(updated);
  }

  function addStage() {
    const lastVolume = stages.length > 0 ? stages[stages.length - 1].volume : 1000;
    onChange([...stages, { label: '', description: '', volume: Math.round(lastVolume * 0.5), conversionRate: 100 }]);
  }

  function removeStage(index: number) {
    onChange(stages.filter((_, i) => i !== index));
  }

  const bottomVolume = stages.length > 0 ? stages[stages.length - 1].volume : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Acquisition Funnel</h2>
        {!readOnly && (
          <Button variant="outline" size="sm" onClick={addStage}>
            <Plus className="size-4" />
            Add Stage
          </Button>
        )}
      </div>

      <FunnelChart stages={stages} />

      <div className="card-elevated rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Stage</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Description</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-[120px]">Volume</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-[120px]">Conv. Rate %</th>
              {!readOnly && <th className="w-[40px]" />}
            </tr>
          </thead>
          <tbody>
            {stages.map((stage, i) => (
              <tr key={i} className="border-b last:border-0 even:bg-muted/15">
                <td className="px-4 py-2 align-top">
                  <Input value={stage.label} onChange={(e) => updateStage(i, 'label', e.target.value)} placeholder="Stage name" readOnly={readOnly} className="h-8 text-sm" />
                </td>
                <td className="px-4 py-2 align-top">
                  <Textarea value={stage.description ?? ''} onChange={(e) => updateStage(i, 'description', e.target.value)} placeholder="How this stage works..." readOnly={readOnly} className="min-h-8 text-sm py-1.5" />
                  <MdPreview text={stage.description ?? ''} />
                </td>
                <td className="px-4 py-2 align-top">
                  <Input type="number" value={stage.volume} onChange={(e) => updateStage(i, 'volume', Number(e.target.value))} readOnly={readOnly} className="h-8 text-sm" />
                </td>
                <td className="px-4 py-2">
                  <Input
                    type="number"
                    value={stage.conversionRate}
                    onChange={(e) => updateStage(i, 'conversionRate', Number(e.target.value))}
                    readOnly={readOnly || i === stages.length - 1}
                    className="h-8 text-sm"
                    min={0}
                    max={100}
                  />
                </td>
                {!readOnly && (
                  <td className="px-2 py-2">
                    <Button variant="ghost" size="icon-xs" onClick={() => removeStage(i)}>
                      <Trash2 className="size-3" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {stages.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">No funnel stages defined.</p>
        )}
      </div>

      {bottomVolume > 0 && (
        <div className="card-elevated rounded-lg p-4 text-center">
          <span className="text-sm text-muted-foreground">Estimated Monthly Customers: </span>
          <span className="text-lg font-bold tabular-nums">{bottomVolume.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
