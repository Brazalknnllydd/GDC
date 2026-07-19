import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, fonts, textSizes } from '../../constants/theme';
import { spacing } from '../../constants/design-system';

type TableProps = {
  children: React.ReactNode;
};

export function AppDataTable({ children }: TableProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.table}>
        {children}
      </View>
    </ScrollView>
  );
}

export function AppDataTableHeader({ children }: TableProps) {
  return (
    <View style={[styles.row, styles.headerRow]}>
      {children}
    </View>
  );
}

export function AppDataTableRow({ children }: TableProps) {
  return (
    <View style={styles.row}>
      {children}
    </View>
  );
}

type CellProps = {
  text?: string | number | null;
  children?: React.ReactNode;
  width?: number;
  numeric?: boolean;
  isHeader?: boolean;
};

export function AppDataTableCell({ text, children, width = 100, numeric, isHeader }: CellProps) {
  return (
    <View style={[styles.cell, { width }, numeric && styles.numericCell]}>
      {children ? children : (
        <Text style={[styles.cellText, isHeader && styles.headerText]} numberOfLines={1}>
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
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  headerRow: {
    backgroundColor: colors.surfaceNeutral,
    borderBottomWidth: 2,
    borderBottomColor: colors.borderMuted,
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
  headerText: {
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
