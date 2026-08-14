import React, { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../../constants/design-system';

type ModalActionsProps = {
  children: ReactNode;
  stacked?: boolean;
};

export function ModalActions({ children, stacked = false }: ModalActionsProps) {
  const content = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    return React.cloneElement(child, {
      // @ts-ignore - assume children accept style array
      style: [!stacked && { flex: 1 }, child.props.style],
    });
  });

  return <View style={[styles.row, stacked && styles.stacked]}>{content}</View>;
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
