import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts, textRoles, textSizes } from '../../constants/theme';
import { useResponsiveLayout } from '../../hooks/use-responsive-layout';
import { formatDrawerStatus, formatPaymentMethod } from '../../lib/cashier-formatters';
import { formatPeso } from '../../lib/product-utils';
import { SurfaceCard } from '../ui/surface-card';

type PaymentBreakdownEntry = {
  method: string;
  total: number;
};

type CashierPaymentBreakdownCardProps = {
  drawerVariance: number;
  paymentBreakdown: PaymentBreakdownEntry[];
  totalReportedSales: number;
};

export function CashierPaymentBreakdownCard({
  drawerVariance,
  paymentBreakdown,
  totalReportedSales,
}: CashierPaymentBreakdownCardProps) {
  const { compactPhone } = useResponsiveLayout();

  return (
    <SurfaceCard style={[styles.card, compactPhone && styles.cardCompact]}>
      <Text style={[styles.title, compactPhone && styles.titleCompact]}>PAYMENT BREAKDOWN</Text>

      <View style={[styles.breakdownRow, compactPhone && styles.breakdownRowCompact]}>
        {paymentBreakdown.length > 0 ? (
          paymentBreakdown.map((entry) => (
            <View key={entry.method} style={styles.breakdownItem}>
              <Text style={styles.breakdownValue}>{formatPeso(entry.total)}</Text>
              <Text style={styles.breakdownLabel}>{formatPaymentMethod(entry.method)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No payments recorded for today yet.</Text>
        )}
      </View>

      <View style={styles.divider} />

      <View style={[styles.totalRow, compactPhone && styles.totalRowCompact]}>
        <Text style={styles.totalLabel}>Total Reported Sales</Text>
        <Text style={styles.totalValue}>{formatPeso(totalReportedSales)}</Text>
      </View>
      <View style={[styles.totalRow, compactPhone && styles.totalRowCompact]}>
        <Text style={styles.totalLabel}>Drawer Reconciliation</Text>
        <Text style={styles.balanceValue}>{formatDrawerStatus(drawerVariance)}</Text>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  cardCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  title: {
    color: colors.textHeading,
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
    letterSpacing: 2.5,
    marginBottom: spacing.xl,
    textAlign: 'left',
  },
  titleCompact: {
    letterSpacing: 1.4,
    marginBottom: spacing.lg,
  },
  breakdownRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'flex-start',
    minHeight: 64,
  },
  breakdownRowCompact: {
    justifyContent: 'flex-start',
  },
  breakdownItem: {
    alignItems: 'flex-start',
    flex: 1,
    minWidth: 82,
  },
  breakdownValue: {
    color: colors.textDark,
    ...textRoles.value,
    fontSize: textSizes.body,
    marginBottom: spacing.sm,
  },
  breakdownLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
  },
  emptyText: {
    color: colors.textTertiary,
    fontFamily: fonts.regular,
    fontSize: textSizes.small + 1,
    textAlign: 'left',
    width: '100%',
  },
  divider: {
    backgroundColor: colors.divider,
    height: 1,
    marginVertical: spacing.xl,
  },
  totalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  totalRowCompact: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  totalLabel: {
    color: colors.textHeading,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
  },
  totalValue: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: textSizes.bodyLarge,
  },
  balanceValue: {
    color: colors.successBright,
    ...textRoles.value,
    fontSize: textSizes.bodyLarge,
  },
});
