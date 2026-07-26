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

import { AdminPageScreen } from '../components/ui/admin-page-screen';
import { SurfaceCard } from '../components/ui/surface-card';
import { AdminMetricGrid } from '../components/ui/admin-metric-grid';
import { InventoryStatCard } from '../components/ui/inventory-stat-card';
import { SectionHeading } from '../components/ui/section-heading';
import { AppButton } from '../components/ui/app-button';

import { usePagination } from '../hooks/use-pagination';
import { normalizeNumber } from '../lib/product-utils';
import { radius, shadows, spacing } from '../constants/design-system';
import { colors, fonts, textRoles, textSizes } from '../constants/theme';
import type { Category, Product } from '../components/admin-products/products-screen-data';
import type { CategoryFormValues } from '../lib/form-schemas';

const lowStockThreshold = 10;
const productsPerPage = 10;
type FeedbackState = { tone: 'success' | 'error'; message: string } | null;

export default function AdminProductsScreen() {
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isCompactPhone = width < 430;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [feedback, setFeedback] = useState<FeedbackState>(null);

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
      setFeedback({ tone: 'success', message: 'Category deleted successfully.' });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setProductPendingDelete(null);
      setFeedback({ tone: 'success', message: 'Product deleted successfully.' });
    },
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
      setFeedback({ tone: 'success', message: `Category ${editingCategoryId ? 'updated' : 'added'} successfully.` });
    }
  });

  useEffect(() => {
    if (selectedCategory !== 'All' && !categories.some(c => c.name === selectedCategory)) {
      setSelectedCategory('All');
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (feedback) {
      const timeout = setTimeout(() => setFeedback(null), 2600);
      return () => clearTimeout(timeout);
    }
  }, [feedback]);

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
    >
      <AdminMetricGrid>
        {overviewCards.map((card) => (
          <InventoryStatCard key={card.id} title={card.title} value={card.value} detail="Overview" accent={card.accent as 'default' | 'danger' | 'success'} />
        ))}
      </AdminMetricGrid>

      <SurfaceCard style={styles.contentCard}>
        <View style={styles.sectionHeaderWrap}>
          <SectionHeading>Inventory Catalog</SectionHeading>
          <View style={styles.actionGroup}>
            <AppButton variant="secondary" icon={Shapes} onPress={() => setShowManageCategories(true)} label="Categories" />
            <AppButton variant="primary" icon={PackagePlus} onPress={() => { setEditingProduct(null); setShowAddProduct(true); }} label="Add Product" />
          </View>
        </View>

        <View style={styles.filtersSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll} contentContainerStyle={styles.categoriesContainer}>
            {categoryChips.map((chip) => (
              <Pressable
                key={chip}
                onPress={() => setSelectedCategory(chip)}
                style={[styles.categoryChip, selectedCategory === chip && styles.categoryChipActive]}
              >
                <Text style={[styles.categoryChipText, selectedCategory === chip && styles.categoryChipTextActive]}>
                  {chip}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
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
        onSuccess={(msg) => setFeedback({ tone: 'success', message: msg })}
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
  contentCard: { padding: 0, overflow: "hidden", flex: 1 },
  sectionHeaderWrap: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.xl, paddingBottom: 0 },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filtersSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  categoriesScroll: {
    marginHorizontal: -spacing.xl,
  },
  categoriesContainer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
    color: colors.text,
  },
  categoryChipTextActive: {
    color: colors.white,
    fontFamily: fonts.semiBold,
  },
});
