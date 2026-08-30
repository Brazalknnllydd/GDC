import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';

import type { Product } from '../admin-products/products-screen-data';
import { SectionHeading } from '../ui/section-heading';
import { AppSelect } from '../ui/app-select';
import { spacing } from '../../constants/design-system';
import { colors, fonts, textSizes } from '../../constants/theme';
import { CashierProductCard } from './cashier-product-card';
import { formatPeso, normalizeNumber } from '../../lib/product-utils';

type CashierInventorySectionProps = {
  isRefreshing?: boolean;
  onAddProduct: (product: Product) => void;
  onRefresh?: () => void;
  numColumns: number;
  products: Product[];
};

export function CashierInventorySection({
  isRefreshing = false,
  onAddProduct,
  onRefresh,
  numColumns,
  products,
}: CashierInventorySectionProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = useMemo(() => {
    const names = new Set<string>();

    products.forEach((product) => {
      if (product.category?.name) {
        names.add(product.category.name);
      }
    });

    return ['All', ...Array.from(names)];
  }, [products]);
  const activeSelectedCategory = categories.includes(selectedCategory) ? selectedCategory : 'All';

  const filteredProducts = useMemo(() => {
    if (activeSelectedCategory === 'All') {
      return products;
    }

    return products.filter((product) => product.category?.name === activeSelectedCategory);
  }, [products, activeSelectedCategory]);

  return (
    <FlashList
      key={`inventory-grid-${numColumns}`}
      data={filteredProducts}
      style={{ flex: 1 }}
      keyExtractor={(product) => String(product.id)}
      numColumns={numColumns}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      ListHeaderComponent={
        <>
          <SectionHeading style={styles.sectionLabel}>INVENTORY VIEW</SectionHeading>
          <Text style={styles.inventoryLead}>
            Browse current stock in the same fast product-grid layout used for the register.
          </Text>

          <View style={styles.filterRow}>
            <AppSelect
              options={categories}
              value={activeSelectedCategory}
              onValueChange={setSelectedCategory}
            />
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'}
            </Text>
            <Text style={styles.summaryText}>Scroll to browse more</Text>
          </View>
        </>
      }
      ListEmptyComponent={
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateTitle}>No products found</Text>
          <Text style={styles.emptyStateText}>
            Try another category filter or wait for inventory to sync.
          </Text>
        </View>
      }
      contentContainerStyle={styles.listContent}
      renderItem={({ item: product }) => {
        return (
          <View style={{ padding: spacing.xs, flex: 1 }}>
            <CashierProductCard
              imageUrl={product.imageUrl}
              name={
                <Text numberOfLines={2}>
                  {product.name}
                </Text>
              }
              onAdd={() => onAddProduct(product)}
              price={formatPeso(normalizeNumber(product.price))}
              stock={product.stock}
              style={{ width: '100%' }}
            />
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    marginBottom: spacing.lg,
    marginTop: spacing.section,
  },
  inventoryLead: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    lineHeight: 22,
  },
  filterRow: {
    marginBottom: spacing.md,
    marginTop: spacing.md,
    zIndex: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryText: {
    color: colors.textTertiary,
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  emptyStateCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateTitle: {
    color: colors.textStrong,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.bodyLarge,
    marginBottom: spacing.xs,
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    textAlign: 'center',
  },
});
