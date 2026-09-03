import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CalendarDays } from 'lucide-react-native';

import { MonthRangePicker, type MonthRangeValue } from './month-range-picker';
import { TransactionDetailsModal } from './transaction-details-modal';
import { PaginationControls } from '../ui/pagination-controls';
import { SurfaceCard } from '../ui/surface-card';
import { colors, fonts, textRoles, textSizes } from '../../constants/theme';
import { radius, spacing } from '../../constants/design-system';
import { formatPeso, normalizeNumber } from '../../lib/product-utils';
import {
  buildCashierHistoryTables,
  createDefaultHistoryState,
  formatMonthRangeLabel,
} from './sales-history-utils';
import type { CashierHistoryState, HistoryFilter, SaleRecord } from './sales-history-types';

const itemsPerPage = 10;
const phoneHistoryColumns = {
  buyer: 132,
  date: 156,
  payment: 88,
  receipt: 132,
  status: 96,
  total: 104,
};
const tabletHistoryColumns = {
  buyer: 170,
  date: 190,
  payment: 110,
  receipt: 156,
  status: 112,
  total: 124,
};

type SalesHistorySectionProps = {
  compactPhone: boolean;
  formatDateTime: (value: string) => string;
  isTablet: boolean;
  sales: SaleRecord[];
  selectedHistoryFilter: HistoryFilter;
  onChangeHistoryFilter: (filter: HistoryFilter) => void;
};

export function SalesHistorySection({
  compactPhone,
  formatDateTime,
  isTablet,
  onChangeHistoryFilter,
  sales,
  selectedHistoryFilter,
}: SalesHistorySectionProps) {
  const [cashierHistoryState, setCashierHistoryState] = useState<Record<string, CashierHistoryState>>({});
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const columnWidths = isTablet ? tabletHistoryColumns : phoneHistoryColumns;
  const tableWidth = Object.values(columnWidths).reduce((sum, value) => sum + value, 0);

  const historyTransactions = useMemo(() => {
    const filteredByMethod =
      selectedHistoryFilter === 'All'
        ? sales
        : sales.filter((sale) => sale.paymentMethod === selectedHistoryFilter);

    return filteredByMethod.slice().sort((left, right) => {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }, [sales, selectedHistoryFilter]);

  const cashierHistoryTables = useMemo(
    () => buildCashierHistoryTables(historyTransactions, cashierHistoryState, itemsPerPage),
    [cashierHistoryState, historyTransactions]
  );

  function updateCashierHistoryState(
    cashierKey: string,
    updater: (current: CashierHistoryState) => CashierHistoryState
  ) {
    setCashierHistoryState((current) => ({
      ...current,
      [cashierKey]: updater(current[cashierKey] || createDefaultHistoryState()),
    }));
  }

  function setCashierHistoryRange(cashierKey: string, monthRange: MonthRangeValue) {
    updateCashierHistoryState(cashierKey, (current) => ({
      ...current,
      monthRange,
      page: 1,
    }));
  }

  function setCashierHistoryPage(cashierKey: string, page: number) {
    updateCashierHistoryState(cashierKey, (current) => ({
      ...current,
      page,
    }));
  }

  function setCashierHistoryYear(cashierKey: string, calendarYear: number) {
    updateCashierHistoryState(cashierKey, (current) => ({
      ...current,
      calendarYear,
    }));
  }

  function toggleCashierHistoryPicker(cashierKey: string) {
    updateCashierHistoryState(cashierKey, (current) => ({
      ...current,
      pickerVisible: !current.pickerVisible,
    }));
  }

  function setCashierHistoryToCurrentMonth(cashierKey: string) {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    updateCashierHistoryState(cashierKey, (current) => ({
      ...current,
      calendarYear: now.getFullYear(),
      monthRange: {
        endMonth: currentMonth,
        startMonth: currentMonth,
      },
      page: 1,
    }));
  }

  function clearCashierHistoryRange(cashierKey: string) {
    updateCashierHistoryState(cashierKey, (current) => ({
      ...current,
      calendarYear: new Date().getFullYear(),
      monthRange: {
        endMonth: null,
        startMonth: null,
      },
      page: 1,
    }));
  }

  return (
    <>
      <SurfaceCard style={[styles.historyCard, compactPhone && styles.historyCardCompact]}>
        <View style={styles.historyHeader}>
          <View style={styles.rangeTextBlock}>
            <Text style={styles.cardHeading}>Sales History</Text>
            <Text style={styles.historySubtitle}>Review transaction records grouped by cashier.</Text>
          </View>
          <View style={styles.historyBadge}>
            <Text style={styles.historyBadgeText}>{historyTransactions.length} transactions</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.historyFilterRow}>
          {(['All', 'Cash', 'GCash'] as const).map((filter) => (
            <Pressable
              key={filter}
              onPress={() => onChangeHistoryFilter(filter)}
              style={[
                styles.historyFilterChip,
                selectedHistoryFilter === filter && styles.historyFilterChipActive,
              ]}>
              <Text
                style={[
                  styles.historyFilterText,
                  selectedHistoryFilter === filter && styles.historyFilterTextActive,
                ]}>
                {filter}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {cashierHistoryTables.length > 0 ? (
          <View style={styles.cashierTablesColumn}>
            {cashierHistoryTables.map((table) => {
              const startItem =
                table.filteredSales.length === 0 ? 0 : (table.activePage - 1) * itemsPerPage + 1;
              const endItem = Math.min(table.activePage * itemsPerPage, table.filteredSales.length);

              return (
                <View key={table.cashierKey} style={styles.cashierTableSection}>
                  <View style={[styles.cashierTableHeader, compactPhone && styles.historyRangeHeaderCompact]}>
                    <View style={styles.rangeTextBlock}>
                      <Text style={styles.cashierTableLabel}>{table.cashierName}</Text>
                      <Text style={styles.historyRangeValue}>{formatMonthRangeLabel(table.state.monthRange)}</Text>
                    </View>

                    <Pressable
                      onPress={() => toggleCashierHistoryPicker(table.cashierKey)}
                      style={[styles.historyCalendarButton, compactPhone && styles.historyCalendarButtonCompact]}>
                      <CalendarDays color={colors.secondary} size={16} strokeWidth={2} />
                      <Text style={styles.historyCalendarButtonText}>
                        {table.state.pickerVisible ? 'Hide Calendar' : 'Choose Month'}
                      </Text>
                    </Pressable>
                  </View>

                  {table.state.pickerVisible ? (
                    <View>
                      <MonthRangePicker
                        displayYear={table.state.calendarYear}
                        onChangeRange={(range) => setCashierHistoryRange(table.cashierKey, range)}
                        onChangeYear={(year) => setCashierHistoryYear(table.cashierKey, year)}
                        range={table.state.monthRange}
                      />

                      <View style={[styles.historyRangeActions, compactPhone && styles.historyRangeActionsCompact]}>
                        <Pressable
                          onPress={() => setCashierHistoryToCurrentMonth(table.cashierKey)}
                          style={styles.historyRangeActionButton}>
                          <Text style={styles.historyRangeActionText}>This Month</Text>
                        </Pressable>

                        <Pressable
                          onPress={() => clearCashierHistoryRange(table.cashierKey)}
                          style={styles.historyRangeActionButton}>
                          <Text style={styles.historyRangeActionText}>Clear</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={true}
                    contentContainerStyle={styles.tableScroller}>
                    <View style={[styles.table, { minWidth: tableWidth }]}>
                      <View style={[styles.tableHeader, isTablet && styles.tableHeaderTablet]}>
                        <Text style={[styles.tableHeaderCell, isTablet && styles.tableHeaderCellTablet, { width: columnWidths.receipt }]}>RECEIPT NO</Text>
                        <Text style={[styles.tableHeaderCell, isTablet && styles.tableHeaderCellTablet, { width: columnWidths.date }]}>DATE SOLD</Text>
                        <Text style={[styles.tableHeaderCell, isTablet && styles.tableHeaderCellTablet, { width: columnWidths.buyer }]}>BUYER</Text>
                        <Text style={[styles.tableHeaderCell, isTablet && styles.tableHeaderCellTablet, { width: columnWidths.payment }]}>PAYMENT</Text>
                        <Text style={[styles.tableHeaderCell, isTablet && styles.tableHeaderCellTablet, { width: columnWidths.status }]}>STATUS</Text>
                        <Text style={[styles.tableHeaderCell, isTablet && styles.tableHeaderCellTablet, { textAlign: 'right', width: columnWidths.total }]}>TOTAL</Text>
                      </View>

                      <View style={styles.tableRows}>
                        {table.paginatedSales.length > 0 ? (
                          table.paginatedSales.map((sale) => (
                            <Pressable
                              accessibilityRole="button"
                              key={sale.id}
                              onPress={() => setSelectedSale(sale)}
                              style={[styles.tableRow, styles.clickableTableRow, isTablet && styles.tableRowTablet]}>
                              <Text numberOfLines={2} style={[styles.tableCell, isTablet && styles.tableCellTablet, { ...textRoles.value, color: colors.textStrong, width: columnWidths.receipt }]}>
                                {sale.receiptNumber}
                              </Text>
                              <Text style={[styles.tableCell, isTablet && styles.tableCellTablet, { width: columnWidths.date }]}>
                                {formatDateTime(sale.createdAt)}
                              </Text>
                              <Text numberOfLines={2} style={[styles.tableCell, isTablet && styles.tableCellTablet, { color: sale.customer || sale.recipientUser ? colors.textSecondary : colors.textSubtle, width: columnWidths.buyer }]}>
                                {sale.saleType === 'INTERNAL_CASHIER'
                                  ? sale.recipientUser?.name || 'Cashier'
                                  : sale.customer?.name || 'Walk-in'}
                              </Text>
                              <Text style={[styles.tableCell, isTablet && styles.tableCellTablet, { width: columnWidths.payment }]}>
                                {sale.paymentMethod}
                              </Text>
                              <Text style={[styles.tableCell, isTablet && styles.tableCellTablet, { color: sale.status === 'voided' ? colors.danger : colors.textSecondary, width: columnWidths.status }]}>
                                {sale.saleType === 'INTERNAL_CASHIER' ? 'internal' : sale.status || 'completed'}
                              </Text>
                              <Text style={[styles.tableCell, isTablet && styles.tableCellTablet, { textAlign: 'right', ...textRoles.value, color: sale.status === 'voided' ? colors.textTertiary : colors.textStrong, textDecorationLine: sale.status === 'voided' ? 'line-through' : 'none', width: columnWidths.total }]}>
                                {formatPeso(normalizeNumber(sale.totalAmount))}
                              </Text>
                            </Pressable>
                          ))
                        ) : (
                          <View style={styles.emptyTableRow}>
                            <Text style={styles.emptyStateText}>No transactions found for this cashier and month.</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.tableFooter}>
                        <PaginationControls
                          borderless
                          currentPage={table.activePage - 1}
                          endItem={endItem}
                          onPageChange={(page) => setCashierHistoryPage(table.cashierKey, page + 1)}
                          startItem={startItem}
                          totalItems={table.filteredSales.length}
                          totalPages={table.totalPages}
                          visiblePageNumbers={table.visiblePageNumbers}
                        />
                      </View>
                    </View>
                  </ScrollView>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyTableRow}>
            <Text style={styles.emptyStateText}>No sales history found for this filter.</Text>
          </View>
        )}
      </SurfaceCard>

      <TransactionDetailsModal
        compact={compactPhone}
        formatDateTime={formatDateTime}
        isTablet={isTablet}
        onClose={() => setSelectedSale(null)}
        sale={selectedSale}
      />
    </>
  );
}

const styles = StyleSheet.create({
  historyCard: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  historyCardCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  historyHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardHeading: {
    color: colors.secondary,
    ...textRoles.value,
    marginBottom: 8,
  },
  historySubtitle: {
    color: colors.textSecondary,
    ...textRoles.body,
    fontSize: 14,
    maxWidth: '88%',
  },
  historyBadge: {
    backgroundColor: colors.surfaceBrandSoft,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  historyBadgeText: {
    color: colors.secondary,
    ...textRoles.label,
  },
  rangeTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  historyRangeHeaderCompact: {
    flexDirection: 'column',
    gap: spacing.sm,
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
  historyFilterRow: {
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: 2,
  },
  historyFilterChip: {
    backgroundColor: colors.surfaceNeutral,
    borderColor: colors.borderMuted,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  historyFilterChipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  historyFilterText: {
    color: colors.textHeading,
    ...textRoles.label,
  },
  historyFilterTextActive: {
    color: colors.textInverse,
  },
  cashierTablesColumn: {
    gap: spacing.lg,
  },
  cashierTableSection: {
    borderColor: colors.borderPanel,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cashierTableHeader: {
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceSubtle,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  cashierTableLabel: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 2,
  },
  table: {
    backgroundColor: '#FFFFFF',
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  tableScroller: {
    flexGrow: 1,
  },
  tableHeader: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderBottomColor: colors.borderPanel,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tableHeaderTablet: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  tableHeaderCell: {
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: textSizes.xsmall,
    letterSpacing: 0.7,
    paddingRight: spacing.md,
  },
  tableHeaderCellTablet: {
    fontSize: textSizes.small,
  },
  tableRows: {
    backgroundColor: '#FFFFFF',
  },
  tableRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomColor: colors.borderPanel,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 1,
  },
  tableRowTablet: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  clickableTableRow: {
    cursor: Platform.OS === 'web' ? 'pointer' : undefined,
  },
  tableCell: {
    color: '#475467',
    fontFamily: fonts.regular,
    fontSize: textSizes.small,
    paddingRight: spacing.md,
  },
  tableCellTablet: {
    fontSize: textSizes.body,
  },
  emptyTableRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 32,
  },
  emptyStateText: {
    color: colors.textSecondary,
    ...textRoles.body,
    fontSize: 15,
    lineHeight: 22,
  },
  tableFooter: {
    backgroundColor: colors.surfaceSoft,
    borderTopColor: colors.borderPanel,
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
});
