import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { spacing } from '../../constants/design-system';
import { colors, textRoles } from '../../constants/theme';
import { categoryFormSchema, type CategoryFormValues } from '../../lib/form-schemas';
import { AdminModalShell } from '../ui/admin-modal-shell';
import { AppButton } from '../ui/app-button';
import { ModalActions } from '../ui/modal-actions';
import { ProductFormInput } from '../ui/product-form-input';

type AddCategoryModalProps = {
  isSavingCategory: boolean;
  initialValues: {
    categoryDescription: string;
    categoryName: string;
  };
  mode: 'create' | 'edit';
  onClose: () => void;
  onSave: (values: CategoryFormValues) => void;
  serverError: string;
  visible: boolean;
};

export function AddCategoryModal({
  isSavingCategory,
  initialValues,
  mode,
  onClose,
  onSave,
  serverError,
  visible,
}: AddCategoryModalProps) {
  const isEditing = mode === 'edit';
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<CategoryFormValues>({
    defaultValues: initialValues,
    resolver: zodResolver(categoryFormSchema),
  });

  useEffect(() => {
    if (visible) {
      reset(initialValues);
    }
  }, [initialValues, reset, visible]);

  return (
    <AdminModalShell
      height="52%"
      maxHeight="72%"
      onClose={onClose}
      title={isEditing ? 'Edit Category' : 'Add Category'}
      visible={visible}
      footer={
        <ModalActions>
          <AppButton label="Cancel" onPress={onClose} variant="secondary" />
          <AppButton
            label={isEditing ? 'Update' : 'Save'}
            loading={isSavingCategory}
            onPress={handleSubmit(onSave)}
            variant="primary"
          />
        </ModalActions>
      }>
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}>
        <Controller
          control={control}
          name="categoryName"
          render={({ field: { onChange, value } }) => (
            <ProductFormInput
              compact
              errorMessage={errors.categoryName?.message}
              label="CATEGORY NAME"
              onChangeText={onChange}
              placeholder="e.g. Frozen Meat"
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="categoryDescription"
          render={({ field: { onChange, value } }) => (
            <ProductFormInput
              compact
              errorMessage={errors.categoryDescription?.message}
              label="DESCRIPTION"
              multiline
              numberOfLines={4}
              onChangeText={onChange}
              placeholder="Short details about this category"
              value={value}
            />
          )}
        />

        {serverError ? <Text style={styles.errorText}>{serverError}</Text> : null}
      </ScrollView>
    </AdminModalShell>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingBottom: spacing.md,
  },
  errorText: {
    color: colors.dangerStrong,
    ...textRoles.label,
    fontSize: 13,
    marginTop: 12,
  },
});
