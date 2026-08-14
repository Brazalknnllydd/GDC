import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AdminModalShell } from '../ui/admin-modal-shell';
import { AppButton } from '../ui/app-button';
import { ModalActions } from '../ui/modal-actions';
import { ProductFormInput } from '../ui/product-form-input';
import { colors, fonts, textSizes } from '../../constants/theme';
import { spacing } from '../../constants/design-system';
import { apiClient } from '../../lib/api';
import { useToastStore } from '../../store/toast-store';

type ShiftCloseModalProps = {
  shiftId: number | null | undefined;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function ShiftCloseModal({ shiftId, visible, onClose, onSuccess }: ShiftCloseModalProps) {
  const [actualCash, setActualCash] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCloseShift = async () => {
    if (!shiftId) return;

    const cleanCash = actualCash.replace(/,/g, '');
    const amount = Number(cleanCash);
    if (isNaN(amount) || amount < 0) {
      setError('Please enter a valid amount.');
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
      title="Close Shift"
      visible={visible}
      onClose={onClose}
      height={380}
      footer={
        <ModalActions>
          <AppButton label="Cancel" variant="secondary" onPress={onClose} disabled={isLoading} />
          <AppButton label="Confirm Close" variant="primary" onPress={handleCloseShift} loading={isLoading} />
        </ModalActions>
      }
    >
      <View style={styles.container}>
        <Text style={styles.description}>
          Enter the exact amount of cash currently in the drawer to close your shift. The system will automatically calculate any shortages or overages.
        </Text>
        
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
  errorText: {
    color: colors.danger,
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
    marginTop: spacing.sm,
  },
});
