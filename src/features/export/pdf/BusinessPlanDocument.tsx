import { Document, View, Text, Image } from '@react-pdf/renderer';
import { styles } from './pdfStyles';
import { CoverPage } from './CoverPage';
import { SectionPage } from './SectionPage';
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
} from '@/types';

// ---- Helpers ----

function formatCurrency(value: number): string {
  return '$' + Math.round(value).toLocaleString('en-US');
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
  high: 'badgeHigh',
  medium: 'badgeMedium',
  low: 'badgeLow',
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
  scenarioName: string;
  scenarioMetrics: {
    monthlyRevenue: number;
    monthlyProfit: number;
    profitMargin: number;
    monthlyBookings: number;
    annualRevenue: number;
  };
  chartImage: string | null;
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
  scenarioName,
  scenarioMetrics,
  chartImage,
}: BusinessPlanDocumentProps) {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document title="Fun Box Business Plan" author="Fun Box" subject="Business Plan">
      {/* Cover Page */}
      <CoverPage
        scenarioName={scenarioName}
        date={date}
        monthlyRevenue={scenarioMetrics.monthlyRevenue}
        annualRevenue={scenarioMetrics.annualRevenue}
        profitMargin={scenarioMetrics.profitMargin}
        monthlyBookings={scenarioMetrics.monthlyBookings}
      />

      {/* Section 1: Executive Summary */}
      <SectionPage number={1} title="Executive Summary">
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

      {/* Section 2: Market Analysis */}
      <SectionPage number={2} title="Market Analysis">
        {marketAnalysis ? (
          <View>
            <View style={styles.col2}>
              <View style={styles.flex1}>
                <SubsectionTitle>Target Demographic</SubsectionTitle>
                <Text style={styles.bodyText}>Age: {marketAnalysis.targetDemographic.ageRange}</Text>
                <Text style={styles.bodyText}>Location: {marketAnalysis.targetDemographic.location} ({marketAnalysis.targetDemographic.radius} mi)</Text>
              </View>
              <View style={styles.flex1}>
                <SubsectionTitle>Market Size</SubsectionTitle>
                <Text style={styles.bodyText}>{marketAnalysis.marketSize}</Text>
              </View>
            </View>

            {marketAnalysis.competitors.length > 0 && (
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

            <SubsectionTitle>Demographics</SubsectionTitle>
            <Text style={styles.bodyText}>Population: {marketAnalysis.demographics.population.toLocaleString()}</Text>
            <Text style={styles.bodyText}>Languages: {marketAnalysis.demographics.languages.join(', ')}</Text>
            <Text style={styles.bodyText}>Income: {marketAnalysis.demographics.income}</Text>
          </View>
        ) : (
          <EmptyState section="Market Analysis" />
        )}
      </SectionPage>

      {/* Section 3: Product & Service */}
      <SectionPage number={3} title="Product & Service">
        {productService ? (
          <View>
            <SubsectionTitle>Packages</SubsectionTitle>
            {productService.packages.map((pkg, i) => (
              <View key={i} style={styles.infoCard}>
                <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }]}>
                  <Text style={styles.infoCardTitle}>{pkg.name}</Text>
                  <Text style={[styles.statValue, { color: '#2563eb', fontSize: 12 }]}>{formatCurrency(pkg.price)}</Text>
                </View>
                <Text style={styles.smallText}>{pkg.duration} | Up to {pkg.maxParticipants} guests</Text>
                <Text style={[styles.bodyText, { marginTop: 4 }]}>{pkg.description}</Text>
                <BulletList items={pkg.includes} />
              </View>
            ))}

            {productService.addOns.length > 0 && (
              <View>
                <SubsectionTitle>Add-Ons</SubsectionTitle>
                {productService.addOns.map((a, i) => (
                  <Text key={i} style={styles.bodyText}>{a.name} -- {formatCurrency(a.price)}</Text>
                ))}
              </View>
            )}
          </View>
        ) : (
          <EmptyState section="Product & Service" />
        )}
      </SectionPage>

      {/* Section 4: Marketing Strategy */}
      <SectionPage number={4} title="Marketing Strategy">
        {marketingStrategy ? (
          <View>
            <SubsectionTitle>Channels</SubsectionTitle>
            {marketingStrategy.channels.map((ch, i) => (
              <View key={i} style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>{CHANNEL_NAMES[ch.name] || ch.name}</Text>
                <View style={[styles.row, { marginBottom: 4 }]}>
                  <Text style={styles.smallText}>Budget: {formatCurrency(ch.budget)}/mo</Text>
                  <Text style={styles.smallText}>  Leads: {ch.expectedLeads}</Text>
                  <Text style={styles.smallText}>  CAC: {formatCurrency(ch.expectedCAC)}</Text>
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

      {/* Section 5: Operations */}
      <SectionPage number={5} title="Operations">
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
                      <Text style={[styles.tableCellRight, { width: '25%' }]}>${m.hourlyRate}/hr</Text>
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

      {/* Section 6: Financial Projections */}
      <SectionPage number={6} title="Financial Projections">
        {financials ? (
          <View>
            <SubsectionTitle>{`Key Metrics (${scenarioName})`}</SubsectionTitle>
            <View style={styles.statCardRow}>
              <StatCard label="Monthly Revenue" value={formatCurrency(scenarioMetrics.monthlyRevenue)} color="#16a34a" />
              <StatCard label="Monthly Profit" value={formatCurrency(scenarioMetrics.monthlyProfit)} color={scenarioMetrics.monthlyProfit >= 0 ? '#16a34a' : '#dc2626'} />
              <StatCard label="Profit Margin" value={`${(scenarioMetrics.profitMargin * 100).toFixed(1)}%`} color={scenarioMetrics.profitMargin >= 0 ? '#16a34a' : '#dc2626'} />
              <StatCard label="Bookings/Mo" value={String(scenarioMetrics.monthlyBookings)} />
            </View>

            <SubsectionTitle>Unit Economics</SubsectionTitle>
            <View style={styles.statCardRow}>
              <StatCard label="Avg Check" value={formatCurrency(financials.unitEconomics.avgCheck)} />
              <StatCard label="Cost/Event" value={formatCurrency(financials.unitEconomics.costPerEvent)} />
              <StatCard label="Profit/Event" value={formatCurrency(financials.unitEconomics.profitPerEvent)} />
              <StatCard label="Break-Even" value={`${financials.unitEconomics.breakEvenEvents} events`} />
            </View>

            {/* Chart Image */}
            {chartImage && (
              <View>
                <SubsectionTitle>Revenue vs Costs (12-Month Projection)</SubsectionTitle>
                <Image style={styles.chartImage} src={chartImage} />
              </View>
            )}

            {/* Monthly P&L Table */}
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
                    <Text style={[styles.tableCellRight, { width: '23%' }]}>{formatCurrency(m.revenue)}</Text>
                    <Text style={[styles.tableCellRight, { width: '23%' }]}>{formatCurrency(totalCosts)}</Text>
                    <Text style={[styles.tableCellRight, { width: '24%', color: profit >= 0 ? '#16a34a' : '#dc2626', fontFamily: 'Helvetica-Bold' }]}>
                      {formatCurrency(profit)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <EmptyState section="Financial Projections" />
        )}
      </SectionPage>

      {/* Section 7: Risks & Due Diligence */}
      <SectionPage number={7} title="Risks & Due Diligence">
        {risks ? (
          <View>
            {risks.risks.length > 0 ? (
              <View>
                <SubsectionTitle>Risk Assessment</SubsectionTitle>
                {risks.risks.map((risk, i) => (
                  <View key={i} style={styles.infoCard}>
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

      {/* Section 8: KPIs & Metrics */}
      <SectionPage number={8} title="KPIs & Metrics">
        {kpis ? (
          <View>
            <SubsectionTitle>Target Metrics</SubsectionTitle>
            <View style={styles.statCardRow}>
              <StatCard label="Monthly Leads" value={String(kpis.targets.monthlyLeads)} />
              <StatCard label="Conversion Rate" value={`${(kpis.targets.conversionRate * 100).toFixed(0)}%`} />
              <StatCard label="Average Check" value={formatCurrency(kpis.targets.avgCheck)} />
            </View>
            <View style={styles.statCardRow}>
              <StatCard label="CAC/Lead" value={formatCurrency(kpis.targets.cacPerLead)} />
              <StatCard label="CAC/Booking" value={formatCurrency(kpis.targets.cacPerBooking)} />
              <StatCard label="Monthly Bookings" value={String(kpis.targets.monthlyBookings)} />
            </View>
          </View>
        ) : (
          <EmptyState section="KPIs & Metrics" />
        )}
      </SectionPage>

      {/* Section 9: Launch Plan */}
      <SectionPage number={9} title="Launch Plan">
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
    </Document>
  );
}
