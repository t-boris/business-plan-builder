import { useSection } from '@/hooks/use-section';
import type {
  RisksDueDiligence as RisksDueDiligenceType,
  Risk,
  RiskSeverity,
  RiskCategory,
  ComplianceItem,
  ComplianceStatus,
} from '@/types';
import {
  Card,
  CardHeader,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

const defaultRisks: RisksDueDiligenceType = {
  risks: [
    {
      category: 'regulatory',
      title: 'Miami-Dade Parking Regulations',
      severity: 'high',
      description: 'Large trailers may be restricted in residential zones per Miami-Dade county regulations.',
      mitigation: 'Research county trailer parking rules, obtain necessary permits, scout parking-friendly venues',
    },
    {
      category: 'legal',
      title: 'Jellyfish Museum Contract',
      severity: 'high',
      description: "Museum opens Feb 2026 — contract terms needed before underwriting '15 tickets included' in packages.",
      mitigation: 'Secure written partnership agreement with pricing guarantees before launch',
    },
    {
      category: 'legal',
      title: 'FTSA Compliance',
      severity: 'medium',
      description: 'Florida Telephone Solicitation Act compliance required for any automated texting/messaging.',
      mitigation: 'Ensure opt-in consent for all automated messages, review FTSA requirements with legal counsel',
    },
    {
      category: 'operational',
      title: 'Slime/Chemical Safety',
      severity: 'medium',
      description: 'Slime and chemical activities carry documented dermatitis/burn risk for children.',
      mitigation: 'Mandatory gloves, pre-activity allergy screening, adult supervision ratio 1:5, first aid kit on-site',
    },
    {
      category: 'financial',
      title: 'CAC Uncertainty',
      severity: 'medium',
      description: 'Actual customer acquisition costs may exceed $30/lead target in competitive Miami market.',
      mitigation: 'Start with small ad budget in soft launch, test and optimize before scaling',
    },
    {
      category: 'operational',
      title: 'Bilingual Market Requirement',
      severity: 'low',
      description: '75.3% of Miami-Dade speaks non-English at home — monolingual English marketing limits reach.',
      mitigation: 'Create bilingual (English/Spanish) ad creatives and landing page',
    },
  ],
  complianceChecklist: [
    { item: 'Business license and permits', status: 'not-started' },
    { item: 'Jellyfish Museum partnership agreement', status: 'not-started' },
    { item: 'General liability insurance', status: 'not-started' },
    { item: 'FTSA compliance review', status: 'not-started' },
    { item: 'Food handling permits (if applicable)', status: 'not-started' },
    { item: 'Vehicle/trailer insurance', status: 'not-started' },
    { item: 'Child safety protocol documentation', status: 'not-started' },
  ],
};

const severityStyles: Record<RiskSeverity, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-green-100 text-green-800',
};

const categoryStyles: Record<RiskCategory, string> = {
  regulatory: 'bg-purple-100 text-purple-800',
  legal: 'bg-blue-100 text-blue-800',
  operational: 'bg-gray-100 text-gray-800',
  financial: 'bg-yellow-100 text-yellow-800',
};

const complianceStatusStyles: Record<ComplianceStatus, string> = {
  'not-started': 'bg-gray-100 text-gray-800',
  pending: 'bg-amber-100 text-amber-800',
  complete: 'bg-green-100 text-green-800',
};

export function RisksDueDiligence() {
  const { data, updateData, isLoading } = useSection<RisksDueDiligenceType>(
    'risks-due-diligence',
    defaultRisks
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Risks & Due Diligence</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  function updateRisk(index: number, field: keyof Risk, value: string) {
    updateData((prev) => {
      const risks = [...prev.risks];
      risks[index] = { ...risks[index], [field]: value };
      return { ...prev, risks };
    });
  }

  function addRisk() {
    updateData((prev) => ({
      ...prev,
      risks: [
        ...prev.risks,
        {
          category: 'operational' as RiskCategory,
          title: '',
          severity: 'medium' as RiskSeverity,
          description: '',
          mitigation: '',
        },
      ],
    }));
  }

  function removeRisk(index: number) {
    updateData((prev) => ({
      ...prev,
      risks: prev.risks.filter((_, i) => i !== index),
    }));
  }

  function updateComplianceItem(index: number, field: keyof ComplianceItem, value: string) {
    updateData((prev) => {
      const complianceChecklist = [...prev.complianceChecklist];
      complianceChecklist[index] = { ...complianceChecklist[index], [field]: value };
      return { ...prev, complianceChecklist };
    });
  }

  function addComplianceItem() {
    updateData((prev) => ({
      ...prev,
      complianceChecklist: [
        ...prev.complianceChecklist,
        { item: '', status: 'not-started' as ComplianceStatus },
      ],
    }));
  }

  function removeComplianceItem(index: number) {
    updateData((prev) => ({
      ...prev,
      complianceChecklist: prev.complianceChecklist.filter((_, i) => i !== index),
    }));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Risks & Due Diligence</h1>

      {/* Risks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Risk Assessment</h2>
          <Button variant="outline" size="sm" onClick={addRisk}>
            <Plus className="size-4" />
            Add Risk
          </Button>
        </div>

        <div className="space-y-4">
          {data.risks.map((risk, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${severityStyles[risk.severity]}`}>
                      {risk.severity}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryStyles[risk.category]}`}>
                      {risk.category}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon-xs" onClick={() => removeRisk(index)}>
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Severity</label>
                    <Select value={risk.severity} onValueChange={(v) => updateRisk(index, 'severity', v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Category</label>
                    <Select value={risk.category} onValueChange={(v) => updateRisk(index, 'category', v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regulatory">Regulatory</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="financial">Financial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Title</label>
                  <Input
                    value={risk.title}
                    onChange={(e) => updateRisk(index, 'title', e.target.value)}
                    placeholder="Risk title"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Description</label>
                  <Textarea
                    value={risk.description}
                    onChange={(e) => updateRisk(index, 'description', e.target.value)}
                    placeholder="Describe the risk..."
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Mitigation</label>
                  <Textarea
                    value={risk.mitigation}
                    onChange={(e) => updateRisk(index, 'mitigation', e.target.value)}
                    placeholder="Mitigation strategy..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          {data.risks.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">No risks added. Click "Add Risk" to get started.</p>
          )}
        </div>
      </div>

      <Separator />

      {/* Compliance Checklist */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Compliance Checklist</h2>
          <Button variant="outline" size="sm" onClick={addComplianceItem}>
            <Plus className="size-4" />
            Add Item
          </Button>
        </div>

        <Card>
          <CardContent>
            <div className="space-y-3">
              {data.complianceChecklist.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Input
                    value={item.item}
                    onChange={(e) => updateComplianceItem(index, 'item', e.target.value)}
                    placeholder="Compliance item..."
                    className="flex-1"
                  />
                  <Select
                    value={item.status}
                    onValueChange={(v) => updateComplianceItem(index, 'status', v)}
                  >
                    <SelectTrigger className="w-36">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${complianceStatusStyles[item.status]}`}>
                        {item.status === 'not-started' ? 'Not Started' : item.status === 'pending' ? 'Pending' : 'Complete'}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-started">Not Started</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="complete">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon-xs" onClick={() => removeComplianceItem(index)}>
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
              {data.complianceChecklist.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">No compliance items. Click "Add Item" to get started.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
