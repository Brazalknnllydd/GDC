import { StyleSheet, Text, View } from 'react-native';
import type { ComponentType } from 'react';

import { radius, spacing } from '../../constants/design-system';
import { textRoles } from '../../constants/theme';
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
        <Icon color="#2C3140" size={22} strokeWidth={1.9} />
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
    minHeight: 136,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#F4F6FB',
    borderColor: '#DCE2EF',
    borderRadius: radius.md,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 40,
  },
  label: {
    color: '#6A6F80',
    ...textRoles.label,
    marginBottom: spacing.sm,
  },
  value: {
    color: '#161B29',
    ...textRoles.value,
    fontSize: 18,
  },
});
