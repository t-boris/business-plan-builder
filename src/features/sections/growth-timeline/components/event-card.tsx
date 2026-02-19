import type { GrowthEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  UserPlus,
  DollarSign,
  Megaphone,
  Package,
  Wrench,
  Pencil,
  Trash2,
  Banknote,
  Building2,
  Users,
  Tag,
  Cpu,
  CalendarRange,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const EVENT_TYPE_CONFIG: Record<
  string,
  { icon: LucideIcon; color: string; bg: string }
> = {
  hire: {
    icon: UserPlus,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
  },
  'cost-change': {
    icon: DollarSign,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
  },
  'capacity-change': {
    icon: Package,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/40',
  },
  'marketing-change': {
    icon: Megaphone,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-900/40',
  },
  custom: {
    icon: Wrench,
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-900/40',
  },
  'funding-round': {
    icon: Banknote,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
  },
  'facility-build': {
    icon: Building2,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/40',
  },
  'hiring-campaign': {
    icon: Users,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-100 dark:bg-cyan-900/40',
  },
  'price-change': {
    icon: Tag,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-100 dark:bg-indigo-900/40',
  },
  'equipment-purchase': {
    icon: Cpu,
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-100 dark:bg-teal-900/40',
  },
  'seasonal-campaign': {
    icon: CalendarRange,
    color: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-100 dark:bg-pink-900/40',
  },
};

function getEventSummary(event: GrowthEvent): string {
  const { delta } = event;
  switch (delta.type) {
    case 'hire':
      return `${delta.data.count > 0 ? '+' : ''}${delta.data.count}x ${delta.data.role} @ $${delta.data.ratePerHour}/hr`;
    case 'cost-change':
      return `${delta.data.category}: $${delta.data.rate} (${delta.data.costType})`;
    case 'capacity-change': {
      const sign = delta.data.outputDelta > 0 ? '+' : '';
      const scope = delta.data.capacityItemId ? '' : ' (all)';
      return `${sign}${delta.data.outputDelta} output/mo${scope}`;
    }
    case 'marketing-change':
      return `$${delta.data.monthlyBudget.toLocaleString()}/mo`;
    case 'custom': {
      const valueStr = `${delta.data.value > 0 ? '+' : ''}$${delta.data.value}`;
      const formulaHint = delta.data.formula ? ` [${delta.data.formula}]` : '';
      return `${delta.data.label}: ${valueStr} (${delta.data.target})${formulaHint}`;
    }
    case 'funding-round':
      return `$${delta.data.amount.toLocaleString()} (${delta.data.investmentType}) — $${delta.data.legalCosts.toLocaleString()} legal`;
    case 'facility-build': {
      let summary = `$${delta.data.constructionCost.toLocaleString()} build → $${delta.data.monthlyRent.toLocaleString()}/mo rent + ${delta.data.capacityAdded} capacity`;
      if (event.durationMonths) summary += ` (${event.durationMonths}mo)`;
      return summary;
    }
    case 'hiring-campaign': {
      let summary = `${delta.data.totalHires}x ${delta.data.role} @ $${delta.data.ratePerHour}/hr`;
      if (event.durationMonths) summary += ` over ${event.durationMonths}mo`;
      return summary;
    }
    case 'price-change':
      return `Avg check → $${delta.data.newAvgCheck.toLocaleString()}`;
    case 'equipment-purchase':
      return `$${delta.data.purchaseCost.toLocaleString()} + $${delta.data.maintenanceCostMonthly}/mo maint. + ${delta.data.capacityIncrease} capacity`;
    case 'seasonal-campaign': {
      let summary = `+$${delta.data.budgetIncrease.toLocaleString()}/mo marketing`;
      if (event.durationMonths) summary += ` for ${event.durationMonths}mo`;
      return summary;
    }
  }
}

interface EventCardProps {
  event: GrowthEvent;
  canEdit: boolean;
  onToggle: (id: string) => void;
  onEdit: (event: GrowthEvent) => void;
  onDelete: (id: string) => void;
}

export function EventCard({ event, canEdit, onToggle, onEdit, onDelete }: EventCardProps) {
  const config = EVENT_TYPE_CONFIG[event.delta.type] ?? EVENT_TYPE_CONFIG.custom;
  const Icon = config.icon;

  return (
    <div
      className={`group flex items-center gap-3 rounded-lg border p-3 transition-opacity ${
        event.enabled ? '' : 'opacity-50'
      }`}
    >
      <div className={`flex size-8 shrink-0 items-center justify-center rounded-md ${config.bg}`}>
        <Icon className={`size-4 ${config.color}`} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tabular-nums">
            M{event.month}
          </span>
          <span className="truncate text-sm font-medium">{event.label}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {getEventSummary(event)}
        </p>
      </div>

      {canEdit && (
        <div className="flex shrink-0 items-center gap-1">
          <Switch
            size="sm"
            checked={event.enabled}
            onCheckedChange={() => onToggle(event.id)}
          />
          <Button
            variant="ghost"
            size="icon-xs"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onEdit(event)}
          >
            <Pencil className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
            onClick={() => onDelete(event.id)}
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
