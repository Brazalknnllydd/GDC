import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts, textRoles } from '../../constants/theme';
import { formatDrawerStatus, formatPaymentMethod } from '../../lib/cashier-formatters';
import { formatPeso } from '../../lib/product-utils';

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
  return (
    <View style={styles.card}>
      <Text style={styles.title}>PAYMENT BREAKDOWN</Text>

      <View style={styles.breakdownRow}>
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

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Reported Sales</Text>
        <Text style={styles.totalValue}>{formatPeso(totalReportedSales)}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Drawer Reconciliation</Text>
        <Text style={styles.balanceValue}>{formatDrawerStatus(drawerVariance)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CED3E3',
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  title: {
    color: '#303546',
    fontFamily: fonts.medium,
    fontSize: 12,
    letterSpacing: 2.5,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  breakdownRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
    minHeight: 64,
  },
  breakdownItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: 82,
  },
  breakdownValue: {
    color: '#202636',
    ...textRoles.value,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  breakdownLabel: {
    color: '#626B7E',
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  emptyText: {
    color: '#697285',
    fontFamily: fonts.regular,
    fontSize: 13,
    textAlign: 'center',
    width: '100%',
  },
  divider: {
    backgroundColor: '#E3E7F1',
    height: 1,
    marginVertical: spacing.xl,
  },
  totalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  totalLabel: {
    color: '#303546',
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  totalValue: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: 15,
  },
  balanceValue: {
    color: '#16A34A',
    ...textRoles.value,
    fontSize: 15,
  },
});
