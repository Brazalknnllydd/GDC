import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Download } from 'lucide-react-native';

import type { CashierDashboardResponse } from './cashier-screen-data';
import { cashierPerformanceCards } from './cashier-screen-data';
import { CashierPaymentBreakdownCard } from './cashier-payment-breakdown-card';
import { CashierPerformanceCard } from './cashier-performance-card';
import { CashierShiftCard } from './cashier-shift-card';
import { AppButton } from '../ui/app-button';
import { PaginationControls } from '../ui/pagination-controls';
import { SectionHeading } from '../ui/section-heading';
import { SurfaceCard } from '../ui/surface-card';
import { spacing, radius } from '../../constants/design-system';
import { colors, fonts, textSizes } from '../../constants/theme';
import { formatPeso } from '../../lib/product-utils';
import { formatCashierTime, formatPaymentMethod } from '../../lib/cashier-formatters';
import { useResponsiveLayout } from '../../hooks/use-responsive-layout';

const phoneColumns = {
  cashier: 132,
  change: 96,
  customer: 140,
  method: 112,
  receipt: 136,
  time: 148,
  total: 104,
};
const tabletColumns = {
  cashier: 150,
  change: 110,
  customer: 160,
  method: 120,
  receipt: 154,
  time: 172,
  total: 120,
};

type CashierHistorySectionProps = {
  dashboard: CashierDashboardResponse;
  isExportingDailyReport?: boolean;
  onExportDailyReport?: () => void;
  onSelectSale?: (sale: any) => void;
};

export function CashierHistorySection({
  dashboard,
  isExportingDailyReport = false,
  onExportDailyReport,
  onSelectSale,
}: CashierHistorySectionProps) {
  const { isTablet } = useResponsiveLayout();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const columns = isTablet ? tabletColumns : phoneColumns;
  const tableWidth = Object.values(columns).reduce((sum, width) => sum + width, 0);

  const totalPages = Math.ceil(dashboard.recentSales.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSales = dashboard.recentSales.slice(startIndex, startIndex + itemsPerPage);

  return (
    <>
      {dashboard.currentShift ? (
        <CashierShiftCard
          startedAt={dashboard.currentShift.startedAt}
          status={dashboard.currentShift.status}
          openingCash={dashboard.currentShift.openingCash}
          expectedCashOnHand={dashboard.currentShift.expectedCashOnHand}
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

      <SurfaceCard style={[styles.exportCard, isTablet && styles.exportCardTablet]}>
        <View style={styles.exportTextBlock}>
          <Text style={styles.exportTitle}>Daily cashier PDF</Text>
          <Text style={styles.exportSubtitle}>
            {"Export today's sales and the current remaining product inventory."}
          </Text>
        </View>
        <AppButton
          fullWidth={!isTablet}
          icon={Download}
          label="Export PDF"
          loading={isExportingDailyReport}
          onPress={onExportDailyReport}
          size="md"
          style={isTablet ? styles.exportButtonTablet : undefined}
          variant="primary"
        />
      </SurfaceCard>

      <SectionHeading style={styles.sectionHeaderLabel}>{"TODAY'S RECENT SALES"}</SectionHeading>

      <SurfaceCard style={styles.recentSalesCard}>
        {/* Table Header */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          contentContainerStyle={styles.tableScroller}
        >
          <View style={[styles.tableContent, { minWidth: tableWidth }]}>
            <View style={[styles.tableHeader, isTablet && styles.tableHeaderTablet]}>
              <Text style={[styles.headerCell, isTablet && styles.headerCellTablet, { width: columns.receipt }]}>RECEIPT</Text>
              <Text style={[styles.headerCell, isTablet && styles.headerCellTablet, { width: columns.time }]}>DATE/TIME</Text>
              <Text style={[styles.headerCell, isTablet && styles.headerCellTablet, { width: columns.cashier }]}>CASHIER</Text>
              <Text style={[styles.headerCell, isTablet && styles.headerCellTablet, { width: columns.customer }]}>CUSTOMER</Text>
              <Text style={[styles.headerCell, isTablet && styles.headerCellTablet, { width: columns.method }]}>METHOD</Text>
              <Text style={[styles.headerCell, isTablet && styles.headerCellTablet, styles.amountCell, { width: columns.change }]}>CHANGE</Text>
              <Text style={[styles.headerCell, isTablet && styles.headerCellTablet, styles.amountCell, { width: columns.total }]}>TOTAL</Text>
            </View>

            {/* Table Rows */}
            {paginatedSales.length > 0 ? (
              paginatedSales.map((sale, index) => (
                <TouchableOpacity
                  key={sale.id}
                  style={[
                    styles.tableRow,
                    isTablet && styles.tableRowTablet,
                    index === paginatedSales.length - 1 && styles.tableRowLast,
                  ]}
                  onPress={() => onSelectSale?.(sale)}
                  activeOpacity={0.7}
                >
                  <Text numberOfLines={2} style={[styles.rowCell, styles.receiptText, isTablet && styles.rowCellTablet, { width: columns.receipt }]}>
                    #{sale.receiptNumber}
                  </Text>
                  <Text style={[styles.rowCell, styles.timeText, isTablet && styles.rowCellTablet, { width: columns.time }]}>
                    {new Date(sale.time).toLocaleDateString()} {formatCashierTime(new Date(sale.time))}
                  </Text>
                  <Text style={[styles.rowCell, styles.timeText, isTablet && styles.rowCellTablet, { width: columns.cashier }]} numberOfLines={1}>
                    {sale.cashierName}
                  </Text>
                  <Text style={[styles.rowCell, styles.timeText, isTablet && styles.rowCellTablet, { width: columns.customer }]} numberOfLines={1}>
                    {sale.saleType === 'INTERNAL_CASHIER'
                      ? sale.recipientCashierName || 'Cashier'
                      : sale.customerName || 'Walk-in'}
                  </Text>
                  <Text style={[styles.rowCell, styles.methodText, isTablet && styles.rowCellTablet, { color: sale.status === 'pending' || sale.status === 'voided' ? colors.danger : colors.textSecondary, width: columns.method }]}>
                    {formatPaymentMethod(sale.paymentMethod)}
                    {sale.saleType === 'INTERNAL_CASHIER' ? '\n(Internal)' : ''}
                    {sale.status === 'pending' ? '\n(Pending)' : ''}
                    {sale.status === 'voided' ? '\n(Voided)' : ''}
                  </Text>
                  <Text style={[styles.rowCell, styles.timeText, isTablet && styles.rowCellTablet, styles.amountCell, { width: columns.change }]}>
                    {formatPeso(sale.changeAmount || 0)}
                  </Text>
                  <Text style={[styles.rowCell, styles.totalText, isTablet && styles.rowCellTablet, styles.amountCell, { color: sale.status === 'voided' ? colors.textTertiary : colors.secondary, textDecorationLine: sale.status === 'voided' ? 'line-through' : 'none', width: columns.total }]}>
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
        expenses={dashboard.totals.expenses}
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
  exportCard: {
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  exportCardTablet: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exportTextBlock: {
    flex: 1,
  },
  exportTitle: {
    color: colors.textStrong,
    fontFamily: fonts.bold,
    fontSize: textSizes.title,
  },
  exportSubtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  exportButtonTablet: {
    minWidth: 156,
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
  tableScroller: {
    flexGrow: 1,
  },
  tableContent: {
    width: '100%',
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
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  tableHeaderTablet: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  headerCell: {
    fontFamily: fonts.bold,
    fontSize: textSizes.xsmall,
    color: colors.textSecondary,
    letterSpacing: 0.7,
    paddingRight: spacing.md,
  },
  headerCellTablet: {
    fontSize: textSizes.small,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 1,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  tableRowTablet: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  rowCell: {
    fontSize: textSizes.body,
    fontFamily: fonts.regular,
    color: colors.textStrong,
    paddingRight: spacing.md,
  },
  rowCellTablet: {
    fontSize: textSizes.bodyLarge,
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
  amountCell: {
    textAlign: 'right',
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
