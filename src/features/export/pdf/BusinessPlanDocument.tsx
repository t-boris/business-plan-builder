import { Document, View, Text, Image } from '@react-pdf/renderer';
import { styles } from './pdfStyles';
import { CoverPage } from './CoverPage';
import { SectionPage } from './SectionPage';
import { SECTION_SLUGS } from '@/lib/constants';
import { normalizeProductService } from '@/features/sections/product-service/normalize';
import type {
  ExecutiveSummary,
  MarketAnalysis,
  ProductService,
  MarketingStrategy,
  Operations,
  FinancialProjections,
  RisksDueDiligence,
  KpisMetrics,
  LaunchPlan,
  MonthlyCosts,
  MarketingChannelName,
  RiskSeverity,
  ComplianceStatus,
  TaskStatus,
  InvestmentVerdict,
  DueDiligencePriority,
  CalcStep,
} from '@/types';
import { computeTam, computeSam, computeSom } from '@/features/sections/market-analysis/lib/sizing-math';

// ---- Helpers ----

function formatCurrency(value: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return '$' + Math.round(value).toLocaleString('en-US');
  }
}

function sumCosts(costs: MonthlyCosts): number {
  return costs.marketing + costs.labor + costs.supplies + costs.museum + costs.transport;
}

const CHANNEL_NAMES: Record<MarketingChannelName, string> = {
  'meta-ads': 'Meta Ads',
  'google-ads': 'Google Ads',
  'organic-social': 'Organic Social',
  partnerships: 'Partnerships',
};

const severityBadge: Record<RiskSeverity, keyof typeof styles> = {
  critical: 'badgeCritical',
  high: 'badgeHigh',
  medium: 'badgeMedium',
  low: 'badgeLow',
};

const verdictLabels: Record<InvestmentVerdict, string> = {
  'strong-go': 'Strong Go',
  'conditional-go': 'Conditional Go',
  'proceed-with-caution': 'Proceed with Caution',
  'defer': 'Defer',
  'no-go': 'No-Go',
};

const verdictColors: Record<InvestmentVerdict, string> = {
  'strong-go': '#16a34a',
  'conditional-go': '#d97706',
  'proceed-with-caution': '#ea580c',
  'defer': '#dc2626',
  'no-go': '#991b1b',
};

const priorityBadge: Record<DueDiligencePriority, keyof typeof styles> = {
  required: 'badgeRequired',
  advised: 'badgeAdvised',
};

const complianceLabels: Record<ComplianceStatus, string> = {
  'not-started': 'Not Started',
  pending: 'Pending',
  complete: 'Complete',
};

const taskLabels: Record<TaskStatus, string> = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  done: 'Done',
};

// ---- Sub-components ----

function BulletList({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((item, i) => (
        <View key={i} style={styles.listItem}>
          <Text style={styles.listBullet}>{'\u2022'}</Text>
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function SubsectionTitle({ children }: { children: string }) {
  return <Text style={styles.subsectionHeader}>{children}</Text>;
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
    </View>
  );
}

function EmptyState({ section }: { section: string }) {
  return <Text style={styles.emptyText}>{section} -- No data entered</Text>;
}

// ---- Main Document ----

export interface BusinessPlanDocumentProps {
  execSummary: ExecutiveSummary | null;
  marketAnalysis: MarketAnalysis | null;
  productService: ProductService | null;
  marketingStrategy: MarketingStrategy | null;
  operations: Operations | null;
  financials: FinancialProjections | null;
  risks: RisksDueDiligence | null;
  kpis: KpisMetrics | null;
  launchPlan: LaunchPlan | null;
  enabledSections: string[];
  scenarioName: string;
  scenarioMetrics: Record<string, { label: string; value: number; unit: string }>;
  chartImage: string | null;
  businessName: string;
  currencyCode: string;
  scenarioPack: import('../index').ScenarioPack | null;
}

export function BusinessPlanDocument({
  execSummary,
  marketAnalysis,
  productService,
  marketingStrategy,
  operations,
  financials,
  risks,
  kpis,
  launchPlan,
  enabledSections,
  scenarioName,
  scenarioMetrics,
  chartImage,
  businessName,
  currencyCode,
  scenarioPack,
}: BusinessPlanDocumentProps) {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Dynamic section filtering and numbering
  const enabledSlugs = SECTION_SLUGS.filter((s) => enabledSections.includes(s));

  function getSectionNumber(slug: string): number {
    return enabledSlugs.indexOf(slug as typeof enabledSlugs[number]) + 1;
  }

  // Build top metrics from scenarioMetrics (top 4, sorted by unit priority)
  const unitPriority: Record<string, number> = {
    currency: 0, percent: 1, ratio: 2, count: 3, months: 4, days: 5, hours: 6,
  };

  const topMetrics = Object.values(scenarioMetrics)
    .sort((a, b) => (unitPriority[a.unit] ?? 99) - (unitPriority[b.unit] ?? 99))
    .slice(0, 4)
    .map((m) => ({
      label: m.label,
      value: m.unit === 'currency'
        ? formatCurrency(m.value, currencyCode)
        : m.unit === 'percent'
          ? `${(m.value * 100).toFixed(1)}%`
          : String(Math.round(m.value)),
    }));

  return (
    <Document title={`${businessName || 'Business'} Plan`} author="" subject="Business Plan">
      {/* Cover Page */}
      <CoverPage
        scenarioName={scenarioName}
        date={date}
        businessName={businessName}
        currencyCode={currencyCode}
        topMetrics={topMetrics}
      />

      {/* Section: Executive Summary */}
      {enabledSlugs.includes('executive-summary') && (
        <SectionPage number={getSectionNumber('executive-summary')} title="Executive Summary">
          {execSummary ? (
            <View>
              <SubsectionTitle>Summary</SubsectionTitle>
              <Text style={styles.bodyText}>{execSummary.summary}</Text>

              <View style={styles.col2}>
                <View style={styles.flex1}>
                  <SubsectionTitle>Mission</SubsectionTitle>
                  <Text style={styles.bodyText}>{execSummary.mission}</Text>
                </View>
                <View style={styles.flex1}>
                  <SubsectionTitle>Vision</SubsectionTitle>
                  <Text style={styles.bodyText}>{execSummary.vision}</Text>
                </View>
              </View>

              <SubsectionTitle>Key Highlights</SubsectionTitle>
              <BulletList items={execSummary.keyHighlights} />
            </View>
          ) : (
            <EmptyState section="Executive Summary" />
          )}
        </SectionPage>
      )}

      {/* Section: Market Analysis */}
      {enabledSlugs.includes('market-analysis') && (
        <SectionPage number={getSectionNumber('market-analysis')} title="Market Analysis">
          {marketAnalysis ? (
            <View>
              {/* TAM / SAM / SOM */}
              {marketAnalysis.enabledBlocks?.sizing !== false && marketAnalysis.marketSizing?.tam?.steps?.length > 0 && (() => {
                const tamVal = computeTam(marketAnalysis.marketSizing.tam);
                const samVal = computeSam(marketAnalysis.marketSizing.tam, marketAnalysis.marketSizing.sam);
                const somVal = computeSom(marketAnalysis.marketSizing.tam, marketAnalysis.marketSizing.sam, marketAnalysis.marketSizing.som);
                const fmt = (v: number) => v >= 1e9 ? `$${(v/1e9).toFixed(1)}B` : v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v/1e3).toFixed(0)}K` : formatCurrency(v, currencyCode);
                const typeLabel = (t: CalcStep['type']) => t === 'currency' ? '$' : t === 'percentage' ? '%' : '#';

                return (
                  <View>
                    <SubsectionTitle>Market Sizing</SubsectionTitle>
                    <View style={styles.statCardRow}>
                      {tamVal > 0 && <StatCard label={`TAM (${marketAnalysis.marketSizing.tam.approach})`} value={fmt(tamVal)} />}
                      {samVal > 0 && <StatCard label="SAM" value={fmt(samVal)} />}
                      {somVal > 0 && <StatCard label="SOM" value={fmt(somVal)} />}
                    </View>

                    {/* TAM steps */}
                    {marketAnalysis.marketSizing.tam.steps.length > 0 && (
                      <View style={{ marginTop: 4 }}>
                        <Text style={[styles.smallText, { fontFamily: 'Helvetica-Bold', marginBottom: 2 }]}>TAM Steps</Text>
                        {marketAnalysis.marketSizing.tam.steps.map((s: CalcStep, i: number) => (
                          <Text key={i} style={styles.bodyText}>
                            {s.label}: {s.type === 'currency' ? formatCurrency(s.value, currencyCode) : `${s.value}`}{typeLabel(s.type) !== '$' ? typeLabel(s.type) : ''}
                          </Text>
                        ))}
                      </View>
                    )}

                    {/* SAM steps */}
                    {marketAnalysis.marketSizing.sam.steps.length > 0 && (
                      <View style={{ marginTop: 4 }}>
                        <Text style={[styles.smallText, { fontFamily: 'Helvetica-Bold', marginBottom: 2 }]}>SAM Steps</Text>
                        {marketAnalysis.marketSizing.sam.steps.map((s: CalcStep, i: number) => (
                          <Text key={i} style={styles.bodyText}>
                            {s.label}: {s.type === 'currency' ? formatCurrency(s.value, currencyCode) : `${s.value}`}{typeLabel(s.type) !== '$' ? typeLabel(s.type) : ''}
                          </Text>
                        ))}
                      </View>
                    )}

                    {/* SOM steps */}
                    {marketAnalysis.marketSizing.som.steps.length > 0 && (
                      <View style={{ marginTop: 4 }}>
                        <Text style={[styles.smallText, { fontFamily: 'Helvetica-Bold', marginBottom: 2 }]}>SOM Steps</Text>
                        {marketAnalysis.marketSizing.som.steps.map((s: CalcStep, i: number) => (
                          <Text key={i} style={styles.bodyText}>
                            {s.label}: {s.type === 'currency' ? formatCurrency(s.value, currencyCode) : `${s.value}`}{typeLabel(s.type) !== '$' ? typeLabel(s.type) : ''}
                          </Text>
                        ))}
                      </View>
                    )}

                    {marketAnalysis.marketNarrative ? (
                      <Text style={[styles.bodyText, { marginTop: 4 }]}>{marketAnalysis.marketNarrative}</Text>
                    ) : null}
                  </View>
                );
              })()}

              {/* Competitors */}
              {marketAnalysis.enabledBlocks?.competitors !== false && marketAnalysis.competitors.length > 0 && (
                <View>
                  <SubsectionTitle>Competitors</SubsectionTitle>
                  <View style={styles.table}>
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Name</Text>
                      <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Pricing</Text>
                      <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Strengths</Text>
                      <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Weaknesses</Text>
                    </View>
                    {marketAnalysis.competitors.map((c, i) => (
                      <View key={i} style={i % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                        <Text style={[styles.tableCellBold, { width: '25%' }]}>{c.name}</Text>
                        <Text style={[styles.tableCell, { width: '15%' }]}>{c.pricing}</Text>
                        <Text style={[styles.tableCell, { width: '30%' }]}>{c.strengths}</Text>
                        <Text style={[styles.tableCell, { width: '30%' }]}>{c.weaknesses}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Demographics */}
              {marketAnalysis.enabledBlocks?.demographics !== false && (
                <View>
                  <SubsectionTitle>Demographics</SubsectionTitle>
                  <Text style={styles.bodyText}>Population: {marketAnalysis.demographics.population.toLocaleString()}</Text>
                  <Text style={styles.bodyText}>Income: {marketAnalysis.demographics.income}</Text>
                  {marketAnalysis.demographics.metrics?.map((m, i) => (
                    <Text key={i} style={styles.bodyText}>{m.label}: {m.value}{m.source ? ` (${m.source})` : ''}</Text>
                  ))}
                </View>
              )}

              {/* Acquisition Funnel */}
              {marketAnalysis.enabledBlocks?.acquisitionFunnel !== false && marketAnalysis.acquisitionFunnel?.length > 0 && (
                <View>
                  <SubsectionTitle>Acquisition Funnel</SubsectionTitle>
                  <View style={styles.table}>
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Stage</Text>
                      <Text style={[styles.tableHeaderCell, { width: '40%' }]}>Description</Text>
                      <Text style={[styles.tableHeaderCell, { width: '20%', textAlign: 'right' }]}>Volume</Text>
                      <Text style={[styles.tableHeaderCell, { width: '20%', textAlign: 'right' }]}>Conv. Rate</Text>
                    </View>
                    {marketAnalysis.acquisitionFunnel.map((s, i) => (
                      <View key={i} style={i % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                        <Text style={[styles.tableCellBold, { width: '20%' }]}>{s.label}</Text>
                        <Text style={[styles.tableCell, { width: '40%' }]}>{s.description}</Text>
                        <Text style={[styles.tableCellRight, { width: '20%' }]}>{s.volume.toLocaleString()}</Text>
                        <Text style={[styles.tableCellRight, { width: '20%' }]}>{s.conversionRate}%</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Adoption Model */}
              {marketAnalysis.enabledBlocks?.adoptionModel !== false && marketAnalysis.adoptionModel && (
                <View>
                  <SubsectionTitle>Adoption Model</SubsectionTitle>
                  <Text style={styles.bodyText}>
                    {marketAnalysis.adoptionModel.type === 's-curve' ? 'S-Curve (Logistic)' : 'Linear'} | Market: {marketAnalysis.adoptionModel.totalMarket.toLocaleString()} | Initial: {marketAnalysis.adoptionModel.initialUsers} | Rate: {marketAnalysis.adoptionModel.growthRate} | {marketAnalysis.adoptionModel.projectionMonths}mo
                  </Text>
                </View>
              )}

              {/* Custom Metrics */}
              {marketAnalysis.enabledBlocks?.customMetrics !== false && marketAnalysis.customMetrics?.length > 0 && (
                <View>
                  <SubsectionTitle>Custom Metrics</SubsectionTitle>
                  {marketAnalysis.customMetrics.map((m, i) => (
                    <Text key={i} style={styles.bodyText}>{m.label}: {m.value}{m.source ? ` (${m.source})` : ''}</Text>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <EmptyState section="Market Analysis" />
          )}
        </SectionPage>
      )}

      {/* Section: Product & Service */}
      {enabledSlugs.includes('product-service') && (() => {
        const normalizedPS = productService ? normalizeProductService(productService) : null;
        return (
          <SectionPage number={getSectionNumber('product-service')} title="Product & Service">
            {normalizedPS ? (
              <View>
                {normalizedPS.overview ? (
                  <Text style={styles.bodyText}>{normalizedPS.overview}</Text>
                ) : null}

                <SubsectionTitle>Offerings</SubsectionTitle>
                {normalizedPS.offerings.map((offering) => (
                  <View key={offering.id} style={styles.infoCard}>
                    {offering.image?.url && (
                      <Image
                        src={offering.image.url}
                        style={{ width: '100%', height: 60, objectFit: 'contain', borderRadius: 4, marginBottom: 4 }}
                      />
                    )}
                    <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }]}>
                      <Text style={styles.infoCardTitle}>{offering.name}</Text>
                      <View style={[styles.row, { alignItems: 'baseline' }]}>
                        <Text style={[styles.statValue, { color: '#2563eb', fontSize: 12 }]}>
                          {offering.price != null ? formatCurrency(offering.price, currencyCode) : 'On request'}
                        </Text>
                        {offering.priceLabel ? (
                          <Text style={[styles.smallText, { marginLeft: 3 }]}>{offering.priceLabel}</Text>
                        ) : null}
                      </View>
                    </View>
                    <Text style={[styles.bodyText, { marginTop: 4 }]}>{offering.description}</Text>
                    {offering.addOnIds.length > 0 && (() => {
                      const linked = offering.addOnIds
                        .map((aid) => normalizedPS.addOns.find((a) => a.id === aid))
                        .filter(Boolean);
                      if (linked.length === 0) return null;
                      return (
                        <Text style={[styles.smallText, { marginTop: 4 }]}>
                          Add-ons: {linked.map((a) => `${a!.name} (${formatCurrency(a!.price, currencyCode)})`).join(', ')}
                        </Text>
                      );
                    })()}
                  </View>
                ))}

                {normalizedPS.addOns.length > 0 && (
                  <View>
                    <SubsectionTitle>Add-Ons</SubsectionTitle>
                    {normalizedPS.addOns.map((a) => (
                      <Text key={a.id} style={styles.bodyText}>
                        {a.name}{a.description ? ` -- ${a.description}` : ''} -- {formatCurrency(a.price, currencyCode)}{a.priceLabel ? ` ${a.priceLabel}` : ''}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <EmptyState section="Product & Service" />
            )}
          </SectionPage>
        );
      })()}

      {/* Section: Marketing Strategy */}
      {enabledSlugs.includes('marketing-strategy') && (
        <SectionPage number={getSectionNumber('marketing-strategy')} title="Marketing Strategy">
          {marketingStrategy ? (
            <View>
              <SubsectionTitle>Channels</SubsectionTitle>
              {marketingStrategy.channels.map((ch, i) => (
                <View key={i} style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>{CHANNEL_NAMES[ch.name] || ch.name}</Text>
                  <View style={[styles.row, { marginBottom: 4 }]}>
                    <Text style={styles.smallText}>Budget: {formatCurrency(ch.budget, currencyCode)}/mo</Text>
                    <Text style={styles.smallText}>  Leads: {ch.expectedLeads}</Text>
                    <Text style={styles.smallText}>  CAC: {formatCurrency(ch.expectedCAC, currencyCode)}</Text>
                  </View>
                  <Text style={styles.bodyText}>{ch.description}</Text>
                </View>
              ))}

              {marketingStrategy.offers.length > 0 && (
                <View>
                  <SubsectionTitle>Promotional Offers</SubsectionTitle>
                  <BulletList items={marketingStrategy.offers} />
                </View>
              )}

              {marketingStrategy.landingPage.description && (
                <View>
                  <SubsectionTitle>Landing Page</SubsectionTitle>
                  {marketingStrategy.landingPage.url && (
                    <Text style={[styles.bodyText, { color: '#2563eb' }]}>{marketingStrategy.landingPage.url}</Text>
                  )}
                  <Text style={styles.bodyText}>{marketingStrategy.landingPage.description}</Text>
                </View>
              )}
            </View>
          ) : (
            <EmptyState section="Marketing Strategy" />
          )}
        </SectionPage>
      )}

      {/* Section: Operations */}
      {enabledSlugs.includes('operations') && (
        <SectionPage number={getSectionNumber('operations')} title="Operations">
          {operations ? (
            <View>
              {operations.crew.length > 0 && (
                <View>
                  <SubsectionTitle>Crew</SubsectionTitle>
                  <View style={styles.table}>
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.tableHeaderCell, { width: '50%' }]}>Role</Text>
                      <Text style={[styles.tableHeaderCell, { width: '25%', textAlign: 'right' }]}>Hourly Rate</Text>
                      <Text style={[styles.tableHeaderCell, { width: '25%', textAlign: 'right' }]}>Count</Text>
                    </View>
                    {operations.crew.map((m, i) => (
                      <View key={i} style={i % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                        <Text style={[styles.tableCellBold, { width: '50%' }]}>{m.role}</Text>
                        <Text style={[styles.tableCellRight, { width: '25%' }]}>{formatCurrency(m.hourlyRate, currencyCode)}/hr</Text>
                        <Text style={[styles.tableCellRight, { width: '25%' }]}>{m.count}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <SubsectionTitle>Capacity</SubsectionTitle>
              <View style={styles.statCardRow}>
                <StatCard label="Daily" value={String(operations.capacity.maxBookingsPerDay)} />
                <StatCard label="Weekly" value={String(operations.capacity.maxBookingsPerWeek)} />
                <StatCard label="Monthly" value={String(operations.capacity.maxBookingsPerMonth)} />
                <StatCard label="Travel Radius" value={`${operations.travelRadius} mi`} />
              </View>

              {operations.equipment.length > 0 && (
                <View>
                  <SubsectionTitle>Equipment</SubsectionTitle>
                  <BulletList items={operations.equipment} />
                </View>
              )}

              {operations.safetyProtocols.length > 0 && (
                <View>
                  <SubsectionTitle>Safety Protocols</SubsectionTitle>
                  {operations.safetyProtocols.map((p, i) => (
                    <View key={i} style={styles.listItem}>
                      <Text style={styles.listBullet}>{i + 1}.</Text>
                      <Text style={styles.listText}>{p}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <EmptyState section="Operations" />
          )}
        </SectionPage>
      )}

      {/* Section: Financial Projections */}
      {enabledSlugs.includes('financial-projections') && (
        <SectionPage number={getSectionNumber('financial-projections')} title="Financial Projections">
          {financials ? (
            <View>
              <SubsectionTitle>{`Key Metrics (${scenarioName})`}</SubsectionTitle>
              <View style={styles.statCardRow}>
                {topMetrics.map((m, i) => (
                  <StatCard key={i} label={m.label} value={m.value} />
                ))}
              </View>

              {(financials.unitEconomics.avgCheck > 0 || financials.unitEconomics.costPerEvent > 0) && (
                <View>
                  <SubsectionTitle>Unit Economics</SubsectionTitle>
                  <View style={styles.statCardRow}>
                    <StatCard label="Avg Check" value={formatCurrency(financials.unitEconomics.avgCheck, currencyCode)} />
                    <StatCard label="Cost/Event" value={formatCurrency(financials.unitEconomics.costPerEvent, currencyCode)} />
                    <StatCard label="Profit/Event" value={formatCurrency(financials.unitEconomics.profitPerEvent, currencyCode)} />
                    <StatCard label="Break-Even" value={`${financials.unitEconomics.breakEvenEvents} events`} />
                  </View>
                </View>
              )}

              {/* Chart Image */}
              {chartImage && (
                <View>
                  <SubsectionTitle>Revenue vs Costs (12-Month Projection)</SubsectionTitle>
                  <Image style={styles.chartImage} src={chartImage} />
                </View>
              )}

              {/* Monthly P&L Table */}
              {financials.months.length > 0 && (
                <View>
                  <SubsectionTitle>Monthly P&L</SubsectionTitle>
                  <View style={styles.table}>
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Month</Text>
                      <Text style={[styles.tableHeaderCell, { width: '23%', textAlign: 'right' }]}>Revenue</Text>
                      <Text style={[styles.tableHeaderCell, { width: '23%', textAlign: 'right' }]}>Costs</Text>
                      <Text style={[styles.tableHeaderCell, { width: '24%', textAlign: 'right' }]}>Profit</Text>
                    </View>
                    {financials.months.map((m, i) => {
                      const totalCosts = sumCosts(m.costs);
                      const profit = m.revenue - totalCosts;
                      return (
                        <View key={i} style={i % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                          <Text style={[styles.tableCellBold, { width: '30%' }]}>{m.month}</Text>
                          <Text style={[styles.tableCellRight, { width: '23%' }]}>{formatCurrency(m.revenue, currencyCode)}</Text>
                          <Text style={[styles.tableCellRight, { width: '23%' }]}>{formatCurrency(totalCosts, currencyCode)}</Text>
                          <Text style={[styles.tableCellRight, { width: '24%', color: profit >= 0 ? '#16a34a' : '#dc2626', fontFamily: 'Helvetica-Bold' }]}>
                            {formatCurrency(profit, currencyCode)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          ) : (
            <EmptyState section="Financial Projections" />
          )}
        </SectionPage>
      )}

      {/* Section: Risks & Due Diligence */}
      {enabledSlugs.includes('risks-due-diligence') && (
        <SectionPage number={getSectionNumber('risks-due-diligence')} title="Risks & Due Diligence">
          {risks ? (
            <View>
              {/* Investment Verdict */}
              {risks.investmentVerdict && (
                <View style={[styles.infoCard, { borderLeftWidth: 3, borderLeftColor: verdictColors[risks.investmentVerdict.verdict] }]}>
                  <View style={[styles.row, { marginBottom: 4, alignItems: 'center' }]}>
                    <Text style={[styles.infoCardTitle, { marginBottom: 0 }]}>Investment Verdict: </Text>
                    <Text style={[styles.infoCardTitle, { marginBottom: 0, color: verdictColors[risks.investmentVerdict.verdict] }]}>
                      {verdictLabels[risks.investmentVerdict.verdict]}
                    </Text>
                  </View>
                  {risks.investmentVerdict.conditions.length > 0 && (
                    <View style={{ marginTop: 4 }}>
                      <Text style={[styles.smallText, { fontFamily: 'Helvetica-Bold', marginBottom: 3, textTransform: 'uppercase' }]}>Conditions</Text>
                      {risks.investmentVerdict.conditions.map((c, i) => (
                        <View key={i} style={styles.listItem}>
                          <Text style={styles.listBullet}>{i + 1}.</Text>
                          <Text style={styles.listText}>{c}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Risk Assessment */}
              {risks.risks.length > 0 ? (
                <View>
                  <SubsectionTitle>Risk Assessment</SubsectionTitle>
                  {risks.risks.map((risk, i) => (
                    <View key={i} style={[styles.infoCard, risk.severity === 'critical' ? { borderLeftWidth: 3, borderLeftColor: '#ef4444' } : {}]}>
                      <View style={[styles.row, { marginBottom: 4, alignItems: 'center' }]}>
                        <Text style={[styles.badge, styles[severityBadge[risk.severity]]]}>{risk.severity}</Text>
                        <Text style={[styles.smallText, { marginLeft: 6 }]}>{risk.category}</Text>
                      </View>
                      <Text style={styles.infoCardTitle}>{risk.title}</Text>
                      <Text style={styles.bodyText}>{risk.description}</Text>
                      <Text style={[styles.bodyText, { fontFamily: 'Helvetica-Bold' }]}>
                        Mitigation: <Text style={{ fontFamily: 'Helvetica' }}>{risk.mitigation}</Text>
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <EmptyState section="Risks" />
              )}

              {/* Due Diligence Checklist */}
              {risks.dueDiligenceChecklist && risks.dueDiligenceChecklist.length > 0 && (
                <View>
                  <SubsectionTitle>Due Diligence Checklist</SubsectionTitle>
                  {risks.dueDiligenceChecklist.map((item, i) => (
                    <View key={i} style={styles.infoCard}>
                      <View style={[styles.row, { marginBottom: 3, alignItems: 'center' }]}>
                        <Text style={[styles.badge, styles[priorityBadge[item.priority]], { marginRight: 4 }]}>{item.priority}</Text>
                        <Text style={[styles.badge, styles.badgeBlue]}>{complianceLabels[item.status]}</Text>
                      </View>
                      <Text style={styles.infoCardTitle}>{item.item}</Text>
                      <Text style={styles.bodyText}>{item.detail}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Compliance Checklist */}
              {risks.complianceChecklist.length > 0 && (
                <View>
                  <SubsectionTitle>Compliance Checklist</SubsectionTitle>
                  {risks.complianceChecklist.map((item, i) => (
                    <View key={i} style={[styles.listItem, { marginBottom: 3 }]}>
                      <Text style={[styles.badge, styles.badgeBlue, { marginRight: 6 }]}>{complianceLabels[item.status]}</Text>
                      <Text style={styles.listText}>{item.item}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <EmptyState section="Risks & Due Diligence" />
          )}
        </SectionPage>
      )}

      {/* Section: KPIs & Metrics */}
      {enabledSlugs.includes('kpis-metrics') && (
        <SectionPage number={getSectionNumber('kpis-metrics')} title="KPIs & Metrics">
          {kpis ? (
            <View>
              <SubsectionTitle>Target Metrics</SubsectionTitle>
              <View style={styles.statCardRow}>
                <StatCard label="Monthly Leads" value={String(kpis.targets.monthlyLeads)} />
                <StatCard label="Conversion Rate" value={`${(kpis.targets.conversionRate * 100).toFixed(0)}%`} />
                <StatCard label="Average Check" value={formatCurrency(kpis.targets.avgCheck, currencyCode)} />
              </View>
              <View style={styles.statCardRow}>
                <StatCard label="CAC/Lead" value={formatCurrency(kpis.targets.cacPerLead, currencyCode)} />
                <StatCard label="CAC/Booking" value={formatCurrency(kpis.targets.cacPerBooking, currencyCode)} />
                <StatCard label="Monthly Bookings" value={String(kpis.targets.monthlyBookings)} />
              </View>
            </View>
          ) : (
            <EmptyState section="KPIs & Metrics" />
          )}
        </SectionPage>
      )}

      {/* Section: Launch Plan */}
      {enabledSlugs.includes('launch-plan') && (
        <SectionPage number={getSectionNumber('launch-plan')} title="Launch Plan">
          {launchPlan ? (
            <View>
              {launchPlan.stages.length > 0 ? (
                launchPlan.stages.map((stage, i) => (
                  <View key={i} style={[styles.infoCard, { marginLeft: 16 }]}>
                    <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }]}>
                      <Text style={styles.infoCardTitle}>Stage {i + 1}: {stage.name}</Text>
                      <Text style={styles.smallText}>{stage.startDate} -- {stage.endDate}</Text>
                    </View>
                    {stage.tasks.map((t, j) => (
                      <View key={j} style={[styles.listItem, { marginBottom: 2 }]}>
                        <Text style={[styles.badge, styles.badgeBlue, { marginRight: 6 }]}>{taskLabels[t.status]}</Text>
                        <Text style={styles.listText}>{t.task}</Text>
                      </View>
                    ))}
                  </View>
                ))
              ) : (
                <EmptyState section="Launch Plan" />
              )}
            </View>
          ) : (
            <EmptyState section="Launch Plan" />
          )}
        </SectionPage>
      )}

      {/* Appendix: Scenario Analysis */}
      {scenarioPack && (() => {
        const { active, scenarios } = scenarioPack;
        const metricKeys = scenarios.length > 0 ? Object.keys(scenarios[0].metrics) : [];
        const hasMultiple = scenarios.length > 1;

        // Determine recommendation: highest profit-related metric
        let recommendationText: string | null = null;
        if (hasMultiple) {
          const profitKey = metricKeys.find((k) => {
            const label = scenarios[0].metrics[k]?.label.toLowerCase() ?? '';
            return label.includes('profit') || label.includes('net income') || label.includes('margin');
          });
          if (profitKey) {
            let bestName = '';
            let bestValue = -Infinity;
            for (const s of scenarios) {
              const val = s.metrics[profitKey]?.value ?? 0;
              if (val > bestValue) {
                bestValue = val;
                bestName = s.name;
              }
            }
            if (bestName) {
              recommendationText = `Based on financial metrics, "${bestName}" appears strongest.`;
            }
          }
        }

        // Calculate column widths dynamically
        const scenarioCount = scenarios.length;
        const labelWidth = scenarioCount <= 3 ? '30%' : '25%';
        const valueWidth = scenarioCount <= 3
          ? `${Math.floor(70 / scenarioCount)}%`
          : `${Math.floor(75 / scenarioCount)}%`;

        // Format metric values for PDF
        const fmtVal = (value: number, unit: string): string => {
          if (unit === 'currency') return formatCurrency(value, currencyCode);
          if (unit === 'percent') return `${(value * 100).toFixed(1)}%`;
          return String(Math.round(value));
        };

        return (
          <SectionPage number={enabledSlugs.length + 1} title="Scenario Analysis">
            <View>
              {/* Active Scenario Summary */}
              <SubsectionTitle>Active Scenario</SubsectionTitle>
              <View style={styles.infoCard}>
                <View style={[styles.row, { alignItems: 'center', marginBottom: 4 }]}>
                  <Text style={styles.infoCardTitle}>{active.name}</Text>
                  <Text style={[styles.badge, styles.badgeBlue, { marginLeft: 8 }]}>
                    {active.status === 'active' ? 'Active' : 'Draft'}
                  </Text>
                </View>
                <Text style={styles.bodyText}>Horizon: {active.horizon} months</Text>
                {active.assumptions.length > 0 && (
                  <View style={{ marginTop: 4 }}>
                    <Text style={[styles.smallText, { fontFamily: 'Helvetica-Bold', marginBottom: 2, textTransform: 'uppercase' }]}>Assumptions</Text>
                    {active.assumptions.map((a) => (
                      <View key={a.id} style={styles.listItem}>
                        <Text style={styles.listBullet}>{'\u2022'}</Text>
                        <Text style={styles.listText}>
                          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{a.label}:</Text> {a.value}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Comparison Table */}
              {hasMultiple && metricKeys.length > 0 && (
                <View>
                  <SubsectionTitle>Scenario Comparison</SubsectionTitle>
                  <View style={styles.table}>
                    {/* Header Row */}
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.tableHeaderCell, { width: labelWidth }]}>Metric</Text>
                      {scenarios.map((s) => (
                        <Text key={s.name} style={[styles.tableHeaderCell, { width: valueWidth, textAlign: 'right' }]}>{s.name}</Text>
                      ))}
                    </View>
                    {/* Data Rows */}
                    {metricKeys.map((varId, i) => {
                      const firstMetric = scenarios[0].metrics[varId];
                      const values = scenarios.map((s) => s.metrics[varId]?.value ?? 0);
                      const bestValue = Math.max(...values);
                      const uniqueBest = values.filter((v) => v === bestValue).length === 1;

                      return (
                        <View key={varId} style={i % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                          <Text style={[styles.tableCellBold, { width: labelWidth }]}>{firstMetric.label}</Text>
                          {scenarios.map((s) => {
                            const m = s.metrics[varId];
                            const isBest = uniqueBest && m.value === bestValue;
                            return (
                              <Text
                                key={s.name}
                                style={[
                                  isBest ? styles.tableCellBold : styles.tableCell,
                                  { width: valueWidth, textAlign: 'right' },
                                  isBest ? { color: '#16a34a' } : {},
                                ]}
                              >
                                {fmtVal(m.value, m.unit)}
                              </Text>
                            );
                          })}
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Single scenario - just show summary without table */}
              {!hasMultiple && scenarios.length === 1 && (
                <View>
                  <SubsectionTitle>Scenario Metrics</SubsectionTitle>
                  <View style={styles.statCardRow}>
                    {metricKeys.slice(0, 4).map((varId) => {
                      const m = scenarios[0].metrics[varId];
                      return (
                        <StatCard key={varId} label={m.label} value={fmtVal(m.value, m.unit)} />
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Recommendation */}
              {recommendationText && (
                <View style={[styles.infoCard, { borderLeftWidth: 3, borderLeftColor: '#16a34a', marginTop: 8 }]}>
                  <Text style={[styles.bodyText, { fontFamily: 'Helvetica-Bold', color: '#166534' }]}>
                    {recommendationText}
                  </Text>
                </View>
              )}
            </View>
          </SectionPage>
        );
      })()}
    </Document>
  );
}
