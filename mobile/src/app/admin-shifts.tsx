import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, RefreshControl, Pressable } from 'react-native';
import { FileText, Unlock, Lock, Calendar as CalendarIcon, X, UserCircle2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';

import { AppButton } from '../components/ui/app-button';
import { SurfaceCard } from '../components/ui/surface-card';
import { AdminModalShell } from '../components/ui/admin-modal-shell';
import { ModalActions } from '../components/ui/modal-actions';
import { AdminPageScreen } from '../components/ui/admin-page-screen';
import { tabs } from '../components/admin-products/products-screen-data';
import { colors, fonts, textSizes } from '../constants/theme';
import { spacing } from '../constants/design-system';
import { apiClient } from '../lib/api';
import { formatPeso } from '../lib/product-utils';
import { ProductFormInput } from '../components/ui/product-form-input';
import { usePagination } from '../hooks/use-pagination';
import { PaginationControls } from '../components/ui/pagination-controls';
import { useResponsiveLayout } from '../hooks/use-responsive-layout';

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

export default function AdminShiftsScreen() {
  const router = useRouter();
  const { isTablet } = useResponsiveLayout();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  // Date Filter State
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const fetchShifts = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<Shift[]>('/shifts');
      setShifts(res.data);
    } catch (err) {
      console.error('Failed to fetch shifts', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchShifts();
  };

  const openActionModal = (shift: Shift, type: 'FORCE_CLOSE' | 'REOPEN') => {
    setSelectedShift(shift);
    setActionType(type);
    setNotes('');
    setShowActionModal(true);
  };

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
      fetchShifts();
    } catch (err) {
      console.error('Failed to update shift', err);
      alert('Failed to update shift. Please try again.');
    } finally {
      setIsSubmitting(false);
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
    >
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {filterDate && (
            <Pressable onPress={() => setFilterDate(null)} style={{ padding: spacing.xs }}>
              <X size={16} color={colors.textSecondary} />
            </Pressable>
          )}
          <AppButton
            variant="secondary"
            icon={CalendarIcon}
            label={filterDate ? dayjs(filterDate).format('MMM DD, YYYY') : 'Filter Date'}
            onPress={() => setShowDatePicker(true)}
            fullWidth={false}
          />
        </View>
      </View>

      <SurfaceCard style={{ padding: 0, overflow: 'hidden', borderWidth: 0 }}>
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
        <View style={{ padding: spacing.xl, backgroundColor: '#fff', borderRadius: 12 }}>
          <DateTimePicker
            mode="single"
            date={filterDate || new Date()}
            onChange={(params: any) => {
              if (params.date) {
                setFilterDate(dayjs(params.date).toDate());
                setShowDatePicker(false);
              }
            }}
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
  modalContent: {
    paddingTop: spacing.md,
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
