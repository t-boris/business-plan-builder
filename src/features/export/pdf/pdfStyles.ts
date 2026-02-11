import { StyleSheet } from '@react-pdf/renderer';

// Color palette
const COLORS = {
  primary: '#2563eb',
  primaryLight: '#dbeafe',
  text: '#1f2937',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  bg: '#f9fafb',
  green: '#16a34a',
  red: '#dc2626',
  amber: '#d97706',
} as const;

export const styles = StyleSheet.create({
  // Page
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: COLORS.text,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 50,
  },

  // Cover page
  coverPage: {
    fontFamily: 'Helvetica',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  coverAccentLine: {
    width: 60,
    height: 3,
    backgroundColor: COLORS.primary,
    marginVertical: 20,
  },
  coverTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 36,
    color: COLORS.primary,
    marginBottom: 4,
  },
  coverSubtitle: {
    fontFamily: 'Helvetica',
    fontSize: 20,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  coverDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  coverScenario: {
    fontSize: 10,
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 4,
  },
  coverMetricsRow: {
    flexDirection: 'row',
    marginTop: 40,
    gap: 12,
  },
  coverMetricCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 12,
    width: 110,
    alignItems: 'center',
  },
  coverMetricLabel: {
    fontSize: 8,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  coverMetricValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    color: COLORS.text,
  },

  // Section headers
  sectionHeader: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionNumber: {
    color: COLORS.textMuted,
  },
  subsectionHeader: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },

  // Body text
  bodyText: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 6,
  },
  smallText: {
    fontSize: 8,
    color: COLORS.textMuted,
  },

  // Lists
  listItem: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  listBullet: {
    width: 12,
    fontSize: 10,
  },
  listText: {
    fontSize: 10,
    flex: 1,
    lineHeight: 1.4,
  },

  // Tables
  table: {
    marginBottom: 8,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    backgroundColor: '#fafafa',
  },
  tableHeaderCell: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: COLORS.textMuted,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableCell: {
    fontSize: 9,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableCellBold: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableCellRight: {
    fontSize: 9,
    paddingVertical: 4,
    paddingHorizontal: 6,
    textAlign: 'right',
  },

  // Stat cards
  statCardRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 7,
    color: COLORS.textMuted,
    marginBottom: 3,
  },
  statValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
  },

  // Info cards (risk, channel, etc.)
  infoCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 10,
    marginBottom: 6,
  },
  infoCardTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    marginBottom: 3,
  },

  // Badges
  badge: {
    fontSize: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    fontFamily: 'Helvetica-Bold',
  },
  badgeHigh: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  badgeMedium: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  badgeLow: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  badgeBlue: {
    backgroundColor: COLORS.primaryLight,
    color: '#1e40af',
  },

  // Chart image
  chartImage: {
    width: '100%',
    height: 200,
    marginVertical: 8,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 8,
    color: COLORS.textMuted,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingTop: 6,
  },

  // Empty state
  emptyText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    paddingVertical: 8,
  },

  // Row helpers
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  col2: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  flex1: {
    flex: 1,
  },

  // Grid items
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    paddingVertical: 3,
  },
  gridLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  gridValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
});

export { COLORS };
