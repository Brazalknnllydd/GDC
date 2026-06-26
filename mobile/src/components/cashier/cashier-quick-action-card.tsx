import type { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts } from '../../constants/theme';

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
          color={active ? '#FFFFFF' : colors.secondary}
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
    backgroundColor: '#FFFFFF',
    borderColor: '#CED3E3',
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
    color: '#141A25',
    fontFamily: fonts.medium,
    fontSize: 12,
    textAlign: 'center',
  },
});
