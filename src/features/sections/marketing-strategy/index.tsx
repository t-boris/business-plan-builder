import { useSection } from '@/hooks/use-section';
import { useAiSuggestion } from '@/hooks/use-ai-suggestion';
import { isAiAvailable } from '@/lib/ai/gemini-client';
import { AiActionBar } from '@/components/ai-action-bar';
import { AiSuggestionPreview } from '@/components/ai-suggestion-preview';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import type {
  MarketingStrategy as MarketingStrategyType,
  MarketingChannel,
  MarketingChannelName,
} from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Plus,
  Trash2,
  AlertCircle,
  DollarSign,
  Users,
  Target,
  CalendarCheck,
  AtSign,
  Search,
  Share2,
  Handshake,
  HelpCircle,
  Gift,
  ExternalLink,
  Link,
  Megaphone,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

const CHANNEL_DISPLAY_NAMES: Record<MarketingChannelName, string> = {
  'meta-ads': 'Meta Ads',
  'google-ads': 'Google Ads',
  'organic-social': 'Organic Social',
  partnerships: 'Partnerships',
};

const CHANNEL_ICONS: Record<MarketingChannelName, React.ReactNode> = {
  'meta-ads': <AtSign className="size-4" />,
  'google-ads': <Search className="size-4" />,
  'organic-social': <Share2 className="size-4" />,
  partnerships: <Handshake className="size-4" />,
};

const CHANNEL_STYLES: Record<MarketingChannelName, { borderColor: string; iconBg: string }> = {
  'meta-ads': {
    borderColor: 'border-l-blue-500',
    iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  },
  'google-ads': {
    borderColor: 'border-l-green-500',
    iconBg: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
  },
  'organic-social': {
    borderColor: 'border-l-purple-500',
    iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
  },
  partnerships: {
    borderColor: 'border-l-amber-500',
    iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  },
};

const PIE_COLORS = ['var(--chart-profit)', 'var(--chart-revenue)', 'var(--chart-accent-1)', 'var(--chart-cost)'];

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
  const aiSuggestion = useAiSuggestion<MarketingStrategyType>('marketing-strategy');

  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader title="Marketing Strategy" description="Channels, budget allocation, and promotional offers" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const isPreview = aiSuggestion.state.status === 'preview';
  const displayData = isPreview && aiSuggestion.state.suggested
    ? aiSuggestion.state.suggested
    : data;

  function handleAccept() {
    const suggested = aiSuggestion.accept();
    if (suggested) updateData(() => suggested);
  }

  const totalBudget = displayData.channels.reduce((sum, ch) => sum + ch.budget, 0);
  const totalLeads = displayData.channels.reduce((sum, ch) => sum + ch.expectedLeads, 0);
  const avgCAC = totalLeads > 0 ? totalBudget / totalLeads : 0;
  const estimatedBookings = Math.round(totalLeads * 0.2);

  function addChannel() {
    updateData((prev) => ({
      ...prev,
      channels: [...prev.channels, { name: 'meta-ads' as MarketingChannelName, budget: 0, expectedLeads: 0, expectedCAC: 0, description: '', tactics: [] }],
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
  const budgetPieData = displayData.channels
    .filter((ch) => ch.budget > 0)
    .map((ch) => ({
      name: CHANNEL_DISPLAY_NAMES[ch.name],
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
            {canEdit && !isPreview && (
              <Button variant="outline" size="sm" onClick={addChannel}>
                <Plus className="size-4" />
                Add Channel
              </Button>
            )}
          </div>
          {displayData.channels.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No marketing channels yet"
              description="Use AI Generate to create a marketing strategy, or add channels manually."
              action={canEdit && !isPreview ? { label: 'Add Channel', onClick: addChannel } : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayData.channels.map((channel, chIndex) => {
                const style = CHANNEL_STYLES[channel.name];
                return (
                  <div key={chIndex} className={`card-elevated rounded-lg border-l-2 ${style.borderColor}`}>
                    {/* Channel Header */}
                    <div className="px-5 pt-4 pb-3 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center size-8 rounded-full ${style.iconBg}`}>
                          {CHANNEL_ICONS[channel.name]}
                        </div>
                        <span className="text-sm font-semibold flex-1">{CHANNEL_DISPLAY_NAMES[channel.name] || channel.name}</span>
                        <span className="text-xs text-muted-foreground">{channel.budget > 0 ? 'Paid' : 'Organic'}</span>
                        {canEdit && !isPreview && (
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
                            <Input type="number" className="pl-7" value={channel.budget} onChange={(e) => updateChannel(chIndex, 'budget', Number(e.target.value))} readOnly={!canEdit || isPreview} />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Expected Leads
                            <InfoTooltip text="Number of new leads expected per month from this channel" />
                          </label>
                          <Input type="number" value={channel.expectedLeads} onChange={(e) => updateChannel(chIndex, 'expectedLeads', Number(e.target.value))} readOnly={!canEdit || isPreview} />
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            CAC
                            <InfoTooltip text="Customer Acquisition Cost -- cost to acquire one lead through this channel" />
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                            <Input type="number" className="pl-7" value={channel.expectedCAC} onChange={(e) => updateChannel(chIndex, 'expectedCAC', Number(e.target.value))} readOnly={!canEdit || isPreview} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Channel Details */}
                    <div className="px-5 pb-5 space-y-4 border-t pt-4">
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Textarea value={channel.description} onChange={(e) => updateChannel(chIndex, 'description', e.target.value)} rows={2} readOnly={!canEdit || isPreview} />
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
                            readOnly={!canEdit || isPreview}
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
                          {canEdit && !isPreview && (
                            <Button variant="ghost" size="xs" onClick={() => addTactic(chIndex)}>
                              <Plus className="size-3" />
                              Add Tactic
                            </Button>
                          )}
                        </div>
                        {channel.tactics.map((tactic, tacticIndex) => (
                          <div key={tacticIndex} className="flex items-center gap-2">
                            <Input value={tactic} onChange={(e) => updateTactic(chIndex, tacticIndex, e.target.value)} className="text-sm" readOnly={!canEdit || isPreview} />
                            {canEdit && !isPreview && (
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
            {canEdit && !isPreview && (
              <Button variant="outline" size="sm" onClick={addOffer}>
                <Plus className="size-4" />
                Add Offer
              </Button>
            )}
          </div>
          {displayData.offers.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="No offers yet"
              description="Click 'Add Offer' to create promotional offers."
              action={canEdit && !isPreview ? { label: 'Add Offer', onClick: addOffer } : undefined}
            />
          ) : (
            <div className="card-elevated rounded-lg divide-y">
              {displayData.offers.map((offer, index) => (
                <div key={index} className="flex items-center gap-3 px-5 py-3">
                  <Gift className="size-3.5 shrink-0 text-pink-500 dark:text-pink-400" />
                  <span className="text-xs font-bold text-muted-foreground w-5 text-right shrink-0">{index + 1}.</span>
                  <Input value={offer} onChange={(e) => updateOffer(index, e.target.value)} placeholder="Promotional offer" readOnly={!canEdit || isPreview} className="border-0 px-0 shadow-none focus-visible:ring-0" />
                  {canEdit && !isPreview && (
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
                  value={displayData.landingPage.url}
                  onChange={(e) => updateData((prev) => ({ ...prev, landingPage: { ...prev.landingPage, url: e.target.value } }))}
                  placeholder="https://yourbusiness.com"
                  readOnly={!canEdit || isPreview}
                />
                {displayData.landingPage.url && (
                  <a href={displayData.landingPage.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <Button variant="ghost" size="icon-xs" type="button">
                      <ExternalLink className="size-4 text-muted-foreground" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea value={displayData.landingPage.description} onChange={(e) => updateData((prev) => ({ ...prev, landingPage: { ...prev.landingPage, description: e.target.value } }))} rows={4} readOnly={!canEdit || isPreview} />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );

  return (
    <div className="page-container">
      <PageHeader title="Marketing Strategy" description="Channels, budget allocation, and promotional offers">
        {canEdit && (
          <AiActionBar onGenerate={() => aiSuggestion.generate('generate', data)} onImprove={() => aiSuggestion.generate('improve', data)} onExpand={() => aiSuggestion.generate('expand', data)} isLoading={aiSuggestion.state.status === 'loading'} disabled={!isAiAvailable} />
        )}
      </PageHeader>

      {aiSuggestion.state.status === 'error' && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
          <AlertCircle className="size-4 shrink-0" />
          <span className="flex-1">{aiSuggestion.state.error}</span>
          <Button variant="ghost" size="sm" onClick={aiSuggestion.dismiss}>Dismiss</Button>
        </div>
      )}

      {aiSuggestion.state.status === 'loading' && (
        <AiSuggestionPreview onAccept={handleAccept} onReject={aiSuggestion.reject} isLoading><div /></AiSuggestionPreview>
      )}

      {aiSuggestion.state.status === 'preview' ? (
        <AiSuggestionPreview onAccept={handleAccept} onReject={aiSuggestion.reject}>{sectionContent}</AiSuggestionPreview>
      ) : (
        aiSuggestion.state.status !== 'loading' && sectionContent
      )}
    </div>
  );
}
