import { StyleSheet, Text, View } from 'react-native';

import type { CashierDashboardResponse } from './cashier-screen-data';
import { cashierPerformanceCards } from './cashier-screen-data';
import { CashierPaymentBreakdownCard } from './cashier-payment-breakdown-card';
import { CashierPerformanceCard } from './cashier-performance-card';
import { CashierRecentSaleItem } from './cashier-recent-sale-item';
import { CashierShiftCard } from './cashier-shift-card';
import { SectionHeading } from '../ui/section-heading';
import { SurfaceCard } from '../ui/surface-card';
import { spacing } from '../../constants/design-system';
import { colors, fonts, textSizes } from '../../constants/theme';
import { formatPeso } from '../../lib/product-utils';

type CashierHistorySectionProps = {
  dashboard: CashierDashboardResponse;
};

export function CashierHistorySection({ dashboard }: CashierHistorySectionProps) {
  return (
    <>
      {dashboard.currentShift ? (
        <CashierShiftCard
          startedAt={dashboard.currentShift.startedAt}
          status={dashboard.currentShift.status}
        />
      ) : null}

      <SectionHeading style={styles.sectionLabel}>PERFORMANCE TODAY</SectionHeading>
      <View style={styles.performanceGrid}>
        {cashierPerformanceCards.map((card) => (
          <CashierPerformanceCard
            key={card.key}
            icon={card.icon}
            label={card.label}
            value={
              card.key === 'salesToday'
                ? formatPeso(dashboard.performance.salesToday)
                : String(dashboard.performance[card.key])
            }
          />
        ))}
      </View>

      <SectionHeading style={styles.sectionHeaderLabel}>TODAY'S RECENT SALES</SectionHeading>

      <SurfaceCard style={styles.recentSalesCard}>
        {dashboard.recentSales.length > 0 ? (
          dashboard.recentSales.map((sale) => (
            <CashierRecentSaleItem
              key={sale.id}
              paymentMethod={sale.paymentMethod}
              receiptNumber={sale.receiptNumber}
              time={sale.time}
              totalAmount={sale.totalAmount}
            />
          ))
        ) : (
          <Text style={styles.emptySalesText}>No sales recorded for this cashier today.</Text>
        )}
      </SurfaceCard>

      <CashierPaymentBreakdownCard
        drawerVariance={dashboard.totals.drawerVariance}
        paymentBreakdown={dashboard.paymentBreakdown}
        totalReportedSales={dashboard.totals.totalReportedSales}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    marginBottom: spacing.lg,
    marginTop: spacing.section,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  sectionHeaderLabel: {
    marginBottom: spacing.lg,
    marginTop: spacing.section,
  },
  recentSalesCard: {
    marginBottom: spacing.section,
    overflow: 'hidden',
    paddingVertical: spacing.sm,
  },
  emptySalesText: {
    color: colors.textTertiary,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    textAlign: 'left',
  },
});
