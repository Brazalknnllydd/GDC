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
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={{ minWidth: '100%', flexGrow: 1 }}
        >
          <View style={{ minWidth: 1000, flex: 1 }}>
        <View style={styles.tableHeader}>
          <View style={styles.headerDataArea}>
            <View style={[styles.nameCol, { gap: 0 }]}><Text style={styles.headerCell}>CASHIER</Text></View>
            <View style={styles.col}><Text style={styles.headerCell}>START TIME</Text></View>
            <View style={styles.colStatus}><Text style={styles.headerCell}>STATUS</Text></View>
            <View style={styles.colNumeric}><Text style={styles.headerCell}>EXPECTED</Text></View>
            <View style={styles.colNumeric}><Text style={styles.headerCell}>ACTUAL</Text></View>
            <View style={[styles.colNumeric, { flex: 3 }]}><Text style={styles.headerCell}>VARIANCE</Text></View>
          </View>
        </View>

        {paginatedItems.map((shift) => {
          const variance = calculateVariance(shift);
          const varianceText = variance !== null 
            ? `${variance > 0 ? '+' : ''}${formatPeso(variance)}` 
            : '—';
          const varianceColor = variance !== null 
            ? (variance < 0 ? colors.danger : variance > 0 ? colors.success : colors.textSecondary)
            : colors.textSecondary;

          return (
            <View key={shift.id} style={styles.row}>
              <View style={styles.dataArea}>
                {/* Cashier Avatar + Name */}
                <View style={styles.nameCol}>
                  <View style={styles.avatar}>
                    <UserCircle2 color={colors.textInverse} size={18} strokeWidth={2} />
                  </View>
                  <Text style={styles.nameText} numberOfLines={1}>{shift.user?.name || 'Unknown'}</Text>
                </View>

                {/* Start Time */}
                <View style={styles.col}>
                  <Text style={styles.metaText} numberOfLines={1}>
                    {new Date(shift.startedAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                {/* Status */}
                <View style={styles.colStatus}>
                  <Text style={styles.metaText}>{shift.status}</Text>
                </View>

                {/* Expected */}
                <View style={styles.colNumeric}>
                  <Text style={styles.metaText}>
                    {shift.expectedClosingCash ? formatPeso(parseFloat(shift.expectedClosingCash)) : '—'}
                  </Text>
                </View>

                {/* Actual */}
                <View style={styles.colNumeric}>
                  <Text style={styles.metaText}>
                    {shift.closingCash ? formatPeso(parseFloat(shift.closingCash)) : '—'}
                  </Text>
                </View>

                {/* Variance and Actions */}
                <View style={[styles.colNumeric, { flex: 3, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.md }]}>
                  <Text style={[styles.metaText, { color: varianceColor, fontFamily: fonts.semiBold }]}>
                    {varianceText}
                  </Text>
                  {shift.status === 'OPEN' ? (
                    <Pressable 
                      onPress={() => openActionModal(shift, 'FORCE_CLOSE')}
                      style={styles.actionIconBtn}
                    >
                      <Lock color={colors.danger} size={18} strokeWidth={2} />
                    </Pressable>
                  ) : (
                    <Pressable 
                      onPress={() => openActionModal(shift, 'REOPEN')}
                      style={styles.actionIconBtn}
                    >
                      <Unlock color="#667085" size={18} strokeWidth={2} />
                    </Pressable>
                  )}
                </View>
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  card: {
    padding: spacing.xl,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: textSizes.titleLarge,
    color: colors.textStrong,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  tableHeader: {
    backgroundColor: colors.surfaceNeutral,
    borderBottomColor: '#EAECF0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerDataArea: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
  },
  headerCell: {
    color: colors.textSecondary,
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  headerCellActions: {
    flex: 0,
    width: 140,
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
  dataArea: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
  },
  nameCol: {
    alignItems: 'center',
    flex: 2.5,
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 20,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  nameText: {
    color: '#101828',
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.body,
  },
  col: {
    flex: 2,
    minWidth: 0,
  },
  colStatus: {
    flex: 1.5,
    minWidth: 0,
  },
  colNumeric: {
    flex: 1.5,
    minWidth: 0,
    alignItems: 'flex-end',
  },
  metaText: {
    color: '#475467',
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
  },
  actionsCol: {
    alignItems: 'center',
    flex: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: 140,
  },
  actionIconBtn: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    paddingHorizontal: 0,
    minHeight: 32,
    height: 32,
    width: 90,
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
});
