import type { ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { layout } from '../../constants/design-system';

type AdminMetricGridProps = {
  children: ReactNode;
};

export function AdminMetricGrid({ children }: AdminMetricGridProps) {
  const { width } = useWindowDimensions();
  const isCompactPhone = width < 430;

  return <View style={[styles.grid, isCompactPhone ? styles.gridCompact : undefined]}>{children}</View>;
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layout.cardGap,
    justifyContent: 'space-between',
    width: '100%',
  },
  gridCompact: {
    gap: 10,
  },
});
