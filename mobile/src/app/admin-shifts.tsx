import { useCallback, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { Unlock, Lock, Calendar as CalendarIcon, X, UserCircle2, ChevronLeft, ChevronRight, Download } from 'lucide-react-native';
import DateTimePicker from 'react-native-ui-datepicker';
import type { DateType } from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import * as Print from 'expo-print';

import { AppButton } from '../components/ui/app-button';
import { SurfaceCard } from '../components/ui/surface-card';
import { AdminModalShell } from '../components/ui/admin-modal-shell';
import { ModalActions } from '../components/ui/modal-actions';
import { AdminPageScreen } from '../components/ui/admin-page-screen';
import { tabs } from '../components/admin-products/products-screen-data';
import { colors, fonts, textSizes } from '../constants/theme';
import { spacing } from '../constants/design-system';
import { apiClient } from '../lib/api';
import { formatExportAmount, formatPeso, normalizeNumber } from '../lib/product-utils';
import { ProductFormInput } from '../components/ui/product-form-input';
import { usePagination } from '../hooks/use-pagination';
import { PaginationControls } from '../components/ui/pagination-controls';
import { useResponsiveLayout } from '../hooks/use-responsive-layout';
import { useRefreshHandler } from '../hooks/use-refresh-handler';
import { shareExportFile } from '../lib/export-file';
import { downloadWebPdfReport } from '../lib/web-pdf-export';

type Shift = {
  id: number;
  userId: number;
  openingCash: string;
  closingCash: string | null;
  expectedClosingCash: string | null;
  status: string;
  notes: string | null;
  startedAt: string;
  endedAt: string | null;
  user: {
    id: number;
    name: string;
  };
  _count?: {
    sales: number;
  };
};

type CashierInventoryRow = {
  cashierPrice: number | string | null;
  cashier: {
    id: number;
    name: string;
    username: string;
  };
  product: {
    id: number;
    name: string;
    barcode: string | null;
    price: number | string;
    unit: string;
    category?: {
      name: string;
    } | null;
  };
  quantity: number;
  sourceCashier: {
    id: number;
    name: string;
    username: string;
  };
};

function escapeHtml(value: string | number) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatFileDate(value: Date) {
  return dayjs(value).format('YYYY-MM-DD');
}

function getCashierInventoryPrice(row: CashierInventoryRow) {
  return row.cashierPrice === null || row.cashierPrice === undefined
    ? normalizeNumber(row.product.price)
    : normalizeNumber(row.cashierPrice);
}

function buildCashierInventoryRows(rows: CashierInventoryRow[]) {
  if (rows.length === 0) {
    return '<tr><td colspan="7">No cashier inventory available.</td></tr>';
  }

  return rows
    .slice()
    .sort((left, right) => {
      const cashierCompare = left.cashier.name.localeCompare(right.cashier.name);
      if (cashierCompare !== 0) return cashierCompare;
      return left.product.name.localeCompare(right.product.name);
    })
    .map((row) => {
      const price = getCashierInventoryPrice(row);
      return `
        <tr>
          <td>${escapeHtml(row.cashier.name)}</td>
          <td>${escapeHtml(row.product.name)}</td>
          <td>${escapeHtml(row.product.category?.name || 'Uncategorized')}</td>
          <td>${escapeHtml(row.sourceCashier.name)}</td>
          <td class="amount">${escapeHtml(formatExportAmount(price))}</td>
          <td class="amount">${escapeHtml(row.quantity)}</td>
          <td>${escapeHtml(row.product.unit || 'pcs')}</td>
        </tr>
      `;
    })
    .join('');
}

function buildCashierInventoryHtml(rows: CashierInventoryRow[]) {
  const generatedAt = new Date().toLocaleString('en-PH', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>GDC Per-Cashier Inventory</title>
        <style>
          body {
            color: #131927;
            font-family: Arial, sans-serif;
            padding: 24px;
          }
          h1 {
            color: #1A237E;
            font-size: 24px;
            margin: 0;
          }
          .subtitle {
            color: #667085;
            font-size: 12px;
            letter-spacing: 1.6px;
            margin: 4px 0 18px;
            text-transform: uppercase;
          }
          .meta {
            border-bottom: 2px solid #DDE4F3;
            color: #475467;
            margin-bottom: 18px;
            padding-bottom: 14px;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th, td {
            border: 1px solid #DDE4F3;
            font-size: 10px;
            padding: 7px 8px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background: #EEF2FF;
            color: #1A237E;
            font-size: 9px;
            letter-spacing: 0.7px;
            text-transform: uppercase;
          }
          .amount {
            text-align: right;
            white-space: nowrap;
          }
        </style>
      </head>
      <body>
        <h1>Per-Cashier Products Remaining</h1>
        <p class="subtitle">GDC Inventory Pro</p>
        <div class="meta">
          <strong>Generated:</strong> ${escapeHtml(generatedAt)}
        </div>
        <table>
          <thead>
            <tr>
              <th>Cashier</th>
              <th>Product</th>
              <th>Category</th>
              <th>Source</th>
              <th>Price</th>
              <th>Qty Left</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>${buildCashierInventoryRows(rows)}</tbody>
        </table>
      </body>
    </html>
  `;
}

export default function AdminShiftsScreen() {
  const { isTablet } = useResponsiveLayout();
  const shiftsQuery = useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const res = await apiClient.get<Shift[]>('/shifts');
      return res.data;
    },
  });
  const shifts = shiftsQuery.data ?? [];
  const isLoading = shiftsQuery.isLoading;
  const screenError = shiftsQuery.error?.message || '';
  const refreshShifts = useCallback(() => shiftsQuery.refetch(), [shiftsQuery]);
  const { isRefreshing, onRefresh } = useRefreshHandler(refreshShifts);

  const shiftTabs = tabs.map((tab) =>
    tab.label === 'Shifts'
      ? { ...tab, active: true, route: '/admin-shifts' as const }
      : { ...tab, active: false }
  );

  // Modal states
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'FORCE_CLOSE' | 'REOPEN'>('FORCE_CLOSE');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExportingInventory, setIsExportingInventory] = useState(false);

  // Date Filter State
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(dayjs().month());
  const [pickerYear, setPickerYear] = useState(dayjs().year());

  const filteredShifts = shifts.filter(shift => {
    if (!filterDate) return true;
    const shiftDate = dayjs(shift.startedAt);
    return shiftDate.isSame(dayjs(filterDate), 'day');
  });

  const {
    page,
    setPage,
    paginatedItems,
    totalPages,
    visiblePageNumbers,
  } = usePagination({
    items: filteredShifts,
    itemsPerPage: 10,
    resetDependencies: [filterDate, shifts],
  });

  const openActionModal = (shift: Shift, type: 'FORCE_CLOSE' | 'REOPEN') => {
    setSelectedShift(shift);
    setActionType(type);
    setNotes('');
    setShowActionModal(true);
  };

  const openDatePicker = () => {
    const activeDate = dayjs(filterDate ?? new Date());
    setPickerMonth(activeDate.month());
    setPickerYear(activeDate.year());
    setShowDatePicker(true);
  };

  const clearFilterDate = () => {
    const today = dayjs();
    setFilterDate(null);
    setPickerMonth(today.month());
    setPickerYear(today.year());
  };

  const handleDatePickerChange = (params: { date: DateType }) => {
    if (!params.date) return;
    const selectedDate = dayjs(params.date);
    setFilterDate(selectedDate.toDate());
    setPickerMonth(selectedDate.month());
    setPickerYear(selectedDate.year());
    setShowDatePicker(false);
  };

  const changePickerMonth = (amount: number) => {
    const nextDate = dayjs()
      .year(pickerYear)
      .month(pickerMonth)
      .date(1)
      .add(amount, 'month');

    setPickerMonth(nextDate.month());
    setPickerYear(nextDate.year());
  };

  const pickerMonthLabel = dayjs()
    .year(pickerYear)
    .month(pickerMonth)
    .date(1)
    .format('MMMM YYYY');

  const handleActionSubmit = async () => {
    if (!selectedShift) return;
    setIsSubmitting(true);
    try {
      if (actionType === 'FORCE_CLOSE') {
        await apiClient.put(`/shifts/${selectedShift.id}/force-close`, { notes });
      } else {
        await apiClient.put(`/shifts/${selectedShift.id}/reopen`, { notes });
      }
      setShowActionModal(false);
      await shiftsQuery.refetch();
    } catch (err) {
      console.error('Failed to update shift', err);
      alert('Failed to update shift. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCashierInventoryPdf = async () => {
    try {
      setIsExportingInventory(true);
      const response = await apiClient.get<CashierInventoryRow[]>('/cashier/inventory');
      const rows = response.data;
      const fileName = `gdc-cashier-products-remaining-${formatFileDate(new Date())}.pdf`;

      if (Platform.OS === 'web') {
        await downloadWebPdfReport({
          fileName,
          title: 'Per-Cashier Products Remaining',
          subtitle: 'GDC Inventory Pro',
          metadata: [
            {
              label: 'Generated',
              value: new Date().toLocaleString('en-PH', {
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
            },
          ],
          summary: [
            { label: 'Cashier Inventory Rows', value: String(rows.length) },
            {
              label: 'Total Qty Left',
              value: String(rows.reduce((sum, row) => sum + normalizeNumber(row.quantity), 0)),
            },
            {
              label: 'Total Inventory Worth',
              value: formatExportAmount(
                rows.reduce(
                  (sum, row) => sum + getCashierInventoryPrice(row) * normalizeNumber(row.quantity),
                  0
                )
              ),
            },
          ],
          tables: [
            {
              emptyText: 'No cashier inventory available.',
              headers: ['Cashier', 'Product', 'Category', 'Source', 'Price', 'Qty Left', 'Unit'],
              rows: rows.map((row) => [
                row.cashier.name,
                row.product.name,
                row.product.category?.name || 'Uncategorized',
                row.sourceCashier.name,
                formatExportAmount(getCashierInventoryPrice(row)),
                String(row.quantity),
                row.product.unit || 'pcs',
              ]),
              title: 'Products Remaining',
            },
          ],
          footer: 'Prepared by GDC Inventory Pro',
        });
        return;
      }

      const { uri } = await Print.printToFileAsync({
        html: buildCashierInventoryHtml(rows),
      });

      await shareExportFile(uri, {
        dialogTitle: 'Save Cashier Products Remaining',
        fileName,
        mimeType: 'application/pdf',
        uti: 'com.adobe.pdf',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not export cashier inventory right now.';
      Alert.alert('Export failed', message);
    } finally {
      setIsExportingInventory(false);
    }
  };

  const calculateVariance = (shift: Shift) => {
    if (shift.status === 'OPEN' || !shift.expectedClosingCash || !shift.closingCash) {
      return null;
    }
    const expected = parseFloat(shift.expectedClosingCash);
    const actual = parseFloat(shift.closingCash);
    return actual - expected;
  };

  return (
    <AdminPageScreen
      title="Shift Management"
      introDescription="View and manage cashier shifts, shortages, and overages."
      bottomNavItems={shiftTabs}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
    >
      <View style={styles.toolbar}>
        <View style={styles.toolbarActions}>
          <AppButton
            fullWidth={false}
            icon={Download}
            label="Export PDF"
            loading={isExportingInventory}
            onPress={handleExportCashierInventoryPdf}
            variant="primary"
          />
          {filterDate && (
            <Pressable onPress={clearFilterDate} style={{ padding: spacing.xs }}>
              <X size={16} color={colors.textSecondary} />
            </Pressable>
          )}
          <AppButton
            variant="secondary"
            icon={CalendarIcon}
            label={filterDate ? dayjs(filterDate).format('MMM DD, YYYY') : 'Filter Date'}
            onPress={openDatePicker}
            fullWidth={false}
          />
        </View>
      </View>

      {screenError ? <Text style={styles.errorText}>{screenError}</Text> : null}

      <SurfaceCard style={{ padding: 0, overflow: 'hidden', borderWidth: 0 }}>
        {isLoading ? (
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>Loading shifts...</Text>
          </View>
        ) : (
          <ScrollView horizontal={!isTablet} showsHorizontalScrollIndicator={false}>
          <View style={[styles.tableContent, isTablet && styles.tableContentTablet]}>
            {/* Table Header */}
            <View style={[styles.tableHeader, isTablet && styles.tableHeaderTablet]}>
              <View style={[styles.nameCol, isTablet && styles.nameColTablet]}>
                <Text style={[styles.headerCell, isTablet && styles.headerCellTablet]}>CASHIER</Text>
              </View>
              <View style={[styles.colTime, isTablet && styles.colTimeTablet]}>
                <Text style={[styles.headerCell, isTablet && styles.headerCellTablet]}>START TIME</Text>
              </View>
              <View style={[styles.colStatus, isTablet && styles.colStatusTablet]}>
                <Text style={[styles.headerCell, isTablet && styles.headerCellTablet]}>STATUS</Text>
              </View>
              <View style={[styles.colVariance, isTablet && styles.colVarianceTablet]}>
                <Text style={[styles.headerCell, isTablet && styles.headerCellTablet, { textAlign: 'right' }]}>VARIANCE</Text>
              </View>
              <View style={styles.colActions} />
            </View>

            {paginatedItems.map((shift) => {
          const variance = calculateVariance(shift);
          const varianceText = variance !== null
            ? `${variance > 0 ? '+' : ''}${formatPeso(variance)}`
            : '—';
          const varianceColor =
            variance !== null
              ? variance < 0 ? colors.danger
              : variance > 0 ? colors.success
              : colors.textSecondary
            : colors.textSecondary;
          const isOpen = shift.status === 'OPEN';

              return (
                <View key={shift.id} style={[styles.row, isTablet && styles.rowTablet]}>
              {/* Cashier */}
              <View style={[styles.nameCol, isTablet && styles.nameColTablet]}>
                <View style={[styles.avatar, isTablet && styles.avatarTablet]}>
                  <UserCircle2 color={colors.textInverse} size={isTablet ? 20 : 16} strokeWidth={2} />
                </View>
                <Text style={[styles.nameText, isTablet && styles.nameTextTablet]} numberOfLines={1}>{shift.user?.name || 'Unknown'}</Text>
              </View>

              {/* Start Time */}
              <View style={[styles.colTime, isTablet && styles.colTimeTablet]}>
                <Text style={[styles.metaText, isTablet && styles.metaTextTablet]} numberOfLines={2}>
                  {new Date(shift.startedAt).toLocaleString('en-PH', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              {/* Status badge */}
              <View style={[styles.colStatus, isTablet && styles.colStatusTablet]}>
                <View style={[styles.statusBadge, isOpen ? styles.statusOpen : styles.statusClosed]}>
                  <Text style={[styles.statusText, isOpen ? styles.statusTextOpen : styles.statusTextClosed]}>
                    {isOpen ? 'Open' : 'Closed'}
                  </Text>
                </View>
              </View>

              {/* Variance */}
              <View style={[styles.colVariance, isTablet && styles.colVarianceTablet]}>
                <Text style={[styles.metaText, isTablet && styles.metaTextTablet, { color: varianceColor, fontFamily: fonts.semiBold, textAlign: 'right' }]}>
                  {varianceText}
                </Text>
              </View>

              {/* Action */}
              <View style={styles.colActions}>
                <Pressable
                  onPress={() => openActionModal(shift, isOpen ? 'FORCE_CLOSE' : 'REOPEN')}
                  style={styles.actionIconBtn}
                >
                  {isOpen
                    ? <Lock color={colors.danger} size={16} strokeWidth={2} />
                    : <Unlock color={colors.textTertiary} size={16} strokeWidth={2} />}
                </Pressable>
              </View>
                </View>
              );
            })}
          </View>
          </ScrollView>
        )}

        <View style={{ paddingVertical: 16, paddingHorizontal: 24, borderTopWidth: 1, borderTopColor: colors.borderPanel, backgroundColor: colors.surfaceSoft }}>
          <PaginationControls
            borderless
            currentPage={page}
            onPageChange={setPage}
            totalPages={totalPages}
            visiblePageNumbers={visiblePageNumbers}
          />
        </View>
      </SurfaceCard>

      {/* Date Picker Modal */}
      <AdminModalShell
        title="Filter by Date"
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        height={500}
      >
        <View style={styles.datePickerContent}>
          <View style={styles.datePickerNav}>
            <Pressable
              accessibilityLabel="Previous month"
              onPress={() => changePickerMonth(-1)}
              style={styles.datePickerNavButton}
            >
              <ChevronLeft color={colors.secondary} size={20} strokeWidth={2.4} />
            </Pressable>
            <Text style={styles.datePickerNavLabel}>{pickerMonthLabel}</Text>
            <Pressable
              accessibilityLabel="Next month"
              onPress={() => changePickerMonth(1)}
              style={styles.datePickerNavButton}
            >
              <ChevronRight color={colors.secondary} size={20} strokeWidth={2.4} />
            </Pressable>
          </View>
          <DateTimePicker
            mode="single"
            date={filterDate ?? undefined}
            month={pickerMonth}
            year={pickerYear}
            hideHeader
            onMonthChange={setPickerMonth}
            onYearChange={setPickerYear}
            onChange={handleDatePickerChange}
          />
        </View>
      </AdminModalShell>

      {/* Action Modal */}
      <AdminModalShell
        title={actionType === 'FORCE_CLOSE' ? 'Force Close Shift' : 'Reopen Shift'}
        visible={showActionModal}
        onClose={() => setShowActionModal(false)}
        height={320}
        footer={
          <ModalActions>
            <AppButton label="Cancel" variant="secondary" onPress={() => setShowActionModal(false)} disabled={isSubmitting} />
            <AppButton 
              label="Confirm" 
              variant="primary" 
              onPress={handleActionSubmit} 
              loading={isSubmitting} 
            />
          </ModalActions>
        }
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalDesc}>
            {actionType === 'FORCE_CLOSE' 
              ? 'Are you sure you want to forcefully close this shift? Cash calculations will be finalized based on current sales.'
              : 'Are you sure you want to reopen this shift? The cashier will be able to process sales again.'}
          </Text>
          <ProductFormInput
            label="Admin Notes (Optional)"
            placeholder="Reason for action..."
            value={notes}
            onChangeText={setNotes}
          />
        </View>
      </AdminModalShell>
    </AdminPageScreen>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  toolbarActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  tableHeader: {
    backgroundColor: colors.surfaceNeutral,
    borderBottomColor: '#EAECF0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tableHeaderTablet: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  tableContent: {
    minWidth: 650,
  },
  tableContentTablet: {
    minWidth: 0,
    width: '100%',
  },
  headerCell: {
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  headerCellTablet: {
    fontSize: textSizes.small,
  },
  row: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#EAECF0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowTablet: {
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  nameCol: {
    alignItems: 'center',
    flexDirection: 'row',
    width: 190,
    gap: 8,
  },
  nameColTablet: {
    flex: 2,
    width: undefined,
  },
  colTime: {
    width: 145,
  },
  colTimeTablet: {
    flex: 2,
    width: undefined,
  },
  colStatus: {
    alignItems: 'center',
    width: 90,
  },
  colStatusTablet: {
    flex: 1,
    width: undefined,
  },
  colVariance: {
    alignItems: 'flex-end',
    width: 105,
  },
  colVarianceTablet: {
    flex: 1.2,
    width: undefined,
  },
  colActions: {
    alignItems: 'center',
    width: 44,
  },
  statusBadge: {
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusOpen: {
    backgroundColor: colors.surfaceSuccessMuted,
  },
  statusClosed: {
    backgroundColor: colors.surfaceNeutral,
  },
  statusText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  statusTextOpen: {
    color: colors.successBright,
  },
  statusTextClosed: {
    color: colors.textTertiary,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 20,
    height: 32,
    justifyContent: 'center',
    width: 32,
    flexShrink: 0,
  },
  avatarTablet: {
    height: 40,
    width: 40,
    borderRadius: 24,
  },
  nameText: {
    color: '#101828',
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.body,
  },
  nameTextTablet: {
    fontSize: textSizes.bodyLarge,
  },
  metaText: {
    color: '#475467',
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
  },
  metaTextTablet: {
    fontSize: textSizes.bodyLarge,
  },
  actionIconBtn: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  loadingText: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: textSizes.body,
  },
  errorText: {
    color: colors.danger,
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
    marginBottom: spacing.sm,
  },
  modalContent: {
    paddingTop: spacing.md,
  },
  datePickerContent: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
  },
  datePickerNav: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  datePickerNavButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  datePickerNavLabel: {
    color: colors.textStrong,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.bodyLarge,
    textAlign: 'center',
  },
  modalDesc: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  // Unused legacy styles kept for safety
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.xl },
  card: { padding: spacing.xl },
  title: { fontFamily: fonts.semiBold, fontSize: textSizes.titleLarge, color: colors.textStrong, marginBottom: spacing.xs },
  subtitle: { fontFamily: fonts.regular, fontSize: textSizes.body, color: colors.textSecondary, marginBottom: spacing.xl },
});
