import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { UserRoundPlus } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import type { Category } from '../admin-products/products-screen-data';
import { AdminModalShell } from '../ui/admin-modal-shell';
import { AppButton } from '../ui/app-button';
import { FilterChip } from '../ui/filter-chip';
import { ModalActions } from '../ui/modal-actions';
import { ProductFormInput } from '../ui/product-form-input';
import { radius, spacing } from '../../constants/design-system';
import { colors, textRoles, textSizes } from '../../constants/theme';
import { addCashierSchema, type AddCashierFormValues } from '../../lib/form-schemas';

type AddCashierModalProps = {
  cashiersSaving: boolean;
  categories: Category[];
  formMessage: string;
  onClose: () => void;
  onSave: (values: AddCashierFormValues) => void;
  visible: boolean;
};

export function AddCashierModal({
  cashiersSaving,
  categories,
  formMessage,
  onClose,
  onSave,
  visible,
}: AddCashierModalProps) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<AddCashierFormValues>({
    defaultValues: {
      allowedCategoryIds: [],
      name: '',
      password: '',
      username: '',
    },
    resolver: zodResolver(addCashierSchema),
  });

  const selectedCategoryIds = watch('allowedCategoryIds');

  useEffect(() => {
    if (visible) {
      reset({
        allowedCategoryIds: [],
        name: '',
        password: '',
        username: '',
      });
    }
  }, [reset, visible]);

  function toggleCategory(categoryId: number) {
    const nextIds = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter((value) => value !== categoryId)
      : [...selectedCategoryIds, categoryId];

    setValue('allowedCategoryIds', nextIds, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  return (
    <AdminModalShell
      footer={
        <ModalActions stacked>
          <AppButton
            disabled={categories.length === 0}
            label="Create Cashier"
            loading={cashiersSaving}
            onPress={handleSubmit(onSave)}
            variant="primary"
          />
          <AppButton
            disabled={cashiersSaving}
            label="Cancel"
            onPress={onClose}
            variant="secondary"
          />
        </ModalActions>
      }
      headerLead={
        <View style={styles.headerLead}>
          <UserRoundPlus color={colors.secondary} size={18} strokeWidth={2.1} />
        </View>
      }
      maxHeight="88%"
      onClose={onClose}
      title="Add Cashier"
      visible={visible}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <ProductFormInput
              compact
              errorMessage={errors.name?.message}
              label="CASHIER NAME"
              onChangeText={onChange}
              placeholder="Enter cashier full name"
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, value } }) => (
            <ProductFormInput
              compact
              errorMessage={errors.username?.message}
              label="USERNAME"
              onChangeText={onChange}
              placeholder="Create a login username"
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <ProductFormInput
              compact
              errorMessage={errors.password?.message}
              label="PASSWORD"
              onChangeText={onChange}
              placeholder="At least 6 characters"
              secureTextEntry
              value={value}
            />
          )}
        />

        <View style={styles.categorySection}>
          <Text style={styles.modalSectionLabel}>ALLOWED CATEGORIES</Text>
          <Text style={styles.modalSectionText}>
            Choose the categories this cashier is allowed to sell. Their cashier product list will
            only show items from the selected categories.
          </Text>
        </View>

        <View style={styles.modalCategoryWrap}>
        {categories.map((category) => (
            <FilterChip
              key={category.id}
              active={selectedCategoryIds.includes(category.id)}
              label={category.name}
              onPress={() => toggleCategory(category.id)}
            />
          ))}
        </View>

        {errors.allowedCategoryIds?.message ? (
          <Text style={styles.formErrorText}>{errors.allowedCategoryIds.message}</Text>
        ) : null}

        {formMessage ? <Text style={styles.formErrorText}>{formMessage}</Text> : null}
      </ScrollView>
    </AdminModalShell>
  );
}

const styles = StyleSheet.create({
  headerLead: {
    alignItems: 'center',
    backgroundColor: colors.surfaceBrandSoft,
    borderRadius: radius.round,
    height: 34,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 34,
  },
  categorySection: {
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  modalSectionLabel: {
    color: colors.textSecondary,
    ...textRoles.label,
    fontSize: textSizes.small,
    letterSpacing: 1.1,
    marginBottom: spacing.xs,
  },
  modalSectionText: {
    color: colors.textTertiary,
    ...textRoles.body,
    fontSize: textSizes.body,
    lineHeight: 21,
  },
  modalCategoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  formErrorText: {
    color: colors.dangerStrong,
    ...textRoles.label,
    fontSize: textSizes.small + 1,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
});
