import type { StyleProp, ViewStyle } from 'react-native';

import { AdminMetricCard } from './admin-metric-card';

type InventoryStatCardProps = {
  title: string;
  value: string;
  detail: string;
  accent?: 'default' | 'danger' | 'success';
  style?: StyleProp<ViewStyle>;
};

export function InventoryStatCard({
  title,
  value,
  detail,
  accent = 'default',
  style,
}: InventoryStatCardProps) {
  return (
    <AdminMetricCard
      detail={detail}
      style={style}
      title={title}
      tone={accent}
      value={value}
    />
  );
}
