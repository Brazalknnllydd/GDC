import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Image } from 'expo-image';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts, textRoles } from '../../constants/theme';
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
  const resolvedImage = resolveApiAssetUrl(imageUrl);

  return (
    <View style={[styles.card, style]}>
      <View style={styles.imageWrap}>
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

      <Text numberOfLines={2} style={styles.name}>
        {name}
      </Text>
      <Text style={styles.price}>{price}</Text>

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
    backgroundColor: '#FFFFFF',
    borderColor: '#CED3E3',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    width: '48%',
  },
  imageWrap: {
    borderRadius: radius.md,
    height: 126,
    marginBottom: spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  fallbackImage: {
    alignItems: 'center',
    backgroundColor: '#D8DEE9',
    flex: 1,
    justifyContent: 'center',
  },
  fallbackText: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: 20,
  },
  lowBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
  },
  lowBadgeText: {
    color: '#B91C1C',
    ...textRoles.label,
    fontSize: 10,
  },
  name: {
    color: '#131927',
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 19,
    marginBottom: spacing.xs,
    minHeight: 38,
  },
  price: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: 16,
    marginBottom: spacing.md,
  },
});
