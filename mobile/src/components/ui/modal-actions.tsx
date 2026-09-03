import React, { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../../constants/design-system';
import { useResponsiveLayout } from '../../hooks/use-responsive-layout';

type ModalActionsProps = {
  children: ReactNode;
  stacked?: boolean;
};

export function ModalActions({ children, stacked }: ModalActionsProps) {
  const { compactPhone } = useResponsiveLayout();
  const shouldStack = stacked ?? compactPhone;
  const content = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    return React.cloneElement(child, {
      // @ts-ignore - assume children accept style array
      style: [!shouldStack && styles.rowChild, child.props.style, shouldStack && styles.stackedChild],
    });
  });

  return <View style={[styles.row, shouldStack && styles.stacked]}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  rowChild: {
    flex: 1,
  },
  stacked: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  stackedChild: {
    flex: 0,
  },
});
