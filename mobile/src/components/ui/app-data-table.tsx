import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, fonts, textSizes } from '../../constants/theme';
import { spacing } from '../../constants/design-system';
import { useResponsiveLayout } from '../../hooks/use-responsive-layout';

type TableProps = {
  children: React.ReactNode;
};

export function AppDataTable({ children }: TableProps) {
  const { isTablet } = useResponsiveLayout();

  if (isTablet) {
    return (
      <View style={styles.tableTablet}>
        {children}
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.table}>
        {children}
      </View>
    </ScrollView>
  );
}

export function AppDataTableHeader({ children }: TableProps) {
  const { isTablet } = useResponsiveLayout();
  return (
    <View style={[styles.row, styles.headerRow, isTablet && styles.headerRowTablet]}>
      {children}
    </View>
  );
}

export function AppDataTableRow({ children }: TableProps) {
  const { isTablet } = useResponsiveLayout();
  return (
    <View style={[styles.row, isTablet && styles.rowTablet]}>
      {children}
    </View>
  );
}

type CellProps = {
  text?: string | number | null;
  children?: React.ReactNode;
  width?: number;
  flex?: number;
  numeric?: boolean;
  isHeader?: boolean;
};

export function AppDataTableCell({ text, children, width = 100, flex, numeric, isHeader }: CellProps) {
  const { isTablet } = useResponsiveLayout();
  return (
    <View style={[styles.cell, flex ? { flex } : { width }, numeric && styles.numericCell]}>
      {children ? children : (
        <Text style={[styles.cellText, isHeader && styles.headerText, isTablet && styles.cellTextTablet, isHeader && isTablet && styles.headerTextTablet]} numberOfLines={1}>
          {text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    minWidth: '100%',
  },
  tableTablet: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  rowTablet: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerRow: {
    backgroundColor: colors.surfaceNeutral,
    borderBottomWidth: 2,
    borderBottomColor: colors.borderMuted,
  },
  headerRowTablet: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  cell: {
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  numericCell: {
    alignItems: 'flex-end',
  },
  cellText: {
    fontFamily: fonts.regular,
    fontSize: textSizes.small,
    color: colors.textStrong,
  },
  cellTextTablet: {
    fontSize: textSizes.body,
  },
  headerText: {
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  headerTextTablet: {
    fontSize: textSizes.small,
    letterSpacing: 0.6,
  },
});
