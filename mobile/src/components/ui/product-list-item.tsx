import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react-native';
import { Image } from 'expo-image';
import { Menu } from 'react-native-paper';

import { radius, spacing } from '../../constants/design-system';
import { colors, textRoles, textSizes, fonts } from '../../constants/theme';
import { resolveApiAssetUrl } from '../../lib/api';
import { AppButton } from './app-button';

type ProductListItemProps = {
  category: string;
  description?: string | null;
  imageUrl?: string | null;
  low?: boolean;
  name: string;
  onDelete?: () => void;
  onEdit?: () => void;
  price: string;
  sku: string;
  weightText: string;
  stockText: string;
};

export function ProductListItem({
  category,
  description,
  imageUrl,
  low = false,
  name,
  onDelete,
  onEdit,
  price,
  sku,
  weightText,
  stockText,
}: ProductListItemProps) {
  const resolvedImageUrl = resolveApiAssetUrl(imageUrl);
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <View style={styles.card}>
      {/* 1. Grouped Product Name Column (circular image + name next to it) */}
      <View style={styles.nameCol}>
        <View style={styles.thumb}>
          {resolvedImageUrl ? (
            <Image contentFit="cover" source={{ uri: resolvedImageUrl }} style={styles.thumbImage} />
          ) : (
            <Text style={styles.thumbGlyph}>PKG</Text>
          )}
          {low ? (
            <View style={styles.lowBadge}>
              <Text style={styles.lowBadgeText}>LOW</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.nameText} numberOfLines={1}>{name}</Text>
      </View>

      {/* 2. Description */}
      <View style={styles.descriptionCol}>
        <Text style={styles.descriptionText} numberOfLines={1}>
          {description?.trim() || '—'}
        </Text>
      </View>

      {/* 3. Category */}
      <View style={styles.categoryCol}>
        <Text style={styles.categoryText} numberOfLines={1}>{category}</Text>
      </View>

      {/* 4. Barcode (SKU) */}
      <View style={styles.barcodeCol}>
        <Text style={styles.barcodeText} numberOfLines={1}>{sku}</Text>
      </View>

      {/* 5. Weight */}
      <View style={styles.weightCol}>
        <Text style={styles.weightText} numberOfLines={1}>{weightText}</Text>
      </View>

      {/* 6. Price */}
      <View style={styles.priceCol}>
        <Text style={styles.priceText} numberOfLines={1}>{price}</Text>
      </View>

      {/* 7. Stock */}
      <View style={styles.stockCol}>
        <Text style={[styles.stockText, low && styles.stockTextLow]} numberOfLines={1}>
          {stockText}
        </Text>
      </View>

      {/* 8. Action Icons (Ellipsis dropdown) */}
      <View style={styles.actionsCol}>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Pressable onPress={() => setMenuVisible(true)} style={styles.actionButton}>
              <EllipsisVertical color="#667085" size={20} strokeWidth={2} />
            </Pressable>
          }>
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              onEdit?.();
            }}
            title="Edit"
            leadingIcon={() => <Pencil size={18} color={colors.textSecondary} />}
          />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              onDelete?.();
            }}
            title="Delete"
            leadingIcon={() => <Trash2 size={18} color={colors.danger} />}
            titleStyle={{ color: colors.danger }}
          />
        </Menu>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderPanel,
    backgroundColor: '#FFFFFF',
    gap: spacing.md,
  },
  nameCol: {
    flex: 3.2,
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumb: {
    alignItems: 'center',
    backgroundColor: colors.textDark,
    borderRadius: 20, // circular avatar shape!
    height: 40,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: 40,
  },
  thumbImage: {
    height: '100%',
    width: '100%',
  },
  thumbGlyph: {
    color: colors.textInverse,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  lowBadge: {
    backgroundColor: colors.dangerAccent,
    borderRadius: radius.sm - 4,
    bottom: 1,
    paddingHorizontal: 2,
    paddingVertical: 0.5,
    position: 'absolute',
    right: 1,
  },
  lowBadgeText: {
    color: colors.textInverse,
    fontFamily: fonts.medium,
    fontSize: 6,
  },
  nameText: {
    color: '#101828', // dark charcoal color matching Olivia Rhye's text!
    fontFamily: fonts.semiBold,
    fontSize: textSizes.body,
  },
  descriptionCol: {
    flex: 2.2,
    minWidth: 150,
    justifyContent: 'center',
  },
  descriptionText: {
    color: '#475467', // medium grey matching the screenshot
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
  },
  categoryCol: {
    flex: 1.2,
    minWidth: 80,
    justifyContent: 'center',
  },
  categoryText: {
    color: '#475467',
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
  },
  barcodeCol: {
    flex: 2.0,
    minWidth: 120,
    justifyContent: 'center',
  },
  barcodeText: {
    color: '#475467',
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
  },
  weightCol: {
    flex: 1.2,
    minWidth: 80,
    justifyContent: 'center',
  },
  weightText: {
    color: '#475467',
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
  },
  priceCol: {
    flex: 1.2,
    minWidth: 80,
    justifyContent: 'center',
  },
  priceText: {
    color: '#475467',
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
  },
  stockCol: {
    flex: 1.2,
    minWidth: 80,
    justifyContent: 'center',
  },
  stockText: {
    color: '#475467',
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
  },
  stockTextLow: {
    color: colors.danger,
  },
  actionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    width: 100,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});
