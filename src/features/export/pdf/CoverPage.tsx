import { Page, View, Text } from '@react-pdf/renderer';
import { styles } from './pdfStyles';
import { PageFooter } from './PageFooter';

interface CoverPageProps {
  scenarioName: string;
  date: string;
  businessName: string;
  currencyCode: string;
  topMetrics: Array<{ label: string; value: string }>;
  translatedLanguageName?: string | null;
}

export function CoverPage({
  scenarioName,
  date,
  businessName,
  topMetrics,
  translatedLanguageName,
}: CoverPageProps) {
  return (
    <Page size="A4" style={styles.coverPage}>
      <Text style={styles.coverTitle}>{businessName || 'Business Plan'}</Text>
      <View style={styles.coverAccentLine} />
      <Text style={styles.coverSubtitle}>Business Plan</Text>
      {translatedLanguageName && (
        <Text style={{ fontSize: 10, color: '#6b7280', marginTop: 4, textAlign: 'center' }}>
          (Translated to {translatedLanguageName})
        </Text>
      )}
      <Text style={styles.coverDate}>Generated {date}</Text>
      <Text style={styles.coverScenario}>Based on: {scenarioName}</Text>

      <View style={styles.coverMetricsRow}>
        {topMetrics.map((metric, i) => (
          <View key={i} style={styles.coverMetricCard}>
            <Text style={styles.coverMetricLabel}>{metric.label}</Text>
            <Text style={styles.coverMetricValue}>{metric.value}</Text>
          </View>
        ))}
      </View>

      <PageFooter />
    </Page>
  );
}
