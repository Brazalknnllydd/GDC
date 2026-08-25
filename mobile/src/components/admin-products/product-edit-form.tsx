import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { getApiErrorMessage } from '../../lib/api-errors';
import { useToastStore } from '../../store/toast-store';
import { AddProductModal } from './add-product-modal';
import type { Category, Product } from './products-screen-data';
import { normalizeNumber, parseWeight } from '../../lib/product-utils';
import * as ImagePicker from 'expo-image-picker';

type SelectedProductImage = {
  file?: File;
  fileName?: string | null;
  mimeType?: string | null;
  uri: string;
};

type ProductFieldErrors = Partial<
  Record<'name' | 'category' | 'costPrice' | 'sellingPrice' | 'stock' | 'weightVolume', string>
>;

export function ProductEditForm({
  visible,
  onClose,
  productToEdit,
  categories,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  productToEdit: Product | null;
  categories: Category[];
  onSuccess: (message: string) => void;
}) {
  const queryClient = useQueryClient();

  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [categoryValue, setCategoryValue] = useState('');
  const [barcode, setBarcode] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [initialStock, setInitialStock] = useState('');
  const [weightVolume, setWeightVolume] = useState('');
  const [productImageUri, setProductImageUri] = useState<string | null>(null);
  const [productImageAsset, setProductImageAsset] = useState<SelectedProductImage | null>(null);

  const [productError, setProductError] = useState('');
  const [productFieldErrors, setProductFieldErrors] = useState<ProductFieldErrors>({});

  useEffect(() => {
    if (visible) {
      if (productToEdit) {
        setProductName(productToEdit.name);
        setProductDescription(productToEdit.description || '');
        setCategoryValue(productToEdit.category.name);
        setBarcode(productToEdit.barcode || '');
        setCostPrice(String(normalizeNumber(productToEdit.costPrice)));
        setUnitPrice(String(normalizeNumber(productToEdit.price)));
        setInitialStock(String(productToEdit.stock));
        setProductImageUri(productToEdit.imageUrl || null);
        setProductImageAsset(null);
        setWeightVolume(
          productToEdit.weight !== null && productToEdit.weight !== undefined
            ? `${productToEdit.weight}${productToEdit.unit !== 'pcs' ? productToEdit.unit : ''}`
            : ''
        );
      } else {
        setProductName('');
        setProductDescription('');
        setCategoryValue(categories[0]?.name || '');
        setBarcode('');
        setCostPrice('');
        setUnitPrice('');
        setInitialStock('');
        setWeightVolume('');
        setProductImageUri(null);
        setProductImageAsset(null);
      }
      setProductError('');
      setProductFieldErrors({});
    }
  }, [visible, productToEdit, categories]);

  const saveMutation = useMutation({
    mutationFn: async (payload: FormData) => {
      if (productToEdit) {
        const res = await apiClient.put<Product>(`/products/${productToEdit.id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
      } else {
        const res = await apiClient.post<Product>('/products', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onSuccess(`Product "${data.name}" ${productToEdit ? 'updated' : 'added'} successfully.`);
      onClose();
    },
    onError: (error) => {
      setProductError(error.message);
      useToastStore.getState().showToast(`Failed to save product: ${error.message}`, 'error');
    }
  });

  function buildFormData(categoryId: number) {
    const formData = new FormData();
    formData.append('name', productName.trim());
    formData.append('categoryId', String(categoryId));
    formData.append('costPrice', costPrice);
    formData.append('price', unitPrice);
    formData.append('stock', initialStock);
    
    if (productDescription.trim()) formData.append('description', productDescription.trim());
    if (barcode.trim()) formData.append('barcode', barcode.trim());
    
    const parsedWeight = parseWeight(weightVolume);
    if (parsedWeight) {
      if (parsedWeight !== null) formData.append('weight', String(parsedWeight));
      formData.append('unit', 'pcs'); // just a hack since unit logic was simplified
    }

    if (productImageUri === null) {
      formData.append('removeImage', 'true');
    } else if (productImageAsset) {
      if (productImageAsset.file) {
        formData.append('image', productImageAsset.file);
      } else {
        const extensionMatch = productImageAsset.fileName?.match(/\.(\w+)$/) ?? productImageAsset.uri.match(/\.(\w+)(?:\?.*)?$/);
        const extension = extensionMatch?.[1]?.toLowerCase() || 'jpg';
        const mimeType = productImageAsset.mimeType || (extension === 'png' ? 'image/png' : 'image/jpeg');
        const fileName = productImageAsset.fileName || `product-image.${extension}`;
        
        formData.append('image', {
          uri: productImageAsset.uri,
          name: fileName,
          type: mimeType,
        } as unknown as Blob);
      }
    }
    return formData;
  }

  const handleSave = () => {
    const trimmedName = productName.trim();
    const matchedCategory = categories.find((c) => c.name === categoryValue);
    const nextFieldErrors: ProductFieldErrors = {};

    if (!trimmedName) nextFieldErrors.name = 'Product name is required.';
    if (!matchedCategory) nextFieldErrors.category = 'Please select a category.';
    if (!costPrice) nextFieldErrors.costPrice = 'Cost price is required.';
    else if (Number(costPrice) <= 0) nextFieldErrors.costPrice = 'Cost price must be greater than zero.';
    if (!unitPrice) nextFieldErrors.sellingPrice = 'Selling price is required.';
    else if (Number(unitPrice) <= 0) nextFieldErrors.sellingPrice = 'Selling price must be greater than zero.';
    if (!initialStock) nextFieldErrors.stock = 'Initial stock is required.';
    if (!weightVolume.trim()) nextFieldErrors.weightVolume = 'Weight / volume is required.';
    else if (parseWeight(weightVolume) === null) nextFieldErrors.weightVolume = 'Enter a valid weight / volume value.';

    setProductFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) {
      setProductError('Please fix the highlighted fields.');
      return;
    }
    
    if (!matchedCategory) return;
    
    const payload = buildFormData(matchedCategory.id);
    saveMutation.mutate(payload);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setProductImageUri(asset.uri);
      setProductImageAsset({ uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType });
    }
  };

  const handleOpenCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setProductError('Camera permission is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setProductImageUri(asset.uri);
      setProductImageAsset({ uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType });
    }
  };

  return (
    <AddProductModal
      visible={visible}
      onClose={onClose}
      productName={productName}
      onProductNameChange={setProductName}
      productDescription={productDescription}
      onProductDescriptionChange={setProductDescription}
      barcode={barcode}
      onBarcodeChange={setBarcode}
      categoryValue={categoryValue}
      onCategorySelect={setCategoryValue}
      categories={categories}
      costPrice={costPrice}
      onCostPriceChange={setCostPrice}
      unitPrice={unitPrice}
      onUnitPriceChange={setUnitPrice}
      initialStock={initialStock}
      onInitialStockChange={setInitialStock}
      weightVolume={weightVolume}
      onWeightVolumeChange={setWeightVolume}
      imagePreviewUri={productImageUri}
      onPickImage={handlePickImage}
      onOpenCamera={handleOpenCamera}
      onRemoveImage={() => {
        setProductImageUri(null);
        setProductImageAsset(null);
      }}
      errorMessage={productError}
      fieldErrors={productFieldErrors}
      isSaving={saveMutation.isPending}
      onSave={handleSave}
      onRequestCreateCategory={() => {}}
      productActionLabel={productToEdit ? 'Save Changes' : 'Create Product'}
      submittingLabel={productToEdit ? 'Saving...' : 'Creating...'}
      selectedCategory={categoryValue}
    />
  );
}
