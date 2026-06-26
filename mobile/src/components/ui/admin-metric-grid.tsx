import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { layout } from '../../constants/design-system';

type AdminMetricGridProps = {
  children: ReactNode;
};

export function AdminMetricGrid({ children }: AdminMetricGridProps) {
  return <View style={styles.grid}>{children}</View>;
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layout.cardGap,
    justifyContent: 'space-between',
    width: '100%',
  },
});
