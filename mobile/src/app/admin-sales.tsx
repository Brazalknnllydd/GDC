import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, Download, QrCode, WalletCards } from 'lucide-react-native';

import {
  MonthRangePicker,
  type MonthRangeValue,
} from '../components/admin-sales/month-range-picker';
import { PaymentMethodCard } from '../components/admin-sales/payment-method-card';
import { exportSalesReport, type ExportFormat } from '../components/admin-sales/sales-report-export';
import { SalesHistorySection } from '../components/admin-sales/sales-history-section';
import { SalesSummaryCard } from '../components/admin-sales/sales-summary-card';
import type { HistoryFilter, SaleRecord } from '../components/admin-sales/sales-history-types';
import { TopProductRow } from '../components/admin-sales/top-product-row';
import { AdminBarChart } from '../components/ui/admin-bar-chart';
import { AppButton } from '../components/ui/app-button';
import { layout, radius, spacing } from '../constants/design-system';
import { AdminMetricGrid } from '../components/ui/admin-metric-grid';
import { AdminPageScreen } from '../components/ui/admin-page-screen';
import { SurfaceCard } from '../components/ui/surface-card';
import { colors, textRoles } from '../constants/theme';
import { useResponsiveLayout } from '../hooks/use-responsive-layout';
import { useRefreshHandler } from '../hooks/use-refresh-handler';
import { useSalesAnalytics } from '../hooks/use-sales-analytics';
import { apiClient } from '../lib/api';
import { formatPeso } from '../lib/product-utils';
import { tabs as productTabs, type Product } from '../components/admin-products/products-screen-data';
import {
  formatMonthRangeLabel,
} from '../components/admin-sales/sales-history-utils';

const emptySales: SaleRecord[] = [];
const emptyProducts: Product[] = [];



function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatExportDate(value: string) {
  return new Date(value).toLocaleString('en-PH', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminSalesScreen() {
  const { compactPhone, isTablet } = useResponsiveLayout();
  const [selectedHistoryFilter, setSelectedHistoryFilter] = useState<HistoryFilter>('All');
  const [selectedExportFormat, setSelectedExportFormat] = useState<ExportFormat>('excel');
  const [isExportVisible, setIsExportVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [screenError, setScreenError] = useState('');
  const [showOverviewMonthRangePicker, setShowOverviewMonthRangePicker] = useState(false);
  const [overviewCalendarYear, setOverviewCalendarYear] = useState(new Date().getFullYear());
  const [overviewMonthRange, setOverviewMonthRange] = useState<MonthRangeValue>(() => {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      endMonth: currentMonth,
      startMonth: currentMonth,
    };
  });
  const salesQuery = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const response = await apiClient.get<SaleRecord[]>('/sales');
      return response.data;
    },
  });
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await apiClient.get<Product[]>('/products');
      return response.data;
    },
  });

  const sales = salesQuery.data ?? emptySales;
  const products = productsQuery.data ?? emptyProducts;
  const queryError =
    (sales.length === 0 ? salesQuery.error?.message || '' : '') ||
    (products.length === 0 ? productsQuery.error?.message || '' : '');
  const displayError = queryError || screenError;
  const refreshSales = useCallback(
    () => Promise.all([salesQuery.refetch(), productsQuery.refetch()]),
    [productsQuery, salesQuery]
  );
  const { isRefreshing, onRefresh } = useRefreshHandler(refreshSales);
  const inventoryWorth = useMemo(
    () => products.reduce((sum, product) => sum + Number(product.price || 0) * product.stock, 0),
    [products]
  );

  const { chartBars, exportRows, paymentMethodCards, paymentSummary, topProducts, totals } =
    useSalesAnalytics({
      formatExportDate,
      overviewMonthRange,
      sales,
    });

  const paymentMethodIcons = {
    CASH: WalletCards,
    GCASH: QrCode,
  } as const;

  const displayDate = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    []
  );

  const salesTabs = productTabs.map((tab) =>
    tab.label === 'Sales'
      ? { ...tab, active: true, route: '/admin-sales' as const }
      : { ...tab, active: false }
  );

  async function handleExportReport() {
    try {
      setIsExporting(true);
      setScreenError('');

      await exportSalesReport({
        exportRows,
        format: selectedExportFormat,
        formatExportDate,
        overviewMonthRange,
        paymentSummary,
        topProducts,
        totals,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not export the report right now.';
      setScreenError(message);
      Alert.alert('Export failed', message);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <AdminPageScreen
      title="Sales"
      introDescription="Monitor transactions, revenue, and business performance"
      bottomNavItems={salesTabs}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      introChildren={
        <View style={styles.dateRow}>
          <CalendarDays color={colors.textTertiary} size={15} strokeWidth={1.9} />
          <Text style={styles.dateText}>{displayDate}</Text>
        </View>
      }>
      <SurfaceCard style={[styles.overviewFilterCard, compactPhone && styles.overviewFilterCardCompact]}>
        <View style={[styles.historyRangeHeader, compactPhone && styles.historyRangeHeaderCompact]}>
          <View style={styles.rangeTextBlock}>
            <Text style={styles.historyRangeLabel}>Overview Month Range</Text>
            <Text style={styles.historyRangeValue}>{formatMonthRangeLabel(overviewMonthRange)}</Text>
          </View>

          <Pressable
            onPress={() => setShowOverviewMonthRangePicker((current) => !current)}
            style={[styles.historyCalendarButton, compactPhone && styles.historyCalendarButtonCompact]}>
            <CalendarDays color={colors.secondary} size={16} strokeWidth={2} />
            <Text style={styles.historyCalendarButtonText}>
              {showOverviewMonthRangePicker ? 'Hide Calendar' : 'Choose Range'}
            </Text>
          </Pressable>
        </View>

        {showOverviewMonthRangePicker ? (
          <View>
            <MonthRangePicker
              displayYear={overviewCalendarYear}
              onChangeRange={setOverviewMonthRange}
              onChangeYear={setOverviewCalendarYear}
              range={overviewMonthRange}
            />

            <View style={[styles.historyRangeActions, compactPhone && styles.historyRangeActionsCompact]}>
              <Pressable
                onPress={() => {
                  const now = new Date();
                  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                  setOverviewMonthRange({
                    endMonth: currentMonth,
                    startMonth: currentMonth,
                  });
                  setOverviewCalendarYear(now.getFullYear());
                }}
                style={styles.historyRangeActionButton}>
                <Text style={styles.historyRangeActionText}>This Month</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  const now = new Date();
                  const startMonth = new Date(now.getFullYear(), 0, 1);
                  const endMonth = new Date(now.getFullYear(), 11, 1);
                  setOverviewMonthRange({
                    endMonth,
                    startMonth,
                  });
                  setOverviewCalendarYear(now.getFullYear());
                }}
                style={styles.historyRangeActionButton}>
                <Text style={styles.historyRangeActionText}>This Year</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </SurfaceCard>

      <AdminMetricGrid>
        <SalesSummaryCard title="TOTAL SALES" value={formatPeso(totals.totalSales)} detail={`${totals.transactions} transactions`} />
        <SalesSummaryCard title="PROFIT" value={formatPeso(totals.profit)} detail="Sales minus product cost" />
        <SalesSummaryCard title="INVENTORY WORTH" value={formatPeso(inventoryWorth)} detail="Current stock value" />
        <SalesSummaryCard title="AVG SALE" value={formatPeso(totals.averageSale)} detail="Average per sale" />
      </AdminMetricGrid>

      <SurfaceCard style={[styles.analyticsCard, compactPhone && styles.analyticsCardCompact]}>
        <View style={styles.analyticsHeader}>
          <View>
            <Text style={styles.analyticsTitle}>Revenue Analytics</Text>
            <Text style={styles.analyticsSubtitle}>Monthly view based on selected month range</Text>
            <Text style={styles.analyticsRangeLabel}>{formatMonthRangeLabel(overviewMonthRange)}</Text>
          </View>
        </View>

        <AdminBarChart
          emptyDescription="Select a month range that includes completed sales to populate the chart."
          emptyTitle="No revenue for this range"
          height={240}
          labels={chartBars.labels}
          values={chartBars.values}
        />
      </SurfaceCard>

      <View style={styles.paymentMethodsRow}>
        {paymentMethodCards.map((card) => (
          <PaymentMethodCard
            key={card.label}
            icon={paymentMethodIcons[card.label]}
            label={card.label}
            value={card.value}
          />
        ))}
      </View>

      <SurfaceCard style={styles.listCard}>
        <Text style={styles.cardHeading}>Top Selling Products</Text>
        <View style={styles.cardList}>
          {topProducts.length > 0 ? (
            topProducts.map((product, index) => (
              <View key={product.name}>
                <TopProductRow {...product} />
                {index < topProducts.length - 1 ? <View style={styles.separator} /> : null}
              </View>
            ))
          ) : (
            <Text style={styles.emptyStateText}>Top products will appear once items are sold.</Text>
          )}
        </View>
      </SurfaceCard>

      <View style={[styles.footerActions, compactPhone && styles.footerActionsCompact]}>
        <AppButton
          icon={({ color, size }) => <Download color={color} size={size} strokeWidth={2.1} />}
          label="Export Report"
          variant="primary"
          onPress={() => {
            setIsExportVisible((current) => !current);
          }}
        />
      </View>

      <SalesHistorySection
        compactPhone={compactPhone}
        formatDateTime={formatDateTime}
        isTablet={isTablet}
        onChangeHistoryFilter={setSelectedHistoryFilter}
        sales={sales}
        selectedHistoryFilter={selectedHistoryFilter}
      />

      {isExportVisible ? (
        <SurfaceCard style={styles.exportCard}>
          <Text style={styles.cardHeading}>Export Report</Text>
          <Text style={styles.exportSubtitle}>
            Excel is best for filtering and accounting. PDF is best for printing and sharing.
          </Text>

          <View style={styles.exportOptionsColumn}>
            <Pressable
              onPress={() => setSelectedExportFormat('excel')}
              style={[
                styles.exportOption,
                selectedExportFormat === 'excel' && styles.exportOptionActive,
              ]}>
              <View style={styles.exportOptionHeader}>
                <Text style={styles.exportOptionTitle}>Excel Report</Text>
                <View style={styles.recommendedPill}>
                  <Text style={styles.recommendedPillText}>Recommended</Text>
                </View>
              </View>
              <Text style={styles.exportOptionBody}>
                Best for sorting transactions, filtering by cashier or payment method, and monthly accounting.
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedExportFormat('pdf')}
              style={[
                styles.exportOption,
                selectedExportFormat === 'pdf' && styles.exportOptionActive,
              ]}>
              <View style={styles.exportOptionHeader}>
                <Text style={styles.exportOptionTitle}>PDF Report</Text>
              </View>
              <Text style={styles.exportOptionBody}>
                Best for a clean printable summary with totals, top products, and transaction highlights.
              </Text>
            </Pressable>
          </View>

          <AppButton
            label={selectedExportFormat === 'excel' ? 'Export as Excel' : 'Export as PDF'}
            loading={isExporting}
            onPress={handleExportReport}
            variant="primary"
          />
        </SurfaceCard>
      ) : null}

      {displayError ? <Text style={styles.screenErrorText}>{displayError}</Text> : null}
    </AdminPageScreen>
  );
}

const styles = StyleSheet.create({
  dateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: -14,
    marginBottom: 18,
  },
  dateText: {
    color: colors.textTertiary,
    ...textRoles.label,
    fontSize: 13,
    marginLeft: 6,
  },
  overviewFilterCard: {
    marginBottom: layout.cardGap + spacing.sm,
    minHeight: 108,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  overviewFilterCardCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  analyticsCard: {
    marginTop: layout.cardGap + spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  analyticsCardCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  analyticsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  analyticsTitle: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: 21,
    lineHeight: 26,
  },
  analyticsSubtitle: {
    color: colors.textTertiary,
    ...textRoles.label,
    marginTop: spacing.xs,
  },
  analyticsRangeLabel: {
    color: colors.textStrong,
    ...textRoles.value,
    fontSize: 18,
    lineHeight: 26,
    marginTop: spacing.xs,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
    marginTop: layout.cardGap + spacing.sm,
    width: '100%',
  },
  listCard: {
    marginTop: layout.cardGap + spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  listCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardHeading: {
    color: colors.secondary,
    ...textRoles.value,
    marginBottom: 8,
  },
  cardList: {
    paddingTop: 2,
  },
  separator: {
    backgroundColor: colors.divider,
    height: 1,
    width: '100%',
  },
  footerActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.section,
  },
  footerActionsCompact: {
    flexDirection: 'column',
  },
  historyRangeHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  historyRangeHeaderCompact: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  rangeTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  historyRangeLabel: {
    color: colors.muted,
    ...textRoles.label,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  historyRangeValue: {
    color: colors.textStrong,
    ...textRoles.value,
    fontSize: 18,
    lineHeight: 28,
  },
  historyCalendarButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceInfo,
    borderColor: colors.borderInfoStrong,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 148,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  historyCalendarButtonCompact: {
    minHeight: 42,
    minWidth: 0,
    paddingHorizontal: spacing.md,
    width: '100%',
  },
  historyCalendarButtonText: {
    color: colors.secondary,
    ...textRoles.label,
    fontSize: 13,
  },
  historyRangeActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  historyRangeActionsCompact: {
    flexWrap: 'wrap',
  },
  historyRangeActionButton: {
    backgroundColor: colors.surfaceNeutral,
    borderColor: colors.borderMuted,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  historyRangeActionText: {
    color: colors.textHeading,
    ...textRoles.label,
  },
  exportCard: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  exportSubtitle: {
    color: colors.textSecondary,
    ...textRoles.body,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  exportOptionsColumn: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  exportOption: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.borderMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  exportOptionActive: {
    backgroundColor: colors.surfaceBrandSoft,
    borderColor: colors.borderInfoStrong,
  },
  exportOptionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  exportOptionTitle: {
    color: colors.textStrong,
    ...textRoles.value,
  },
  exportOptionBody: {
    color: colors.textSecondary,
    ...textRoles.body,
    fontSize: 14,
    lineHeight: 22,
  },
  recommendedPill: {
    backgroundColor: colors.surfaceSuccessMuted,
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  },
  recommendedPillText: {
    color: colors.successBright,
    ...textRoles.label,
  },
  emptyStateText: {
    color: colors.textSecondary,
    ...textRoles.body,
    fontSize: 15,
    lineHeight: 22,
  },
  screenErrorText: {
    color: colors.dangerStrong,
    ...textRoles.label,
    fontSize: 13,
    marginTop: spacing.md,
  },
});
