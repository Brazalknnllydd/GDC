import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Camera, ChevronDown, ImagePlus, ScanLine, Trash2 } from 'lucide-react-native';
import { Image } from 'expo-image';

import type { Category } from './products-screen-data';
import { radius, spacing } from '../../constants/design-system';
import { colors, textRoles, textSizes } from '../../constants/theme';
import { resolveApiAssetUrl } from '../../lib/api';
import { AdminModalShell } from '../ui/admin-modal-shell';
import { AppButton } from '../ui/app-button';
import { ProductFormInput } from '../ui/product-form-input';

type AddProductModalProps = {
  barcode: string;
  categories: Category[];
  categoryValue: string;
  costPrice: string;
  errorMessage: string;
  fieldErrors: Partial<
    Record<'name' | 'category' | 'costPrice' | 'sellingPrice' | 'stock' | 'weightVolume', string>
  >;
  imagePreviewUri: string | null;
  initialStock: string;
  isSaving: boolean;
  onBarcodeChange: (value: string) => void;
  onCategorySelect: (value: string) => void;
  onClose: () => void;
  onCostPriceChange: (value: string) => void;
  onInitialStockChange: (value: string) => void;
  onOpenCamera: () => void;
  onPickImage: () => void;
  onRemoveImage: () => void;
  onRequestCreateCategory: () => void;
  onProductNameChange: (value: string) => void;
  onSave: () => void;
  onUnitPriceChange: (value: string) => void;
  onWeightVolumeChange: (value: string) => void;
  productActionLabel: string;
  productName: string;
  selectedCategory: string;
  submittingLabel: string;
  unitPrice: string;
  visible: boolean;
  weightVolume: string;
};

export function AddProductModal({
  barcode,
  categories,
  categoryValue,
  costPrice,
  errorMessage,
  fieldErrors,
  imagePreviewUri,
  initialStock,
  isSaving,
  onBarcodeChange,
  onCategorySelect,
  onClose,
  onCostPriceChange,
  onInitialStockChange,
  onOpenCamera,
  onPickImage,
  onRemoveImage,
  onRequestCreateCategory,
  onProductNameChange,
  onSave,
  onUnitPriceChange,
  onWeightVolumeChange,
  productActionLabel,
  productName,
  selectedCategory,
  submittingLabel,
  unitPrice,
  visible,
  weightVolume,
}: AddProductModalProps) {
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const { height, width } = useWindowDimensions();
  const isSingleColumn = width < 680;
  const isPhone = width < 680;
  const resolvedImagePreviewUri = resolveApiAssetUrl(imagePreviewUri);

  useEffect(() => {
    if (!visible) {
      setCategoryDropdownOpen(false);
    }
  }, [visible]);

  return (
    <AdminModalShell
      height={isPhone ? Math.min(height * 0.82, 720) : undefined}
      maxHeight="92%"
      onClose={onClose}
      title={productActionLabel}
      visible={visible}
      footer={
        <AppButton
          label={isSaving ? submittingLabel : productActionLabel}
          loading={isSaving}
          onPress={onSave}
          size="xl"
          variant="primary"
        />
      }>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        style={styles.formScroll}>
        <View style={styles.imageSection}>
          <Text style={styles.fieldLabel}>PRODUCT IMAGE</Text>
          <Pressable onPress={onPickImage} style={styles.imagePicker}>
            {resolvedImagePreviewUri ? (
              <Image
                contentFit="cover"
                source={{ uri: resolvedImagePreviewUri }}
                style={styles.imagePreview}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <ImagePlus color={colors.secondary} size={28} strokeWidth={2} />
                <Text style={styles.imagePlaceholderTitle}>Add product photo</Text>
                <Text style={styles.imagePlaceholderText}>
                  Tap here to pick from the gallery, or use the camera button below.
                </Text>
              </View>
            )}
          </Pressable>

          <View style={styles.imageActions}>
            <AppButton
              fullWidth={false}
              icon={({ color, size }) => <Camera color={color} size={size} strokeWidth={2} />}
              label="Open Camera"
              onPress={onOpenCamera}
              size="sm"
              variant="primary"
            />
            {resolvedImagePreviewUri ? (
              <AppButton
                fullWidth={false}
                icon={({ color, size }) => <Trash2 color={color} size={size} strokeWidth={2} />}
                label="Remove"
                onPress={onRemoveImage}
                size="sm"
                variant="dangerOutline"
              />
            ) : null}
          </View>
        </View>

        <ProductFormInput
          errorMessage={fieldErrors.name}
          label="PRODUCT NAME"
          onChangeText={onProductNameChange}
          placeholder="e.g. Frozen Atlantic Salmon"
          value={productName}
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>CATEGORY</Text>
          <Pressable
            onPress={() => setCategoryDropdownOpen((current) => !current)}
            style={[
              styles.dropdownTrigger,
              fieldErrors.category ? styles.dropdownTriggerError : undefined,
              categoryDropdownOpen && styles.dropdownTriggerOpen,
            ]}>
            <Text
              style={[
                styles.dropdownTriggerText,
                !categoryValue && styles.dropdownPlaceholderText,
              ]}>
              {categoryValue || 'Select a category'}
            </Text>
            <ChevronDown
              color="#4B5060"
              size={24}
              strokeWidth={2.2}
              style={categoryDropdownOpen ? styles.dropdownChevronOpen : undefined}
            />
          </Pressable>

          {categoryDropdownOpen ? (
            <View style={styles.dropdownMenu}>
              <ScrollView
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                style={styles.dropdownScroll}>
                {categories.map((category, index) => (
                  <Pressable
                    key={category.id}
                    onPress={() => {
                      onCategorySelect(category.name);
                      setCategoryDropdownOpen(false);
                    }}
                    style={[
                      styles.dropdownOption,
                      selectedCategory === category.name && styles.dropdownOptionActive,
                      index < categories.length - 1 && styles.dropdownOptionBorder,
                    ]}>
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        selectedCategory === category.name && styles.dropdownOptionTextActive,
                      ]}>
                      {category.name}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => {
                    setCategoryDropdownOpen(false);
                    onRequestCreateCategory();
                  }}
                  style={styles.createCategoryOption}>
                  <Text style={styles.createCategoryText}>+ Add new category</Text>
                </Pressable>
              </ScrollView>
            </View>
          ) : null}
          {fieldErrors.category ? (
            <Text style={styles.fieldErrorText}>{fieldErrors.category}</Text>
          ) : null}
        </View>

        <ProductFormInput
          keyboardType="numeric"
          label="BARCODE / SKU"
          onChangeText={onBarcodeChange}
          placeholder="0000 0000 0000"
          rightSlot={
            <View style={styles.barcodeSlot}>
              <ScanLine color={colors.secondary} size={24} strokeWidth={2.1} />
            </View>
          }
          value={barcode}
        />

        <View style={[styles.twoColumnRow, isSingleColumn && styles.singleColumnRow]}>
          <View style={styles.halfField}>
            <ProductFormInput
              errorMessage={fieldErrors.costPrice}
              keyboardType="number-pad"
              label="COST PRICE (P)"
              onChangeText={onCostPriceChange}
              placeholder="0"
              value={costPrice}
            />
          </View>
          <View style={[styles.halfField, isSingleColumn && styles.fullField]}>
            <ProductFormInput
              errorMessage={fieldErrors.sellingPrice}
              keyboardType="number-pad"
              label="SELLING PRICE (P)"
              onChangeText={onUnitPriceChange}
              placeholder="0"
              value={unitPrice}
            />
          </View>
        </View>

        <View style={[styles.twoColumnRow, isSingleColumn && styles.singleColumnRow]}>
          <View style={styles.halfField}>
            <ProductFormInput
              errorMessage={fieldErrors.stock}
              keyboardType="number-pad"
              label="INITIAL STOCK"
              onChangeText={onInitialStockChange}
              placeholder="0"
              value={initialStock}
            />
          </View>
          <View style={[styles.halfField, isSingleColumn && styles.fullField]}>
            <ProductFormInput
              errorMessage={fieldErrors.weightVolume}
              label="WEIGHT / VOLUME"
              onChangeText={onWeightVolumeChange}
              placeholder="e.g. 500g"
              value={weightVolume}
            />
          </View>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </ScrollView>
    </AdminModalShell>
  );
}

const styles = StyleSheet.create({
  formScroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
    paddingTop: 8,
  },
  imageSection: {
    marginBottom: spacing.section,
  },
  fieldGroup: {
    marginBottom: 26,
  },
  fieldLabel: {
    color: '#373C4A',
    ...textRoles.label,
    fontSize: textSizes.medium,
    letterSpacing: 3,
    marginBottom: 14,
  },
  imagePicker: {
    backgroundColor: '#F3F5FA',
    borderColor: '#D4DAE7',
    borderRadius: radius.xl,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    minHeight: 190,
    overflow: 'hidden',
  },
  imagePreview: {
    height: 220,
    width: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 190,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  imagePlaceholderTitle: {
    color: '#172033',
    ...textRoles.value,
    fontSize: 18,
    marginTop: 12,
  },
  imagePlaceholderText: {
    color: '#6A7284',
    ...textRoles.label,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  imageActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  dropdownTrigger: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#C8CDDD',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 86,
    paddingHorizontal: 20,
  },
  dropdownTriggerOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownTriggerError: {
    borderColor: '#C62828',
  },
  dropdownTriggerText: {
    color: '#14171F',
    ...textRoles.body,
    flex: 1,
    fontSize: 18,
    marginRight: 10,
  },
  dropdownPlaceholderText: {
    color: '#737A8D',
  },
  dropdownChevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C8CDDD',
    borderTopWidth: 0,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderWidth: 1,
    maxHeight: 220,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 220,
  },
  dropdownOption: {
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: 20,
  },
  dropdownOptionActive: {
    backgroundColor: '#EEF1FF',
  },
  dropdownOptionBorder: {
    borderBottomColor: '#E5E8F0',
    borderBottomWidth: 1,
  },
  dropdownOptionText: {
    color: '#1F2533',
    ...textRoles.body,
    fontSize: 17,
  },
  dropdownOptionTextActive: {
    color: colors.secondary,
    ...textRoles.value,
  },
  fieldErrorText: {
    color: '#C62828',
    ...textRoles.label,
    fontSize: 13,
    marginTop: 10,
  },
  createCategoryOption: {
    borderTopColor: '#E5E8F0',
    borderTopWidth: 1,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: 20,
  },
  createCategoryText: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: 16,
  },
  barcodeSlot: {
    alignItems: 'center',
    backgroundColor: '#F2F3F7',
    borderRadius: 14,
    height: 64,
    justifyContent: 'center',
    width: 88,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 14,
  },
  singleColumnRow: {
    flexDirection: 'column',
    gap: 0,
  },
  halfField: {
    flex: 1,
  },
  fullField: {
    width: '100%',
  },
  errorText: {
    color: '#C62828',
    ...textRoles.label,
    fontSize: 13,
    marginTop: 8,
  },
});
