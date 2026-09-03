import { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput as RNTextInput, useWindowDimensions, StyleSheet } from 'react-native';
import { Pencil, Search, PackagePlus, Shapes, X } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

import { ProductEditForm } from '../components/admin-products/product-edit-form';
import { ProductTable } from '../components/admin-products/product-table';
import { DeleteProductModal } from '../components/admin-products/delete-product-modal';
import { AddCategoryModal } from '../components/admin-products/add-category-modal';
import { DeleteCategoryModal } from '../components/admin-products/delete-category-modal';
import { ManageCategoriesModal } from '../components/admin-products/manage-categories-modal';
import { useToastStore } from '../store/toast-store';

import { AdminPageScreen } from '../components/ui/admin-page-screen';
import { SurfaceCard } from '../components/ui/surface-card';
import { AdminMetricGrid } from '../components/ui/admin-metric-grid';
import { ActionIconButton } from '../components/ui/action-icon-button';
import { InventoryStatCard } from '../components/ui/inventory-stat-card';
import { SectionHeading } from '../components/ui/section-heading';
import { AppButton } from '../components/ui/app-button';
import { AppSelect } from '../components/ui/app-select';
import { PaginationControls } from '../components/ui/pagination-controls';
import { AdminModalShell } from '../components/ui/admin-modal-shell';
import { ModalActions } from '../components/ui/modal-actions';
import { ProductFormInput } from '../components/ui/product-form-input';

import { usePagination } from '../hooks/use-pagination';
import { useResponsiveLayout } from '../hooks/use-responsive-layout';
import { useRefreshHandler } from '../hooks/use-refresh-handler';
import { radius, spacing } from '../constants/design-system';
import { colors, fonts, textSizes } from '../constants/theme';
import { tabs as productTabs, type Category, type Product } from '../components/admin-products/products-screen-data';
import type { CategoryFormValues } from '../lib/form-schemas';
import { formatPeso, normalizeNumber } from '../lib/product-utils';
import { barcodeSearchMatches } from '../lib/barcode-utils';

const lowStockThreshold = 10;
const productsPerPage = 10;
const supplierCashierUsernames = new Set(['cashier-a', 'cashier-b']);
const recipientCashierUsernames = new Set(['cashier-c', 'cashier-d']);
const cashierInventoryColumns = {
  action: 96,
  cashier: 142,
  category: 150,
  price: 112,
  product: 210,
  quantity: 112,
  source: 150,
};

type InventoryView = 'catalog' | 'cashier';

type CashierInventoryRow = {
  cashierPrice: number | string | null;
  cashier: {
    id: number;
    name: string;
    username: string;
  };
  product: Product;
  quantity: number;
  sourceCashier: {
    id: number;
    name: string;
    username: string;
  };
};

const emptyCategories: Category[] = [];
const emptyProducts: Product[] = [];
const emptyCashierInventoryRows: CashierInventoryRow[] = [];

export default function AdminProductsScreen() {
  const { compactPhone } = useResponsiveLayout();
  const activeTabs = useMemo(
    () =>
      productTabs.map((tab) =>
        tab.label === 'Products'
          ? { ...tab, active: true, route: '/admin-products' as const }
          : { ...tab, active: false }
      ),
    []
  );
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isCompactPhone = width < 430;
  const metricCardStyle = isCompactPhone
    ? { width: '100%' as const }
    : { width: '31.5%' as const };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [inventoryView, setInventoryView] = useState<InventoryView>('catalog');

  // Modals state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productPendingDelete, setProductPendingDelete] = useState<Product | null>(null);

  const [showManageCategories, setShowManageCategories] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryModalRevision, setCategoryModalRevision] = useState(0);
  const [categoryPendingDelete, setCategoryPendingDelete] = useState<Category | null>(null);
  const [priceEditingRow, setPriceEditingRow] = useState<CashierInventoryRow | null>(null);
  const [priceInput, setPriceInput] = useState('');

  // Queries
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get<Category[]>('/categories');
      return res.data;
    },
  });

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await apiClient.get<Product[]>('/products');
      return res.data;
    },
  });

  const cashierInventoryQuery = useQuery({
    queryKey: ['cashier-inventory'],
    queryFn: async () => {
      const res = await apiClient.get<CashierInventoryRow[]>('/cashier/inventory');
      return res.data;
    },
  });

  const categories = categoriesQuery.data ?? emptyCategories;
  const products = productsQuery.data ?? emptyProducts;
  const cashierInventoryRows = cashierInventoryQuery.data ?? emptyCashierInventoryRows;
  const isLoadingCategories = categoriesQuery.isLoading;
  const isLoadingProductsList = productsQuery.isLoading;
  const isLoadingProducts = isLoadingCategories || isLoadingProductsList;
  const refreshProductsPage = useCallback(
    () => Promise.all([categoriesQuery.refetch(), productsQuery.refetch(), cashierInventoryQuery.refetch()]),
    [cashierInventoryQuery, categoriesQuery, productsQuery],
  );
  const { isRefreshing, onRefresh } = useRefreshHandler(refreshProductsPage);
  const addCategoryInitialValues = useMemo(() => {
    if (editingCategoryId === null) {
      return {
        categoryDescription: '',
        categoryName: '',
      };
    }

    const editingCategory = categories.find((category) => category.id === editingCategoryId);

    return {
      categoryDescription: editingCategory?.description ?? '',
      categoryName: editingCategory?.name ?? '',
    };
  }, [categories, editingCategoryId]);

  // Mutations for categories
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setCategoryPendingDelete(null);
      useToastStore.getState().showToast('Category deleted successfully.', 'success');
    },
    onError: (error) => {
      useToastStore.getState().showToast(`Failed to delete category: ${error.message}`, 'error');
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setProductPendingDelete(null);
      useToastStore.getState().showToast('Product deleted successfully.', 'success');
    },
    onError: (error) => {
      useToastStore.getState().showToast(`Failed to delete product: ${error.message}`, 'error');
    }
  });

  
  const saveCategoryMutation = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      if (editingCategoryId) {
        return apiClient.put(`/categories/${editingCategoryId}`, { name: values.categoryName, description: values.categoryDescription });
      }
      return apiClient.post('/categories', { name: values.categoryName, description: values.categoryDescription });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowAddCategory(false);
      setEditingCategoryId(null);
      useToastStore.getState().showToast(`Category ${editingCategoryId ? 'updated' : 'added'} successfully.`, 'success');
    },
    onError: (error) => {
      useToastStore.getState().showToast(`Failed to save category: ${error.message}`, 'error');
    }
  });

  const categoryChips = useMemo(() => ['All', ...categories.map(c => c.name)], [categories]);
  const activeCategory = categoryChips.includes(selectedCategory) ? selectedCategory : 'All';

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = activeCategory === 'All' || product.category.name === activeCategory;
      const matchesQuery = !normalizedQuery || 
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.category.name.toLowerCase().includes(normalizedQuery) ||
        barcodeSearchMatches(product.barcode, searchQuery);
      return matchesCategory && matchesQuery;
    });
  }, [products, searchQuery, activeCategory]);

  const filteredCashierInventoryRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return cashierInventoryRows.filter((row) => {
      const matchesCategory = activeCategory === 'All' || row.product.category.name === activeCategory;
      const matchesQuery =
        !normalizedQuery ||
        row.cashier.name.toLowerCase().includes(normalizedQuery) ||
        row.cashier.username.toLowerCase().includes(normalizedQuery) ||
        row.product.name.toLowerCase().includes(normalizedQuery) ||
        row.product.category.name.toLowerCase().includes(normalizedQuery) ||
        row.sourceCashier.name.toLowerCase().includes(normalizedQuery) ||
        barcodeSearchMatches(row.product.barcode, searchQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, cashierInventoryRows, searchQuery]);

  const supplierInventoryRows = useMemo(
    () => filteredCashierInventoryRows.filter((row) => supplierCashierUsernames.has(row.cashier.username)),
    [filteredCashierInventoryRows]
  );

  const recipientInventoryRows = useMemo(
    () => filteredCashierInventoryRows.filter((row) => recipientCashierUsernames.has(row.cashier.username)),
    [filteredCashierInventoryRows]
  );

  const {
    page: productPage,
    paginatedItems: paginatedProducts,
    setPage: setProductPage,
    totalPages: totalProductPages,
    visiblePageNumbers,
  } = usePagination({
    items: filteredProducts,
    itemsPerPage: productsPerPage,
    resetDependencies: [searchQuery, activeCategory],
  });

  const saveCashierPriceMutation = useMutation({
    mutationFn: async ({
      cashierId,
      price,
      productId,
    }: {
      cashierId: number;
      price: number | null;
      productId: number;
    }) => {
      const res = await apiClient.put('/cashier/inventory/prices', {
        cashierId,
        price,
        productId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashier-inventory'] });
      setPriceEditingRow(null);
      setPriceInput('');
      useToastStore.getState().showToast('Cashier product price updated.', 'success');
    },
    onError: (error) => {
      useToastStore.getState().showToast(`Failed to update price: ${error.message}`, 'error');
    },
  });

  const {
    page: supplierInventoryPage,
    paginatedItems: paginatedSupplierInventoryRows,
    setPage: setSupplierInventoryPage,
    totalPages: totalSupplierInventoryPages,
    visiblePageNumbers: supplierInventoryVisiblePageNumbers,
  } = usePagination({
    items: supplierInventoryRows,
    itemsPerPage: productsPerPage,
    resetDependencies: [searchQuery, activeCategory],
  });

  const {
    page: recipientInventoryPage,
    paginatedItems: paginatedRecipientInventoryRows,
    setPage: setRecipientInventoryPage,
    totalPages: totalRecipientInventoryPages,
    visiblePageNumbers: recipientInventoryVisiblePageNumbers,
  } = usePagination({
    items: recipientInventoryRows,
    itemsPerPage: productsPerPage,
    resetDependencies: [searchQuery, activeCategory],
  });

  const overviewCards = useMemo(() => {
    const lowStockCount = products.filter(p => p.stock <= lowStockThreshold).length;

    return [
      { id: '1', title: 'Total Products', value: products.length.toString(), accent: 'default' },
      { id: '2', title: 'Categories', value: categories.length.toString(), accent: 'default' },
      { id: '3', title: 'Low Stock Items', value: lowStockCount.toString(), accent: lowStockCount > 0 ? 'danger' : 'default' },
    ] as const;
  }, [products, categories]);

  return (
    <AdminPageScreen
      title="Products & Inventory"
      introDescription="Manage your product catalog, categories, and track inventory levels across your store."
      bottomNavItems={activeTabs}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
    >
      <AdminMetricGrid>
        {overviewCards.map((card) => (
          <InventoryStatCard
            key={card.id}
            style={metricCardStyle}
            title={card.title}
            value={card.value}
            detail="Overview"
            accent={card.accent as 'default' | 'danger' | 'success'}
          />
        ))}
      </AdminMetricGrid>

      <SurfaceCard style={styles.contentCard}>
        <View style={[styles.sectionHeaderWrap, compactPhone && styles.sectionHeaderWrapCompact]}>
          <SectionHeading>Inventory Catalog</SectionHeading>
          <View style={[styles.actionGroup, compactPhone && styles.actionGroupCompact]}>
            <AppButton fullWidth={false} variant="secondary" icon={Shapes} onPress={() => setShowManageCategories(true)} label="Categories" />
            <AppButton fullWidth={false} variant="primary" icon={PackagePlus} onPress={() => { setEditingProduct(null); setShowAddProduct(true); }} label="Add Product" />
          </View>
        </View>

        <View style={styles.viewToggleRow}>
          {(['catalog', 'cashier'] as const).map((view) => (
            <Pressable
              key={view}
              onPress={() => setInventoryView(view)}
              style={[
                styles.viewToggle,
                inventoryView === view && styles.viewToggleActive,
              ]}>
              <Text
                style={[
                  styles.viewToggleText,
                  inventoryView === view && styles.viewToggleTextActive,
                ]}>
                {view === 'catalog' ? 'Catalog' : 'Cashier Inventory'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.filtersSection}>
          <View style={[styles.filtersRow, compactPhone && styles.filtersRowCompact]}>
            <View style={styles.searchBarWrap}>
              <Search color={colors.textSecondary} size={18} style={styles.searchIcon} />
              <RNTextInput
                placeholder="Search products, category, barcode..."
                placeholderTextColor={colors.textSubtle}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                  <X color={colors.textSecondary} size={16} />
                </Pressable>
              ) : null}
            </View>

            <View style={[styles.selectWrap, compactPhone && styles.selectWrapCompact]}>
              <AppSelect
                options={categoryChips}
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              />
            </View>

          </View>
        </View>

        {inventoryView === 'catalog' ? (
          <ProductTable
            isLoading={isLoadingProducts}
            paginatedProducts={paginatedProducts}
            productPage={productPage}
            setProductPage={setProductPage}
            totalPages={totalProductPages}
            visiblePageNumbers={visiblePageNumbers}
            onEdit={(product) => { setEditingProduct(product); setShowAddProduct(true); }}
            onDelete={(product) => setProductPendingDelete(product)}
          />
        ) : (
          <View style={styles.cashierInventorySections}>
            <CashierInventoryTable
              allowPriceEditing={false}
              description="Stock assigned from admin inventory for cashier selling."
              isCompact={width < 700}
              isLoading={cashierInventoryQuery.isLoading}
              page={supplierInventoryPage}
              rows={paginatedSupplierInventoryRows}
              setPage={setSupplierInventoryPage}
              sourceLabel="Admin stock"
              title="Cashier A/B Inventory"
              totalPages={totalSupplierInventoryPages}
              visiblePageNumbers={supplierInventoryVisiblePageNumbers}
            />

            <CashierInventoryTable
              allowPriceEditing
              description="Stock received from Cashier A/B for customer selling."
              isCompact={width < 700}
              isLoading={cashierInventoryQuery.isLoading}
              page={recipientInventoryPage}
              rows={paginatedRecipientInventoryRows}
              setPage={setRecipientInventoryPage}
              title="Cashier C/D Inventory"
              totalPages={totalRecipientInventoryPages}
              visiblePageNumbers={recipientInventoryVisiblePageNumbers}
              onEditPrice={(row) => {
                setPriceEditingRow(row);
                setPriceInput(row.cashierPrice === null ? '' : String(row.cashierPrice));
              }}
            />
          </View>
        )}
      </SurfaceCard>

      <ProductEditForm
        visible={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        productToEdit={editingProduct}
        categories={categories}
        onSuccess={(msg) => useToastStore.getState().showToast(msg, 'success')}
      />

      <DeleteProductModal
        visible={!!productPendingDelete}
        onClose={() => setProductPendingDelete(null)}
        onConfirm={() => {
          if (productPendingDelete) deleteProductMutation.mutate(productPendingDelete.id);
        }}
        productName={productPendingDelete?.name || ''}
        isDeleting={deleteProductMutation.isPending}
        
      />
      
      {/* Categories Modals */}
      <ManageCategoriesModal
        categories={categories.map(c => ({ ...c, productCount: products.filter(p => p.categoryId === c.id).length }))}
        onClose={() => setShowManageCategories(false)}
        onCreate={() => {
          setShowManageCategories(false);
          setEditingCategoryId(null);
          setCategoryModalRevision((value) => value + 1);
          setShowAddCategory(true);
        }}
        onDelete={(category) => setCategoryPendingDelete(category as unknown as Category)}
        onEdit={(category) => {
          setShowManageCategories(false);
          setEditingCategoryId(category.id);
          setCategoryModalRevision((value) => value + 1);
          setShowAddCategory(true);
        }}
        visible={showManageCategories}
      />

      <AddCategoryModal
        key={`${categoryModalRevision}-${editingCategoryId ?? 'new'}`}
        isSavingCategory={saveCategoryMutation.isPending}
        initialValues={addCategoryInitialValues}
        mode={editingCategoryId !== null ? 'edit' : 'create'}
        onClose={() => {
          setShowAddCategory(false);
          setEditingCategoryId(null);
        }}
        onSave={(values) => saveCategoryMutation.mutate(values)}
        serverError={saveCategoryMutation.isError ? (saveCategoryMutation.error?.message || '') : ''}
        visible={showAddCategory}
      />

      <DeleteCategoryModal
        categoryName={categoryPendingDelete?.name || ''}
        
        isDeleting={deleteCategoryMutation.isPending}
        onClose={() => setCategoryPendingDelete(null)}
        onConfirm={() => {
          if (categoryPendingDelete) deleteCategoryMutation.mutate(categoryPendingDelete.id);
        }}
        visible={!!categoryPendingDelete}
      />

      <AdminModalShell
        height={300}
        maxHeight="72%"
        onClose={() => {
          setPriceEditingRow(null);
          setPriceInput('');
        }}
        title="Edit Cashier Price"
        visible={priceEditingRow !== null}
        footer={
          <ModalActions>
            <AppButton
              disabled={saveCashierPriceMutation.isPending}
              label="Use Default"
              onPress={() => {
                if (!priceEditingRow) return;
                saveCashierPriceMutation.mutate({
                  cashierId: priceEditingRow.cashier.id,
                  productId: priceEditingRow.product.id,
                  price: null,
                });
              }}
              variant="secondary"
            />
            <AppButton
              label="Save Price"
              loading={saveCashierPriceMutation.isPending}
              onPress={() => {
                if (!priceEditingRow) return;
                const parsedPrice = Number(priceInput);
                if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
                  useToastStore.getState().showToast('Enter a valid price.', 'error');
                  return;
                }
                saveCashierPriceMutation.mutate({
                  cashierId: priceEditingRow.cashier.id,
                  productId: priceEditingRow.product.id,
                  price: parsedPrice,
                });
              }}
              variant="primary"
            />
          </ModalActions>
        }>
        {priceEditingRow ? (
          <View>
            <Text style={styles.priceModalMeta}>
              {priceEditingRow.cashier.name} - {priceEditingRow.product.name}
            </Text>
            <Text style={styles.priceModalDefault}>
              Default price: {formatPeso(normalizeNumber(priceEditingRow.product.price))}
            </Text>
            <ProductFormInput
              compact
              keyboardType="numeric"
              label="CASHIER PRICE"
              onChangeText={setPriceInput}
              placeholder="Leave blank to use default"
              value={priceInput}
            />
          </View>
        ) : null}
      </AdminModalShell>

    </AdminPageScreen>
  );
}

function CashierInventoryTable({
  allowPriceEditing,
  description,
  isCompact,
  isLoading,
  page,
  rows,
  setPage,
  sourceLabel,
  title,
  totalPages,
  visiblePageNumbers,
  onEditPrice,
}: {
  allowPriceEditing: boolean;
  description: string;
  isCompact: boolean;
  isLoading: boolean;
  page: number;
  rows: CashierInventoryRow[];
  setPage: (page: number) => void;
  sourceLabel?: string;
  title: string;
  totalPages: number;
  visiblePageNumbers: number[];
  onEditPrice?: (row: CashierInventoryRow) => void;
}) {
  const renderSource = (row: CashierInventoryRow) => sourceLabel ?? row.sourceCashier.name;
  const renderCashierPrice = (row: CashierInventoryRow) =>
    row.cashierPrice === null ? formatPeso(normalizeNumber(row.product.price)) : formatPeso(normalizeNumber(row.cashierPrice));
  const tableWidth = Object.entries(cashierInventoryColumns).reduce((sum, [key, width]) => {
    return key === 'action' && !allowPriceEditing ? sum : sum + width;
  }, 0);

  if (isLoading) {
    return (
      <View style={styles.cashierInventorySection}>
        <CashierInventorySectionHeader description={description} title={title} />
        <View style={styles.centeredState}>
          <Text style={styles.emptyText}>Loading cashier inventory...</Text>
        </View>
      </View>
    );
  }

  if (rows.length === 0) {
    return (
      <View style={styles.cashierInventorySection}>
        <CashierInventorySectionHeader description={description} title={title} />
        <View style={styles.centeredState}>
          <Text style={styles.emptyText}>No cashier inventory found.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.cashierInventorySection}>
      <CashierInventorySectionHeader description={description} title={title} />

      {isCompact ? (
        <View style={styles.cashierInventoryCards}>
          {rows.map((row) => (
            <View key={`${row.cashier.id}-${row.product.id}-${row.sourceCashier.id}`} style={styles.cashierInventoryCard}>
              <View style={styles.cashierInventoryCardHeader}>
                <View style={styles.cashierInventoryCardTitleWrap}>
                  <Text style={styles.cashierInventoryCardTitle} numberOfLines={2}>{row.product.name}</Text>
                  <Text style={styles.cashierInventoryCardMeta}>{row.product.category?.name || '-'}</Text>
                </View>
                <Text style={styles.cashierInventoryCardQty}>{row.quantity} {row.product.unit}</Text>
              </View>

              <View style={styles.cashierInventoryCardDetails}>
                <CashierInventoryDetail label="Cashier" value={row.cashier.name} />
                <CashierInventoryDetail label="Source" value={renderSource(row)} />
                <CashierInventoryDetail label="Price" value={renderCashierPrice(row)} />
              </View>
              {allowPriceEditing && onEditPrice ? (
                <ActionIconButton
                  accessibilityLabel={`Edit cashier price for ${row.product.name}`}
                  icon={Pencil}
                  onPress={() => onEditPrice(row)}
                />
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.cashierInventoryScrollerContent}
          horizontal
          showsHorizontalScrollIndicator
          style={styles.cashierInventoryScroller}>
          <View style={[styles.cashierInventoryTable, { minWidth: tableWidth }]}>
            <View style={styles.cashierInventoryHeader}>
              <Text style={[styles.cashierInventoryHeaderText, { width: cashierInventoryColumns.cashier }]}>CASHIER</Text>
              <Text style={[styles.cashierInventoryHeaderText, { width: cashierInventoryColumns.product }]}>PRODUCT</Text>
              <Text style={[styles.cashierInventoryHeaderText, { width: cashierInventoryColumns.category }]}>CATEGORY</Text>
              <Text style={[styles.cashierInventoryHeaderText, { width: cashierInventoryColumns.source }]}>SOURCE</Text>
              <Text style={[styles.cashierInventoryHeaderText, styles.cashierInventoryAmountCell, { width: cashierInventoryColumns.price }]}>PRICE</Text>
              <Text style={[styles.cashierInventoryHeaderText, styles.cashierInventoryAmountCell, { width: cashierInventoryColumns.quantity }]}>QTY</Text>
              {allowPriceEditing ? <Text style={[styles.cashierInventoryHeaderText, styles.cashierInventoryAmountCell, { width: cashierInventoryColumns.action }]}>ACTION</Text> : null}
            </View>

            {rows.map((row) => (
              <View
                key={`${row.cashier.id}-${row.product.id}-${row.sourceCashier.id}`}
                style={styles.cashierInventoryRow}>
                <Text numberOfLines={1} style={[styles.cashierInventoryCellStrong, { width: cashierInventoryColumns.cashier }]}>{row.cashier.name}</Text>
                <Text numberOfLines={2} style={[styles.cashierInventoryCell, { width: cashierInventoryColumns.product }]}>{row.product.name}</Text>
                <Text numberOfLines={1} style={[styles.cashierInventoryCell, { width: cashierInventoryColumns.category }]}>{row.product.category?.name || '-'}</Text>
                <Text numberOfLines={1} style={[styles.cashierInventoryCell, { width: cashierInventoryColumns.source }]}>{renderSource(row)}</Text>
                <Text style={[styles.cashierInventoryCellStrong, styles.cashierInventoryAmountCell, { width: cashierInventoryColumns.price }]}>
                  {renderCashierPrice(row)}
                </Text>
                <Text style={[styles.cashierInventoryCellStrong, styles.cashierInventoryAmountCell, { width: cashierInventoryColumns.quantity }]}>
                  {row.quantity} {row.product.unit}
                </Text>
                {allowPriceEditing && onEditPrice ? (
                  <View style={[styles.cashierInventoryActionCell, { width: cashierInventoryColumns.action }]}>
                    <ActionIconButton
                      accessibilityLabel={`Edit cashier price for ${row.product.name}`}
                      icon={Pencil}
                      onPress={() => onEditPrice(row)}
                    />
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <View style={styles.paginationRow}>
        <PaginationControls
          borderless
          currentPage={page}
          onPageChange={setPage}
          totalPages={totalPages}
          visiblePageNumbers={visiblePageNumbers}
        />
      </View>
    </View>
  );
}

function CashierInventorySectionHeader({ description, title }: { description: string; title: string }) {
  return (
    <View style={styles.cashierInventorySectionHeader}>
      <Text style={styles.cashierInventorySectionTitle}>{title}</Text>
      <Text style={styles.cashierInventorySectionDescription}>{description}</Text>
    </View>
  );
}

function CashierInventoryDetail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.cashierInventoryDetail}>
      <Text style={styles.cashierInventoryDetailLabel}>{label}</Text>
      <Text style={styles.cashierInventoryDetailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contentCard: { padding: 0, overflow: "hidden", flex: 1, marginTop: spacing.sm },
  sectionHeaderWrap: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.xl, paddingBottom: 0 },
  sectionHeaderWrapCompact: { flexDirection: "column", alignItems: "center", gap: spacing.md },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionGroupCompact: {
    justifyContent: "center",
    width: "100%",
  },
  viewToggleRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  viewToggle: {
    backgroundColor: colors.surfaceNeutral,
    borderColor: colors.borderMuted,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  viewToggleActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  viewToggleText: {
    color: colors.textHeading,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.small,
  },
  viewToggleTextActive: {
    color: colors.textInverse,
  },
  filtersSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  filtersRowCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  searchBarWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceNeutral,
    borderColor: colors.borderMuted,
    borderWidth: 1,
    borderRadius: radius.lg,
    height: 44,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: colors.textStrong,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: spacing.xs,
    marginRight: -spacing.xs,
  },
  selectWrap: {
    minWidth: 180,
  },
  selectWrapCompact: {
    width: '100%',
  },
  centeredState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    color: colors.textSubtle,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
  },
  cashierInventorySections: {
    backgroundColor: colors.card,
    borderTopColor: colors.borderPanel,
    borderTopWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  cashierInventorySection: {
    backgroundColor: colors.surfaceNeutral,
    borderColor: colors.borderPanel,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cashierInventorySectionHeader: {
    backgroundColor: colors.card,
    borderBottomColor: colors.borderPanel,
    borderBottomWidth: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cashierInventorySectionTitle: {
    color: colors.textHeading,
    fontFamily: fonts.bold,
    fontSize: textSizes.medium,
  },
  cashierInventorySectionDescription: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: textSizes.small + 1,
  },
  cashierInventoryScroller: {
    width: '100%',
  },
  cashierInventoryScrollerContent: {
    flexGrow: 1,
    minWidth: '100%',
  },
  cashierInventoryTable: {
    flex: 1,
    width: '100%',
  },
  cashierInventoryHeader: {
    backgroundColor: colors.surfaceSoft,
    borderBottomColor: colors.borderPanel,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  cashierInventoryHeaderText: {
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: textSizes.smallCaps,
    letterSpacing: 0.8,
    paddingRight: spacing.md,
  },
  cashierInventoryRow: {
    alignItems: 'center',
    borderBottomColor: colors.borderPanel,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  cashierInventoryCell: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: textSizes.small + 1,
    paddingRight: spacing.md,
  },
  cashierInventoryCellStrong: {
    color: colors.textStrong,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.small + 1,
    paddingRight: spacing.md,
  },
  cashierInventoryAmountCell: {
    textAlign: 'right',
  },
  cashierInventoryCards: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  cashierInventoryCard: {
    backgroundColor: colors.card,
    borderColor: colors.borderPanel,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  cashierInventoryCardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  cashierInventoryCardTitleWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  cashierInventoryCardTitle: {
    color: colors.textStrong,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.body,
  },
  cashierInventoryCardMeta: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: textSizes.small,
  },
  cashierInventoryCardQty: {
    color: colors.secondary,
    flexShrink: 0,
    fontFamily: fonts.bold,
    fontSize: textSizes.body,
    textAlign: 'right',
  },
  cashierInventoryCardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cashierInventoryDetail: {
    flexBasis: 120,
    flexGrow: 1,
    gap: spacing.xs,
  },
  cashierInventoryDetailLabel: {
    color: colors.textSubtle,
    fontFamily: fonts.bold,
    fontSize: textSizes.smallCaps,
    letterSpacing: 0.8,
  },
  cashierInventoryDetailValue: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: textSizes.small + 1,
  },
  cashierInventoryActionCell: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  paginationRow: {
    backgroundColor: colors.surfaceSoft,
    borderTopColor: colors.borderPanel,
    borderTopWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  priceModalMeta: {
    color: colors.textHeading,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.medium,
    marginBottom: spacing.xs,
  },
  priceModalDefault: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    marginBottom: spacing.lg,
  },
});
