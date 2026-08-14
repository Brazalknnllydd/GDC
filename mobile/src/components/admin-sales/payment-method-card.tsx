import { StyleSheet, Text, View } from 'react-native';
import type { ComponentType } from 'react';

import { radius, spacing } from '../../constants/design-system';
import { colors, textRoles } from '../../constants/theme';
import { SurfaceCard } from '../ui/surface-card';

type IconProps = {
  color?: string;
  size?: number;
  strokeWidth?: number;
};

type PaymentMethodCardProps = {
  icon: ComponentType<IconProps>;
  label: string;
  value: string;
};

export function PaymentMethodCard({ icon: Icon, label, value }: PaymentMethodCardProps) {
  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.iconWrap}>
        <Icon color={colors.textHeading} size={20} strokeWidth={1.9} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 114,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.borderPanel,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 36,
  },
  label: {
    color: colors.textTertiary,
    ...textRoles.label,
    fontSize: 11,
    marginBottom: spacing.sm,
  },
  value: {
    color: colors.textStrong,
    ...textRoles.value,
    fontSize: 15,
    lineHeight: 20,
  },
});
