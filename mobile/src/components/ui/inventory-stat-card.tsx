import type { StyleProp, ViewStyle } from 'react-native';

import { AdminMetricCard } from './admin-metric-card';

type InventoryStatCardProps = {
  title: string;
  value: string;
  detail: string;
  accent?: 'default' | 'danger' | 'success';
  infoDialogTitle?: string;
  infoDialogValue?: string;
  style?: StyleProp<ViewStyle>;
};

export function InventoryStatCard({
  title,
  value,
  detail,
  accent = 'default',
  infoDialogTitle,
  infoDialogValue,
  style,
}: InventoryStatCardProps) {
  return (
    <AdminMetricCard
      detail={detail}
      infoDialogTitle={infoDialogTitle}
      infoDialogValue={infoDialogValue}
      style={style}
      title={title}
      tone={accent}
      value={value}
    />
  );
}
