import { StyleSheet, Text, View } from 'react-native';
import type { ComponentType } from 'react';

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
    minHeight: 94,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  iconWrap: {
    marginBottom: 10,
  },
  label: {
    color: '#6A6F80',
    ...textRoles.label,
    marginBottom: 6,
  },
  value: {
    color: '#161B29',
    ...textRoles.value,
  },
});
