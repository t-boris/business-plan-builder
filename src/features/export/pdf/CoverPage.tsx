import { Page, View, Text } from '@react-pdf/renderer';
import { styles } from './pdfStyles';
import { PageFooter } from './PageFooter';

interface CoverPageProps {
  scenarioName: string;
  date: string;
  monthlyRevenue: number;
  annualRevenue: number;
  profitMargin: number;
  monthlyBookings: number;
}

function formatCurrency(value: number): string {
  return '$' + Math.round(value).toLocaleString('en-US');
}

export function CoverPage({
  scenarioName,
  date,
  monthlyRevenue,
  annualRevenue,
  profitMargin,
  monthlyBookings,
}: CoverPageProps) {
  return (
    <Page size="A4" style={styles.coverPage}>
      <Text style={styles.coverTitle}>Fun Box</Text>
      <View style={styles.coverAccentLine} />
      <Text style={styles.coverSubtitle}>Business Plan</Text>
      <Text style={styles.coverDate}>Generated {date}</Text>
      <Text style={styles.coverScenario}>Based on: {scenarioName}</Text>

      <View style={styles.coverMetricsRow}>
        <View style={styles.coverMetricCard}>
          <Text style={styles.coverMetricLabel}>Monthly Revenue</Text>
          <Text style={styles.coverMetricValue}>{formatCurrency(monthlyRevenue)}</Text>
        </View>
        <View style={styles.coverMetricCard}>
          <Text style={styles.coverMetricLabel}>Annual Revenue</Text>
          <Text style={styles.coverMetricValue}>{formatCurrency(annualRevenue)}</Text>
        </View>
        <View style={styles.coverMetricCard}>
          <Text style={styles.coverMetricLabel}>Profit Margin</Text>
          <Text style={styles.coverMetricValue}>{(profitMargin * 100).toFixed(1)}%</Text>
        </View>
        <View style={styles.coverMetricCard}>
          <Text style={styles.coverMetricLabel}>Monthly Bookings</Text>
          <Text style={styles.coverMetricValue}>{monthlyBookings}</Text>
        </View>
      </View>

      <PageFooter />
    </Page>
  );
}
