import { useSection } from '@/hooks/use-section';
import { useAiSuggestion } from '@/hooks/use-ai-suggestion';
import { isAiAvailable } from '@/lib/ai/gemini-client';
import { AiActionBar } from '@/components/ai-action-bar';
import { AiSuggestionPreview } from '@/components/ai-suggestion-preview';
import type {
  RisksDueDiligence as RisksDueDiligenceType,
  Risk,
  RiskSeverity,
  RiskCategory,
  ComplianceItem,
  ComplianceStatus,
  DueDiligenceItem,
  DueDiligencePriority,
  InvestmentVerdict,
} from '@/types';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, AlertCircle, ShieldCheck } from 'lucide-react';

const defaultRisks: RisksDueDiligenceType = {
  investmentVerdict: undefined,
  risks: [],
  dueDiligenceChecklist: [],
  complianceChecklist: [],
};

const severityStyles: Record<RiskSeverity, string> = {
  critical: 'bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

const categoryStyles: Record<RiskCategory, string> = {
  regulatory: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  legal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  operational: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  financial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  safety: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  dependency: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  capacity: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  market: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
};

const complianceStatusStyles: Record<ComplianceStatus, string> = {
  'not-started': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  complete: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

const priorityStyles: Record<DueDiligencePriority, string> = {
  required: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  advised: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

const verdictStyles: Record<InvestmentVerdict, { border: string; bg: string; text: string }> = {
  'strong-go': { border: 'border-l-green-500', bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-800 dark:text-green-300' },
  'conditional-go': { border: 'border-l-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-800 dark:text-amber-300' },
  'proceed-with-caution': { border: 'border-l-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-800 dark:text-orange-300' },
  'defer': { border: 'border-l-red-400', bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-800 dark:text-red-300' },
  'no-go': { border: 'border-l-red-600', bg: 'bg-red-100 dark:bg-red-950/50', text: 'text-red-900 dark:text-red-200' },
};

const verdictLabels: Record<InvestmentVerdict, string> = {
  'strong-go': 'Strong Go',
  'conditional-go': 'Conditional Go',
  'proceed-with-caution': 'Proceed with Caution',
  'defer': 'Defer',
  'no-go': 'No-Go',
};

export function RisksDueDiligence() {
  const { data, updateData, isLoading } = useSection<RisksDueDiligenceType>('risks-due-diligence', defaultRisks);
  const aiSuggestion = useAiSuggestion<RisksDueDiligenceType>('risks-due-diligence');

  if (isLoading) {
    return (<div className="space-y-6"><h1 className="text-3xl font-bold tracking-tight">Risks & Due Diligence</h1><p className="text-muted-foreground">Loading...</p></div>);
  }

  const isPreview = aiSuggestion.state.status === 'preview';
  const displayData = isPreview && aiSuggestion.state.suggested ? aiSuggestion.state.suggested : data;

  function handleAccept() { const suggested = aiSuggestion.accept(); if (suggested) updateData(() => suggested); }

  // Risk CRUD
  function updateRisk(index: number, field: keyof Risk, value: string) { updateData((prev) => { const risks = [...prev.risks]; risks[index] = { ...risks[index], [field]: value }; return { ...prev, risks }; }); }
  function addRisk() { updateData((prev) => ({ ...prev, risks: [...prev.risks, { category: 'operational' as RiskCategory, title: '', severity: 'medium' as RiskSeverity, description: '', mitigation: '' }] })); }
  function removeRisk(index: number) { updateData((prev) => ({ ...prev, risks: prev.risks.filter((_, i) => i !== index) })); }

  // Compliance CRUD
  function updateComplianceItem(index: number, field: keyof ComplianceItem, value: string) { updateData((prev) => { const complianceChecklist = [...prev.complianceChecklist]; complianceChecklist[index] = { ...complianceChecklist[index], [field]: value }; return { ...prev, complianceChecklist }; }); }
  function addComplianceItem() { updateData((prev) => ({ ...prev, complianceChecklist: [...prev.complianceChecklist, { item: '', status: 'not-started' as ComplianceStatus }] })); }
  function removeComplianceItem(index: number) { updateData((prev) => ({ ...prev, complianceChecklist: prev.complianceChecklist.filter((_, i) => i !== index) })); }

  // Verdict
  function updateVerdict(verdict: InvestmentVerdict) { updateData((prev) => ({ ...prev, investmentVerdict: { ...prev.investmentVerdict ?? { verdict: 'conditional-go', conditions: [] }, verdict } })); }
  function updateVerdictCondition(index: number, value: string) { updateData((prev) => { const conditions = [...(prev.investmentVerdict?.conditions ?? [])]; conditions[index] = value; return { ...prev, investmentVerdict: { ...prev.investmentVerdict ?? { verdict: 'conditional-go', conditions: [] }, conditions } }; }); }
  function addVerdictCondition() { updateData((prev) => ({ ...prev, investmentVerdict: { ...prev.investmentVerdict ?? { verdict: 'conditional-go', conditions: [] }, conditions: [...(prev.investmentVerdict?.conditions ?? []), ''] } })); }
  function removeVerdictCondition(index: number) { updateData((prev) => ({ ...prev, investmentVerdict: { ...prev.investmentVerdict ?? { verdict: 'conditional-go', conditions: [] }, conditions: (prev.investmentVerdict?.conditions ?? []).filter((_, i) => i !== index) } })); }

  // DD Checklist CRUD
  function updateDDItem(index: number, field: keyof DueDiligenceItem, value: string) { updateData((prev) => { const list = [...(prev.dueDiligenceChecklist ?? [])]; list[index] = { ...list[index], [field]: value }; return { ...prev, dueDiligenceChecklist: list }; }); }
  function addDDItem() { updateData((prev) => ({ ...prev, dueDiligenceChecklist: [...(prev.dueDiligenceChecklist ?? []), { item: '', detail: '', priority: 'advised' as DueDiligencePriority, status: 'not-started' as ComplianceStatus }] })); }
  function removeDDItem(index: number) { updateData((prev) => ({ ...prev, dueDiligenceChecklist: (prev.dueDiligenceChecklist ?? []).filter((_, i) => i !== index) })); }

  const verdict = displayData.investmentVerdict;
  const ddChecklist = displayData.dueDiligenceChecklist ?? [];
  const vStyle = verdict ? verdictStyles[verdict.verdict] : null;

  const sectionContent = (
    <div className="space-y-6">
      {/* A. Investment Verdict Banner */}
      {verdict && vStyle && (
        <Card className={`border-l-4 ${vStyle.border} ${vStyle.bg}`}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="size-5 shrink-0" />
              <h2 className="text-lg font-semibold">Investment Verdict</h2>
              {!isPreview ? (
                <Select value={verdict.verdict} onValueChange={(v) => updateVerdict(v as InvestmentVerdict)}>
                  <SelectTrigger className="w-52">
                    <span className={`font-semibold ${vStyle.text}`}>{verdictLabels[verdict.verdict]}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strong-go">Strong Go</SelectItem>
                    <SelectItem value="conditional-go">Conditional Go</SelectItem>
                    <SelectItem value="proceed-with-caution">Proceed with Caution</SelectItem>
                    <SelectItem value="defer">Defer</SelectItem>
                    <SelectItem value="no-go">No-Go</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span className={`font-semibold text-lg ${vStyle.text}`}>{verdictLabels[verdict.verdict]}</span>
              )}
            </div>
            {verdict.conditions.length > 0 && (
              <div className="space-y-2 ml-8">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Conditions</p>
                {verdict.conditions.map((condition, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">{i + 1}.</span>
                    {!isPreview ? (
                      <>
                        <Input value={condition} onChange={(e) => updateVerdictCondition(i, e.target.value)} placeholder="Condition..." className="flex-1 text-sm" />
                        <Button variant="ghost" size="icon-xs" onClick={() => removeVerdictCondition(i)}><Trash2 className="size-3" /></Button>
                      </>
                    ) : (
                      <span className="text-sm">{condition}</span>
                    )}
                  </div>
                ))}
                {!isPreview && (
                  <Button variant="ghost" size="sm" onClick={addVerdictCondition} className="text-xs"><Plus className="size-3 mr-1" />Add Condition</Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* B. Risk Assessment */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Risk Assessment</h2>
          {!isPreview && <Button variant="outline" size="sm" onClick={addRisk}><Plus className="size-4" />Add Risk</Button>}
        </div>
        <div className="space-y-4">
          {displayData.risks.map((risk, index) => (
            <Card key={index} className={risk.severity === 'critical' ? 'border-l-4 border-l-red-500' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${severityStyles[risk.severity]}`}>{risk.severity}</span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryStyles[risk.category]}`}>{risk.category}</span>
                  </div>
                  {!isPreview && <Button variant="ghost" size="icon-xs" onClick={() => removeRisk(index)}><Trash2 className="size-3" /></Button>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Severity</label>
                    <Select value={risk.severity} onValueChange={(v) => updateRisk(index, 'severity', v)} disabled={isPreview}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Category</label>
                    <Select value={risk.category} onValueChange={(v) => updateRisk(index, 'category', v)} disabled={isPreview}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regulatory">Regulatory</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="financial">Financial</SelectItem>
                        <SelectItem value="safety">Safety</SelectItem>
                        <SelectItem value="dependency">Dependency</SelectItem>
                        <SelectItem value="capacity">Capacity</SelectItem>
                        <SelectItem value="market">Market</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground">Title</label><Input value={risk.title} onChange={(e) => updateRisk(index, 'title', e.target.value)} placeholder="Risk title" readOnly={isPreview} /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Description</label><Textarea value={risk.description} onChange={(e) => updateRisk(index, 'description', e.target.value)} placeholder="Describe the risk..." rows={2} readOnly={isPreview} /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Mitigation</label><Textarea value={risk.mitigation} onChange={(e) => updateRisk(index, 'mitigation', e.target.value)} placeholder="Mitigation strategy..." rows={2} readOnly={isPreview} /></div>
              </CardContent>
            </Card>
          ))}
          {displayData.risks.length === 0 && <p className="text-sm text-muted-foreground py-4">No risks identified yet. Use AI Generate to create a risk assessment, or add risks manually.</p>}
        </div>
      </div>

      <Separator />

      {/* C. Due Diligence Checklist */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Due Diligence Checklist</h2>
          {!isPreview && <Button variant="outline" size="sm" onClick={addDDItem}><Plus className="size-4" />Add Item</Button>}
        </div>
        <div className="space-y-3">
          {ddChecklist.map((item, index) => (
            <Card key={index}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityStyles[item.priority]}`}>{item.priority}</span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${complianceStatusStyles[item.status]}`}>
                      {item.status === 'not-started' ? 'Not Started' : item.status === 'pending' ? 'Pending' : 'Complete'}
                    </span>
                  </div>
                  {!isPreview && <Button variant="ghost" size="icon-xs" onClick={() => removeDDItem(index)}><Trash2 className="size-3" /></Button>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Priority</label>
                    <Select value={item.priority} onValueChange={(v) => updateDDItem(index, 'priority', v)} disabled={isPreview}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="required">Required</SelectItem>
                        <SelectItem value="advised">Advised</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <Select value={item.status} onValueChange={(v) => updateDDItem(index, 'status', v)} disabled={isPreview}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not-started">Not Started</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground">Item</label><Input value={item.item} onChange={(e) => updateDDItem(index, 'item', e.target.value)} placeholder="Due diligence item..." readOnly={isPreview} /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Detail</label><Textarea value={item.detail} onChange={(e) => updateDDItem(index, 'detail', e.target.value)} placeholder="Details and findings..." rows={2} readOnly={isPreview} /></div>
              </CardContent>
            </Card>
          ))}
          {ddChecklist.length === 0 && <p className="text-sm text-muted-foreground py-4">No due diligence items yet.</p>}
        </div>
      </div>

      <Separator />

      {/* D. Compliance Checklist */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Compliance Checklist</h2>
          {!isPreview && <Button variant="outline" size="sm" onClick={addComplianceItem}><Plus className="size-4" />Add Item</Button>}
        </div>
        <Card>
          <CardContent>
            <div className="space-y-3">
              {displayData.complianceChecklist.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Input value={item.item} onChange={(e) => updateComplianceItem(index, 'item', e.target.value)} placeholder="Compliance item..." className="flex-1" readOnly={isPreview} />
                  <Select value={item.status} onValueChange={(v) => updateComplianceItem(index, 'status', v)} disabled={isPreview}>
                    <SelectTrigger className="w-36">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${complianceStatusStyles[item.status]}`}>
                        {item.status === 'not-started' ? 'Not Started' : item.status === 'pending' ? 'Pending' : 'Complete'}
                      </span>
                    </SelectTrigger>
                    <SelectContent><SelectItem value="not-started">Not Started</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="complete">Complete</SelectItem></SelectContent>
                  </Select>
                  {!isPreview && <Button variant="ghost" size="icon-xs" onClick={() => removeComplianceItem(index)}><Trash2 className="size-3" /></Button>}
                </div>
              ))}
              {displayData.complianceChecklist.length === 0 && <p className="text-sm text-muted-foreground py-2">No compliance items yet.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Risks & Due Diligence</h1>
        <AiActionBar onGenerate={() => aiSuggestion.generate('generate', data)} onImprove={() => aiSuggestion.generate('improve', data)} onExpand={() => aiSuggestion.generate('expand', data)} isLoading={aiSuggestion.state.status === 'loading'} disabled={!isAiAvailable} />
      </div>

      {aiSuggestion.state.status === 'error' && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
          <AlertCircle className="size-4 shrink-0" /><span className="flex-1">{aiSuggestion.state.error}</span>
          <Button variant="ghost" size="sm" onClick={aiSuggestion.dismiss}>Dismiss</Button>
        </div>
      )}

      {aiSuggestion.state.status === 'loading' && <AiSuggestionPreview onAccept={handleAccept} onReject={aiSuggestion.reject} isLoading><div /></AiSuggestionPreview>}

      {aiSuggestion.state.status === 'preview' ? (
        <AiSuggestionPreview onAccept={handleAccept} onReject={aiSuggestion.reject}>{sectionContent}</AiSuggestionPreview>
      ) : aiSuggestion.state.status !== 'loading' && sectionContent}
    </div>
  );
}
