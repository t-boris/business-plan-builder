import { useSection } from '@/hooks/use-section';
import { useAiSuggestion } from '@/hooks/use-ai-suggestion';
import { isAiAvailable } from '@/lib/ai/gemini-client';
import { AiActionBar } from '@/components/ai-action-bar';
import { AiSuggestionPreview } from '@/components/ai-suggestion-preview';
import type { Operations as OperationsType, CrewMember } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, AlertTriangle, AlertCircle } from 'lucide-react';

const defaultOperations: OperationsType = {
  crew: [
    { role: 'Party Host', hourlyRate: 20, count: 1 },
    { role: 'Photographer', hourlyRate: 25.5, count: 1 },
    { role: 'Assistant', hourlyRate: 18, count: 1 },
  ],
  capacity: { maxBookingsPerDay: 2, maxBookingsPerWeek: 8, maxBookingsPerMonth: 25 },
  travelRadius: 25,
  equipment: ['Party bus', 'Workshop supplies', 'Slime lab materials', 'Ocean decorations', 'Sound system'],
  safetyProtocols: [
    'Slime/chemical safety gloves for all participants',
    'First aid kit on-site',
    'Adult supervision ratio 1:5',
    'Museum emergency procedures briefing',
    'Allergy check before activities',
  ],
};

export function Operations() {
  const { data, updateData, isLoading } = useSection<OperationsType>('operations', defaultOperations);
  const aiSuggestion = useAiSuggestion<OperationsType>('operations');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Operations</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const isPreview = aiSuggestion.state.status === 'preview';
  const displayData = isPreview && aiSuggestion.state.suggested ? aiSuggestion.state.suggested : data;

  function handleAccept() {
    const suggested = aiSuggestion.accept();
    if (suggested) updateData(() => suggested);
  }

  function updateCrewMember(index: number, field: keyof CrewMember, value: string | number) {
    updateData((prev) => { const crew = [...prev.crew]; crew[index] = { ...crew[index], [field]: value }; return { ...prev, crew }; });
  }
  function addCrewMember() { updateData((prev) => ({ ...prev, crew: [...prev.crew, { role: '', hourlyRate: 0, count: 1 }] })); }
  function removeCrewMember(index: number) { updateData((prev) => ({ ...prev, crew: prev.crew.filter((_, i) => i !== index) })); }
  function updateCapacity(field: keyof OperationsType['capacity'], value: number) { updateData((prev) => ({ ...prev, capacity: { ...prev.capacity, [field]: value } })); }
  function updateEquipment(index: number, value: string) { updateData((prev) => { const equipment = [...prev.equipment]; equipment[index] = value; return { ...prev, equipment }; }); }
  function addEquipment() { updateData((prev) => ({ ...prev, equipment: [...prev.equipment, ''] })); }
  function removeEquipment(index: number) { updateData((prev) => ({ ...prev, equipment: prev.equipment.filter((_, i) => i !== index) })); }
  function updateSafetyProtocol(index: number, value: string) { updateData((prev) => { const safetyProtocols = [...prev.safetyProtocols]; safetyProtocols[index] = value; return { ...prev, safetyProtocols }; }); }
  function addSafetyProtocol() { updateData((prev) => ({ ...prev, safetyProtocols: [...prev.safetyProtocols, ''] })); }
  function removeSafetyProtocol(index: number) { updateData((prev) => ({ ...prev, safetyProtocols: prev.safetyProtocols.filter((_, i) => i !== index) })); }

  const sectionContent = (
    <div className="space-y-6">
      {/* Crew Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Crew</h2>
          {!isPreview && <Button variant="outline" size="sm" onClick={addCrewMember}><Plus className="size-4" />Add Crew Member</Button>}
        </div>
        <Card>
          <CardContent>
            <div className="space-y-3">
              <div className="hidden sm:grid grid-cols-[1fr_120px_80px_40px] gap-3 items-center">
                <span className="text-xs font-medium text-muted-foreground">Role</span>
                <span className="text-xs font-medium text-muted-foreground">Hourly Rate</span>
                <span className="text-xs font-medium text-muted-foreground">Count</span>
                <span />
              </div>
              {displayData.crew.map((member, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_80px_40px] gap-3 items-start border-b pb-3 last:border-0 last:pb-0 sm:border-0 sm:pb-0">
                  <div><span className="text-xs font-medium text-muted-foreground sm:hidden">Role</span><Input value={member.role} onChange={(e) => updateCrewMember(index, 'role', e.target.value)} placeholder="Role name" readOnly={isPreview} /></div>
                  <div><span className="text-xs font-medium text-muted-foreground sm:hidden">Hourly Rate</span><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span><Input type="number" className="pl-7" value={member.hourlyRate} onChange={(e) => updateCrewMember(index, 'hourlyRate', Number(e.target.value))} step="0.5" readOnly={isPreview} /></div></div>
                  <div><span className="text-xs font-medium text-muted-foreground sm:hidden">Count</span><Input type="number" value={member.count} onChange={(e) => updateCrewMember(index, 'count', Number(e.target.value))} min={1} readOnly={isPreview} /></div>
                  {!isPreview && <Button variant="ghost" size="icon-xs" className="mt-1 sm:mt-0" onClick={() => removeCrewMember(index)}><Trash2 className="size-3" /></Button>}
                </div>
              ))}
              {displayData.crew.length === 0 && <p className="text-sm text-muted-foreground py-2">No crew members added yet.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Capacity + Travel Radius */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Capacity</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Per Day</label><Input type="number" value={displayData.capacity.maxBookingsPerDay} onChange={(e) => updateCapacity('maxBookingsPerDay', Number(e.target.value))} min={0} readOnly={isPreview} /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Per Week</label><Input type="number" value={displayData.capacity.maxBookingsPerWeek} onChange={(e) => updateCapacity('maxBookingsPerWeek', Number(e.target.value))} min={0} readOnly={isPreview} /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Per Month</label><Input type="number" value={displayData.capacity.maxBookingsPerMonth} onChange={(e) => updateCapacity('maxBookingsPerMonth', Number(e.target.value))} min={0} readOnly={isPreview} /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Travel Radius</CardTitle></CardHeader>
          <CardContent>
            <div className="relative">
              <Input type="number" value={displayData.travelRadius} onChange={(e) => updateData((prev) => ({ ...prev, travelRadius: Number(e.target.value) }))} min={0} readOnly={isPreview} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">miles</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Equipment List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Equipment</h2>
          {!isPreview && <Button variant="outline" size="sm" onClick={addEquipment}><Plus className="size-4" />Add Item</Button>}
        </div>
        <Card>
          <CardContent>
            <div className="space-y-3">
              {displayData.equipment.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input value={item} onChange={(e) => updateEquipment(index, e.target.value)} placeholder="Equipment item" readOnly={isPreview} />
                  {!isPreview && <Button variant="ghost" size="icon-xs" onClick={() => removeEquipment(index)}><Trash2 className="size-3" /></Button>}
                </div>
              ))}
              {displayData.equipment.length === 0 && <p className="text-sm text-muted-foreground py-2">No equipment listed yet.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Safety Protocols */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Safety Protocols</h2>
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/50">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Deep Research Warning</p>
            <p className="text-sm text-amber-800 dark:text-amber-200">Slime/chemical activities carry documented dermatitis/burn risk. Ensure proper protective gloves, ventilation, and adult supervision for all slime lab activities.</p>
          </div>
        </div>
        <div className="flex items-center justify-end">
          {!isPreview && <Button variant="outline" size="sm" onClick={addSafetyProtocol}><Plus className="size-4" />Add Protocol</Button>}
        </div>
        <Card>
          <CardContent>
            <div className="space-y-3">
              {displayData.safetyProtocols.map((protocol, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="inline-flex shrink-0 items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">#{index + 1}</span>
                  <Input value={protocol} onChange={(e) => updateSafetyProtocol(index, e.target.value)} placeholder="Safety protocol" readOnly={isPreview} />
                  {!isPreview && <Button variant="ghost" size="icon-xs" onClick={() => removeSafetyProtocol(index)}><Trash2 className="size-3" /></Button>}
                </div>
              ))}
              {displayData.safetyProtocols.length === 0 && <p className="text-sm text-muted-foreground py-2">No safety protocols defined yet.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Operations</h1>
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
