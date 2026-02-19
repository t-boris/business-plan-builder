import { useAtom } from 'jotai';
import { scenarioAssumptionsAtom } from '@/store/scenario-atoms';
import type { ScenarioAssumption } from '@/types/scenario';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X, Lightbulb } from 'lucide-react';

const ASSUMPTION_CATEGORIES = [
  'Market',
  'Financial',
  'Operational',
  'Regulatory',
  'Technical',
  'Other',
] as const;

interface AssumptionsEditorProps {
  canEdit: boolean;
}

export function AssumptionsEditor({ canEdit }: AssumptionsEditorProps) {
  const [assumptions, setAssumptions] = useAtom(scenarioAssumptionsAtom);

  const addAssumption = () => {
    const newAssumption: ScenarioAssumption = {
      id: crypto.randomUUID(),
      label: '',
      value: '',
      category: undefined,
    };
    setAssumptions([...assumptions, newAssumption]);
  };

  const removeAssumption = (id: string) => {
    setAssumptions(assumptions.filter((a) => a.id !== id));
  };

  const updateAssumption = (id: string, field: keyof ScenarioAssumption, val: string | undefined) => {
    setAssumptions(
      assumptions.map((a) => (a.id === id ? { ...a, [field]: val } : a))
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="size-4 text-amber-500" />
          <h3 className="text-sm font-semibold">Key Assumptions</h3>
        </div>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={addAssumption} className="h-7 text-xs">
            <Plus className="size-3.5 mr-1" />
            Add assumption
          </Button>
        )}
      </div>

      {/* Empty state */}
      {assumptions.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          <Lightbulb className="size-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No assumptions defined yet.</p>
          {canEdit && (
            <p className="text-xs mt-1">
              Add assumptions to document the key beliefs underlying this scenario.
            </p>
          )}
        </div>
      )}

      {/* Assumptions list */}
      {assumptions.map((assumption) => (
        <Card key={assumption.id} className="p-4">
          {canEdit ? (
            <div className="space-y-3">
              {/* Header row: label + category + delete */}
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <Input
                    value={assumption.label}
                    onChange={(e) => updateAssumption(assumption.id, 'label', e.target.value)}
                    placeholder="Assumption title (e.g. Market growth rate)"
                    className="h-8 text-sm font-medium"
                  />
                </div>
                <Select
                  value={assumption.category ?? ''}
                  onValueChange={(v) => updateAssumption(assumption.id, 'category', v || undefined)}
                >
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSUMPTION_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAssumption(assumption.id)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
                >
                  <X className="size-3.5" />
                </Button>
              </div>

              {/* Value textarea */}
              <Textarea
                value={assumption.value}
                onChange={(e) => updateAssumption(assumption.id, 'value', e.target.value)}
                placeholder="Describe the assumption in detail (e.g. We assume 15% YoY market growth based on industry reports from Q3 2025)"
                className="text-sm min-h-[60px] resize-y"
                rows={2}
              />
            </div>
          ) : (
            /* Read-only mode */
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{assumption.label || 'Untitled assumption'}</p>
                {assumption.category && (
                  <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {assumption.category}
                  </span>
                )}
              </div>
              {assumption.value && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {assumption.value}
                </p>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
