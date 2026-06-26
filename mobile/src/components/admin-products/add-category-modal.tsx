import { StyleSheet, Text, View } from 'react-native';

import { textRoles } from '../../constants/theme';
import { AdminModalShell } from '../ui/admin-modal-shell';
import { AppButton } from '../ui/app-button';
import { ModalActions } from '../ui/modal-actions';
import { ProductFormInput } from '../ui/product-form-input';

type AddCategoryModalProps = {
  categoryDescription: string;
  categoryError: string;
  categoryName: string;
  isSavingCategory: boolean;
  mode: 'create' | 'edit';
  onChangeCategoryDescription: (value: string) => void;
  onChangeCategoryName: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  visible: boolean;
};

export function AddCategoryModal({
  categoryDescription,
  categoryError,
  categoryName,
  isSavingCategory,
  mode,
  onChangeCategoryDescription,
  onChangeCategoryName,
  onClose,
  onSave,
  visible,
}: AddCategoryModalProps) {
  const isEditing = mode === 'edit';

  return (
    <AdminModalShell
      onClose={onClose}
      title={isEditing ? 'Edit Category' : 'Add Category'}
      visible={visible}
      footer={
        <ModalActions>
          <AppButton label="Cancel" onPress={onClose} variant="secondary" />
          <AppButton
            label={isEditing ? 'Update' : 'Save'}
            loading={isSavingCategory}
            onPress={onSave}
            variant="primary"
          />
        </ModalActions>
      }>
      <View style={styles.body}>
        <ProductFormInput
          label="CATEGORY NAME"
          onChangeText={onChangeCategoryName}
          placeholder="e.g. Frozen Meat"
          value={categoryName}
        />

        <ProductFormInput
          label="DESCRIPTION"
          multiline
          numberOfLines={4}
          onChangeText={onChangeCategoryDescription}
          placeholder="Short details about this category"
          value={categoryDescription}
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
});
