import { View, Text, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Package, Pencil, Trash2 } from 'lucide-react-native';
import { IconButton } from 'react-native-paper';

import type { Product } from './products-screen-data';
import { PaginationControls } from '../ui/pagination-controls';
import { resolveApiAssetUrl } from '../../lib/api';
import { formatPeso, normalizeNumber } from '../../lib/product-utils';
import { colors, fonts, textRoles, textSizes } from '../../constants/theme';
import { radius, spacing } from '../../constants/design-system';
import { useResponsiveLayout } from '../../hooks/use-responsive-layout';

export function ProductTable({
  paginatedProducts,
  productPage,
  setProductPage,
  totalPages,
  visiblePageNumbers,
  onEdit,
  onDelete,
  isLoading,
}: {
  paginatedProducts: Product[];
  productPage: number;
  setProductPage: (page: number) => void;
  totalPages: number;
  visiblePageNumbers: number[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  isLoading: boolean;
}) {
  const { compactPhone, isTablet, isWideTablet } = useResponsiveLayout();
  const { width } = useWindowDimensions();
  const isNarrowPhone = width < 430;
  const numColumns = isNarrowPhone ? 1 : isWideTablet ? 3 : 2;

  if (isLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator color={colors.secondary} size="small" />
      </View>
    );
  }

  if (paginatedProducts.length === 0) {
    return (
      <View style={styles.centeredState}>
        <Package color={colors.textSubtle} size={32} strokeWidth={1.5} />
        <Text style={styles.emptyText}>No products found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {paginatedProducts.map((product) => {
          const resolvedImage = resolveApiAssetUrl(product.imageUrl);
          const isLowStock = product.stock <= 10;

          return (
            <View
              key={product.id}
              style={[styles.itemWrap, compactPhone && styles.itemWrapCompact, { flexBasis: `${100 / numColumns}%` }]}
            >
              <View style={[styles.card, compactPhone && styles.cardCompact]}>
                <View style={[styles.imageWrap, compactPhone && styles.imageWrapCompact]}>
                  {resolvedImage ? (
                    <Image
                      contentFit="cover"
                      source={{ uri: resolvedImage }}
                      style={styles.image}
                    />
                  ) : (
                    <View style={styles.fallbackImage}>
                      <Text style={styles.fallbackText}>GDC</Text>
                    </View>
                  )}
                  {isLowStock ? (
                    <View
                      style={[
                        styles.badge,
                        product.stock === 0 ? styles.badgeDanger : styles.badgeWarning,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          product.stock === 0 ? styles.badgeTextDanger : styles.badgeTextWarning,
                        ]}
                      >
                        {product.stock === 0 ? 'OUT' : 'LOW'}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={[styles.body, compactPhone && styles.bodyCompact]}>
                  <Text numberOfLines={2} style={[styles.nameText, compactPhone && styles.nameTextCompact]}>
                    {product.name}
                  </Text>
                  <Text numberOfLines={1} style={[styles.skuText, compactPhone && styles.skuTextCompact]}>
                    {product.barcode || 'No barcode'}
                  </Text>

                  <View style={[styles.metaRow, compactPhone && styles.metaRowCompact]}>
                    <Text style={[styles.metaLabel, compactPhone && styles.metaLabelCompact]}>Category</Text>
                    <Text numberOfLines={1} style={[styles.metaValue, compactPhone && styles.metaValueCompact]}>
                      {product.category?.name || '—'}
                    </Text>
                  </View>

                  <View style={[styles.metaRow, compactPhone && styles.metaRowCompact]}>
                    <Text style={[styles.metaLabel, compactPhone && styles.metaLabelCompact]}>Price</Text>
                    <Text style={[styles.metaValue, styles.priceText, compactPhone && styles.metaValueCompact]}>
                      {formatPeso(normalizeNumber(product.price))}
                    </Text>
                  </View>

                  <View style={[styles.metaRow, compactPhone && styles.metaRowCompact]}>
                    <Text style={[styles.metaLabel, compactPhone && styles.metaLabelCompact]}>Stock</Text>
                    <Text
                      style={[
                        styles.metaValue,
                        compactPhone && styles.metaValueCompact,
                        product.stock === 0 && styles.dangerText,
                        isLowStock && product.stock > 0 && styles.warningText,
                      ]}
                    >
                      {product.stock} {product.unit}
                    </Text>
                  </View>

                  {product.weight !== null && product.weight !== undefined ? (
                    <View style={[styles.metaRow, compactPhone && styles.metaRowCompact]}>
                      <Text style={[styles.metaLabel, compactPhone && styles.metaLabelCompact]}>Weight</Text>
                      <Text style={[styles.metaValue, compactPhone && styles.metaValueCompact]}>
                        {product.weight}
                        {product.unit !== 'pcs' ? product.unit : ''}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={[styles.actionsRow, compactPhone && styles.actionsRowCompact]}>
                  <IconButton
                    icon={() => <Pencil color={colors.secondary} size={18} strokeWidth={2.5} />}
                    onPress={() => onEdit(product)}
                    size={22}
                    style={styles.actionButton}
                  />
                  <IconButton
                    icon={() => <Trash2 color={colors.danger} size={18} strokeWidth={2.5} />}
                    onPress={() => onDelete(product)}
                    size={22}
                    style={[styles.actionButton, styles.deleteButton]}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.paginationRow}>
        <PaginationControls
          borderless
          currentPage={productPage}
          onPageChange={setProductPage}
          totalPages={totalPages}
          visiblePageNumbers={visiblePageNumbers}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#EAECF0',
    borderTopWidth: 1,
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.xl,
  },
  centeredState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
    paddingVertical: 48,
  },
  emptyText: {
    color: '#D0D5DD',
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    marginTop: 8,
  },
  itemWrap: {
    padding: spacing.sm,
  },
  itemWrapCompact: {
    padding: spacing.xs,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EAECF0',
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardCompact: {
    borderRadius: radius.lg,
  },
  imageWrap: {
    backgroundColor: colors.surfaceSoft,
    height: 160,
    position: 'relative',
  },
  imageWrapCompact: {
    height: 104,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  fallbackImage: {
    alignItems: 'center',
    backgroundColor: colors.fallbackImage,
    flex: 1,
    justifyContent: 'center',
  },
  fallbackText: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: textSizes.titleLarge,
  },
  badge: {
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
  },
  badgeWarning: {
    backgroundColor: colors.surfaceWarningSoft,
  },
  badgeDanger: {
    backgroundColor: colors.surfaceDanger,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: textSizes.xsmall,
    letterSpacing: 0.8,
  },
  badgeTextWarning: {
    color: colors.warningStrong,
  },
  badgeTextDanger: {
    color: colors.dangerStrong,
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  bodyCompact: {
    paddingHorizontal: spacing.sm + 1,
    paddingTop: spacing.sm + 1,
  },
  nameText: {
    color: colors.textStrong,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.body,
    lineHeight: 19,
  },
  nameTextCompact: {
    fontSize: textSizes.small + 1,
    lineHeight: 17,
  },
  skuText: {
    color: colors.textTertiary,
    fontFamily: fonts.regular,
    fontSize: textSizes.small,
    marginTop: 4,
  },
  skuTextCompact: {
    fontSize: textSizes.xsmall,
    marginTop: 2,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  metaRowCompact: {
    marginTop: spacing.xs,
  },
  metaLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: textSizes.smallCaps,
    letterSpacing: 1,
  },
  metaLabelCompact: {
    fontSize: textSizes.xsmall,
    letterSpacing: 0.5,
  },
  metaValue: {
    color: colors.textStrong,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.body,
  },
  metaValueCompact: {
    fontSize: textSizes.small,
  },
  priceText: {
    color: colors.secondary,
    ...textRoles.value,
  },
  dangerText: {
    color: colors.danger,
  },
  warningText: {
    color: colors.warningStrong,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
  },
  actionsRowCompact: {
    paddingBottom: spacing.xs,
    paddingTop: spacing.xs,
  },
  actionButton: {
    backgroundColor: colors.surfaceSoft,
    margin: 0,
  },
  deleteButton: {
    backgroundColor: colors.surfaceDanger,
  },
  paginationRow: {
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
});
