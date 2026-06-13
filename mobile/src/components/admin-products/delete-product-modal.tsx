import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertTriangle, Trash2 } from 'lucide-react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, textRoles, textSizes } from '../../constants/theme';
import { AdminModalShell } from '../ui/admin-modal-shell';

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
        <View style={styles.footerActions}>
          <Pressable onPress={onClose} style={[styles.actionButton, styles.cancelButton]}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable onPress={onConfirm} style={[styles.actionButton, styles.deleteButton]}>
            <Trash2 color="#FFFFFF" size={16} strokeWidth={2.1} />
            <Text style={styles.deleteButtonText}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Text>
          </Pressable>
        </View>
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
  footerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 54,
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#AEB5D0',
    borderRadius: 2,
    borderWidth: 1.5,
  },
  cancelButtonText: {
    color: '#495098',
    ...textRoles.label,
    fontSize: textSizes.medium - 1,
  },
  deleteButton: {
    backgroundColor: '#C62828',
    borderRadius: 2,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    ...textRoles.label,
    fontSize: textSizes.medium - 1,
    marginLeft: 8,
  },
});
