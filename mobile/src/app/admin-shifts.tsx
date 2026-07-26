import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { FileText, Unlock, Lock } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppButton } from '../components/ui/app-button';
import { SurfaceCard } from '../components/ui/surface-card';
import { AppDataTable, AppDataTableCell, AppDataTableHeader, AppDataTableRow } from '../components/ui/app-data-table';
import { AdminModalShell } from '../components/ui/admin-modal-shell';
import { ModalActions } from '../components/ui/modal-actions';
import { AdminPageScreen } from '../components/ui/admin-page-screen';
import { tabs } from '../components/admin-products/products-screen-data';
import { colors, fonts, textSizes } from '../constants/theme';
import { spacing } from '../constants/design-system';
import { apiClient } from '../lib/api';
import { formatPeso } from '../lib/product-utils';
import { ProductFormInput } from '../components/ui/product-form-input';

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

  // Modal states
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'FORCE_CLOSE' | 'REOPEN'>('FORCE_CLOSE');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      bottomNavItems={tabs}
    >
      <View style={styles.tableWrapper}>
        <AppDataTable>
          <AppDataTableHeader>
            <AppDataTableCell isHeader text="Cashier" width={140} />
            <AppDataTableCell isHeader text="Start Time" width={160} />
            <AppDataTableCell isHeader text="Status" width={100} />
            <AppDataTableCell isHeader text="Expected" width={120} numeric />
            <AppDataTableCell isHeader text="Actual" width={120} numeric />
            <AppDataTableCell isHeader text="Variance" width={120} numeric />
            <AppDataTableCell isHeader text="Actions" width={200} />
          </AppDataTableHeader>

          {shifts.map((shift) => {
            const variance = calculateVariance(shift);
            const varianceText = variance !== null 
              ? `${variance > 0 ? '+' : ''}${formatPeso(variance)}` 
              : '-';
            const varianceColor = variance !== null 
              ? (variance < 0 ? colors.danger : variance > 0 ? colors.success : colors.textSecondary)
              : colors.textSecondary;

            return (
              <AppDataTableRow key={shift.id}>
                <AppDataTableCell text={shift.user?.name || 'Unknown'} width={140} />
                <AppDataTableCell text={new Date(shift.startedAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} width={160} />
                <AppDataTableCell text={shift.status} width={100} />
                <AppDataTableCell text={shift.expectedClosingCash ? formatPeso(parseFloat(shift.expectedClosingCash)) : '-'} width={120} numeric />
                <AppDataTableCell text={shift.closingCash ? formatPeso(parseFloat(shift.closingCash)) : '-'} width={120} numeric />
                <AppDataTableCell width={120} numeric>
                  <Text style={{ color: varianceColor, fontFamily: fonts.semiBold }}>
                    {varianceText}
                  </Text>
                </AppDataTableCell>
                <AppDataTableCell width={200}>
                  <View style={styles.actionButtons}>
                    {shift.status === 'OPEN' ? (
                      <AppButton 
                        label="Force Close" 
                        variant="secondary" 
                        onPress={() => openActionModal(shift, 'FORCE_CLOSE')}
                        icon={({ color, size }) => <Lock color={colors.danger} size={14} />}
                        style={styles.actionBtn}
                        
                      />
                    ) : (
                      <AppButton 
                        label="Reopen" 
                        variant="secondary" 
                        onPress={() => openActionModal(shift, 'REOPEN')}
                        icon={({ color, size }) => <Unlock color={color} size={14} />}
                        style={styles.actionBtn}
                        
                      />
                    )}
                  </View>
                </AppDataTableCell>
              </AppDataTableRow>
            );
          })}
        </AppDataTable>
      </View>

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
  tableWrapper: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    paddingHorizontal: spacing.sm,
    minHeight: 32,
    height: 32,
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
