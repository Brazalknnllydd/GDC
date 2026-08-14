import { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions, StyleSheet } from 'react-native';
import { Search, PackagePlus, Shapes, Tags } from 'lucide-react-native';
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
import { InventoryStatCard } from '../components/ui/inventory-stat-card';
import { SectionHeading } from '../components/ui/section-heading';
import { AppButton } from '../components/ui/app-button';
import { AppSelect } from '../components/ui/app-select';

import { usePagination } from '../hooks/use-pagination';
import { useResponsiveLayout } from '../hooks/use-responsive-layout';
import { normalizeNumber } from '../lib/product-utils';
import { radius, shadows, spacing } from '../constants/design-system';
import { colors, fonts, textRoles, textSizes } from '../constants/theme';
import { tabs as productTabs, type Category, type Product } from '../components/admin-products/products-screen-data';
import type { CategoryFormValues } from '../lib/form-schemas';

const lowStockThreshold = 10;
const productsPerPage = 10;

export default function AdminProductsScreen() {
  const { compactPhone } = useResponsiveLayout();
  const activeTabs = productTabs.map((tab) =>
    tab.label === 'Products'
      ? { ...tab, active: true, route: '/admin-products' as const }
      : { ...tab, active: false }
  );
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isCompactPhone = width < 430;
  const metricCardStyle = isCompactPhone
    ? { width: '100%' as const }
    : width >= 1200
      ? { width: '31.5%' as const }
      : { width: '48.2%' as const };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productPendingDelete, setProductPendingDelete] = useState<Product | null>(null);

  const [showManageCategories, setShowManageCategories] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryPendingDelete, setCategoryPendingDelete] = useState<Category | null>(null);

  // Queries
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get<Category[]>('/categories');
      return res.data;
    },
  });

  const { data: products = [], isLoading: isLoadingProductsList } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await apiClient.get<Product[]>('/products');
      return res.data;
    },
  });

  const isLoadingProducts = isLoadingCategories || isLoadingProductsList;

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
      useToastStore.getState().showToast(`Category ${editingCategoryId ? 'updated' : 'added'} successfully.`, 'success');
    },
    onError: (error) => {
      useToastStore.getState().showToast(`Failed to save category: ${error.message}`, 'error');
    }
  });

  useEffect(() => {
    if (selectedCategory !== 'All' && !categories.some(c => c.name === selectedCategory)) {
      setSelectedCategory('All');
    }
  }, [categories, selectedCategory]);

  const categoryChips = useMemo(() => ['All', ...categories.map(c => c.name)], [categories]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'All' || product.category.name === selectedCategory;
      const matchesQuery = !normalizedQuery || 
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.category.name.toLowerCase().includes(normalizedQuery) ||
        (product.barcode || '').toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [products, searchQuery, selectedCategory]);

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
    const inventoryValue = products.reduce((sum, p) => sum + normalizeNumber(p.price) * p.stock, 0);
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

        <View style={styles.filtersSection}>
          <View style={{ marginBottom: spacing.md }}>
            <AppSelect
              options={categoryChips}
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            />
          </View>
        </View>

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
        onCreate={() => setShowAddCategory(true)}
        onDelete={(category) => setCategoryPendingDelete(category as unknown as Category)}
        onEdit={(category) => { setEditingCategoryId(category.id); setShowAddCategory(true); }}
        visible={showManageCategories}
      />

      <AddCategoryModal
        isSavingCategory={saveCategoryMutation.isPending}
        initialValues={{
          categoryName: (editingCategoryId !== null ? categories.find(c => c.id === editingCategoryId)?.name : '') || '',
          categoryDescription: (editingCategoryId !== null ? (categories.find(c => c.id === editingCategoryId) as any)?.description : '') || ''
        }}
        mode={editingCategoryId !== null ? 'edit' : 'create'}
        onClose={() => setShowAddCategory(false)}
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

    </AdminPageScreen>
  );
}

const styles = StyleSheet.create({
  contentCard: { padding: 0, overflow: "hidden", flex: 1, marginTop: spacing.sm },
  sectionHeaderWrap: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.xl, paddingBottom: 0 },
  sectionHeaderWrapCompact: { flexDirection: "column", alignItems: "flex-start", gap: spacing.md },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionGroupCompact: {
    justifyContent: "flex-start",
  },
  filtersSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
});
