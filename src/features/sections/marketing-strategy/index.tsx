import { useSection } from '@/hooks/use-section';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import type {
  MarketingStrategy as MarketingStrategyType,
  MarketingChannel,
} from '@/types';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Plus,
  Trash2,
  DollarSign,
  Users,
  Target,
  CalendarCheck,
  HelpCircle,
  Gift,
  ExternalLink,
  Link,
  Megaphone,
  Search,
  FileText,
  Share2,
  Handshake,
  UserPlus,
  Newspaper,
  CalendarDays,
  Mail,
  MessageCircle,
  Pencil,
  type LucideIcon,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { AiFieldTrigger } from '@/components/ai-field-trigger';

const PREDEFINED_CHANNELS = [
  'Google Ads',
  'Meta Ads',
  'Instagram Ads',
  'TikTok Ads',
  'LinkedIn Ads',
  'YouTube Ads',
  'Email Marketing',
  'SEO / Organic Search',
  'Content Marketing',
  'Organic Social',
  'Partnerships',
  'Referral Program',
  'PR & Media',
  'Events & Trade Shows',
  'Direct Outreach',
];

const CHANNEL_ICONS: Record<string, LucideIcon> = {
  'Google Ads': Search,
  'Meta Ads': Megaphone,
  'Instagram Ads': MessageCircle,
  'TikTok Ads': MessageCircle,
  'LinkedIn Ads': UserPlus,
  'YouTube Ads': Megaphone,
  'Email Marketing': Mail,
  'SEO / Organic Search': Search,
  'Content Marketing': FileText,
  'Organic Social': Share2,
  'Partnerships': Handshake,
  'Referral Program': UserPlus,
  'PR & Media': Newspaper,
  'Events & Trade Shows': CalendarDays,
  'Direct Outreach': Mail,
};

function getChannelIcon(name: string): LucideIcon {
  return CHANNEL_ICONS[name] || Pencil;
}

const CHANNEL_COLORS = [
  { border: 'border-l-blue-500', bg: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400' },
  { border: 'border-l-green-500', bg: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400' },
  { border: 'border-l-purple-500', bg: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400' },
  { border: 'border-l-amber-500', bg: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400' },
  { border: 'border-l-rose-500', bg: 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400' },
  { border: 'border-l-cyan-500', bg: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400' },
];

const PIE_COLORS = ['var(--chart-profit)', 'var(--chart-revenue)', 'var(--chart-accent-1)', 'var(--chart-cost)', 'var(--chart-profit)', 'var(--chart-revenue)'];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="size-3.5 text-muted-foreground cursor-help inline-block ml-1" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px]">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

const defaultMarketing: MarketingStrategyType = {
  channels: [],
  offers: [],
  landingPage: {
    url: '',
    description: '',
  },
};

export function MarketingStrategy() {
  const { data, updateData, isLoading, canEdit } = useSection<MarketingStrategyType>(
    'marketing-strategy',
    defaultMarketing
  );
  const [customNameIndices, setCustomNameIndices] = useState<Set<number>>(new Set());

  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader showScenarioBadge title="Marketing Strategy" description="Channels, budget allocation, and promotional offers" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const totalBudget = data.channels.reduce((sum, ch) => sum + ch.budget, 0);
  const totalLeads = data.channels.reduce((sum, ch) => sum + ch.expectedLeads, 0);
  const avgCAC = totalLeads > 0 ? totalBudget / totalLeads : 0;
  const estimatedBookings = Math.round(totalLeads * 0.2);

  function addChannel() {
    updateData((prev) => ({
      ...prev,
      channels: [...prev.channels, { name: '', budget: 0, expectedLeads: 0, expectedCAC: 0, description: '', tactics: [] }],
    }));
  }

  function removeChannel(index: number) {
    updateData((prev) => ({
      ...prev,
      channels: prev.channels.filter((_, i) => i !== index),
    }));
  }

  function updateChannel(index: number, field: keyof MarketingChannel, value: string | number | string[]) {
    updateData((prev) => {
      const channels = [...prev.channels];
      channels[index] = { ...channels[index], [field]: value };
      return { ...prev, channels };
    });
  }

  function updateTactic(channelIndex: number, tacticIndex: number, value: string) {
    updateData((prev) => {
      const channels = [...prev.channels];
      const tactics = [...channels[channelIndex].tactics];
      tactics[tacticIndex] = value;
      channels[channelIndex] = { ...channels[channelIndex], tactics };
      return { ...prev, channels };
    });
  }

  function addTactic(channelIndex: number) {
    updateData((prev) => {
      const channels = [...prev.channels];
      const tactics = [...channels[channelIndex].tactics, ''];
      channels[channelIndex] = { ...channels[channelIndex], tactics };
      return { ...prev, channels };
    });
  }

  function removeTactic(channelIndex: number, tacticIndex: number) {
    updateData((prev) => {
      const channels = [...prev.channels];
      const tactics = channels[channelIndex].tactics.filter((_, i) => i !== tacticIndex);
      channels[channelIndex] = { ...channels[channelIndex], tactics };
      return { ...prev, channels };
    });
  }

  function updateOffer(index: number, value: string) {
    updateData((prev) => {
      const offers = [...prev.offers];
      offers[index] = value;
      return { ...prev, offers };
    });
  }

  function addOffer() {
    updateData((prev) => ({ ...prev, offers: [...prev.offers, ''] }));
  }

  function removeOffer(index: number) {
    updateData((prev) => ({ ...prev, offers: prev.offers.filter((_, i) => i !== index) }));
  }

  // Pie chart data -- only channels with budget > 0
  const budgetPieData = data.channels
    .filter((ch) => ch.budget > 0)
    .map((ch) => ({
      name: ch.name || 'Unnamed',
      value: ch.budget,
    }));

  const sectionContent = (
    <TooltipProvider>
      <div className="space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card-elevated rounded-lg p-4 space-y-1">
            <div className="flex items-center gap-2">
              <DollarSign className="size-3.5 text-amber-500" />
              <span className="text-xs font-medium text-muted-foreground">Total Ad Spend</span>
            </div>
            <p className="text-xl font-bold tabular-nums">{formatCurrency(totalBudget)}</p>
            <p className="text-xs text-muted-foreground">per month</p>
          </div>

          <div className="card-elevated rounded-lg p-4 space-y-1">
            <div className="flex items-center gap-2">
              <Users className="size-3.5 text-blue-500" />
              <span className="text-xs font-medium text-muted-foreground">
                Expected Leads
                <InfoTooltip text="Number of new leads expected per month from all channels" />
              </span>
            </div>
            <p className="text-xl font-bold tabular-nums">{totalLeads}</p>
            <p className="text-xs text-muted-foreground">per month</p>
          </div>

          <div className="card-elevated rounded-lg p-4 space-y-1">
            <div className="flex items-center gap-2">
              <Target className="size-3.5 text-purple-500" />
              <span className="text-xs font-medium text-muted-foreground">
                Average CAC
                <InfoTooltip text="Customer Acquisition Cost -- average cost to acquire one lead across all channels" />
              </span>
            </div>
            <p className="text-xl font-bold tabular-nums">{formatCurrency(avgCAC)}</p>
            <p className="text-xs text-muted-foreground">per lead</p>
          </div>

          <div className="card-elevated rounded-lg p-4 space-y-1">
            <div className="flex items-center gap-2">
              <CalendarCheck className="size-3.5 text-green-500" />
              <span className="text-xs font-medium text-muted-foreground">Est. Monthly Bookings</span>
            </div>
            <p className="text-xl font-bold tabular-nums">{estimatedBookings}</p>
            <p className="text-xs text-muted-foreground">at 20% conversion</p>
          </div>
        </div>

        {/* Budget Allocation Pie Chart */}
        {budgetPieData.length > 0 && (
          <div className="card-elevated rounded-lg p-5 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Budget Allocation</h2>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={budgetPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {budgetPieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Marketing Channels */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Marketing Channels</h2>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={addChannel}>
                <Plus className="size-4" />
                Add Channel
              </Button>
            )}
          </div>
          {data.channels.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No marketing channels yet"
              description="Use AI Generate to create a marketing strategy, or add channels manually."
              action={canEdit ? { label: 'Add Channel', onClick: addChannel } : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.channels.map((channel, chIndex) => {
                const colorSet = CHANNEL_COLORS[chIndex % CHANNEL_COLORS.length];
                const ChannelIcon = getChannelIcon(channel.name);
                return (
                  <div key={chIndex} className={`card-elevated rounded-lg border-l-2 ${colorSet.border}`}>
                    {/* Channel Header */}
                    <div className="px-5 pt-4 pb-3 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center size-8 rounded-full ${colorSet.bg}`}>
                          <ChannelIcon className="size-4" />
                        </div>
                        {(customNameIndices.has(chIndex) || (channel.name !== '' && !PREDEFINED_CHANNELS.includes(channel.name))) ? (
                          <Input
                            value={channel.name}
                            onChange={(e) => updateChannel(chIndex, 'name', e.target.value)}
                            placeholder="Channel name"
                            readOnly={!canEdit}
                            className="border-0 px-0 shadow-none focus-visible:ring-0 text-sm font-semibold flex-1 h-auto py-0"
                          />
                        ) : (
                          <Select
                            value={channel.name || undefined}
                            onValueChange={(val) => {
                              if (val === '__custom__') {
                                setCustomNameIndices((prev) => new Set(prev).add(chIndex));
                                updateChannel(chIndex, 'name', '');
                              } else {
                                updateChannel(chIndex, 'name', val);
                              }
                            }}
                            disabled={!canEdit}
                          >
                            <SelectTrigger className="border-0 shadow-none focus-visible:ring-0 text-sm font-semibold flex-1 h-auto py-0 px-0 w-auto">
                              <SelectValue placeholder="Select channel" />
                            </SelectTrigger>
                            <SelectContent>
                              {PREDEFINED_CHANNELS.map((ch) => {
                                const Icon = CHANNEL_ICONS[ch] || Megaphone;
                                return (
                                  <SelectItem key={ch} value={ch}>
                                    <Icon className="size-3.5 text-muted-foreground" />
                                    {ch}
                                  </SelectItem>
                                );
                              })}
                              <SelectSeparator />
                              <SelectItem value="__custom__">
                                <Pencil className="size-3.5 text-muted-foreground" />
                                Custom...
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <span className="text-xs text-muted-foreground">{channel.budget > 0 ? 'Paid' : 'Organic'}</span>
                        {canEdit && (
                          <Button variant="ghost" size="icon-xs" onClick={() => removeChannel(chIndex)}>
                            <Trash2 className="size-3" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium">
                            Budget
                            <InfoTooltip text="Monthly spend allocated to this channel" />
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                            <Input type="number" className="pl-7" value={channel.budget} onChange={(e) => updateChannel(chIndex, 'budget', Number(e.target.value))} readOnly={!canEdit} />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Expected Leads
                            <InfoTooltip text="Number of new leads expected per month from this channel" />
                          </label>
                          <Input type="number" value={channel.expectedLeads} onChange={(e) => updateChannel(chIndex, 'expectedLeads', Number(e.target.value))} readOnly={!canEdit} />
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            CAC
                            <InfoTooltip text="Customer Acquisition Cost -- cost to acquire one lead through this channel" />
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                            <Input type="number" className="pl-7" value={channel.expectedCAC} onChange={(e) => updateChannel(chIndex, 'expectedCAC', Number(e.target.value))} readOnly={!canEdit} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Channel Details */}
                    <div className="px-5 pb-5 space-y-4 border-t pt-4">
                      <div>
                        <label className="text-sm font-medium flex items-center gap-1">
                          Description
                          {canEdit && (
                            <AiFieldTrigger
                              fieldName="channel-description"
                              fieldLabel={`Description for ${channel.name || 'Channel'}`}
                              currentValue={channel.description}
                              sectionSlug="marketing-strategy"
                              sectionData={data as unknown as Record<string, unknown>}
                              onResult={(val) => updateChannel(chIndex, 'description', val)}
                            />
                          )}
                        </label>
                        <Textarea value={channel.description} onChange={(e) => updateChannel(chIndex, 'description', e.target.value)} rows={2} readOnly={!canEdit} />
                      </div>

                      {/* Campaign/Tracking URL */}
                      <div>
                        <label className="text-sm font-medium flex items-center gap-1">
                          <Link className="size-3" />
                          Campaign URL
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={channel.url ?? ''}
                            onChange={(e) => updateChannel(chIndex, 'url', e.target.value)}
                            placeholder="https://..."
                            readOnly={!canEdit}
                            className="text-sm"
                          />
                          {channel.url && (
                            <a href={channel.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                              <Button variant="ghost" size="icon-xs" type="button">
                                <ExternalLink className="size-3 text-muted-foreground" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            Tactics
                            <InfoTooltip text="Specific actions and campaigns run within this channel" />
                          </label>
                          {canEdit && (
                            <Button variant="ghost" size="xs" onClick={() => addTactic(chIndex)}>
                              <Plus className="size-3" />
                              Add Tactic
                            </Button>
                          )}
                        </div>
                        {channel.tactics.map((tactic, tacticIndex) => (
                          <div key={tacticIndex} className="flex items-center gap-2">
                            <Input value={tactic} onChange={(e) => updateTactic(chIndex, tacticIndex, e.target.value)} className="text-sm" readOnly={!canEdit} />
                            {canEdit && (
                              <Button variant="ghost" size="icon-xs" onClick={() => removeTactic(chIndex, tacticIndex)}>
                                <Trash2 className="size-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Promotional Offers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Promotional Offers</h2>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={addOffer}>
                <Plus className="size-4" />
                Add Offer
              </Button>
            )}
          </div>
          {data.offers.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="No offers yet"
              description="Click 'Add Offer' to create promotional offers."
              action={canEdit ? { label: 'Add Offer', onClick: addOffer } : undefined}
            />
          ) : (
            <div className="card-elevated rounded-lg divide-y">
              {data.offers.map((offer, index) => (
                <div key={index} className="flex items-center gap-3 px-5 py-3">
                  <Gift className="size-3.5 shrink-0 text-pink-500 dark:text-pink-400" />
                  <span className="text-xs font-bold text-muted-foreground w-5 text-right shrink-0">{index + 1}.</span>
                  <Input value={offer} onChange={(e) => updateOffer(index, e.target.value)} placeholder="Promotional offer" readOnly={!canEdit} className="border-0 px-0 shadow-none focus-visible:ring-0" />
                  {canEdit && (
                    <Button variant="ghost" size="icon-xs" onClick={() => removeOffer(index)}>
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Landing Page Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Landing Page</h2>
          <div className="card-elevated rounded-lg p-5 space-y-4">
            <div>
              <label className="text-sm font-medium">URL</label>
              <div className="flex items-center gap-2">
                <Input
                  value={data.landingPage.url}
                  onChange={(e) => updateData((prev) => ({ ...prev, landingPage: { ...prev.landingPage, url: e.target.value } }))}
                  placeholder="https://yourbusiness.com"
                  readOnly={!canEdit}
                />
                {data.landingPage.url && (
                  <a href={data.landingPage.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <Button variant="ghost" size="icon-xs" type="button">
                      <ExternalLink className="size-4 text-muted-foreground" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-1">
                Description
                {canEdit && (
                  <AiFieldTrigger
                    fieldName="landing-page-description"
                    fieldLabel="Landing Page Description"
                    currentValue={data.landingPage.description}
                    sectionSlug="marketing-strategy"
                    sectionData={data as unknown as Record<string, unknown>}
                    onResult={(val) => updateData((prev) => ({ ...prev, landingPage: { ...prev.landingPage, description: val } }))}
                  />
                )}
              </label>
              <Textarea value={data.landingPage.description} onChange={(e) => updateData((prev) => ({ ...prev, landingPage: { ...prev.landingPage, description: e.target.value } }))} rows={4} readOnly={!canEdit} />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );

  return (
    <div className="page-container">
      <PageHeader showScenarioBadge title="Marketing Strategy" description="Channels, budget allocation, and promotional offers" />
      {sectionContent}
    </div>
  );
}
