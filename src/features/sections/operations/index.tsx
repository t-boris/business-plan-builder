import { useSection } from '@/hooks/use-section';
import { useAiSuggestion } from '@/hooks/use-ai-suggestion';
import { isAiAvailable } from '@/lib/ai/gemini-client';
import { AiActionBar } from '@/components/ai-action-bar';
import { AiSuggestionPreview } from '@/components/ai-suggestion-preview';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { EmptyState } from '@/components/empty-state';
import type { Operations as OperationsType, CrewMember, CostBreakdown } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, AlertTriangle, AlertCircle, Users, Monitor, Car, Megaphone, Package, ShieldAlert, Wrench } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const defaultCostBreakdown: CostBreakdown = {
  // Per-event variable
  suppliesPerChild: 5,
  participantsPerEvent: 15,
  museumTicketPrice: 15,
  ticketsPerEvent: 15,
  fuelPricePerGallon: 3.5,
  vehicleMPG: 12,
  avgRoundTripMiles: 30,
  parkingPerEvent: 10,
  // Team salaries
  ownerSalary: 4000,
  marketingPerson: 2500,
  eventCoordinator: 2000,
  // Vehicle
  vehiclePayment: 800,
  vehicleInsurance: 250,
  vehicleMaintenance: 200,
  // IT & Software
  crmSoftware: 100,
  websiteHosting: 50,
  aiChatbot: 300,
  cloudServices: 50,
  phonePlan: 100,
  // Marketing overhead
  contentCreation: 500,
  graphicDesign: 150,
  // Other
  storageRent: 300,
  equipmentAmortization: 200,
  businessLicenses: 50,
  miscFixed: 100,
  // Custom
  customExpenses: [],
};

const defaultOperations: OperationsType = {
  crew: [],
  hoursPerEvent: 0,
  capacity: { maxBookingsPerDay: 0, maxBookingsPerWeek: 0, maxBookingsPerMonth: 0 },
  travelRadius: 0,
  equipment: [],
  safetyProtocols: [],
  costBreakdown: { ...defaultCostBreakdown, suppliesPerChild: 0, participantsPerEvent: 0, museumTicketPrice: 0, ticketsPerEvent: 0, fuelPricePerGallon: 0, vehicleMPG: 0, avgRoundTripMiles: 0, parkingPerEvent: 0, ownerSalary: 0, marketingPerson: 0, eventCoordinator: 0, vehiclePayment: 0, vehicleInsurance: 0, vehicleMaintenance: 0, crmSoftware: 0, websiteHosting: 0, aiChatbot: 0, cloudServices: 0, phonePlan: 0, contentCreation: 0, graphicDesign: 0, storageRent: 0, equipmentAmortization: 0, businessLicenses: 0, miscFixed: 0 },
};

function fmt(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
}

function fmtS(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function computeCosts(ops: OperationsType) {
  const cb = ops.costBreakdown;

  // Per-event variable costs
  const suppliesCost = cb.suppliesPerChild * cb.participantsPerEvent;
  const museumCost = cb.museumTicketPrice * cb.ticketsPerEvent;
  const fuelCost = cb.vehicleMPG > 0 ? (cb.avgRoundTripMiles / cb.vehicleMPG) * cb.fuelPricePerGallon : 0;
  const laborCost = ops.crew.reduce((sum, m) => sum + m.hourlyRate * m.count, 0) * ops.hoursPerEvent;
  const variableCostPerEvent = suppliesCost + museumCost + fuelCost + cb.parkingPerEvent;
  const totalCostPerEvent = variableCostPerEvent + laborCost;

  // Custom expenses
  const customs = cb.customExpenses || [];
  const customPerEvent = customs.filter((c) => c.type === 'per-event').reduce((s, c) => s + c.amount, 0);
  const customMonthly = customs.filter((c) => c.type === 'monthly').reduce((s, c) => s + c.amount, 0);

  // Add custom per-event to total
  const totalCostPerEventFinal = totalCostPerEvent + customPerEvent;

  // Monthly fixed by category
  const teamCosts = cb.ownerSalary + cb.marketingPerson + cb.eventCoordinator;
  const vehicleCosts = cb.vehiclePayment + cb.vehicleInsurance + cb.vehicleMaintenance;
  const itCosts = cb.crmSoftware + cb.websiteHosting + cb.aiChatbot + cb.cloudServices + cb.phonePlan;
  const marketingOverhead = cb.contentCreation + cb.graphicDesign;
  const otherOverhead = cb.storageRent + cb.equipmentAmortization + cb.businessLicenses + cb.miscFixed;
  const monthlyFixed = teamCosts + vehicleCosts + itCosts + marketingOverhead + otherOverhead + customMonthly;

  // Monthly totals
  const bookings = ops.capacity.maxBookingsPerMonth;
  const monthlyVariableTotal = totalCostPerEventFinal * bookings;
  const monthlyTotalCosts = monthlyVariableTotal + monthlyFixed;

  return {
    suppliesCost, museumCost, fuelCost, laborCost, variableCostPerEvent,
    totalCostPerEvent: totalCostPerEventFinal, customPerEvent, customMonthly,
    teamCosts, vehicleCosts, itCosts, marketingOverhead, otherOverhead, monthlyFixed,
    monthlyVariableTotal, monthlyTotalCosts, bookings,
  };
}

const PIE_COLORS = ['var(--chart-profit)', 'var(--chart-accent-1)', 'var(--chart-cost)', 'var(--chart-revenue)', 'var(--chart-accent-2)', '#06b6d4'];
const FIXED_COLORS = ['var(--chart-profit)', 'var(--chart-accent-1)', 'var(--chart-cost)', 'var(--chart-revenue)', 'var(--chart-accent-2)'];

function CostInput({ label, value, onChange, readOnly, step }: { label: string; value: number; onChange: (v: number) => void; readOnly: boolean; step?: number }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
        <Input type="number" className="pl-7 tabular-nums" value={value} onChange={(e) => onChange(Number(e.target.value))} step={step} readOnly={readOnly} />
      </div>
    </div>
  );
}

function CategoryCard({ icon: Icon, iconColor, title, children }: { icon: React.ElementType; iconColor: string; title: string; children: React.ReactNode }) {
  return (
    <div className="card-elevated rounded-lg">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <Icon className={`size-4 ${iconColor}`} />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="px-4 pb-4 space-y-3">{children}</div>
    </div>
  );
}

function SubtotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{fmt(value)}</span>
    </div>
  );
}

function SummaryLine({ label, value, bold, indent, colorClass }: { label: string; value: string; bold?: boolean; indent?: boolean; colorClass?: string }) {
  return (
    <div className={`flex justify-between ${indent ? 'pl-4' : ''} ${bold ? 'font-semibold' : 'text-sm'}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular-nums ${colorClass ?? ''}`}>{value}</span>
    </div>
  );
}

export function Operations() {
  const { data, updateData, isLoading, canEdit } = useSection<OperationsType>('operations', defaultOperations);
  const aiSuggestion = useAiSuggestion<OperationsType>('operations');

  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader title="Operations" description="Loading..." />
      </div>
    );
  }

  const isPreview = aiSuggestion.state.status === 'preview';
  const displayData = isPreview && aiSuggestion.state.suggested ? aiSuggestion.state.suggested : data;

  if (!displayData.costBreakdown || !('ownerSalary' in displayData.costBreakdown)) {
    updateData((prev) => ({ ...prev, costBreakdown: defaultCostBreakdown, hoursPerEvent: prev.hoursPerEvent || 4 }));
    return null;
  }

  const costs = computeCosts(displayData);
  const cb = displayData.costBreakdown;

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
  function uc(field: keyof CostBreakdown, value: number) { updateData((prev) => ({ ...prev, costBreakdown: { ...prev.costBreakdown, [field]: value } })); }
  function updateEquipment(index: number, value: string) { updateData((prev) => { const equipment = [...prev.equipment]; equipment[index] = value; return { ...prev, equipment }; }); }
  function addEquipment() { updateData((prev) => ({ ...prev, equipment: [...prev.equipment, ''] })); }
  function removeEquipment(index: number) { updateData((prev) => ({ ...prev, equipment: prev.equipment.filter((_, i) => i !== index) })); }
  function updateSafetyProtocol(index: number, value: string) { updateData((prev) => { const safetyProtocols = [...prev.safetyProtocols]; safetyProtocols[index] = value; return { ...prev, safetyProtocols }; }); }
  function addSafetyProtocol() { updateData((prev) => ({ ...prev, safetyProtocols: [...prev.safetyProtocols, ''] })); }
  function removeSafetyProtocol(index: number) { updateData((prev) => ({ ...prev, safetyProtocols: prev.safetyProtocols.filter((_, i) => i !== index) })); }
  function addCustomExpense() { updateData((prev) => ({ ...prev, costBreakdown: { ...prev.costBreakdown, customExpenses: [...(prev.costBreakdown.customExpenses || []), { name: '', amount: 0, type: 'monthly' as const }] } })); }
  function updateCustomExpense(index: number, field: string, value: string | number) {
    updateData((prev) => {
      const exps = [...(prev.costBreakdown.customExpenses || [])];
      exps[index] = { ...exps[index], [field]: value };
      return { ...prev, costBreakdown: { ...prev.costBreakdown, customExpenses: exps } };
    });
  }
  function removeCustomExpense(index: number) { updateData((prev) => ({ ...prev, costBreakdown: { ...prev.costBreakdown, customExpenses: (prev.costBreakdown.customExpenses || []).filter((_, i) => i !== index) } })); }

  // Charts
  const perEventPieData = [
    { name: 'Labor', value: costs.laborCost },
    { name: 'Venue/Tickets', value: costs.museumCost },
    { name: 'Supplies', value: costs.suppliesCost },
    { name: 'Fuel', value: costs.fuelCost },
    { name: 'Parking', value: cb.parkingPerEvent },
  ].filter((d) => d.value > 0);

  const fixedPieData = [
    { name: 'Team Salaries', value: costs.teamCosts },
    { name: 'Vehicle', value: costs.vehicleCosts },
    { name: 'IT & Software', value: costs.itCosts },
    { name: 'Marketing', value: costs.marketingOverhead },
    { name: 'Other', value: costs.otherOverhead },
  ].filter((d) => d.value > 0);

  const monthlyBarData = [
    { name: 'Per Event', value: costs.totalCostPerEvent },
    { name: `Events (${costs.bookings})`, value: costs.monthlyVariableTotal },
    { name: 'Fixed', value: costs.monthlyFixed },
    { name: 'Total', value: costs.monthlyTotalCosts },
  ];

  const sectionContent = (
    <div className="page-container">
      {/* Summary Stats */}
      <div className="stat-grid">
        <StatCard label="Cost Per Event" value={fmtS(costs.totalCostPerEvent)} sublabel="labor + materials + transport" />
        <StatCard label="Monthly Fixed" value={fmtS(costs.monthlyFixed)} sublabel="team + vehicle + IT + overhead" />
        <StatCard label={`Monthly Total (${costs.bookings} events)`} value={fmtS(costs.monthlyTotalCosts)} sublabel="all costs combined" />
        <StatCard label="Team Salaries" value={fmtS(costs.teamCosts)} sublabel="owner + marketing + coordinator" />
      </div>

      {/* Crew & Labor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Event Crew</h2>
          {canEdit && !isPreview && <Button variant="outline" size="sm" onClick={addCrewMember}><Plus className="size-4" />Add Crew Member</Button>}
        </div>
        {displayData.crew.length === 0 ? (
          <EmptyState icon={Users} title="No crew members" description="Add crew members to calculate per-event labor costs." action={canEdit && !isPreview ? { label: 'Add Crew Member', onClick: addCrewMember } : undefined} />
        ) : (
          <div className="card-elevated rounded-lg overflow-hidden">
            <div className="p-4 space-y-3">
              <div className="hidden sm:grid grid-cols-[1fr_120px_80px_100px_40px] gap-3 items-center">
                <span className="text-xs font-medium text-muted-foreground">Role</span>
                <span className="text-xs font-medium text-muted-foreground">Hourly Rate</span>
                <span className="text-xs font-medium text-muted-foreground">Count</span>
                <span className="text-xs font-medium text-muted-foreground">Per Event</span>
                <span />
              </div>
              {displayData.crew.map((member, index) => (
                <div key={index} className="group grid grid-cols-1 sm:grid-cols-[1fr_120px_80px_100px_40px] gap-3 items-start border-b pb-3 last:border-0 last:pb-0 sm:border-0 sm:pb-0">
                  <div><span className="text-xs font-medium text-muted-foreground sm:hidden">Role</span><Input value={member.role} onChange={(e) => updateCrewMember(index, 'role', e.target.value)} placeholder="Role name" readOnly={!canEdit || isPreview} /></div>
                  <div><span className="text-xs font-medium text-muted-foreground sm:hidden">$/hr</span><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span><Input type="number" className="pl-7 tabular-nums" value={member.hourlyRate} onChange={(e) => updateCrewMember(index, 'hourlyRate', Number(e.target.value))} step="0.5" readOnly={!canEdit || isPreview} /></div></div>
                  <div><span className="text-xs font-medium text-muted-foreground sm:hidden">Count</span><Input type="number" className="tabular-nums" value={member.count} onChange={(e) => updateCrewMember(index, 'count', Number(e.target.value))} min={1} readOnly={!canEdit || isPreview} /></div>
                  <div><span className="text-xs font-medium text-muted-foreground sm:hidden">Per Event</span><div className="flex h-9 items-center rounded-md bg-muted px-3 text-sm font-medium tabular-nums">{fmt(member.hourlyRate * member.count * displayData.hoursPerEvent)}</div></div>
                  {canEdit && !isPreview && <Button variant="ghost" size="icon-xs" className="mt-1 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeCrewMember(index)}><Trash2 className="size-3" /></Button>}
                </div>
              ))}
              {displayData.crew.length > 0 && (
                <div className="border-t pt-3 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_80px_100px_40px] gap-3 items-center">
                    <div className="sm:col-span-3 text-sm font-medium text-right">Hours per event:</div>
                    <div><Input type="number" className="tabular-nums" value={displayData.hoursPerEvent} onChange={(e) => updateData((prev) => ({ ...prev, hoursPerEvent: Number(e.target.value) }))} min={1} step={0.5} readOnly={!canEdit || isPreview} /></div>
                    <div />
                  </div>
                  <SubtotalRow label={`Total labor per event (${displayData.crew.length} crew x ${displayData.hoursPerEvent}h)`} value={costs.laborCost} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Capacity */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Capacity & Travel</h2>
        <div className="stat-grid">
          <div className="card-elevated rounded-lg p-4">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Max / Day</label>
            <Input type="number" className="mt-1 tabular-nums" value={displayData.capacity.maxBookingsPerDay} onChange={(e) => updateCapacity('maxBookingsPerDay', Number(e.target.value))} min={0} readOnly={!canEdit || isPreview} />
          </div>
          <div className="card-elevated rounded-lg p-4">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Max / Week</label>
            <Input type="number" className="mt-1 tabular-nums" value={displayData.capacity.maxBookingsPerWeek} onChange={(e) => updateCapacity('maxBookingsPerWeek', Number(e.target.value))} min={0} readOnly={!canEdit || isPreview} />
          </div>
          <div className="card-elevated rounded-lg p-4">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Max / Month</label>
            <Input type="number" className="mt-1 tabular-nums" value={displayData.capacity.maxBookingsPerMonth} onChange={(e) => updateCapacity('maxBookingsPerMonth', Number(e.target.value))} min={0} readOnly={!canEdit || isPreview} />
          </div>
          <div className="card-elevated rounded-lg p-4">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Travel Radius</label>
            <div className="relative mt-1">
              <Input type="number" className="tabular-nums pr-14" value={displayData.travelRadius} onChange={(e) => updateData((prev) => ({ ...prev, travelRadius: Number(e.target.value) }))} min={0} readOnly={!canEdit || isPreview} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">miles</span>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Event Variable Costs */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Per-Event Variable Costs</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CategoryCard icon={Package} iconColor="text-blue-600" title="Supplies & Materials">
            <div className="form-grid">
              <CostInput label="Cost per child" value={cb.suppliesPerChild} onChange={(v) => uc('suppliesPerChild', v)} readOnly={!canEdit || isPreview} step={0.5} />
              <div><label className="text-xs font-medium text-muted-foreground">Participants</label><Input type="number" className="tabular-nums" value={cb.participantsPerEvent} onChange={(e) => uc('participantsPerEvent', Number(e.target.value))} min={1} readOnly={!canEdit || isPreview} /></div>
            </div>
            <SubtotalRow label="Supplies total" value={costs.suppliesCost} />
          </CategoryCard>

          <CategoryCard icon={Wrench} iconColor="text-purple-600" title="Venue / Tickets">
            <div className="form-grid">
              <CostInput label="Ticket/Venue price" value={cb.museumTicketPrice} onChange={(v) => uc('museumTicketPrice', v)} readOnly={!canEdit || isPreview} step={0.5} />
              <div><label className="text-xs font-medium text-muted-foreground">Tickets per event</label><Input type="number" className="tabular-nums" value={cb.ticketsPerEvent} onChange={(e) => uc('ticketsPerEvent', Number(e.target.value))} min={0} readOnly={!canEdit || isPreview} /></div>
            </div>
            <SubtotalRow label="Venue/Tickets total" value={costs.museumCost} />
          </CategoryCard>

          <CategoryCard icon={Car} iconColor="text-emerald-600" title="Fuel / Transportation">
            <div className="grid grid-cols-3 gap-3">
              <CostInput label="Gas $/gal" value={cb.fuelPricePerGallon} onChange={(v) => uc('fuelPricePerGallon', v)} readOnly={!canEdit || isPreview} step={0.1} />
              <div><label className="text-xs font-medium text-muted-foreground">Vehicle MPG</label><Input type="number" className="tabular-nums" value={cb.vehicleMPG} onChange={(e) => uc('vehicleMPG', Number(e.target.value))} min={1} readOnly={!canEdit || isPreview} /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Round trip mi</label><Input type="number" className="tabular-nums" value={cb.avgRoundTripMiles} onChange={(e) => uc('avgRoundTripMiles', Number(e.target.value))} min={0} readOnly={!canEdit || isPreview} /></div>
            </div>
            <CostInput label="Parking per event" value={cb.parkingPerEvent} onChange={(v) => uc('parkingPerEvent', v)} readOnly={!canEdit || isPreview} />
            <SubtotalRow label={`Fuel (${(cb.avgRoundTripMiles / Math.max(cb.vehicleMPG, 1)).toFixed(1)} gal) + parking`} value={costs.fuelCost + cb.parkingPerEvent} />
          </CategoryCard>

          {/* Per-Event Summary */}
          <div className="card-elevated rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-semibold">Per-Event Cost Summary</h3>
            <SummaryLine label={`Labor (${displayData.crew.length} crew x ${displayData.hoursPerEvent}h)`} value={fmt(costs.laborCost)} />
            <SummaryLine label={`Supplies (${cb.participantsPerEvent} x ${fmt(cb.suppliesPerChild)})`} value={fmt(costs.suppliesCost)} />
            <SummaryLine label={`Venue/Tickets (${cb.ticketsPerEvent} x ${fmt(cb.museumTicketPrice)})`} value={fmt(costs.museumCost)} />
            <SummaryLine label="Fuel + Parking" value={fmt(costs.fuelCost + cb.parkingPerEvent)} />
            {costs.customPerEvent > 0 && <SummaryLine label="Custom per-event" value={fmt(costs.customPerEvent)} />}
            <div className="border-t pt-2">
              <SummaryLine label="Total per event" value={fmt(costs.totalCostPerEvent)} bold colorClass="text-blue-700 dark:text-blue-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Per-Event Chart */}
      {perEventPieData.length > 0 && (
        <div className="card-elevated rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Per-Event Cost Breakdown</h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={perEventPieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {perEventPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Monthly Fixed Costs */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Monthly Fixed Costs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CategoryCard icon={Users} iconColor="text-blue-600" title="Core Team">
            <div className="form-grid">
              <CostInput label="Owner / Founder salary" value={cb.ownerSalary} onChange={(v) => uc('ownerSalary', v)} readOnly={!canEdit || isPreview} />
              <CostInput label="Marketing / Social Media" value={cb.marketingPerson} onChange={(v) => uc('marketingPerson', v)} readOnly={!canEdit || isPreview} />
            </div>
            <CostInput label="Event coordinator / Sales" value={cb.eventCoordinator} onChange={(v) => uc('eventCoordinator', v)} readOnly={!canEdit || isPreview} />
            <SubtotalRow label="Team subtotal" value={costs.teamCosts} />
          </CategoryCard>

          <CategoryCard icon={Car} iconColor="text-purple-600" title="Vehicle">
            <CostInput label="Loan / Lease payment" value={cb.vehiclePayment} onChange={(v) => uc('vehiclePayment', v)} readOnly={!canEdit || isPreview} />
            <CostInput label="Insurance" value={cb.vehicleInsurance} onChange={(v) => uc('vehicleInsurance', v)} readOnly={!canEdit || isPreview} />
            <CostInput label="Maintenance reserve" value={cb.vehicleMaintenance} onChange={(v) => uc('vehicleMaintenance', v)} readOnly={!canEdit || isPreview} />
            <SubtotalRow label="Vehicle subtotal" value={costs.vehicleCosts} />
          </CategoryCard>

          <CategoryCard icon={Monitor} iconColor="text-emerald-600" title="IT & Software">
            <CostInput label="CRM + Booking platform" value={cb.crmSoftware} onChange={(v) => uc('crmSoftware', v)} readOnly={!canEdit || isPreview} />
            <CostInput label="Website hosting + domain" value={cb.websiteHosting} onChange={(v) => uc('websiteHosting', v)} readOnly={!canEdit || isPreview} />
            <CostInput label="AI chatbot / API costs" value={cb.aiChatbot} onChange={(v) => uc('aiChatbot', v)} readOnly={!canEdit || isPreview} />
            <div className="form-grid">
              <CostInput label="Cloud services" value={cb.cloudServices} onChange={(v) => uc('cloudServices', v)} readOnly={!canEdit || isPreview} />
              <CostInput label="Business phone plan" value={cb.phonePlan} onChange={(v) => uc('phonePlan', v)} readOnly={!canEdit || isPreview} />
            </div>
            <SubtotalRow label="IT subtotal" value={costs.itCosts} />
          </CategoryCard>

          <CategoryCard icon={Megaphone} iconColor="text-amber-600" title="Marketing Overhead">
            <CostInput label="Content creation (video, photo)" value={cb.contentCreation} onChange={(v) => uc('contentCreation', v)} readOnly={!canEdit || isPreview} />
            <CostInput label="Graphic design (Canva Pro, freelance)" value={cb.graphicDesign} onChange={(v) => uc('graphicDesign', v)} readOnly={!canEdit || isPreview} />
            <SubtotalRow label="Marketing overhead subtotal" value={costs.marketingOverhead} />
            <p className="text-[10px] text-muted-foreground">Production cost only, not ad spend.</p>
          </CategoryCard>

          {/* Other Overhead */}
          <div className="card-elevated rounded-lg">
            <div className="flex items-center gap-2 px-4 pt-4 pb-2">
              <h3 className="text-sm font-semibold">Other Overhead</h3>
            </div>
            <div className="px-4 pb-4 space-y-3">
              <div className="form-grid">
                <CostInput label="Storage / warehouse rent" value={cb.storageRent} onChange={(v) => uc('storageRent', v)} readOnly={!canEdit || isPreview} />
                <CostInput label="Equipment amortization" value={cb.equipmentAmortization} onChange={(v) => uc('equipmentAmortization', v)} readOnly={!canEdit || isPreview} />
              </div>
              <div className="form-grid">
                <CostInput label="Business licenses (amortized)" value={cb.businessLicenses} onChange={(v) => uc('businessLicenses', v)} readOnly={!canEdit || isPreview} />
                <CostInput label="Miscellaneous / buffer" value={cb.miscFixed} onChange={(v) => uc('miscFixed', v)} readOnly={!canEdit || isPreview} />
              </div>
              <SubtotalRow label="Other subtotal" value={costs.otherOverhead} />
            </div>
          </div>

          {/* Custom Expenses */}
          <div className="card-elevated rounded-lg">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="text-sm font-semibold">Custom Expenses</h3>
              {canEdit && !isPreview && <Button variant="outline" size="sm" onClick={addCustomExpense}><Plus className="size-3" />Add</Button>}
            </div>
            <div className="px-4 pb-4 space-y-3">
              {(cb.customExpenses || []).length === 0 && <p className="text-xs text-muted-foreground py-2">No custom expenses. Add any cost not covered above.</p>}
              {(cb.customExpenses || []).map((exp, index) => (
                <div key={index} className="group grid grid-cols-[1fr_100px_120px_32px] gap-2 items-end">
                  <div><label className="text-xs font-medium text-muted-foreground">Name</label><Input value={exp.name} onChange={(e) => updateCustomExpense(index, 'name', e.target.value)} placeholder="Expense name" readOnly={!canEdit || isPreview} /></div>
                  <div><label className="text-xs font-medium text-muted-foreground">Amount</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span><Input type="number" className="pl-7 tabular-nums" value={exp.amount} onChange={(e) => updateCustomExpense(index, 'amount', Number(e.target.value))} readOnly={!canEdit || isPreview} /></div></div>
                  <div><label className="text-xs font-medium text-muted-foreground">Type</label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={exp.type} onChange={(e) => updateCustomExpense(index, 'type', e.target.value)} disabled={!canEdit || isPreview}>
                      <option value="monthly">Monthly</option>
                      <option value="per-event">Per Event</option>
                    </select>
                  </div>
                  {canEdit && !isPreview && <Button variant="ghost" size="icon-xs" className="mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeCustomExpense(index)}><Trash2 className="size-3" /></Button>}
                </div>
              ))}
              {((cb.customExpenses || []).length > 0) && (
                <div className="space-y-1 pt-2 border-t">
                  {costs.customPerEvent > 0 && <SubtotalRow label="Custom per-event total" value={costs.customPerEvent} />}
                  {costs.customMonthly > 0 && <SubtotalRow label="Custom monthly total" value={costs.customMonthly} />}
                </div>
              )}
            </div>
          </div>

          {/* Fixed Summary */}
          <div className="card-elevated rounded-lg p-4 space-y-2 md:col-span-2">
            <h3 className="text-sm font-semibold">Monthly Fixed Summary</h3>
            <SummaryLine label="Team salaries" value={fmtS(costs.teamCosts)} />
            <SummaryLine label="Vehicle" value={fmtS(costs.vehicleCosts)} />
            <SummaryLine label="IT & Software" value={fmtS(costs.itCosts)} />
            <SummaryLine label="Marketing overhead" value={fmtS(costs.marketingOverhead)} />
            <SummaryLine label="Other overhead" value={fmtS(costs.otherOverhead)} />
            {costs.customMonthly > 0 && <SummaryLine label="Custom monthly" value={fmtS(costs.customMonthly)} />}
            <div className="border-t pt-2">
              <SummaryLine label="Total monthly fixed" value={fmtS(costs.monthlyFixed)} bold colorClass="text-purple-700 dark:text-purple-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Costs Chart */}
      {fixedPieData.length > 0 && (
        <div className="card-elevated rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Monthly Fixed Costs Breakdown</h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={fixedPieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {fixedPieData.map((_, i) => <Cell key={i} fill={FIXED_COLORS[i % FIXED_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtS(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Monthly Total Overview */}
      <div className="card-elevated rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Monthly Operations Total ({costs.bookings} events/month)</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <SummaryLine label={`Variable (${costs.bookings} events x ${fmtS(costs.totalCostPerEvent)})`} value={fmtS(costs.monthlyVariableTotal)} />
            <SummaryLine label="Labor" value={fmtS(costs.laborCost * costs.bookings)} indent />
            <SummaryLine label="Supplies" value={fmtS(costs.suppliesCost * costs.bookings)} indent />
            <SummaryLine label="Venue/Tickets" value={fmtS(costs.museumCost * costs.bookings)} indent />
            <SummaryLine label="Fuel + parking" value={fmtS((costs.fuelCost + cb.parkingPerEvent) * costs.bookings)} indent />
            <div className="border-t pt-2">
              <SummaryLine label="Fixed costs" value={fmtS(costs.monthlyFixed)} />
            </div>
            <SummaryLine label="Team" value={fmtS(costs.teamCosts)} indent />
            <SummaryLine label="Vehicle" value={fmtS(costs.vehicleCosts)} indent />
            <SummaryLine label="IT" value={fmtS(costs.itCosts)} indent />
            <SummaryLine label="Marketing prod." value={fmtS(costs.marketingOverhead)} indent />
            <SummaryLine label="Other" value={fmtS(costs.otherOverhead)} indent />
            <div className="border-t pt-2">
              <SummaryLine label="Total Monthly" value={fmtS(costs.monthlyTotalCosts)} bold colorClass="text-amber-700 dark:text-amber-300" />
            </div>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyBarData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => fmtS(Number(v))} />
                <Bar dataKey="value" fill="var(--chart-cost)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Equipment */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Equipment</h2>
          {canEdit && !isPreview && <Button variant="outline" size="sm" onClick={addEquipment}><Plus className="size-4" />Add Item</Button>}
        </div>
        {displayData.equipment.length === 0 ? (
          <EmptyState icon={Package} title="No equipment listed" description="Add equipment and tools used in your operations." action={canEdit && !isPreview ? { label: 'Add Equipment', onClick: addEquipment } : undefined} />
        ) : (
          <div className="grid gap-2">
            {displayData.equipment.map((item, index) => (
              <div key={index} className="group card-elevated rounded-lg px-4 py-2 flex items-center gap-2">
                <Input value={item} onChange={(e) => updateEquipment(index, e.target.value)} placeholder="Equipment item" className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0" readOnly={!canEdit || isPreview} />
                {canEdit && !isPreview && <Button variant="ghost" size="icon-xs" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeEquipment(index)}><Trash2 className="size-3" /></Button>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Safety */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Safety Protocols</h2>
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Safety Notice</p>
            <p className="text-xs text-amber-800 dark:text-amber-200">Define safety protocols relevant to your business operations.</p>
          </div>
        </div>
        {displayData.safetyProtocols.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="No safety protocols" description="Define safety protocols relevant to your operations." action={canEdit && !isPreview ? { label: 'Add Protocol', onClick: addSafetyProtocol } : undefined} />
        ) : (
          <div className="space-y-2">
            {canEdit && !isPreview && (
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={addSafetyProtocol}><Plus className="size-4" />Add Protocol</Button>
              </div>
            )}
            {displayData.safetyProtocols.map((protocol, index) => (
              <div key={index} className="group flex items-center gap-2">
                <span className="inline-flex shrink-0 items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">#{index + 1}</span>
                <Input value={protocol} onChange={(e) => updateSafetyProtocol(index, e.target.value)} placeholder="Safety protocol" readOnly={!canEdit || isPreview} />
                {canEdit && !isPreview && <Button variant="ghost" size="icon-xs" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeSafetyProtocol(index)}><Trash2 className="size-3" /></Button>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <PageHeader title="Operations" description="Cost structure, crew, capacity, and operational details">
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
