import { useSection } from '@/hooks/use-section';
import { PageHeader } from '@/components/page-header';
import type { ExecutiveSummary as ExecutiveSummaryType } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { AiFieldTrigger } from '@/components/ai-field-trigger';
import { MdPreview } from '@/components/md';

const defaultSummary: ExecutiveSummaryType = {
  summary: '',
  mission: '',
  vision: '',
  keyHighlights: [],
};

export function ExecutiveSummary() {
  const { data, updateField, updateData, isLoading, canEdit } = useSection<ExecutiveSummaryType>(
    'executive-summary',
    defaultSummary
  );

  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader showScenarioBadge title="Executive Summary" description="High-level overview of your business" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  function updateHighlight(index: number, value: string) {
    updateData((prev) => {
      const keyHighlights = [...prev.keyHighlights];
      keyHighlights[index] = value;
      return { ...prev, keyHighlights };
    });
  }

  function addHighlight() {
    updateData((prev) => ({
      ...prev,
      keyHighlights: [...prev.keyHighlights, ''],
    }));
  }

  function removeHighlight(index: number) {
    updateData((prev) => ({
      ...prev,
      keyHighlights: prev.keyHighlights.filter((_, i) => i !== index),
    }));
  }

  return (
    <div className="page-container">
      <PageHeader showScenarioBadge title="Executive Summary" description="High-level overview of your business" />

      <div className="space-y-4">
        {/* Summary */}
        <div className="card-elevated rounded-lg p-5 space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            Business Summary
            {canEdit && (
              <AiFieldTrigger
                fieldName="summary"
                fieldLabel="Business Summary"
                currentValue={data.summary}
                sectionSlug="executive-summary"
                sectionData={data as unknown as Record<string, unknown>}
                onResult={(val) => updateData((prev) => ({ ...prev, summary: val }))}
              />
            )}
          </h2>
          <Textarea
            value={data.summary}
            onChange={(e) => updateField('summary', e.target.value)}
            rows={5}
            placeholder="Executive summary of the business..."
            readOnly={!canEdit}
          />
          <MdPreview text={data.summary} />
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card-elevated rounded-lg p-5 space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              Mission
              {canEdit && (
                <AiFieldTrigger
                  fieldName="mission"
                  fieldLabel="Mission"
                  currentValue={data.mission}
                  sectionSlug="executive-summary"
                  sectionData={data as unknown as Record<string, unknown>}
                  onResult={(val) => updateData((prev) => ({ ...prev, mission: val }))}
                />
              )}
            </h2>
            <Textarea
              value={data.mission}
              onChange={(e) => updateField('mission', e.target.value)}
              rows={4}
              placeholder="Company mission statement..."
              readOnly={!canEdit}
            />
            <MdPreview text={data.mission} />
          </div>
          <div className="card-elevated rounded-lg p-5 space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              Vision
              {canEdit && (
                <AiFieldTrigger
                  fieldName="vision"
                  fieldLabel="Vision"
                  currentValue={data.vision}
                  sectionSlug="executive-summary"
                  sectionData={data as unknown as Record<string, unknown>}
                  onResult={(val) => updateData((prev) => ({ ...prev, vision: val }))}
                />
              )}
            </h2>
            <Textarea
              value={data.vision}
              onChange={(e) => updateField('vision', e.target.value)}
              rows={4}
              placeholder="Company vision statement..."
              readOnly={!canEdit}
            />
            <MdPreview text={data.vision} />
          </div>
        </div>

        {/* Key Highlights */}
        <div className="card-elevated rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Key Highlights</h2>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={addHighlight}>
                <Plus className="size-4" />
                Add Highlight
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {data.keyHighlights.map((highlight, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={highlight}
                  onChange={(e) => updateHighlight(index, e.target.value)}
                  placeholder="Key highlight..."
                  readOnly={!canEdit}
                />
                {canEdit && (
                  <Button variant="ghost" size="icon-xs" onClick={() => removeHighlight(index)}>
                    <Trash2 className="size-3" />
                  </Button>
                )}
              </div>
            ))}
            {data.keyHighlights.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">
                No highlights yet. Click "Add Highlight" to get started.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
