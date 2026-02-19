import { useSection } from '@/hooks/use-section';
import { useAiSuggestion } from '@/hooks/use-ai-suggestion';
import { isAiAvailable } from '@/lib/ai/gemini-client';
import { AiActionBar } from '@/components/ai-action-bar';
import { AiSuggestionPreview } from '@/components/ai-suggestion-preview';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, AlertCircle, ShieldCheck, AlertTriangle, ClipboardCheck, CheckCircle2, Circle, CircleDot } from 'lucide-react';
import { AiFieldTrigger } from '@/components/ai-field-trigger';

const defaultRisks: RisksDueDiligenceType = {
  investmentVerdict: undefined,
  risks: [],
  dueDiligenceChecklist: [],
  complianceChecklist: [],
};

const severityDotColors: Record<RiskSeverity, string> = {
  critical: 'bg-red-500',
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-green-400',
};

const severityStyles: Record<RiskSeverity, string> = {
  critical: 'bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-300',
  high: 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  medium: 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  low: 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

const categoryStyles: Record<RiskCategory, string> = {
  regulatory: 'bg-muted text-muted-foreground',
  legal: 'bg-muted text-muted-foreground',
  operational: 'bg-muted text-muted-foreground',
  financial: 'bg-muted text-muted-foreground',
  safety: 'bg-muted text-muted-foreground',
  dependency: 'bg-muted text-muted-foreground',
  capacity: 'bg-muted text-muted-foreground',
  market: 'bg-muted text-muted-foreground',
};

const complianceStatusIcons: Record<ComplianceStatus, React.ElementType> = {
  'not-started': Circle,
  pending: CircleDot,
  complete: CheckCircle2,
};

const complianceStatusStyles: Record<ComplianceStatus, string> = {
  'not-started': 'text-muted-foreground',
  pending: 'text-amber-500',
  complete: 'text-green-500',
};

const priorityStyles: Record<DueDiligencePriority, string> = {
  required: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  advised: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

const verdictStyles: Record<InvestmentVerdict, { border: string; bg: string; text: string; icon: string }> = {
  'strong-go': { border: 'border-l-green-500', bg: 'bg-green-50/50 dark:bg-green-950/20', text: 'text-green-800 dark:text-green-300', icon: 'text-green-600' },
  'conditional-go': { border: 'border-l-amber-500', bg: 'bg-amber-50/50 dark:bg-amber-950/20', text: 'text-amber-800 dark:text-amber-300', icon: 'text-amber-600' },
  'proceed-with-caution': { border: 'border-l-orange-500', bg: 'bg-orange-50/50 dark:bg-orange-950/20', text: 'text-orange-800 dark:text-orange-300', icon: 'text-orange-600' },
  'defer': { border: 'border-l-red-400', bg: 'bg-red-50/50 dark:bg-red-950/20', text: 'text-red-800 dark:text-red-300', icon: 'text-red-500' },
  'no-go': { border: 'border-l-red-600', bg: 'bg-red-100/50 dark:bg-red-950/30', text: 'text-red-900 dark:text-red-200', icon: 'text-red-600' },
};

const verdictLabels: Record<InvestmentVerdict, string> = {
  'strong-go': 'Strong Go',
  'conditional-go': 'Conditional Go',
  'proceed-with-caution': 'Proceed with Caution',
  'defer': 'Defer',
  'no-go': 'No-Go',
};

export function RisksDueDiligence() {
  const { data, updateData, isLoading, canEdit } = useSection<RisksDueDiligenceType>('risks-due-diligence', defaultRisks);
  const aiSuggestion = useAiSuggestion<RisksDueDiligenceType>('risks-due-diligence');

  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader title="Risks & Due Diligence" description="Loading..." />
      </div>
    );
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
    <div className="page-container">
      {/* Investment Verdict Banner */}
      {verdict && vStyle && (
        <div className={`rounded-lg border-l-4 ${vStyle.border} ${vStyle.bg} p-4`}>
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className={`size-5 shrink-0 ${vStyle.icon}`} />
            <h2 className="text-sm font-semibold">Investment Verdict</h2>
            {canEdit && !isPreview ? (
              <Select value={verdict.verdict} onValueChange={(v) => updateVerdict(v as InvestmentVerdict)}>
                <SelectTrigger className="w-48 h-8">
                  <span className={`font-semibold text-sm ${vStyle.text}`}>{verdictLabels[verdict.verdict]}</span>
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
              <span className={`font-semibold ${vStyle.text}`}>{verdictLabels[verdict.verdict]}</span>
            )}
          </div>
          {verdict.conditions.length > 0 && (
            <div className="space-y-1.5 ml-8">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Conditions</p>
              {verdict.conditions.map((condition, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs shrink-0">{i + 1}.</span>
                  {canEdit && !isPreview ? (
                    <>
                      <Input value={condition} onChange={(e) => updateVerdictCondition(i, e.target.value)} placeholder="Condition..." className="flex-1 h-8 text-sm" />
                      <Button variant="ghost" size="icon-xs" onClick={() => removeVerdictCondition(i)}><Trash2 className="size-3" /></Button>
                    </>
                  ) : (
                    <span className="text-sm">{condition}</span>
                  )}
                </div>
              ))}
              {canEdit && !isPreview && (
                <Button variant="ghost" size="sm" onClick={addVerdictCondition} className="text-xs h-7"><Plus className="size-3 mr-1" />Add Condition</Button>
              )}
            </div>
          )}
          {verdict.conditions.length === 0 && canEdit && !isPreview && (
            <div className="ml-8">
              <Button variant="ghost" size="sm" onClick={addVerdictCondition} className="text-xs h-7"><Plus className="size-3 mr-1" />Add Condition</Button>
            </div>
          )}
        </div>
      )}

      {/* Risk Assessment */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Risk Assessment</h2>
          {canEdit && !isPreview && <Button variant="outline" size="sm" onClick={addRisk}><Plus className="size-4" />Add Risk</Button>}
        </div>

        {displayData.risks.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="No risks identified" description="Use AI Generate to create a risk assessment, or add risks manually." action={canEdit && !isPreview ? { label: 'Add Risk', onClick: addRisk } : undefined} />
        ) : (
          <div className="space-y-3">
            {displayData.risks.map((risk, index) => (
              <div key={index} className="card-elevated rounded-lg p-4 space-y-3">
                {/* Risk header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`size-2 rounded-full shrink-0 ${severityDotColors[risk.severity]}`} />
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${severityStyles[risk.severity]}`}>{risk.severity}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${categoryStyles[risk.category]}`}>{risk.category}</span>
                  </div>
                  {canEdit && !isPreview && <Button variant="ghost" size="icon-xs" onClick={() => removeRisk(index)}><Trash2 className="size-3" /></Button>}
                </div>

                {/* Dropdowns */}
                <div className="form-grid">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Severity</label>
                    <Select value={risk.severity} onValueChange={(v) => updateRisk(index, 'severity', v)} disabled={!canEdit || isPreview}>
                      <SelectTrigger className="w-full h-8"><SelectValue /></SelectTrigger>
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
                    <Select value={risk.category} onValueChange={(v) => updateRisk(index, 'category', v)} disabled={!canEdit || isPreview}>
                      <SelectTrigger className="w-full h-8"><SelectValue /></SelectTrigger>
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

                {/* Title */}
                <div>
                  <Input value={risk.title} onChange={(e) => updateRisk(index, 'title', e.target.value)} placeholder="Risk title" className="text-sm font-medium" readOnly={!canEdit || isPreview} />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    Description
                    {canEdit && !isPreview && (
                      <AiFieldTrigger
                        fieldName="risk-description"
                        fieldLabel={`Description for risk: ${risk.title || 'Risk'}`}
                        currentValue={risk.description}
                        sectionSlug="risks-due-diligence"
                        sectionData={data as unknown as Record<string, unknown>}
                        onResult={(val) => updateData((prev) => {
                          const risks = [...prev.risks];
                          risks[index] = { ...risks[index], description: val };
                          return { ...prev, risks };
                        })}
                      />
                    )}
                  </label>
                  <Textarea value={risk.description} onChange={(e) => updateRisk(index, 'description', e.target.value)} placeholder="Describe the risk..." rows={2} className="text-xs text-muted-foreground" readOnly={!canEdit || isPreview} />
                </div>

                {/* Mitigation */}
                {(risk.mitigation || canEdit) && (
                  <div className="border-l-2 border-muted pl-3">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      Mitigation
                      {canEdit && !isPreview && (
                        <AiFieldTrigger
                          fieldName="risk-mitigation"
                          fieldLabel={`Mitigation for: ${risk.title || 'Risk'}`}
                          currentValue={risk.mitigation}
                          sectionSlug="risks-due-diligence"
                          sectionData={data as unknown as Record<string, unknown>}
                          onResult={(val) => updateData((prev) => {
                            const risks = [...prev.risks];
                            risks[index] = { ...risks[index], mitigation: val };
                            return { ...prev, risks };
                          })}
                        />
                      )}
                    </label>
                    <Textarea value={risk.mitigation} onChange={(e) => updateRisk(index, 'mitigation', e.target.value)} placeholder="Mitigation strategy..." rows={2} className="text-xs" readOnly={!canEdit || isPreview} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Due Diligence Checklist */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Due Diligence Checklist</h2>
          {canEdit && !isPreview && <Button variant="outline" size="sm" onClick={addDDItem}><Plus className="size-4" />Add Item</Button>}
        </div>

        {ddChecklist.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No due diligence items" description="Add items to track your due diligence checklist." action={canEdit && !isPreview ? { label: 'Add Item', onClick: addDDItem } : undefined} />
        ) : (
          <div className="space-y-3">
            {ddChecklist.map((item, index) => (
              <div key={index} className="card-elevated rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityStyles[item.priority]}`}>{item.priority}</span>
                    {(() => {
                      const StatusIcon = complianceStatusIcons[item.status];
                      return <StatusIcon className={`size-4 ${complianceStatusStyles[item.status]}`} />;
                    })()}
                    <span className="text-xs text-muted-foreground">
                      {item.status === 'not-started' ? 'Not Started' : item.status === 'pending' ? 'Pending' : 'Complete'}
                    </span>
                  </div>
                  {canEdit && !isPreview && <Button variant="ghost" size="icon-xs" onClick={() => removeDDItem(index)}><Trash2 className="size-3" /></Button>}
                </div>
                <div className="form-grid">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Priority</label>
                    <Select value={item.priority} onValueChange={(v) => updateDDItem(index, 'priority', v)} disabled={!canEdit || isPreview}>
                      <SelectTrigger className="w-full h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="required">Required</SelectItem>
                        <SelectItem value="advised">Advised</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <Select value={item.status} onValueChange={(v) => updateDDItem(index, 'status', v)} disabled={!canEdit || isPreview}>
                      <SelectTrigger className="w-full h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not-started">Not Started</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Input value={item.item} onChange={(e) => updateDDItem(index, 'item', e.target.value)} placeholder="Due diligence item..." className="text-sm font-medium" readOnly={!canEdit || isPreview} /></div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    Detail
                    {canEdit && !isPreview && (
                      <AiFieldTrigger
                        fieldName="dd-item-detail"
                        fieldLabel={`Detail for: ${item.item || 'Item'}`}
                        currentValue={item.detail}
                        sectionSlug="risks-due-diligence"
                        sectionData={data as unknown as Record<string, unknown>}
                        onResult={(val) => updateData((prev) => {
                          const list = [...(prev.dueDiligenceChecklist ?? [])];
                          list[index] = { ...list[index], detail: val };
                          return { ...prev, dueDiligenceChecklist: list };
                        })}
                      />
                    )}
                  </label>
                  <Textarea value={item.detail} onChange={(e) => updateDDItem(index, 'detail', e.target.value)} placeholder="Details and findings..." rows={2} className="text-xs" readOnly={!canEdit || isPreview} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compliance Checklist */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Compliance Checklist</h2>
          {canEdit && !isPreview && <Button variant="outline" size="sm" onClick={addComplianceItem}><Plus className="size-4" />Add Item</Button>}
        </div>

        {displayData.complianceChecklist.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="No compliance items" description="Track regulatory and compliance requirements." action={canEdit && !isPreview ? { label: 'Add Item', onClick: addComplianceItem } : undefined} />
        ) : (
          <div className="card-elevated rounded-lg divide-y">
            {displayData.complianceChecklist.map((item, index) => {
              const StatusIcon = complianceStatusIcons[item.status];
              return (
                <div key={index} className="flex items-center gap-3 px-4 py-3">
                  <StatusIcon className={`size-4 shrink-0 ${complianceStatusStyles[item.status]}`} />
                  <Input value={item.item} onChange={(e) => updateComplianceItem(index, 'item', e.target.value)} placeholder="Compliance item..." className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-1 px-1 text-sm" readOnly={!canEdit || isPreview} />
                  <Select value={item.status} onValueChange={(v) => updateComplianceItem(index, 'status', v)} disabled={!canEdit || isPreview}>
                    <SelectTrigger className="w-32 h-8">
                      <span className="text-xs">
                        {item.status === 'not-started' ? 'Not Started' : item.status === 'pending' ? 'Pending' : 'Complete'}
                      </span>
                    </SelectTrigger>
                    <SelectContent><SelectItem value="not-started">Not Started</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="complete">Complete</SelectItem></SelectContent>
                  </Select>
                  {canEdit && !isPreview && <Button variant="ghost" size="icon-xs" onClick={() => removeComplianceItem(index)}><Trash2 className="size-3" /></Button>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <PageHeader title="Risks & Due Diligence" description="Risk assessment, compliance tracking, and investment verdict">
        {canEdit && (
          <AiActionBar onGenerate={() => aiSuggestion.generate('generate', data)} onImprove={() => aiSuggestion.generate('improve', data)} onExpand={() => aiSuggestion.generate('expand', data)} isLoading={aiSuggestion.state.status === 'loading'} disabled={!isAiAvailable} />
        )}
      </PageHeader>

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
