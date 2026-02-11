import { useSection } from '@/hooks/use-section';
import { DEFAULT_MARKETING_CHANNELS } from '@/lib/constants';
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
import { Plus, Trash2 } from 'lucide-react';

const CHANNEL_DISPLAY_NAMES: Record<MarketingChannelName, string> = {
  'meta-ads': 'Meta Ads',
  'google-ads': 'Google Ads',
  'organic-social': 'Organic Social',
  partnerships: 'Partnerships',
};

const defaultMarketing: MarketingStrategyType = {
  channels: DEFAULT_MARKETING_CHANNELS,
  offers: [
    'Free slime lab for March bookings',
    'Free professional photos for April parties',
    'Free custom cake topper',
    'Free Museum Jellyfish tickets for birthday child',
  ],
  landingPage: {
    url: '',
    description:
      'Landing page with service tiers, photo/video gallery, booking form, trust signals (reviews, safety certifications), and bilingual content (English/Spanish).',
  },
};

export function MarketingStrategy() {
  const { data, updateData, isLoading } = useSection<MarketingStrategyType>(
    'marketing-strategy',
    defaultMarketing
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Marketing Strategy</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const totalMonthlyAdSpend = data.channels.reduce((sum, ch) => sum + ch.budget, 0);

  function updateChannel(
    index: number,
    field: keyof MarketingChannel,
    value: string | number | string[]
  ) {
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
    updateData((prev) => ({
      ...prev,
      offers: [...prev.offers, ''],
    }));
  }

  function removeOffer(index: number) {
    updateData((prev) => ({
      ...prev,
      offers: prev.offers.filter((_, i) => i !== index),
    }));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Marketing Strategy</h1>

      {/* Total Monthly Ad Spend Summary */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Total Monthly Ad Spend
          </span>
          <span className="text-2xl font-bold">
            ${totalMonthlyAdSpend.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Marketing Channels */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Marketing Channels</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.channels.map((channel, chIndex) => (
            <Card key={chIndex}>
              <CardHeader>
                <div className="space-y-3">
                  <CardTitle>{CHANNEL_DISPLAY_NAMES[channel.name] || channel.name}</CardTitle>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Budget
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          $
                        </span>
                        <Input
                          type="number"
                          className="pl-7"
                          value={channel.budget}
                          onChange={(e) =>
                            updateChannel(chIndex, 'budget', Number(e.target.value))
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Expected Leads
                      </label>
                      <Input
                        type="number"
                        value={channel.expectedLeads}
                        onChange={(e) =>
                          updateChannel(chIndex, 'expectedLeads', Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Expected CAC
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          $
                        </span>
                        <Input
                          type="number"
                          className="pl-7"
                          value={channel.expectedCAC}
                          onChange={(e) =>
                            updateChannel(chIndex, 'expectedCAC', Number(e.target.value))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Description
                  </label>
                  <Textarea
                    value={channel.description}
                    onChange={(e) =>
                      updateChannel(chIndex, 'description', e.target.value)
                    }
                    rows={2}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">
                      Tactics
                    </label>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => addTactic(chIndex)}
                    >
                      <Plus className="size-3" />
                      Add Tactic
                    </Button>
                  </div>
                  {channel.tactics.map((tactic, tacticIndex) => (
                    <div key={tacticIndex} className="flex items-center gap-2">
                      <Input
                        value={tactic}
                        onChange={(e) =>
                          updateTactic(chIndex, tacticIndex, e.target.value)
                        }
                        className="text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeTactic(chIndex, tacticIndex)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Offers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Promotional Offers</h2>
          <Button variant="outline" size="sm" onClick={addOffer}>
            <Plus className="size-4" />
            Add Offer
          </Button>
        </div>
        <Card>
          <CardContent>
            <div className="space-y-3">
              {data.offers.map((offer, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={offer}
                    onChange={(e) => updateOffer(index, e.target.value)}
                    placeholder="Promotional offer"
                  />
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeOffer(index)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
              {data.offers.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">
                  No offers yet. Click "Add Offer" to get started.
                </p>
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
              <Input
                value={data.landingPage.url}
                onChange={(e) =>
                  updateData((prev) => ({
                    ...prev,
                    landingPage: { ...prev.landingPage, url: e.target.value },
                  }))
                }
                placeholder="https://funboxparty.com"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Description
              </label>
              <Textarea
                value={data.landingPage.description}
                onChange={(e) =>
                  updateData((prev) => ({
                    ...prev,
                    landingPage: { ...prev.landingPage, description: e.target.value },
                  }))
                }
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
