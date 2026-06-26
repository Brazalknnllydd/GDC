import { StyleSheet, Text, View } from 'react-native';
import { AlertTriangle, Trash2 } from 'lucide-react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, textRoles } from '../../constants/theme';
import { AdminModalShell } from '../ui/admin-modal-shell';
import { AppButton } from '../ui/app-button';
import { ModalActions } from '../ui/modal-actions';

type DeleteProductModalProps = {
  isDeleting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
  visible: boolean;
};

export function DeleteProductModal({
  isDeleting = false,
  onClose,
  onConfirm,
  productName,
  visible,
}: DeleteProductModalProps) {
  return (
    <AdminModalShell
      onClose={onClose}
      title="Delete Product"
      visible={visible}
      headerLead={
        <View style={styles.iconWrap}>
          <AlertTriangle color="#B3261E" size={18} strokeWidth={2.2} />
        </View>
      }
      footer={
        <ModalActions>
          <AppButton label="Cancel" onPress={onClose} variant="secondary" />
          <AppButton
            icon={({ color, size }) => <Trash2 color={color} size={size} strokeWidth={2.1} />}
            label="Delete"
            loading={isDeleting}
            onPress={onConfirm}
            variant="danger"
          />
        </ModalActions>
      }>
      <View style={styles.body}>
        <Text style={styles.message}>
          Are you sure you want to delete <Text style={styles.productName}>{productName}</Text>?
        </Text>
        <Text style={styles.subMessage}>
          This action will remove the product from your inventory list.
        </Text>
      </View>
    </AdminModalShell>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#FDECEC',
    borderRadius: radius.round,
    height: 34,
    justifyContent: 'center',
    marginRight: 12,
    width: 34,
  },
  body: {
    paddingBottom: spacing.xl,
  },
  message: {
    color: '#222734',
    ...textRoles.body,
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 8,
  },
  productName: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: 18,
  },
  subMessage: {
    color: '#667085',
    ...textRoles.label,
    fontSize: 13,
    lineHeight: 20,
  },
});
