import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import type { CashierDashboardResponse } from './cashier-screen-data';
import { cashierPerformanceCards } from './cashier-screen-data';
import { CashierPaymentBreakdownCard } from './cashier-payment-breakdown-card';
import { CashierPerformanceCard } from './cashier-performance-card';
import { CashierShiftCard } from './cashier-shift-card';
import { PaginationControls } from '../ui/pagination-controls';
import { SectionHeading } from '../ui/section-heading';
import { SurfaceCard } from '../ui/surface-card';
import { spacing, radius } from '../../constants/design-system';
import { colors, fonts, textSizes } from '../../constants/theme';
import { formatPeso } from '../../lib/product-utils';
import { formatCashierTime, formatPaymentMethod } from '../../lib/cashier-formatters';
import { apiClient } from '../../lib/api';
import { useCashierStore } from '../../store/cashier-store';

type CashierHistorySectionProps = {
  dashboard: CashierDashboardResponse;
  onEditOpeningCash?: () => void;
  onSelectSale?: (sale: any) => void;
};

export function CashierHistorySection({
  dashboard,
  onEditOpeningCash,
  onSelectSale,
}: CashierHistorySectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [payingSaleId, setPayingSaleId] = useState<number | null>(null);
  const { loadWorkspace, setToast } = useCashierStore();
  const itemsPerPage = 15;

  const totalPages = Math.ceil(dashboard.recentSales.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSales = dashboard.recentSales.slice(startIndex, startIndex + itemsPerPage);

  const handleMarkAsPaid = async (saleId: number) => {
    try {
      setPayingSaleId(saleId);
      await apiClient.patch(`/sales/${saleId}/pay`);
      await loadWorkspace();
      setToast({ message: 'Sale marked as paid', type: 'success' });
    } catch (error) {
      console.error('Failed to mark sale as paid', error);
      setToast({ message: 'Failed to mark sale as paid', type: 'error' });
    } finally {
      setPayingSaleId(null);
    }
  };

  return (
    <>
      {dashboard.currentShift ? (
        <CashierShiftCard
          startedAt={dashboard.currentShift.startedAt}
          status={dashboard.currentShift.status}
          openingCash={dashboard.currentShift.openingCash}
          expectedCashOnHand={dashboard.currentShift.expectedCashOnHand}
          onEditOpeningCash={onEditOpeningCash}
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
        {/* Table Header */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ minWidth: 900, flex: 1 }}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { flex: 1.5 }]}>RECEIPT</Text>
              <Text style={[styles.headerCell, { flex: 1.5 }]}>DATE/TIME</Text>
              <Text style={[styles.headerCell, { flex: 1.5 }]}>CASHIER</Text>
              <Text style={[styles.headerCell, { flex: 1.5 }]}>CUSTOMER</Text>
              <Text style={[styles.headerCell, { flex: 1 }]}>METHOD</Text>
              <Text style={[styles.headerCell, { flex: 1, textAlign: 'right' }]}>CHANGE</Text>
              <Text style={[styles.headerCell, { flex: 1, textAlign: 'right' }]}>TOTAL</Text>
            </View>

            {/* Table Rows */}
            {paginatedSales.length > 0 ? (
              paginatedSales.map((sale, index) => (
                <TouchableOpacity
                  key={sale.id}
                  style={[
                    styles.tableRow,
                    index === paginatedSales.length - 1 && styles.tableRowLast,
                  ]}
                  onPress={() => onSelectSale?.(sale)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.rowCell, styles.receiptText, { flex: 1.5 }]}>
                    #{sale.receiptNumber}
                  </Text>
                  <Text style={[styles.rowCell, styles.timeText, { flex: 1.5 }]}>
                    {new Date(sale.time).toLocaleDateString()} {formatCashierTime(new Date(sale.time))}
                  </Text>
                  <Text style={[styles.rowCell, styles.timeText, { flex: 1.5 }]} numberOfLines={1}>
                    {sale.cashierName}
                  </Text>
                  <Text style={[styles.rowCell, styles.timeText, { flex: 1.5 }]} numberOfLines={1}>
                    {sale.customerName || 'Walk-in'}
                  </Text>
                  <Text style={[styles.rowCell, styles.methodText, { flex: 1, color: sale.status === 'pending' || sale.status === 'voided' ? colors.danger : colors.textSecondary }]}>
                    {formatPaymentMethod(sale.paymentMethod)}
                    {sale.status === 'pending' ? '\n(Pending)' : ''}
                    {sale.status === 'voided' ? '\n(Voided)' : ''}
                  </Text>
                  <Text style={[styles.rowCell, styles.timeText, { flex: 1, textAlign: 'right' }]}>
                    {formatPeso(sale.changeAmount || 0)}
                  </Text>
                  <Text style={[styles.rowCell, styles.totalText, { flex: 1, textAlign: 'right', color: sale.status === 'voided' ? colors.textTertiary : colors.secondary, textDecorationLine: sale.status === 'voided' ? 'line-through' : 'none' }]}>
                    {formatPeso(sale.totalAmount)}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptySalesText}>No sales recorded for this cashier today.</Text>
            )}
          </View>
        </ScrollView>

        {/* Pagination Footer */}
        <View style={{ paddingVertical: 16, paddingHorizontal: 24, borderTopWidth: 1, borderTopColor: colors.borderPanel, backgroundColor: colors.surfaceSoft }}>
          <PaginationControls
            borderless
            currentPage={currentPage - 1}
            onPageChange={(p) => setCurrentPage(p + 1)}
            totalPages={totalPages}
          />
        </View>
      </SurfaceCard>

      <CashierPaymentBreakdownCard
        drawerVariance={dashboard.totals.drawerVariance}
        paymentBreakdown={dashboard.paymentBreakdown}
        totalReportedSales={dashboard.totals.totalReportedSales}
        cashReceived={dashboard.totals.cashReceived}
        changeGiven={dashboard.totals.changeGiven}
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
    paddingVertical: 0,
  },
  emptySalesText: {
    color: colors.textTertiary,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    textAlign: 'left',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderPanel,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
  },
  headerCell: {
    fontFamily: fonts.bold,
    fontSize: textSizes.smallCaps,
    color: colors.textSecondary,
    letterSpacing: 1.2,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  rowCell: {
    fontSize: textSizes.body,
    fontFamily: fonts.regular,
    color: colors.textStrong,
  },
  receiptText: {
    fontFamily: fonts.bold,
    color: colors.textDark,
  },
  timeText: {
    color: colors.textSecondary,
  },
  methodText: {
    color: colors.textSecondary,
  },
  totalText: {
    fontFamily: fonts.bold,
    color: colors.secondary,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderPanel,
    backgroundColor: colors.surfaceSoft,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderPanel,
    backgroundColor: colors.card,
    gap: 4,
  },
  pageButtonDisabled: {
    opacity: 0.5,
    borderColor: colors.divider,
  },
  pageButtonText: {
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
    color: colors.secondary,
  },
  pageButtonTextDisabled: {
    color: colors.textTertiary,
  },
  pageInfoText: {
    fontFamily: fonts.regular,
    fontSize: textSizes.small,
    color: colors.textSecondary,
  },
  payButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    backgroundColor: `${colors.primary}20`,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  payButtonText: {
    fontFamily: fonts.medium,
    fontSize: textSizes.xsmall,
    color: colors.primary,
  },
});
