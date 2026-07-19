import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import type { Product } from '../admin-products/products-screen-data';
import { CashierProductCard } from './cashier-product-card';
import { SectionHeading } from '../ui/section-heading';
import { spacing } from '../../constants/design-system';
import { colors, fonts, textSizes } from '../../constants/theme';
import { formatPeso, normalizeNumber } from '../../lib/product-utils';

type CashierInventorySectionProps = {
  onAddProduct: (product: Product) => void;
  productCardWidth: ViewStyle['width'];
  products: Product[];
};

export function CashierInventorySection({
  onAddProduct,
  productCardWidth,
  products,
}: CashierInventorySectionProps) {
  return (
    <>
      <SectionHeading style={styles.sectionLabel}>INVENTORY VIEW</SectionHeading>
      <Text style={styles.inventoryLead}>
        Browse current stock levels and product pricing in the same cashier workspace.
      </Text>
      <View style={styles.productsGrid}>
        {products.map((product) => (
          <CashierProductCard
            key={product.id}
            imageUrl={product.imageUrl}
            name={`${product.name} (${product.stock} ${product.unit})`}
            onAdd={() => onAddProduct(product)}
            price={formatPeso(normalizeNumber(product.price))}
            stock={product.stock}
            style={{ width: productCardWidth }}
          />
        ))}
      </View>
    </>
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
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
