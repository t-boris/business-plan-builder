import { useSection } from '@/hooks/use-section';
import { useAiSuggestion } from '@/hooks/use-ai-suggestion';
import { isAiAvailable } from '@/lib/ai/gemini-client';
import { AiActionBar } from '@/components/ai-action-bar';
import { AiSuggestionPreview } from '@/components/ai-suggestion-preview';
import type { Operations as OperationsType, CrewMember, CostBreakdown } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, AlertTriangle, AlertCircle, Calculator, Users, Monitor, Car, Megaphone } from 'lucide-react';
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

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#06b6d4'];
const FIXED_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444'];

function CostInput({ label, value, onChange, readOnly, step }: { label: string; value: number; onChange: (v: number) => void; readOnly: boolean; step?: number }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
        <Input type="number" className="pl-7" value={value} onChange={(e) => onChange(Number(e.target.value))} step={step} readOnly={readOnly} />
      </div>
    </div>
  );
}

function SubtotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{fmt(value)}</span>
    </div>
  );
}

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
    { name: `Events\n(${costs.bookings})`, value: costs.monthlyVariableTotal },
    { name: 'Fixed', value: costs.monthlyFixed },
    { name: 'Total', value: costs.monthlyTotalCosts },
  ];

  const sectionContent = (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Cost Per Event</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{fmtS(costs.totalCostPerEvent)}</p>
            <p className="text-xs text-muted-foreground mt-1">labor + materials + transport</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/30">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Monthly Fixed</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{fmtS(costs.monthlyFixed)}</p>
            <p className="text-xs text-muted-foreground mt-1">team + vehicle + IT + overhead</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Monthly Total ({costs.bookings} events)</p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{fmtS(costs.monthlyTotalCosts)}</p>
            <p className="text-xs text-muted-foreground mt-1">all costs combined</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Team Salaries</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{fmtS(costs.teamCosts)}</p>
            <p className="text-xs text-muted-foreground mt-1">owner + marketing + coordinator</p>
          </CardContent>
        </Card>
      </div>

      {/* Crew & Labor */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Event Crew (per-event labor)</h2>
          {!isPreview && <Button variant="outline" size="sm" onClick={addCrewMember}><Plus className="size-4" />Add Crew Member</Button>}
        </div>
        <Card>
          <CardContent>
            <div className="space-y-3">
              <div className="hidden sm:grid grid-cols-[1fr_120px_80px_100px_40px] gap-3 items-center">
                <span className="text-xs font-medium text-muted-foreground">Role</span>
                <span className="text-xs font-medium text-muted-foreground">Hourly Rate</span>
                <span className="text-xs font-medium text-muted-foreground">Count</span>
                <span className="text-xs font-medium text-muted-foreground">Per Event</span>
                <span />
              </div>
              {displayData.crew.map((member, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_80px_100px_40px] gap-3 items-start border-b pb-3 last:border-0 last:pb-0 sm:border-0 sm:pb-0">
                  <div><span className="text-xs font-medium text-muted-foreground sm:hidden">Role</span><Input value={member.role} onChange={(e) => updateCrewMember(index, 'role', e.target.value)} placeholder="Role name" readOnly={isPreview} /></div>
                  <div><span className="text-xs font-medium text-muted-foreground sm:hidden">$/hr</span><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span><Input type="number" className="pl-7" value={member.hourlyRate} onChange={(e) => updateCrewMember(index, 'hourlyRate', Number(e.target.value))} step="0.5" readOnly={isPreview} /></div></div>
                  <div><span className="text-xs font-medium text-muted-foreground sm:hidden">Count</span><Input type="number" value={member.count} onChange={(e) => updateCrewMember(index, 'count', Number(e.target.value))} min={1} readOnly={isPreview} /></div>
                  <div><span className="text-xs font-medium text-muted-foreground sm:hidden">Per Event</span><div className="flex h-9 items-center rounded-md bg-muted px-3 text-sm font-medium">{fmt(member.hourlyRate * member.count * displayData.hoursPerEvent)}</div></div>
                  {!isPreview && <Button variant="ghost" size="icon-xs" className="mt-1 sm:mt-0" onClick={() => removeCrewMember(index)}><Trash2 className="size-3" /></Button>}
                </div>
              ))}
              {displayData.crew.length === 0 && <p className="text-sm text-muted-foreground py-2">No crew members.</p>}
              {displayData.crew.length > 0 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_80px_100px_40px] gap-3 items-center border-t pt-3">
                    <div className="sm:col-span-3 text-sm font-semibold text-right">Hours per event:</div>
                    <div><Input type="number" value={displayData.hoursPerEvent} onChange={(e) => updateData((prev) => ({ ...prev, hoursPerEvent: Number(e.target.value) }))} min={1} step={0.5} readOnly={isPreview} /></div>
                    <div />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_80px_100px_40px] gap-3 items-center border-t pt-3">
                    <div className="sm:col-span-3 text-sm font-bold text-right">Total labor per event:</div>
                    <div className="flex h-9 items-center rounded-md bg-blue-100 dark:bg-blue-900 px-3 text-sm font-bold text-blue-800 dark:text-blue-200">{fmt(costs.laborCost)}</div>
                    <div />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Per-Event Variable Costs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="size-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Per-Event Variable Costs</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Supplies & Materials</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <CostInput label="Cost per child" value={cb.suppliesPerChild} onChange={(v) => uc('suppliesPerChild', v)} readOnly={isPreview} step={0.5} />
                <div><label className="text-xs font-medium text-muted-foreground">Participants</label><Input type="number" value={cb.participantsPerEvent} onChange={(e) => uc('participantsPerEvent', Number(e.target.value))} min={1} readOnly={isPreview} /></div>
              </div>
              <SubtotalRow label="Supplies total" value={costs.suppliesCost} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Venue / Tickets</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <CostInput label="Ticket/Venue price" value={cb.museumTicketPrice} onChange={(v) => uc('museumTicketPrice', v)} readOnly={isPreview} step={0.5} />
                <div><label className="text-xs font-medium text-muted-foreground">Tickets per event</label><Input type="number" value={cb.ticketsPerEvent} onChange={(e) => uc('ticketsPerEvent', Number(e.target.value))} min={0} readOnly={isPreview} /></div>
              </div>
              <SubtotalRow label="Venue/Tickets total" value={costs.museumCost} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Fuel / Transportation</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <CostInput label="Gas $/gal" value={cb.fuelPricePerGallon} onChange={(v) => uc('fuelPricePerGallon', v)} readOnly={isPreview} step={0.1} />
                <div><label className="text-xs font-medium text-muted-foreground">Vehicle MPG</label><Input type="number" value={cb.vehicleMPG} onChange={(e) => uc('vehicleMPG', Number(e.target.value))} min={1} readOnly={isPreview} /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Round trip mi</label><Input type="number" value={cb.avgRoundTripMiles} onChange={(e) => uc('avgRoundTripMiles', Number(e.target.value))} min={0} readOnly={isPreview} /></div>
              </div>
              <CostInput label="Parking per event" value={cb.parkingPerEvent} onChange={(v) => uc('parkingPerEvent', v)} readOnly={isPreview} />
              <SubtotalRow label={`Fuel (${(cb.avgRoundTripMiles / Math.max(cb.vehicleMPG, 1)).toFixed(1)} gal) + parking`} value={costs.fuelCost + cb.parkingPerEvent} />
            </CardContent>
          </Card>
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader><CardTitle>Per-Event Cost Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Labor ({displayData.crew.length} crew x {displayData.hoursPerEvent}h)</span><span>{fmt(costs.laborCost)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Supplies ({cb.participantsPerEvent} x {fmt(cb.suppliesPerChild)})</span><span>{fmt(costs.suppliesCost)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Venue/Tickets ({cb.ticketsPerEvent} x {fmt(cb.museumTicketPrice)})</span><span>{fmt(costs.museumCost)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Fuel + Parking</span><span>{fmt(costs.fuelCost + cb.parkingPerEvent)}</span></div>
                {costs.customPerEvent > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Custom per-event</span><span>{fmt(costs.customPerEvent)}</span></div>}
                <Separator />
                <div className="flex justify-between font-bold"><span>Total per event</span><span className="text-blue-700 dark:text-blue-300">{fmt(costs.totalCostPerEvent)}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Per-Event Chart */}
      <Card>
        <CardHeader><CardTitle>Per-Event Cost Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={perEventPieData} cx="50%" cy="50%" outerRadius={95} dataKey="value" label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {perEventPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Monthly Fixed Costs */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Monthly Fixed Costs</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Team Salaries */}
          <Card>
            <CardHeader><div className="flex items-center gap-2"><Users className="size-4 text-blue-600" /><CardTitle>Core Team</CardTitle></div></CardHeader>
            <CardContent className="space-y-3">
              <CostInput label="Owner / Founder salary" value={cb.ownerSalary} onChange={(v) => uc('ownerSalary', v)} readOnly={isPreview} />
              <CostInput label="Marketing / Social Media manager" value={cb.marketingPerson} onChange={(v) => uc('marketingPerson', v)} readOnly={isPreview} />
              <CostInput label="Event coordinator / Sales" value={cb.eventCoordinator} onChange={(v) => uc('eventCoordinator', v)} readOnly={isPreview} />
              <SubtotalRow label="Team subtotal" value={costs.teamCosts} />
            </CardContent>
          </Card>

          {/* Vehicle */}
          <Card>
            <CardHeader><div className="flex items-center gap-2"><Car className="size-4 text-purple-600" /><CardTitle>Vehicle</CardTitle></div></CardHeader>
            <CardContent className="space-y-3">
              <CostInput label="Loan / Lease payment" value={cb.vehiclePayment} onChange={(v) => uc('vehiclePayment', v)} readOnly={isPreview} />
              <CostInput label="Insurance" value={cb.vehicleInsurance} onChange={(v) => uc('vehicleInsurance', v)} readOnly={isPreview} />
              <CostInput label="Maintenance reserve" value={cb.vehicleMaintenance} onChange={(v) => uc('vehicleMaintenance', v)} readOnly={isPreview} />
              <SubtotalRow label="Vehicle subtotal" value={costs.vehicleCosts} />
            </CardContent>
          </Card>

          {/* IT & Software */}
          <Card>
            <CardHeader><div className="flex items-center gap-2"><Monitor className="size-4 text-emerald-600" /><CardTitle>IT & Software</CardTitle></div></CardHeader>
            <CardContent className="space-y-3">
              <CostInput label="CRM + Booking platform" value={cb.crmSoftware} onChange={(v) => uc('crmSoftware', v)} readOnly={isPreview} />
              <CostInput label="Website hosting + domain" value={cb.websiteHosting} onChange={(v) => uc('websiteHosting', v)} readOnly={isPreview} />
              <CostInput label="AI chatbot (Gemini API, Instagram bot)" value={cb.aiChatbot} onChange={(v) => uc('aiChatbot', v)} readOnly={isPreview} />
              <CostInput label="Cloud services (Firebase, storage)" value={cb.cloudServices} onChange={(v) => uc('cloudServices', v)} readOnly={isPreview} />
              <CostInput label="Business phone plan" value={cb.phonePlan} onChange={(v) => uc('phonePlan', v)} readOnly={isPreview} />
              <SubtotalRow label="IT subtotal" value={costs.itCosts} />
            </CardContent>
          </Card>

          {/* Marketing Overhead */}
          <Card>
            <CardHeader><div className="flex items-center gap-2"><Megaphone className="size-4 text-amber-600" /><CardTitle>Marketing Overhead</CardTitle></div></CardHeader>
            <CardContent className="space-y-3">
              <CostInput label="Content creation (video, photo)" value={cb.contentCreation} onChange={(v) => uc('contentCreation', v)} readOnly={isPreview} />
              <CostInput label="Graphic design (Canva Pro, freelance)" value={cb.graphicDesign} onChange={(v) => uc('graphicDesign', v)} readOnly={isPreview} />
              <SubtotalRow label="Marketing overhead subtotal" value={costs.marketingOverhead} />
              <p className="text-[10px] text-muted-foreground">This is production cost, not ad spend. Ad spend is in Marketing Strategy.</p>
            </CardContent>
          </Card>

          {/* Other Overhead */}
          <Card>
            <CardHeader><CardTitle>Other Overhead</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <CostInput label="Storage / warehouse rent" value={cb.storageRent} onChange={(v) => uc('storageRent', v)} readOnly={isPreview} />
              <CostInput label="Equipment amortization (monthly)" value={cb.equipmentAmortization} onChange={(v) => uc('equipmentAmortization', v)} readOnly={isPreview} />
              <CostInput label="Business licenses (amortized)" value={cb.businessLicenses} onChange={(v) => uc('businessLicenses', v)} readOnly={isPreview} />
              <CostInput label="Miscellaneous / buffer" value={cb.miscFixed} onChange={(v) => uc('miscFixed', v)} readOnly={isPreview} />
              <SubtotalRow label="Other subtotal" value={costs.otherOverhead} />
            </CardContent>
          </Card>

          {/* Custom Expenses */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Custom Expenses</CardTitle>
                {!isPreview && <Button variant="outline" size="sm" onClick={addCustomExpense}><Plus className="size-4" />Add Expense</Button>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(cb.customExpenses || []).length === 0 && <p className="text-sm text-muted-foreground py-2">No custom expenses. Add any cost not covered above.</p>}
                {(cb.customExpenses || []).map((exp, index) => (
                  <div key={index} className="grid grid-cols-[1fr_100px_120px_32px] gap-2 items-end">
                    <div><label className="text-xs font-medium text-muted-foreground">Name</label><Input value={exp.name} onChange={(e) => updateCustomExpense(index, 'name', e.target.value)} placeholder="Expense name" readOnly={isPreview} /></div>
                    <div><label className="text-xs font-medium text-muted-foreground">Amount</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span><Input type="number" className="pl-7" value={exp.amount} onChange={(e) => updateCustomExpense(index, 'amount', Number(e.target.value))} readOnly={isPreview} /></div></div>
                    <div><label className="text-xs font-medium text-muted-foreground">Type</label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={exp.type} onChange={(e) => updateCustomExpense(index, 'type', e.target.value)} disabled={isPreview}>
                        <option value="monthly">Monthly</option>
                        <option value="per-event">Per Event</option>
                      </select>
                    </div>
                    {!isPreview && <Button variant="ghost" size="icon-xs" className="mb-0.5" onClick={() => removeCustomExpense(index)}><Trash2 className="size-3" /></Button>}
                  </div>
                ))}
                {((cb.customExpenses || []).length > 0) && (
                  <div className="space-y-1 pt-2 border-t">
                    {costs.customPerEvent > 0 && <SubtotalRow label="Custom per-event total" value={costs.customPerEvent} />}
                    {costs.customMonthly > 0 && <SubtotalRow label="Custom monthly total" value={costs.customMonthly} />}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fixed Summary */}
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader><CardTitle>Monthly Fixed Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Team salaries</span><span>{fmtS(costs.teamCosts)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Vehicle</span><span>{fmtS(costs.vehicleCosts)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">IT & Software</span><span>{fmtS(costs.itCosts)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Marketing overhead</span><span>{fmtS(costs.marketingOverhead)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Other overhead</span><span>{fmtS(costs.otherOverhead)}</span></div>
                <Separator />
                <div className="flex justify-between font-bold"><span>Total monthly fixed</span><span className="text-purple-700 dark:text-purple-300">{fmtS(costs.monthlyFixed)}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fixed Costs Chart */}
      <Card>
        <CardHeader><CardTitle>Monthly Fixed Costs Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={fixedPieData} cx="50%" cy="50%" outerRadius={95} dataKey="value" label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {fixedPieData.map((_, i) => <Cell key={i} fill={FIXED_COLORS[i % FIXED_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtS(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Monthly Total Overview */}
      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader><CardTitle>Monthly Operations Total ({costs.bookings} events/month)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Variable ({costs.bookings} events x {fmtS(costs.totalCostPerEvent)})</span><span>{fmtS(costs.monthlyVariableTotal)}</span></div>
              <div className="flex justify-between text-sm pl-4 text-xs"><span className="text-muted-foreground">Labor</span><span>{fmtS(costs.laborCost * costs.bookings)}</span></div>
              <div className="flex justify-between text-sm pl-4 text-xs"><span className="text-muted-foreground">Supplies</span><span>{fmtS(costs.suppliesCost * costs.bookings)}</span></div>
              <div className="flex justify-between text-sm pl-4 text-xs"><span className="text-muted-foreground">Venue/Tickets</span><span>{fmtS(costs.museumCost * costs.bookings)}</span></div>
              <div className="flex justify-between text-sm pl-4 text-xs"><span className="text-muted-foreground">Fuel + parking</span><span>{fmtS((costs.fuelCost + cb.parkingPerEvent) * costs.bookings)}</span></div>
              <Separator />
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Fixed costs</span><span>{fmtS(costs.monthlyFixed)}</span></div>
              <div className="flex justify-between text-sm pl-4 text-xs"><span className="text-muted-foreground">Team</span><span>{fmtS(costs.teamCosts)}</span></div>
              <div className="flex justify-between text-sm pl-4 text-xs"><span className="text-muted-foreground">Vehicle</span><span>{fmtS(costs.vehicleCosts)}</span></div>
              <div className="flex justify-between text-sm pl-4 text-xs"><span className="text-muted-foreground">IT</span><span>{fmtS(costs.itCosts)}</span></div>
              <div className="flex justify-between text-sm pl-4 text-xs"><span className="text-muted-foreground">Marketing prod.</span><span>{fmtS(costs.marketingOverhead)}</span></div>
              <div className="flex justify-between text-sm pl-4 text-xs"><span className="text-muted-foreground">Other</span><span>{fmtS(costs.otherOverhead)}</span></div>
              <Separator />
              <div className="flex justify-between font-bold text-base"><span>Total Monthly</span><span className="text-amber-700 dark:text-amber-300">{fmtS(costs.monthlyTotalCosts)}</span></div>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyBarData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => fmtS(Number(v))} />
                  <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Capacity + Travel */}
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

      {/* Equipment */}
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
              {displayData.equipment.length === 0 && <p className="text-sm text-muted-foreground py-2">No equipment listed.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Safety */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Safety Protocols</h2>
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/50">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Safety Notice</p>
            <p className="text-sm text-amber-800 dark:text-amber-200">Define safety protocols relevant to your business operations.</p>
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
              {displayData.safetyProtocols.length === 0 && <p className="text-sm text-muted-foreground py-2">No safety protocols defined.</p>}
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
