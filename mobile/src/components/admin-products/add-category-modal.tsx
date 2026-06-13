import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, textRoles, textSizes } from '../../constants/theme';
import { AdminModalShell } from '../ui/admin-modal-shell';
import { ProductFormInput } from '../ui/product-form-input';

type AddCategoryModalProps = {
  categoryError: string;
  isSavingCategory: boolean;
  newCategoryName: string;
  onChangeCategoryName: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  visible: boolean;
};

export function AddCategoryModal({
  categoryError,
  isSavingCategory,
  newCategoryName,
  onChangeCategoryName,
  onClose,
  onSave,
  visible,
}: AddCategoryModalProps) {
  return (
    <AdminModalShell
      onClose={onClose}
      title="Add Category"
      visible={visible}
      footer={
        <View style={styles.footerActions}>
          <Pressable onPress={onClose} style={[styles.actionButton, styles.cancelButton]}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable onPress={onSave} style={[styles.actionButton, styles.saveButton]}>
            <Text style={styles.saveButtonText}>{isSavingCategory ? 'Saving...' : 'Save'}</Text>
          </Pressable>
        </View>
      }>
      <View style={styles.body}>
        <ProductFormInput
          label="CATEGORY NAME"
          onChangeText={onChangeCategoryName}
          placeholder="e.g. Frozen Meat"
          value={newCategoryName}
        />

        {categoryError ? <Text style={styles.errorText}>{categoryError}</Text> : null}
      </View>
    </AdminModalShell>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingBottom: 20,
  },
  errorText: {
    color: '#C62828',
    ...textRoles.label,
    fontSize: 13,
    marginTop: 12,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
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
  saveButton: {
    backgroundColor: colors.secondary,
    borderRadius: 2,
  },
  saveButtonText: {
    color: '#FFFFFF',
    ...textRoles.label,
    fontSize: textSizes.medium - 1,
  },
});
