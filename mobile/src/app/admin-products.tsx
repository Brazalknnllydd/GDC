import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Search } from 'lucide-react-native';

import { AddCategoryModal } from '../components/admin-products/add-category-modal';
import { DeleteProductModal } from '../components/admin-products/delete-product-modal';
import { AddProductModal } from '../components/admin-products/add-product-modal';
import {
  baseOverviewCards,
  tabs,
  type Category,
  type Product,
} from '../components/admin-products/products-screen-data';
import { layout, radius, shadows, spacing } from '../constants/design-system';
import { colors, fonts, textRoles, textSizes } from '../constants/theme';
import { AdminMetricGrid } from '../components/ui/admin-metric-grid';
import { AdminPageScreen } from '../components/ui/admin-page-screen';
import { FilterChip } from '../components/ui/filter-chip';
import { InventoryStatCard } from '../components/ui/inventory-stat-card';
import { ProductListItem } from '../components/ui/product-list-item';
import { SectionHeading } from '../components/ui/section-heading';
import { apiClient } from '../lib/api';

function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

function formatPeso(value: number) {
  return `P${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function normalizeNumber(value: number | string) {
  return typeof value === 'number' ? value : Number(value) || 0;
}

function parseWeight(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function inferUnit(value: string) {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return 'pcs';
  }

  if (normalized.includes('kg')) return 'kg';
  if (normalized.includes('g')) return 'g';
  if (normalized.includes('ml')) return 'ml';
  if (normalized.includes('l')) return 'L';

  return 'pcs';
}

const lowStockThreshold = 10;
type FeedbackState = {
  tone: 'success' | 'error';
  message: string;
} | null;
type ProductFieldErrors = Partial<
  Record<'name' | 'category' | 'costPrice' | 'sellingPrice' | 'stock' | 'weightVolume', string>
>;

export default function AdminProductsScreen() {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  const [productName, setProductName] = useState('');
  const [categoryValue, setCategoryValue] = useState('');
  const [barcode, setBarcode] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [initialStock, setInitialStock] = useState('');
  const [weightVolume, setWeightVolume] = useState('');
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

  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState('');

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
        return { ...card, value: formatPeso(inventoryValue) };
      }

      return card;
    });
  }, [categories.length, products]);

  async function handleSaveCategory() {
    const trimmedName = newCategoryName.trim();

    if (!trimmedName) {
      setCategoryError('Category name is required.');
      return;
    }

    try {
      setIsSavingCategory(true);
      setCategoryError('');

      const response = await apiClient.post<Category>('/categories', {
        name: trimmedName,
      });

      setCategories((currentCategories) =>
        [...currentCategories, response.data].sort((a, b) => a.name.localeCompare(b.name))
      );
      setCategoryValue(response.data.name);
      setSelectedCategory(response.data.name);
      setNewCategoryName('');
      setShowAddCategory(false);
      setFeedback({
        tone: 'success',
        message: `Category "${response.data.name}" added successfully.`,
      });
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
    setNewCategoryName('');
    setCategoryError('');
  }

  function openCategoryModalFromProduct() {
    setNewCategoryName('');
    setCategoryError('');
    setShowAddCategory(true);
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

    const payload = {
      name: trimmedName,
      barcode: barcode.trim() || null,
      costPrice: Number(costPrice),
      price: Number(unitPrice),
      stock: Number(initialStock),
      weight: parseWeight(weightVolume),
      unit: inferUnit(weightVolume),
      categoryId: matchedCategory.id,
    };

    try {
      setIsSavingProduct(true);
      setProductError('');
      setProductFieldErrors({});

      if (editingProductId) {
        const response = await apiClient.put<Product>(`/products/${editingProductId}`, payload);
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
        const response = await apiClient.post<Product>('/products', payload);
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
      bottomNavItems={tabs}
      floatingContent={
        <Pressable onPress={openCreateProductModal} style={styles.fab}>
          <Text style={styles.fabPlus}>+</Text>
        </Pressable>
      }>
      <Pressable onPress={() => setShowAddCategory(true)} style={styles.addCategoryButton}>
        <Text style={styles.addCategoryButtonText}>Add Category</Text>
      </Pressable>

      <AdminMetricGrid>
        {overviewCards.map((card) => (
          <InventoryStatCard
            key={card.title}
            accent={card.accent}
            detail={card.detail}
            title={card.title}
            value={card.value}
          />
        ))}
      </AdminMetricGrid>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search color="#6F7487" size={22} strokeWidth={2} />
          <TextInput
            onChangeText={setSearchQuery}
            placeholder="Search products..."
            placeholderTextColor="#747B8D"
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
          filteredProducts.map((product) => (
            <ProductListItem
              key={product.id}
              category={product.category.name}
              low={product.stock <= lowStockThreshold}
              name={product.name}
              onDelete={() => requestDeleteProduct(product)}
              onEdit={() => openEditProductModal(product)}
              price={formatPeso(normalizeNumber(product.price))}
              sku={product.barcode || `ID-${product.id}`}
              unitsText={`${product.stock} ${product.unit} in stock`}
            />
          ))
        ) : (
          <Text style={styles.emptyStateText}>No products found for this filter yet.</Text>
        )}
      </View>

      <AddCategoryModal
        categoryError={categoryError}
        isSavingCategory={isSavingCategory}
        newCategoryName={newCategoryName}
        onChangeCategoryName={(value) => {
          setNewCategoryName(value);
          if (categoryError) {
            setCategoryError('');
          }
        }}
        onClose={closeCategoryModal}
        onSave={handleSaveCategory}
        visible={showAddCategory}
      />

      <AddProductModal
        barcode={barcode}
        categories={categories}
        categoryValue={categoryValue}
        costPrice={costPrice}
        errorMessage={productError}
        fieldErrors={productFieldErrors}
        initialStock={initialStock}
        isSaving={isSavingProduct}
        onBarcodeChange={setBarcode}
        onCategorySelect={setCategoryValue}
        onClose={closeProductModal}
        onCostPriceChange={(value) => setCostPrice(digitsOnly(value))}
        onInitialStockChange={(value) => setInitialStock(digitsOnly(value))}
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
    </AdminPageScreen>
  );
}

const styles = StyleSheet.create({
  addCategoryButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    justifyContent: 'center',
    marginBottom: spacing.xl + 4,
    minHeight: 56,
    paddingHorizontal: spacing.xl,
  },
  addCategoryButtonText: {
    color: '#FFFFFF',
    ...textRoles.label,
    fontSize: textSizes.medium,
  },
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.section,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CED3E3',
    borderRadius: radius.xl,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    minHeight: 76,
    paddingHorizontal: spacing.xl,
  },
  searchInput: {
    color: '#2E3341',
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 20,
    marginLeft: 10,
  },
  chipsRow: {
    gap: spacing.md,
    paddingVertical: spacing.xl + 4,
  },
  filterSummaryText: {
    color: '#687082',
    ...textRoles.label,
    fontSize: 13,
    marginBottom: 14,
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
    backgroundColor: '#E9F8EF',
    borderColor: '#A6D9B6',
    borderWidth: 1,
  },
  feedbackError: {
    backgroundColor: '#FDECEC',
    borderColor: '#E7B5B5',
    borderWidth: 1,
  },
  feedbackText: {
    ...textRoles.label,
    fontSize: 13,
  },
  feedbackTextSuccess: {
    color: '#0D7A33',
  },
  feedbackTextError: {
    color: '#B3261E',
  },
  screenErrorText: {
    color: '#B3261E',
    ...textRoles.label,
    fontSize: 13,
    marginBottom: 12,
  },
  productsList: {
    gap: 14,
  },
  emptyStateText: {
    color: '#5D6476',
    ...textRoles.body,
    fontSize: 17,
  },
  fab: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 36,
    bottom: 104,
    height: 72,
    justifyContent: 'center',
    position: 'absolute',
    right: 22,
    ...shadows.floating,
    width: 72,
  },
  fabPlus: {
    color: '#FFFFFF',
    fontFamily: fonts.regular,
    fontSize: 44,
    lineHeight: 46,
    marginTop: -2,
  },
});
