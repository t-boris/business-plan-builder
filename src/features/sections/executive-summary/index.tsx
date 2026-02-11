import { useSection } from '@/hooks/use-section';
import type { ExecutiveSummary as ExecutiveSummaryType } from '@/types';
import {
  Card,
  CardHeader,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Info } from 'lucide-react';

const defaultSummary: ExecutiveSummaryType = {
  summary:
    'Fun Box is a premium mobile kids birthday party service operating in the Miami metropolitan area. We combine ocean-themed interactive workshops with guided Jellyfish Museum experiences, offering three all-inclusive packages ($800-$1,200) for groups of up to 15 participants.',
  mission:
    'To create unforgettable, hassle-free birthday celebrations that combine education and entertainment through immersive ocean-themed experiences.',
  vision:
    "To become Miami's leading premium kids birthday party service, known for unique museum-integrated experiences and exceptional customer satisfaction.",
  keyHighlights: [
    'Three packages: $800 / $980 / $1,200',
    '15 participants per event, all-inclusive',
    'Jellyfish Museum partnership with included tickets',
    'Target: 100-150 leads/month, 15-25% conversion',
    'Launch: March 2026 (soft launch → scale)',
    'Bilingual marketing opportunity (75% non-English at home)',
  ],
};

export function ExecutiveSummary() {
  const { data, updateField, updateData, isLoading } = useSection<ExecutiveSummaryType>(
    'executive-summary',
    defaultSummary
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Executive Summary</h1>
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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Executive Summary</h1>

      {/* Info Note */}
      <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
        <Info className="size-4 mt-0.5 shrink-0" />
        <span>This section will be enhanced with AI-generated content in a future update.</span>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Business Summary</h2>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.summary}
            onChange={(e) => updateField('summary', e.target.value)}
            rows={5}
            placeholder="Executive summary of the business..."
          />
        </CardContent>
      </Card>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Mission</h2>
          </CardHeader>
          <CardContent>
            <Textarea
              value={data.mission}
              onChange={(e) => updateField('mission', e.target.value)}
              rows={4}
              placeholder="Company mission statement..."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Vision</h2>
          </CardHeader>
          <CardContent>
            <Textarea
              value={data.vision}
              onChange={(e) => updateField('vision', e.target.value)}
              rows={4}
              placeholder="Company vision statement..."
            />
          </CardContent>
        </Card>
      </div>

      {/* Key Highlights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Key Highlights</h2>
            <Button variant="outline" size="sm" onClick={addHighlight}>
              <Plus className="size-4" />
              Add Highlight
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.keyHighlights.map((highlight, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={highlight}
                  onChange={(e) => updateHighlight(index, e.target.value)}
                  placeholder="Key highlight..."
                />
                <Button variant="ghost" size="icon-xs" onClick={() => removeHighlight(index)}>
                  <Trash2 className="size-3" />
                </Button>
              </div>
            ))}
            {data.keyHighlights.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">
                No highlights yet. Click "Add Highlight" to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
