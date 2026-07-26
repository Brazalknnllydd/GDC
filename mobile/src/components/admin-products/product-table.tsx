import { useMemo } from 'react';
import { StyleSheet, View, Text, useWindowDimensions } from 'react-native';
import { createColumnHelper } from '@tanstack/react-table';
import { Image } from 'expo-image';
import { Pencil, Trash2 } from 'lucide-react-native';

import type { Product } from './products-screen-data';
import { DataTable } from '../ui/data-table';
import { PaginationControls } from '../ui/pagination-controls';
import { AppButton } from '../ui/app-button';
import { resolveApiAssetUrl } from '../../lib/api';
import { colors, fonts, textRoles, textSizes } from '../../constants/theme';
import { radius, spacing } from '../../constants/design-system';

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
  const { width } = useWindowDimensions();
  const isCompactPhone = width < 430;

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<Product>();

    return [
      columnHelper.accessor('name', {
        header: 'Product',
        meta: { flex: 1 },
        cell: (info) => {
          const product = info.row.original;
          const resolvedImage = resolveApiAssetUrl(product.imageUrl);
          
          return (
            <View style={styles.productCell}>
              <View style={styles.imageWrap}>
                {resolvedImage ? (
                  <Image source={{ uri: resolvedImage }} style={styles.image} contentFit="cover" />
                ) : (
                  <View style={styles.fallbackImage}>
                    <Text style={styles.fallbackText}>GDC</Text>
                  </View>
                )}
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.nameText} numberOfLines={1}>{product.name}</Text>
                {product.barcode ? <Text style={styles.skuText}>{product.barcode}</Text> : null}
              </View>
            </View>
          );
        },
      }),
      ...(isCompactPhone ? [] : [
        columnHelper.accessor('category.name', {
          header: 'Category',
          meta: { width: 140 },
          cell: (info) => (
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>{info.getValue()}</Text>
            </View>
          ),
        }),
      ]),
      columnHelper.accessor('price', {
        header: 'Price',
        meta: { width: 110, align: 'right' },
        cell: (info) => <Text style={styles.priceText}>₱{Number(info.getValue()).toFixed(2)}</Text>,
      }),
      columnHelper.accessor('stock', {
        header: 'Stock',
        meta: { width: 90, align: 'right' },
        cell: (info) => {
          const stock = info.getValue();
          const weight = info.row.original.weight;
          const unit = info.row.original.unit;
          
          return (
            <View style={styles.stockCell}>
              <Text style={[styles.stockText, stock <= 10 && styles.lowStockText]}>
                {stock}
              </Text>
              {weight !== null && weight !== undefined && (
                <Text style={styles.weightText}>
                  {weight}{unit !== 'pcs' ? unit : ''}
                </Text>
              )}
            </View>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        meta: { width: 84 },
        cell: (info) => (
          <View style={styles.actions}>
            <AppButton
              variant="secondary"
              size="sm"
              icon={({ color, size }) => <Pencil color={color} size={size} strokeWidth={2.5} />}
              onPress={() => onEdit(info.row.original)}
              label=""
            />
            <AppButton
              variant="dangerOutline"
              size="sm"
              icon={({ color, size }) => <Trash2 color={color} size={size} strokeWidth={2.5} />}
              onPress={() => onDelete(info.row.original)}
              label=""
            />
          </View>
        ),
      })
    ];
  }, [isCompactPhone, onDelete, onEdit]);

  return (
    <>
      <DataTable
        columns={columns}
        data={paginatedProducts}
        isLoading={isLoading}
        estimatedItemSize={isCompactPhone ? 116 : 84}
        emptyStateMessage="No products found in this category."
        keyExtractor={(item) => item.id.toString()}
      />
      <PaginationControls
        currentPage={productPage}
        onPageChange={setProductPage}
        totalPages={totalPages}
        visiblePageNumbers={visiblePageNumbers}
      />
    </>
  );
}

const styles = StyleSheet.create({
  productCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  imageWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.fallbackImage,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontFamily: fonts.bold,
    fontSize: textSizes.small,
    color: colors.secondary,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameText: {
    fontFamily: fonts.semiBold,
    fontSize: textSizes.body,
    color: colors.textStrong,
  },
  skuText: {
    fontFamily: fonts.regular,
    fontSize: textSizes.small,
    color: colors.text,
    marginTop: 2,
  },
  categoryPill: {
    backgroundColor: colors.surfaceSubtle,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  categoryText: {
    fontFamily: fonts.medium,
    fontSize: textSizes.xsmall,
    color: colors.text,
  },
  priceText: {
    ...textRoles.value,
    fontSize: textSizes.body,
    color: colors.secondary,
    textAlign: 'right',
  },
  stockCell: {
    alignItems: 'flex-end',
  },
  stockText: {
    fontFamily: fonts.semiBold,
    fontSize: textSizes.body,
    color: colors.textStrong,
  },
  lowStockText: {
    color: colors.dangerStrong,
  },
  weightText: {
    fontFamily: fonts.regular,
    fontSize: textSizes.small,
    color: colors.text,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'flex-end',
  },
});
