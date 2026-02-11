import type { ReactNode } from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { styles } from './pdfStyles';
import { PageFooter } from './PageFooter';

interface SectionPageProps {
  number: number;
  title: string;
  children: ReactNode;
}

export function SectionPage({ number, title, children }: SectionPageProps) {
  return (
    <Page size="A4" style={styles.page} bookmark={`${number}. ${title}`}>
      <Text style={styles.sectionHeader}>
        <Text style={styles.sectionNumber}>{number}. </Text>
        {title}
      </Text>
      <View>{children}</View>
      <PageFooter />
    </Page>
  );
}
