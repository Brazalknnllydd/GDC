import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Minus, Plus, X } from 'lucide-react-native';
import { Image } from 'expo-image';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts, textRoles, textSizes } from '../../constants/theme';
import { resolveApiAssetUrl } from '../../lib/api';

type CashierCartItemRowProps = {
  imageUrl?: string | null;
  name: string;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
  priceText: string;
  quantity: number;
  totalText: string;
};

export function CashierCartItemRow({
  imageUrl,
  name,
  onDecrease,
  onIncrease,
  onRemove,
  priceText,
  quantity,
  totalText,
}: CashierCartItemRowProps) {
  const resolvedImage = resolveApiAssetUrl(imageUrl);

  return (
    <View style={styles.row}>
      <View style={styles.imageWrap}>
        {resolvedImage ? (
          <Image contentFit="cover" source={{ uri: resolvedImage }} style={styles.image} />
        ) : (
          <View style={styles.fallbackImage}>
            <Text style={styles.fallbackText}>GDC</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.textWrap}>
            <Text numberOfLines={2} style={styles.name}>
              {name}
            </Text>
            <Text style={styles.priceText}>{priceText} / unit</Text>
          </View>
          <Pressable onPress={onRemove} style={styles.removeButton}>
            <X color={colors.dangerAccent} size={16} strokeWidth={2.1} />
          </Pressable>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.stepper}>
            <Pressable onPress={onDecrease} style={styles.stepperButton}>
              <Minus color={colors.secondary} size={15} strokeWidth={2.2} />
            </Pressable>
            <Text style={styles.quantity}>{quantity}</Text>
            <Pressable onPress={onIncrease} style={styles.stepperButton}>
              <Plus color={colors.secondary} size={15} strokeWidth={2.2} />
            </Pressable>
          </View>
          <Text style={styles.totalText}>{totalText}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderBottomColor: colors.borderSoft,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: spacing.md,
  },
  imageWrap: {
    borderRadius: radius.md,
    height: 72,
    marginRight: spacing.md,
    overflow: 'hidden',
    width: 72,
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
    fontSize: 13,
  },
  body: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textWrap: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  name: {
    color: colors.textHeading,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.body,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  priceText: {
    color: colors.textSecondary,
    ...textRoles.label,
    fontSize: textSizes.small,
  },
  removeButton: {
    padding: 2,
  },
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  stepper: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1.2,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  stepperButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  quantity: {
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: textSizes.body,
    minWidth: 34,
    textAlign: 'center',
  },
  totalText: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: textSizes.medium,
  },
});
