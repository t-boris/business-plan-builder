import { useAtom } from 'jotai';
import {
  priceStarterAtom,
  priceExplorerAtom,
  priceVIPAtom,
  monthlyLeadsAtom,
  conversionRateAtom,
  cacPerLeadAtom,
  monthlyAdBudgetMetaAtom,
  monthlyAdBudgetGoogleAtom,
  crewCountAtom,
  costPerEventAtom,
} from '@/store/scenario-atoms.ts';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  /** Multiplier for display (e.g. 100 for percentage) */
  displayMultiplier?: number;
}

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  prefix,
  suffix,
  displayMultiplier = 1,
}: SliderInputProps) {
  const displayValue = value * displayMultiplier;
  const displayMin = min * displayMultiplier;
  const displayMax = max * displayMultiplier;
  const displayStep = step * displayMultiplier;

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-[120px]">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {prefix}
            </span>
          )}
          <Input
            type="number"
            value={displayValue}
            onChange={(e) => onChange(Number(e.target.value) / displayMultiplier)}
            className={`h-8 text-sm text-right ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-7' : ''}`}
            min={displayMin}
            max={displayMax}
            step={displayStep}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {suffix}
            </span>
          )}
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 cursor-pointer accent-primary"
        />
      </div>
    </div>
  );
}

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  min?: number;
  max?: number;
}

function NumberInput({ label, value, onChange, prefix, min, max }: NumberInputProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {prefix}
          </span>
        )}
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`h-8 text-sm ${prefix ? 'pl-7' : ''}`}
          min={min}
          max={max}
        />
      </div>
    </div>
  );
}

export function ScenarioControls() {
  const [priceStarter, setPriceStarter] = useAtom(priceStarterAtom);
  const [priceExplorer, setPriceExplorer] = useAtom(priceExplorerAtom);
  const [priceVIP, setPriceVIP] = useAtom(priceVIPAtom);
  const [monthlyLeads, setMonthlyLeads] = useAtom(monthlyLeadsAtom);
  const [conversionRate, setConversionRate] = useAtom(conversionRateAtom);
  const [cacPerLead, setCacPerLead] = useAtom(cacPerLeadAtom);
  const [adBudgetMeta, setAdBudgetMeta] = useAtom(monthlyAdBudgetMetaAtom);
  const [adBudgetGoogle, setAdBudgetGoogle] = useAtom(monthlyAdBudgetGoogleAtom);
  const [crewCount, setCrewCount] = useAtom(crewCountAtom);
  const [costPerEvent, setCostPerEvent] = useAtom(costPerEventAtom);

  return (
    <div className="space-y-4">
      {/* Pricing */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-sm font-semibold">Pricing</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <NumberInput
            label="Ocean Starter"
            value={priceStarter}
            onChange={setPriceStarter}
            prefix="$"
            min={0}
          />
          <NumberInput
            label="Ocean Explorer"
            value={priceExplorer}
            onChange={setPriceExplorer}
            prefix="$"
            min={0}
          />
          <NumberInput
            label="Ocean VIP"
            value={priceVIP}
            onChange={setPriceVIP}
            prefix="$"
            min={0}
          />
        </CardContent>
      </Card>

      {/* Leads & Conversion */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-sm font-semibold">Leads & Conversion</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <SliderInput
            label="Monthly Leads"
            value={monthlyLeads}
            onChange={setMonthlyLeads}
            min={50}
            max={300}
            step={5}
          />
          <SliderInput
            label="Conversion Rate"
            value={conversionRate}
            onChange={setConversionRate}
            min={0.05}
            max={0.5}
            step={0.01}
            suffix="%"
            displayMultiplier={100}
          />
          <SliderInput
            label="CAC per Lead"
            value={cacPerLead}
            onChange={setCacPerLead}
            min={5}
            max={100}
            step={1}
            prefix="$"
          />
        </CardContent>
      </Card>

      {/* Marketing Budgets */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-sm font-semibold">Marketing Budgets</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <NumberInput
            label="Meta Ads (monthly)"
            value={adBudgetMeta}
            onChange={setAdBudgetMeta}
            prefix="$"
            min={0}
          />
          <NumberInput
            label="Google Ads (monthly)"
            value={adBudgetGoogle}
            onChange={setAdBudgetGoogle}
            prefix="$"
            min={0}
          />
        </CardContent>
      </Card>

      {/* Operations */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-sm font-semibold">Operations</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <SliderInput
            label="Crew Count"
            value={crewCount}
            onChange={setCrewCount}
            min={1}
            max={10}
            step={1}
          />
          <NumberInput
            label="Cost per Event"
            value={costPerEvent}
            onChange={setCostPerEvent}
            prefix="$"
            min={0}
          />
        </CardContent>
      </Card>
    </div>
  );
}
