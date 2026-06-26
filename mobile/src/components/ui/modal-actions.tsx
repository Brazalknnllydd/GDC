import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../../constants/design-system';

type ModalActionsProps = {
  children: ReactNode;
  stacked?: boolean;
};

export function ModalActions({ children, stacked = false }: ModalActionsProps) {
  return <View style={[styles.row, stacked && styles.stacked]}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  stacked: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
});
