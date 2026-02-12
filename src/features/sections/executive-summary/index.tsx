import { useSection } from '@/hooks/use-section';
import { useAiSuggestion } from '@/hooks/use-ai-suggestion';
import { isAiAvailable } from '@/lib/ai/gemini-client';
import { AiActionBar } from '@/components/ai-action-bar';
import { AiSuggestionPreview } from '@/components/ai-suggestion-preview';
import { PageHeader } from '@/components/page-header';
import type { ExecutiveSummary as ExecutiveSummaryType } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

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
  const aiSuggestion = useAiSuggestion<ExecutiveSummaryType>('executive-summary');

  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader title="Executive Summary" description="High-level overview of your business" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const displayData = aiSuggestion.state.status === 'preview' && aiSuggestion.state.suggested
    ? aiSuggestion.state.suggested
    : data;

  function handleAccept() {
    const suggested = aiSuggestion.accept();
    if (suggested) {
      updateData(() => suggested);
    }
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

  const sectionContent = (
    <div className="space-y-4">
      {/* Summary */}
      <div className="card-elevated rounded-lg p-5 space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Business Summary</h2>
        <Textarea
          value={displayData.summary}
          onChange={(e) => updateField('summary', e.target.value)}
          rows={5}
          placeholder="Executive summary of the business..."
          readOnly={!canEdit || aiSuggestion.state.status === 'preview'}
        />
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-elevated rounded-lg p-5 space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Mission</h2>
          <Textarea
            value={displayData.mission}
            onChange={(e) => updateField('mission', e.target.value)}
            rows={4}
            placeholder="Company mission statement..."
            readOnly={!canEdit || aiSuggestion.state.status === 'preview'}
          />
        </div>
        <div className="card-elevated rounded-lg p-5 space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Vision</h2>
          <Textarea
            value={displayData.vision}
            onChange={(e) => updateField('vision', e.target.value)}
            rows={4}
            placeholder="Company vision statement..."
            readOnly={!canEdit || aiSuggestion.state.status === 'preview'}
          />
        </div>
      </div>

      {/* Key Highlights */}
      <div className="card-elevated rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Key Highlights</h2>
          {canEdit && aiSuggestion.state.status !== 'preview' && (
            <Button variant="outline" size="sm" onClick={addHighlight}>
              <Plus className="size-4" />
              Add Highlight
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {displayData.keyHighlights.map((highlight, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={highlight}
                onChange={(e) => updateHighlight(index, e.target.value)}
                placeholder="Key highlight..."
                readOnly={!canEdit || aiSuggestion.state.status === 'preview'}
              />
              {canEdit && aiSuggestion.state.status !== 'preview' && (
                <Button variant="ghost" size="icon-xs" onClick={() => removeHighlight(index)}>
                  <Trash2 className="size-3" />
                </Button>
              )}
            </div>
          ))}
          {displayData.keyHighlights.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">
              No highlights yet. Click "Add Highlight" to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <PageHeader title="Executive Summary" description="High-level overview of your business">
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

      {/* AI Error */}
      {aiSuggestion.state.status === 'error' && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
          <AlertCircle className="size-4 shrink-0" />
          <span className="flex-1">{aiSuggestion.state.error}</span>
          <Button variant="ghost" size="sm" onClick={aiSuggestion.dismiss}>
            Dismiss
          </Button>
        </div>
      )}

      {/* AI Loading */}
      {aiSuggestion.state.status === 'loading' && (
        <AiSuggestionPreview onAccept={handleAccept} onReject={aiSuggestion.reject} isLoading>
          <div />
        </AiSuggestionPreview>
      )}

      {/* AI Preview or Normal Content */}
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
