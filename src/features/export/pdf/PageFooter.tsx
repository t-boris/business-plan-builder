import { Text, View } from '@react-pdf/renderer';
import { styles } from './pdfStyles';

export function PageFooter() {
  return (
    <View style={styles.footer} fixed>
      <Text>Fun Box Business Plan</Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}
