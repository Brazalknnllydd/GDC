import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AdminModalShell } from '../ui/admin-modal-shell';
import { AppButton } from '../ui/app-button';
import { ModalActions } from '../ui/modal-actions';
import { ProductFormInput } from '../ui/product-form-input';
import { colors, fonts, textSizes } from '../../constants/theme';
import { spacing } from '../../constants/design-system';
import { apiClient } from '../../lib/api';
import { formatPeso } from '../../lib/product-utils';
import { useToastStore } from '../../store/toast-store';
import { useResponsiveLayout } from '../../hooks/use-responsive-layout';

type ShiftCloseModalProps = {
  expectedCash: number | null | undefined;
  shiftId: number | null | undefined;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function ShiftCloseModal({ expectedCash, shiftId, visible, onClose, onSuccess }: ShiftCloseModalProps) {
  const [actualCash, setActualCash] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { isTablet } = useResponsiveLayout();

  const handleCloseShift = async () => {
    if (!shiftId) return;

    const cleanCash = actualCash.replace(/,/g, '');
    const amount = Number(cleanCash);
    if (isNaN(amount) || amount < 0) {
      setError('Please enter a valid amount.');
      useToastStore.getState().showToast('Enter a valid closing cash amount.', 'error');
      return;
    }

    if (expectedCash === null || expectedCash === undefined) {
      setError('Expected cash is unavailable. Refresh the shift and try again.');
      useToastStore.getState().showToast('Expected cash is unavailable. Please refresh and try again.', 'error');
      return;
    }

    if (Math.round(amount * 100) !== Math.round(expectedCash * 100)) {
      const message = `Closing cash must match the expected amount of ${formatPeso(expectedCash)}.`;
      setError(message);
      useToastStore.getState().showToast(message, 'error');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await apiClient.put(`/shifts/${shiftId}/close`, {
        closingCash: amount,
      });
      useToastStore.getState().showToast('Shift closed successfully', 'success');
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to close shift.';
      setError(msg);
      useToastStore.getState().showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminModalShell
      compact={!isTablet}
      title="Close Shift"
      visible={visible}
      onClose={onClose}
      height={isTablet ? 420 : 380}
      maxHeight={isTablet ? '72%' : '68%'}
      footer={
        <ModalActions>
          <AppButton label="Cancel" variant="secondary" onPress={onClose} disabled={isLoading} />
          <AppButton label="Confirm Close" variant="primary" onPress={handleCloseShift} loading={isLoading} />
        </ModalActions>
      }
    >
      <View style={styles.container}>
        <Text style={styles.description}>
          Count the cash in your drawer and enter the exact expected amount to close your shift.
        </Text>

        <View style={styles.expectedCashCard}>
          <Text style={styles.expectedCashLabel}>EXPECTED CASH</Text>
          <Text style={styles.expectedCashValue}>
            {expectedCash !== null && expectedCash !== undefined ? formatPeso(expectedCash) : 'Unavailable'}
          </Text>
        </View>
        
        <ProductFormInput
          label="ACTUAL CASH IN DRAWER"
          placeholder="0.00"
          value={actualCash}
          onChangeText={(val) => {
            setActualCash(val);
            setError('');
          }}
          keyboardType="decimal-pad"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </AdminModalShell>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.md,
  },
  description: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  expectedCashCard: {
    backgroundColor: colors.surfaceBrandSoft,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  expectedCashLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
    letterSpacing: 1,
  },
  expectedCashValue: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: 20,
    marginTop: spacing.xs,
  },
  errorText: {
    color: colors.danger,
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
    marginTop: spacing.sm,
  },
});
