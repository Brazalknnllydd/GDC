import type { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import { Image } from 'expo-image';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts, textRoles, textSizes } from '../../constants/theme';
import { useResponsiveLayout } from '../../hooks/use-responsive-layout';
import { resolveApiAssetUrl } from '../../lib/api';
import { AppButton } from '../ui/app-button';

type CashierProductCardProps = {
  imageUrl?: string | null;
  name: ReactNode;
  onAdd: () => void;
  price: string;
  stock: number;
  style?: StyleProp<ViewStyle>;
};

export function CashierProductCard({
  imageUrl,
  name,
  onAdd,
  price,
  stock,
  style,
}: CashierProductCardProps) {
  const { compactPhone } = useResponsiveLayout();
  const resolvedImage = resolveApiAssetUrl(imageUrl);

  return (
    <View style={[styles.card, compactPhone && styles.cardCompact, style]}>
      <View style={[styles.imageWrap, compactPhone && styles.imageWrapCompact]}>
        {resolvedImage ? (
          <Image contentFit="contain" source={{ uri: resolvedImage }} style={styles.image} />
        ) : (
          <View style={styles.fallbackImage}>
            <Text style={styles.fallbackText}>GDC</Text>
          </View>
        )}
        {stock <= 10 ? (
          <View style={[styles.lowBadge, stock === 0 ? styles.outOfStockBadge : styles.warningBadge]}>
            <Text style={[styles.lowBadgeText, stock === 0 ? styles.outOfStockText : styles.warningText]}>
              {stock === 0 ? 'NO STOCKS' : 'LOW'}
            </Text>
          </View>
        ) : null}
      </View>

      <Text numberOfLines={2} style={[styles.name, compactPhone && styles.nameCompact]}>
        {name}
      </Text>
      <Text style={[styles.stockText, compactPhone && styles.stockTextCompact, stock === 0 && { color: colors.danger }]}>
        {stock} in stock
      </Text>
      <Text style={[styles.price, compactPhone && styles.priceCompact]}>{price}</Text>

      <AppButton
        disabled={stock === 0}
        fullWidth
        icon={({ color, size }) => <Plus color={color} size={size} strokeWidth={2.2} />}
        label="Add"
        onPress={onAdd}
        size="sm"
        variant="secondary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    width: '48%',
  },
  cardCompact: {
    padding: spacing.sm + 2,
  },
  imageWrap: {
    borderRadius: radius.md,
    height: 126,
    marginBottom: spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  imageWrapCompact: {
    height: 110,
    marginBottom: spacing.sm,
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
  lowBadge: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
  },
  warningBadge: {
    backgroundColor: colors.surfaceWarningSoft,
  },
  outOfStockBadge: {
    backgroundColor: colors.surfaceDanger,
  },
  lowBadgeText: {
    ...textRoles.label,
    fontSize: textSizes.xsmall,
  },
  warningText: {
    color: colors.warningStrong,
  },
  outOfStockText: {
    color: colors.dangerStrong,
  },
  name: {
    color: colors.textStrong,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.body,
    lineHeight: 19,
    marginBottom: 4,
    minHeight: 38,
  },
  nameCompact: {
    fontSize: textSizes.small + 1,
    lineHeight: 18,
    minHeight: 36,
  },
  stockText: {
    color: colors.textTertiary,
    fontFamily: fonts.regular,
    fontSize: textSizes.small,
    marginBottom: spacing.xs,
  },
  stockTextCompact: {
    fontSize: textSizes.xsmall,
  },
  price: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: textSizes.medium,
    marginBottom: spacing.md,
  },
  priceCompact: {
    fontSize: textSizes.bodyLarge,
    marginBottom: spacing.sm,
  },
});
