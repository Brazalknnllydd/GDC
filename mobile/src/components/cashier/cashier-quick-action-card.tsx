import type { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts, textSizes } from '../../constants/theme';

type CashierQuickActionCardProps = {
  active?: boolean;
  icon: ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
  label: string;
  onPress?: () => void;
};

export function CashierQuickActionCard({
  active = false,
  icon: Icon,
  label,
  onPress,
}: CashierQuickActionCardProps) {
  return (
    <View style={styles.itemWrap}>
      <Pressable onPress={onPress} style={[styles.card, active && styles.cardActive]}>
        <Icon
          color={active ? colors.textInverse : colors.secondary}
          size={25}
          strokeWidth={active ? 2.2 : 1.9}
        />
      </Pressable>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  itemWrap: {
    alignItems: 'center',
    width: '23%',
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 84,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: '100%',
  },
  cardActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  label: {
    color: colors.textStrong,
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
    textAlign: 'center',
  },
});
