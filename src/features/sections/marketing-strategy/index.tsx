import { useSection } from '@/hooks/use-section';
import { useAiSuggestion } from '@/hooks/use-ai-suggestion';
import { isAiAvailable } from '@/lib/ai/gemini-client';
import { AiActionBar } from '@/components/ai-action-bar';
import { AiSuggestionPreview } from '@/components/ai-suggestion-preview';
import type {
  MarketingStrategy as MarketingStrategyType,
  MarketingChannel,
  MarketingChannelName,
} from '@/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
  'meta-ads': <AtSign className="size-5" />,
  'google-ads': <Search className="size-5" />,
  'organic-social': <Share2 className="size-5" />,
  partnerships: <Handshake className="size-5" />,
};

const CHANNEL_STYLES: Record<MarketingChannelName, { border: string; badge: string; iconBg: string }> = {
  'meta-ads': {
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
  },
  'google-ads': {
    border: 'border-green-200 dark:border-green-800',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    iconBg: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
  },
  'organic-social': {
    border: 'border-purple-200 dark:border-purple-800',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
  },
  partnerships: {
    border: 'border-amber-200 dark:border-amber-800',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400',
  },
};

const PIE_COLORS = ['#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b'];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="size-3 text-muted-foreground cursor-help inline-block ml-1" />
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
  const { data, updateData, isLoading } = useSection<MarketingStrategyType>(
    'marketing-strategy',
    defaultMarketing
  );
  const aiSuggestion = useAiSuggestion<MarketingStrategyType>('marketing-strategy');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Marketing Strategy</h1>
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

  // Pie chart data — only channels with budget > 0
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="rounded-md bg-amber-100 p-1.5 dark:bg-amber-900">
                  <DollarSign className="size-4 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Total Ad Spend</p>
              </div>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{formatCurrency(totalBudget)}</p>
              <p className="text-xs text-muted-foreground mt-1">per month</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="rounded-md bg-blue-100 p-1.5 dark:bg-blue-900">
                  <Users className="size-4 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  Expected Leads
                  <InfoTooltip text="Number of new leads expected per month from all channels" />
                </p>
              </div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalLeads}</p>
              <p className="text-xs text-muted-foreground mt-1">per month</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/30">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="rounded-md bg-purple-100 p-1.5 dark:bg-purple-900">
                  <Target className="size-4 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  Average CAC
                  <InfoTooltip text="Customer Acquisition Cost — average cost to acquire one lead across all channels" />
                </p>
              </div>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatCurrency(avgCAC)}</p>
              <p className="text-xs text-muted-foreground mt-1">per lead</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="rounded-md bg-green-100 p-1.5 dark:bg-green-900">
                  <CalendarCheck className="size-4 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Est. Monthly Bookings</p>
              </div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{estimatedBookings}</p>
              <p className="text-xs text-muted-foreground mt-1">at 20% conversion</p>
            </CardContent>
          </Card>
        </div>

        {/* Budget Allocation Pie Chart */}
        {budgetPieData.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Budget Allocation</h2>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] w-full">
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
            </CardContent>
          </Card>
        )}

        {/* Marketing Channels */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Marketing Channels</h2>
            {!isPreview && (
              <Button variant="outline" size="sm" onClick={addChannel}>
                <Plus className="size-4" />
                Add Channel
              </Button>
            )}
          </div>
          {displayData.channels.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">No marketing channels yet. Use AI Generate to create a marketing strategy, or add channels manually.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayData.channels.map((channel, chIndex) => {
              const style = CHANNEL_STYLES[channel.name];
              return (
                <Card key={chIndex} className={style.border}>
                  <CardHeader>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${style.iconBg}`}>
                          {CHANNEL_ICONS[channel.name]}
                        </div>
                        <div className="flex-1">
                          <CardTitle>{CHANNEL_DISPLAY_NAMES[channel.name] || channel.name}</CardTitle>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.badge}`}>
                          {channel.budget > 0 ? 'Paid' : 'Organic'}
                        </span>
                        {!isPreview && (
                          <Button variant="ghost" size="icon-xs" onClick={() => removeChannel(chIndex)}>
                            <Trash2 className="size-3" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">
                            Budget
                            <InfoTooltip text="Monthly spend allocated to this channel" />
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                            <Input type="number" className="pl-7" value={channel.budget} onChange={(e) => updateChannel(chIndex, 'budget', Number(e.target.value))} readOnly={isPreview} />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">
                            Expected Leads
                            <InfoTooltip text="Number of new leads expected per month from this channel" />
                          </label>
                          <Input type="number" value={channel.expectedLeads} onChange={(e) => updateChannel(chIndex, 'expectedLeads', Number(e.target.value))} readOnly={isPreview} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">
                            CAC
                            <InfoTooltip text="Customer Acquisition Cost — cost to acquire one lead through this channel" />
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                            <Input type="number" className="pl-7" value={channel.expectedCAC} onChange={(e) => updateChannel(chIndex, 'expectedCAC', Number(e.target.value))} readOnly={isPreview} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Description</label>
                      <Textarea value={channel.description} onChange={(e) => updateChannel(chIndex, 'description', e.target.value)} rows={2} readOnly={isPreview} />
                    </div>

                    {/* Campaign/Tracking URL */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Link className="size-3" />
                        Campaign URL
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={channel.url ?? ''}
                          onChange={(e) => updateChannel(chIndex, 'url', e.target.value)}
                          placeholder="https://..."
                          readOnly={isPreview}
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

                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-muted-foreground">
                          Tactics
                          <InfoTooltip text="Specific actions and campaigns run within this channel" />
                        </label>
                        {!isPreview && (
                          <Button variant="ghost" size="xs" onClick={() => addTactic(chIndex)}>
                            <Plus className="size-3" />
                            Add Tactic
                          </Button>
                        )}
                      </div>
                      {channel.tactics.map((tactic, tacticIndex) => (
                        <div key={tacticIndex} className="flex items-center gap-2">
                          <Input value={tactic} onChange={(e) => updateTactic(chIndex, tacticIndex, e.target.value)} className="text-sm" readOnly={isPreview} />
                          {!isPreview && (
                            <Button variant="ghost" size="icon-xs" onClick={() => removeTactic(chIndex, tacticIndex)}>
                              <Trash2 className="size-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Promotional Offers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Promotional Offers</h2>
            {!isPreview && (
              <Button variant="outline" size="sm" onClick={addOffer}>
                <Plus className="size-4" />
                Add Offer
              </Button>
            )}
          </div>
          <Card>
            <CardContent>
              <div className="space-y-3">
                {displayData.offers.map((offer, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 shrink-0">
                      <Gift className="size-4 text-pink-500 dark:text-pink-400" />
                      <span className="text-xs font-bold text-muted-foreground w-5 text-right">{index + 1}.</span>
                    </div>
                    <Input value={offer} onChange={(e) => updateOffer(index, e.target.value)} placeholder="Promotional offer" readOnly={isPreview} />
                    {!isPreview && (
                      <Button variant="ghost" size="icon-xs" onClick={() => removeOffer(index)}>
                        <Trash2 className="size-3" />
                      </Button>
                    )}
                  </div>
                ))}
                {displayData.offers.length === 0 && (
                  <p className="text-sm text-muted-foreground py-2">No offers yet. Click "Add Offer" to get started.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Landing Page Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Landing Page</h2>
          <Card>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">URL</label>
                <div className="flex items-center gap-2">
                  <Input
                    value={displayData.landingPage.url}
                    onChange={(e) => updateData((prev) => ({ ...prev, landingPage: { ...prev.landingPage, url: e.target.value } }))}
                    placeholder="https://yourbusiness.com"
                    readOnly={isPreview}
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
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <Textarea value={displayData.landingPage.description} onChange={(e) => updateData((prev) => ({ ...prev, landingPage: { ...prev.landingPage, description: e.target.value } }))} rows={4} readOnly={isPreview} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Marketing Strategy</h1>
        <AiActionBar onGenerate={() => aiSuggestion.generate('generate', data)} onImprove={() => aiSuggestion.generate('improve', data)} onExpand={() => aiSuggestion.generate('expand', data)} isLoading={aiSuggestion.state.status === 'loading'} disabled={!isAiAvailable} />
      </div>

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
