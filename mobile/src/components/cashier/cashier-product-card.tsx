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
  name: string;
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
          <Image contentFit="cover" source={{ uri: resolvedImage }} style={styles.image} />
        ) : (
          <View style={styles.fallbackImage}>
            <Text style={styles.fallbackText}>GDC</Text>
          </View>
        )}
        {stock <= 10 ? (
          <View style={styles.lowBadge}>
            <Text style={styles.lowBadgeText}>LOW</Text>
          </View>
        ) : null}
      </View>

      <Text numberOfLines={2} style={[styles.name, compactPhone && styles.nameCompact]}>
        {name}
      </Text>
      <Text style={[styles.price, compactPhone && styles.priceCompact]}>{price}</Text>

      <AppButton
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
    backgroundColor: colors.surfaceDanger,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
  },
  lowBadgeText: {
    color: colors.dangerStrong,
    ...textRoles.label,
    fontSize: textSizes.xsmall,
  },
  name: {
    color: colors.textStrong,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.body,
    lineHeight: 19,
    marginBottom: spacing.xs,
    minHeight: 38,
  },
  nameCompact: {
    fontSize: textSizes.small + 1,
    lineHeight: 18,
    minHeight: 36,
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
