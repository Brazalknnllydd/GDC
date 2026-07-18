import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { PackagePlus, Search, Shapes, Tags } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import { AddCategoryModal } from '../components/admin-products/add-category-modal';
import { DeleteCategoryModal } from '../components/admin-products/delete-category-modal';
import { DeleteProductModal } from '../components/admin-products/delete-product-modal';
import { AddProductModal } from '../components/admin-products/add-product-modal';
import { ManageCategoriesModal } from '../components/admin-products/manage-categories-modal';
import {
  baseOverviewCards,
  tabs,
  type Category,
  type Product,
} from '../components/admin-products/products-screen-data';
import { radius, shadows, spacing } from '../constants/design-system';
import { colors, fonts, textRoles, textSizes } from '../constants/theme';
import { usePagination } from '../hooks/use-pagination';
import {
  digitsOnly,
  formatCompactPeso,
  formatPeso,
  inferUnit,
  normalizeNumber,
  parseWeight,
} from '../lib/product-utils';
import { AdminMetricGrid } from '../components/ui/admin-metric-grid';
import { AdminPageScreen } from '../components/ui/admin-page-screen';
import { FilterChip } from '../components/ui/filter-chip';
import { InventoryStatCard } from '../components/ui/inventory-stat-card';
import { PaginationControls } from '../components/ui/pagination-controls';
import { ProductListItem } from '../components/ui/product-list-item';
import { SectionHeading } from '../components/ui/section-heading';
import { AppButton } from '../components/ui/app-button';
import { apiClient } from '../lib/api';
import type { CategoryFormValues } from '../lib/form-schemas';

const lowStockThreshold = 10;
const productsPerPage = 10;
type FeedbackState = {
  tone: 'success' | 'error';
  message: string;
} | null;
type ProductFieldErrors = Partial<
  Record<'name' | 'category' | 'costPrice' | 'sellingPrice' | 'stock' | 'weightVolume', string>
>;
type SelectedProductImage = {
  file?: File;
  fileName?: string | null;
  mimeType?: string | null;
  uri: string;
};

export default function AdminProductsScreen() {
  const { width } = useWindowDimensions();
  const isCompactPhone = width < 430;
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

  const [productName, setProductName] = useState('');
  const [categoryValue, setCategoryValue] = useState('');
  const [barcode, setBarcode] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [initialStock, setInitialStock] = useState('');
  const [weightVolume, setWeightVolume] = useState('');
  const [productImageUri, setProductImageUri] = useState<string | null>(null);
  const [productImageAsset, setProductImageAsset] = useState<SelectedProductImage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [productPendingDelete, setProductPendingDelete] = useState<Product | null>(null);

  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [productError, setProductError] = useState('');
  const [screenError, setScreenError] = useState('');
  const [productFieldErrors, setProductFieldErrors] = useState<ProductFieldErrors>({});
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [categoryPendingDelete, setCategoryPendingDelete] = useState<Category | null>(null);

  async function loadCategories() {
    const response = await apiClient.get<Category[]>('/categories');
    setCategories(response.data);
    setCategoryValue((currentValue) => currentValue || response.data[0]?.name || '');
  }

  async function loadProducts() {
    const response = await apiClient.get<Product[]>('/products');
    setProducts(response.data);
  }

  async function loadScreenData() {
    try {
      setScreenError('');
      setIsLoadingProducts(true);
      await Promise.all([loadCategories(), loadProducts()]);
    } catch {
      setScreenError('Could not load inventory right now.');
    } finally {
      setIsLoadingProducts(false);
    }
  }

  useEffect(() => {
    loadScreenData();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'All') {
      return;
    }

    const categoryStillExists = categories.some((category) => category.name === selectedCategory);

    if (!categoryStillExists) {
      setSelectedCategory('All');
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeout = setTimeout(() => setFeedback(null), 2600);
    return () => clearTimeout(timeout);
  }, [feedback]);

  function resetProductForm() {
    setEditingProductId(null);
    setProductName('');
    setCategoryValue(categories[0]?.name || '');
    setBarcode('');
    setCostPrice('');
    setUnitPrice('');
    setInitialStock('');
    setWeightVolume('');
    setProductImageUri(null);
    setProductImageAsset(null);
    setProductError('');
    setProductFieldErrors({});
  }

  function closeProductModal() {
    setShowAddProduct(false);
    resetProductForm();
  }

  function openCreateProductModal() {
    resetProductForm();
    setShowAddProduct(true);
  }

  function openEditProductModal(product: Product) {
    setEditingProductId(product.id);
    setProductName(product.name);
    setCategoryValue(product.category.name);
    setBarcode(product.barcode || '');
    setCostPrice(String(normalizeNumber(product.costPrice)));
    setUnitPrice(String(normalizeNumber(product.price)));
    setInitialStock(String(product.stock));
    setProductImageUri(product.imageUrl || null);
    setProductImageAsset(null);
    setWeightVolume(
      product.weight !== null && product.weight !== undefined
        ? `${product.weight}${product.unit !== 'pcs' ? product.unit : ''}`
        : ''
    );
    setProductError('');
    setShowAddProduct(true);
  }

  const categoryChips = useMemo(
    () => ['All', ...categories.map((category) => category.name)],
    [categories]
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' || product.category.name === selectedCategory;

      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.category.name.toLowerCase().includes(normalizedQuery) ||
        (product.barcode || '').toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [products, searchQuery, selectedCategory]);

  const categoriesWithCounts = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        productCount: products.filter((product) => product.categoryId === category.id).length,
      })),
    [categories, products]
  );

  const {
    endItem: productPageEnd,
    page: productPage,
    paginatedItems: paginatedProducts,
    setPage: setProductPage,
    startItem: productPageStart,
    totalPages: totalProductPages,
    visiblePageNumbers,
  } = usePagination({
    items: filteredProducts,
    itemsPerPage: productsPerPage,
    resetDependencies: [searchQuery, selectedCategory],
  });

  const overviewCards = useMemo(() => {
    const inventoryValue = products.reduce(
      (sum, product) => sum + normalizeNumber(product.price) * product.stock,
      0
    );
    const lowStockCount = products.filter((product) => product.stock <= lowStockThreshold).length;

    return baseOverviewCards.map((card) => {
      if (card.title === 'TOTAL\nPRODUCTS') {
        return { ...card, value: String(products.length) };
      }

      if (card.title === 'LOW STOCK') {
        return { ...card, value: String(lowStockCount) };
      }

      if (card.title === 'CATEGORIES') {
        return { ...card, value: String(categories.length) };
      }

      if (card.title === 'INVENTORY VALUE') {
        return {
          ...card,
          fullValue: formatPeso(inventoryValue),
          value: formatCompactPeso(inventoryValue),
        };
      }

      return card;
    });
  }, [categories.length, products]);

  const editingCategory = useMemo(
    () => categories.find((category) => category.id === editingCategoryId) ?? null,
    [categories, editingCategoryId]
  );

  async function handleSaveCategory(values: CategoryFormValues) {
    const trimmedName = values.categoryName.trim();
    const trimmedDescription = values.categoryDescription.trim();

    try {
      setIsSavingCategory(true);
      setCategoryError('');
      const payload = {
        description: trimmedDescription || null,
        name: trimmedName,
      };

      if (editingCategoryId) {
        const response = await apiClient.put<Category>(`/categories/${editingCategoryId}`, payload);
        setCategories((currentCategories) =>
          currentCategories
            .map((category) => (category.id === editingCategoryId ? response.data : category))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        setCategoryValue((currentValue) =>
          currentValue === categories.find((category) => category.id === editingCategoryId)?.name
            ? response.data.name
            : currentValue
        );
        setSelectedCategory((currentValue) =>
          currentValue === categories.find((category) => category.id === editingCategoryId)?.name
            ? response.data.name
            : currentValue
        );
        setFeedback({
          tone: 'success',
          message: `Category "${response.data.name}" updated successfully.`,
        });
      } else {
        const response = await apiClient.post<Category>('/categories', payload);
        setCategories((currentCategories) =>
          [...currentCategories, response.data].sort((a, b) => a.name.localeCompare(b.name))
        );
        setCategoryValue(response.data.name);
        setSelectedCategory(response.data.name);
        setFeedback({
          tone: 'success',
          message: `Category "${response.data.name}" added successfully.`,
        });
      }

      closeCategoryModal();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setCategoryError(error.response?.data?.message ?? 'Could not save category right now.');
        return;
      }

      setCategoryError('Could not save category right now.');
    } finally {
      setIsSavingCategory(false);
    }
  }

  function closeCategoryModal() {
    setShowAddCategory(false);
    setEditingCategoryId(null);
    setCategoryError('');
  }

  function openCreateCategoryModal() {
    setEditingCategoryId(null);
    setCategoryError('');
    setShowAddCategory(true);
  }

  function openEditCategoryModal(category: Category) {
    setEditingCategoryId(category.id);
    setCategoryError('');
    setShowAddCategory(true);
  }

  function openCategoryModalFromProduct() {
    openCreateCategoryModal();
  }

  function requestDeleteCategory(category: Category) {
    setCategoryPendingDelete(category);
  }

  function closeDeleteCategoryModal() {
    if (isDeletingCategory) {
      return;
    }

    setCategoryPendingDelete(null);
  }

  async function handleConfirmDeleteCategory() {
    if (!categoryPendingDelete) {
      return;
    }

    try {
      setIsDeletingCategory(true);
      await apiClient.delete(`/categories/${categoryPendingDelete.id}`);
      setCategories((currentCategories) =>
        currentCategories.filter((category) => category.id !== categoryPendingDelete.id)
      );
      setFeedback({
        tone: 'success',
        message: `Category "${categoryPendingDelete.name}" deleted successfully.`,
      });
      setCategoryPendingDelete(null);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setScreenError(error.response?.data?.message ?? 'Could not delete category right now.');
      } else {
        setScreenError('Could not delete category right now.');
      }
    } finally {
      setIsDeletingCategory(false);
    }
  }

  async function handlePickProductImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setProductError('Media library access is needed to choose a product image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled) {
      const selectedAsset = result.assets[0];
      if (!selectedAsset?.uri) {
        setProductError('Could not use the selected image.');
        return;
      }

      setProductImageUri(selectedAsset.uri);
      setProductImageAsset({
        file: (selectedAsset as ImagePicker.ImagePickerAsset & { file?: File }).file,
        fileName: selectedAsset.fileName,
        mimeType: selectedAsset.mimeType,
        uri: selectedAsset.uri,
      });
      setProductError('');
    }
  }

  async function handleOpenProductCamera() {
    if (Platform.OS === 'web') {
      setProductError('Camera capture is available on the mobile app. Tap the photo area to pick an image on web.');
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setProductError('Camera access is needed to take a product image.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      cameraType: ImagePicker.CameraType.back,
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled) {
      const selectedAsset = result.assets[0];
      if (!selectedAsset?.uri) {
        setProductError('Could not use the captured image.');
        return;
      }

      setProductImageUri(selectedAsset.uri);
      setProductImageAsset({
        file: (selectedAsset as ImagePicker.ImagePickerAsset & { file?: File }).file,
        fileName: selectedAsset.fileName,
        mimeType: selectedAsset.mimeType,
        uri: selectedAsset.uri,
      });
      setProductError('');
    }
  }

  function buildProductFormData(categoryId: number) {
    const formData = new FormData();

    formData.append('name', productName.trim());
    formData.append('barcode', barcode.trim());
    formData.append('costPrice', costPrice);
    formData.append('price', unitPrice);
    formData.append('stock', initialStock);
    formData.append('weight', String(parseWeight(weightVolume) ?? ''));
    formData.append('unit', inferUnit(weightVolume));
    formData.append('categoryId', String(categoryId));

    if (!productImageUri) {
      if (editingProductId) {
        formData.append('removeImage', 'true');
      }

      return formData;
    }

    if (!productImageAsset) {
      return formData;
    }

    if (productImageAsset.file) {
      formData.append('image', productImageAsset.file);
      return formData;
    }

    const extensionMatch =
      productImageAsset.fileName?.match(/\.(\w+)$/) ??
      productImageAsset.uri.match(/\.(\w+)(?:\?.*)?$/);
    const extension = extensionMatch?.[1]?.toLowerCase() || 'jpg';
    const mimeType = productImageAsset.mimeType || (extension === 'png' ? 'image/png' : 'image/jpeg');
    const fileName = productImageAsset.fileName || `product-image.${extension}`;

    formData.append('image', {
      uri: productImageAsset.uri,
      name: fileName,
      type: mimeType,
    } as any);

    return formData;
  }

  async function handleSaveProduct() {
    const trimmedName = productName.trim();
    const matchedCategory = categories.find((category) => category.name === categoryValue);
    const nextFieldErrors: ProductFieldErrors = {};

    if (!trimmedName) {
      nextFieldErrors.name = 'Product name is required.';
    }

    if (!matchedCategory) {
      nextFieldErrors.category = 'Please select a category.';
    }

    if (!costPrice) {
      nextFieldErrors.costPrice = 'Cost price is required.';
    } else if (Number(costPrice) <= 0) {
      nextFieldErrors.costPrice = 'Cost price must be greater than zero.';
    }

    if (!unitPrice) {
      nextFieldErrors.sellingPrice = 'Selling price is required.';
    } else if (Number(unitPrice) <= 0) {
      nextFieldErrors.sellingPrice = 'Selling price must be greater than zero.';
    }

    if (!initialStock) {
      nextFieldErrors.stock = 'Initial stock is required.';
    }

    if (!weightVolume.trim()) {
      nextFieldErrors.weightVolume = 'Weight / volume is required.';
    } else if (parseWeight(weightVolume) === null) {
      nextFieldErrors.weightVolume = 'Enter a valid weight / volume value.';
    }

    setProductFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length > 0) {
      setProductError('Please fix the highlighted fields.');
      return;
    }

    if (!matchedCategory) {
      setProductError('Please select a category.');
      return;
    }

    try {
      setIsSavingProduct(true);
      setProductError('');
      setProductFieldErrors({});
      const payload = buildProductFormData(matchedCategory.id);

      if (editingProductId) {
        const response = await apiClient.put<Product>(`/products/${editingProductId}`, payload, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setProducts((currentProducts) =>
          currentProducts.map((product) =>
            product.id === editingProductId ? response.data : product
          )
        );
        setFeedback({
          tone: 'success',
          message: `Product "${response.data.name}" updated successfully.`,
        });
      } else {
        const response = await apiClient.post<Product>('/products', payload, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setProducts((currentProducts) => [response.data, ...currentProducts]);
        setFeedback({
          tone: 'success',
          message: `Product "${response.data.name}" added successfully.`,
        });
      }

      closeProductModal();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setProductError(error.response?.data?.message ?? 'Could not save product right now.');
        return;
      }

      setProductError('Could not save product right now.');
    } finally {
      setIsSavingProduct(false);
    }
  }

  function requestDeleteProduct(product: Product) {
    setProductPendingDelete(product);
  }

  function closeDeleteProductModal() {
    if (isDeletingProduct) {
      return;
    }

    setProductPendingDelete(null);
  }

  async function handleConfirmDeleteProduct() {
    if (!productPendingDelete) {
      return;
    }

    try {
      setIsDeletingProduct(true);
      await apiClient.delete(`/products/${productPendingDelete.id}`);
      setProducts((currentProducts) =>
        currentProducts.filter((currentProduct) => currentProduct.id !== productPendingDelete.id)
      );
      setFeedback({
        tone: 'success',
        message: `Product "${productPendingDelete.name}" deleted successfully.`,
      });
      setProductPendingDelete(null);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setScreenError(error.response?.data?.message ?? 'Could not delete product right now.');
      } else {
        setScreenError('Could not delete product right now.');
      }
    } finally {
      setIsDeletingProduct(false);
    }
  }

  return (
    <AdminPageScreen
      title="Products"
      introDescription="Manage inventory and pricing across all stores."
      bottomNavItems={tabs}>
      <View style={[styles.categoryActionsRow, isCompactPhone && styles.categoryActionsColumn]}>
        <AppButton
          fullWidth={isCompactPhone}
          icon={({ color, size }) => <PackagePlus color={color} size={size} strokeWidth={2.1} />}
          label="Add Product"
          onPress={openCreateProductModal}
          size="sm"
          style={isCompactPhone ? styles.mobileActionButton : styles.desktopActionButton}
          variant="primary"
        />
        <AppButton
          fullWidth={isCompactPhone}
          icon={({ color, size }) => <Tags color={color} size={size} strokeWidth={2.1} />}
          label="Add Category"
          onPress={openCreateCategoryModal}
          size="sm"
          style={isCompactPhone ? styles.mobileActionButton : styles.desktopActionButton}
          variant="primary"
        />
        <AppButton
          fullWidth={isCompactPhone}
          icon={({ color, size }) => <Shapes color={color} size={size} strokeWidth={2.1} />}
          label="Manage Categories"
          onPress={() => setShowManageCategories(true)}
          size="sm"
          style={isCompactPhone ? styles.mobileActionButton : styles.desktopActionButton}
          variant="secondary"
        />
      </View>

      <AdminMetricGrid>
        {overviewCards.map((card) => (
          <InventoryStatCard
            key={card.title}
            accent={card.accent}
            detail={card.detail}
            infoDialogTitle={card.title.replace('\n', ' ')}
            infoDialogValue={'fullValue' in card ? card.fullValue : undefined}
            title={card.title}
            value={card.value}
          />
        ))}
      </AdminMetricGrid>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search color={colors.textTertiary} size={22} strokeWidth={2} />
          <TextInput
            onChangeText={setSearchQuery}
            placeholder="Search products..."
            placeholderTextColor={colors.textSubtle}
            style={styles.searchInput}
            value={searchQuery}
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        {categoryChips.map((category) => (
          <FilterChip
            key={category}
            active={selectedCategory === category}
            label={category}
            onPress={() => setSelectedCategory(category)}
          />
        ))}
      </ScrollView>

      <Text style={styles.filterSummaryText}>
        {selectedCategory === 'All'
          ? `Showing ${filteredProducts.length} of ${products.length} products`
          : `Showing ${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'} in ${selectedCategory}`}
      </Text>

      <SectionHeading style={styles.sectionHeading}>PRODUCTS</SectionHeading>
      {feedback ? (
        <View
          style={[
            styles.feedbackBanner,
            feedback.tone === 'success' ? styles.feedbackSuccess : styles.feedbackError,
          ]}>
          <Text
            style={[
              styles.feedbackText,
              feedback.tone === 'success'
                ? styles.feedbackTextSuccess
                : styles.feedbackTextError,
            ]}>
            {feedback.message}
          </Text>
        </View>
      ) : null}
      {screenError ? <Text style={styles.screenErrorText}>{screenError}</Text> : null}
      <View style={styles.productsList}>
        {isLoadingProducts ? (
          <Text style={styles.emptyStateText}>Loading inventory...</Text>
        ) : filteredProducts.length > 0 ? (
          <FlashList
            data={paginatedProducts}
            ItemSeparatorComponent={() => <View style={styles.listSpacer} />}
            keyExtractor={(product) => String(product.id)}
            renderItem={({ item: product }) => (
              <ProductListItem
                category={product.category.name}
                imageUrl={product.imageUrl}
                low={product.stock <= lowStockThreshold}
                name={product.name}
                onDelete={() => requestDeleteProduct(product)}
                onEdit={() => openEditProductModal(product)}
                price={formatPeso(normalizeNumber(product.price))}
                sku={product.barcode || `ID-${product.id}`}
                unitsText={`${product.stock} ${product.unit} in stock`}
              />
            )}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptyStateText}>No products found for this filter yet.</Text>
        )}
      </View>
      {!isLoadingProducts && filteredProducts.length > 0 ? (
        <PaginationControls
          currentPage={productPage}
          endItem={productPageEnd}
          onPageChange={setProductPage}
          startItem={productPageStart}
          totalItems={filteredProducts.length}
          totalPages={totalProductPages}
          visiblePageNumbers={visiblePageNumbers}
        />
      ) : null}

      <AddCategoryModal
        isSavingCategory={isSavingCategory}
        initialValues={{
          categoryDescription: editingCategory?.description || '',
          categoryName: editingCategory?.name || '',
        }}
        mode={editingCategoryId ? 'edit' : 'create'}
        onClose={closeCategoryModal}
        onSave={handleSaveCategory}
        serverError={categoryError}
        visible={showAddCategory}
      />

      <ManageCategoriesModal
        categories={categoriesWithCounts}
        onClose={() => setShowManageCategories(false)}
        onCreate={() => {
          setShowManageCategories(false);
          openCreateCategoryModal();
        }}
        onDelete={(category) => requestDeleteCategory(category)}
        onEdit={(category) => {
          setShowManageCategories(false);
          openEditCategoryModal(category);
        }}
        visible={showManageCategories}
      />

      <AddProductModal
        barcode={barcode}
        categories={categories}
        categoryValue={categoryValue}
        costPrice={costPrice}
        errorMessage={productError}
        fieldErrors={productFieldErrors}
        imagePreviewUri={productImageUri}
        initialStock={initialStock}
        isSaving={isSavingProduct}
        onBarcodeChange={setBarcode}
        onCategorySelect={setCategoryValue}
        onClose={closeProductModal}
        onCostPriceChange={(value) => setCostPrice(digitsOnly(value))}
        onInitialStockChange={(value) => setInitialStock(digitsOnly(value))}
        onOpenCamera={handleOpenProductCamera}
        onPickImage={handlePickProductImage}
        onRemoveImage={() => {
          setProductImageUri(null);
          setProductImageAsset(null);
        }}
        onRequestCreateCategory={openCategoryModalFromProduct}
        onProductNameChange={setProductName}
        onSave={handleSaveProduct}
        onUnitPriceChange={(value) => setUnitPrice(digitsOnly(value))}
        onWeightVolumeChange={setWeightVolume}
        productActionLabel={editingProductId ? 'Update Product' : 'Add Product'}
        productName={productName}
        selectedCategory={categoryValue}
        submittingLabel={editingProductId ? 'Updating...' : 'Saving...'}
        unitPrice={unitPrice}
        visible={showAddProduct}
        weightVolume={weightVolume}
      />

      <DeleteProductModal
        isDeleting={isDeletingProduct}
        onClose={closeDeleteProductModal}
        onConfirm={handleConfirmDeleteProduct}
        productName={productPendingDelete?.name || ''}
        visible={!!productPendingDelete}
      />

      <DeleteCategoryModal
        categoryName={categoryPendingDelete?.name || ''}
        isDeleting={isDeletingCategory}
        onClose={closeDeleteCategoryModal}
        onConfirm={handleConfirmDeleteCategory}
        visible={!!categoryPendingDelete}
      />
    </AdminPageScreen>
  );
}

const styles = StyleSheet.create({
  categoryActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl + 4,
  },
  categoryActionsColumn: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  mobileActionButton: {
    width: '100%',
  },
  desktopActionButton: {
    minWidth: 184,
  },
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.section,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.borderStrong,
    borderRadius: radius.xl,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    minHeight: 60,
    paddingHorizontal: spacing.lg,
  },
  searchInput: {
    color: colors.textHeading,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 17,
    marginLeft: spacing.sm + 2,
  },
  chipsRow: {
    gap: spacing.md,
    paddingVertical: spacing.xl + 4,
  },
  filterSummaryText: {
    color: colors.textTertiary,
    ...textRoles.label,
    fontSize: 13,
    marginBottom: 12,
  },
  sectionHeading: {
    marginBottom: 18,
  },
  feedbackBanner: {
    borderRadius: radius.md,
    marginBottom: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  feedbackSuccess: {
    backgroundColor: colors.surfaceSuccessMuted,
    borderColor: colors.borderSuccess,
    borderWidth: 1,
  },
  feedbackError: {
    backgroundColor: colors.surfaceDangerMuted,
    borderColor: colors.borderDangerSoft,
    borderWidth: 1,
  },
  feedbackText: {
    ...textRoles.label,
    fontSize: 13,
  },
  feedbackTextSuccess: {
    color: colors.successBright,
  },
  feedbackTextError: {
    color: colors.dangerStrong,
  },
  screenErrorText: {
    color: colors.dangerStrong,
    ...textRoles.label,
    fontSize: 13,
    marginBottom: 12,
  },
  productsList: {
    minHeight: 60,
  },
  listSpacer: {
    height: 14,
  },
  emptyStateText: {
    color: colors.textSecondary,
    ...textRoles.body,
    fontSize: 15,
    lineHeight: 22,
  },
});
