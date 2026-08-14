import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { spacing } from '../../constants/design-system';
import { colors, fonts, textSizes } from '../../constants/theme';

export type DataTableProps<TData> = {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  isLoading?: boolean;
  estimatedItemSize?: number;
  emptyStateMessage?: string;
  keyExtractor?: (item: TData, index: number) => string;
};

export function DataTable<TData>({
  columns,
  data,
  isLoading,
  estimatedItemSize = 100,
  emptyStateMessage = 'No data available',
  keyExtractor,
}: DataTableProps<TData>) {
  const { width } = useWindowDimensions();
  const isCompactPhone = width < 430;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateText}>Loading...</Text>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateText}>{emptyStateMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Table Header */}
      {!isCompactPhone && table.getHeaderGroups().map((headerGroup) => (
        <View key={headerGroup.id} style={styles.headerRow}>
          {headerGroup.headers.map((header) => {
            const meta = header.column.columnDef.meta as { flex?: number; width?: number; align?: 'left' | 'center' | 'right' } | undefined;
            return (
              <View
                key={header.id}
                style={[
                  styles.headerCell,
                  meta?.flex ? { flex: meta.flex } : undefined,
                  meta?.width ? { width: meta.width, flexShrink: 0 } : undefined,
                ]}
              >
                {!header.isPlaceholder && (
                  <Text style={[styles.headerText, meta?.align ? { textAlign: meta.align } : undefined]}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      ))}

      {/* Table Body */}
      <View style={styles.listContainer}>
        <FlashList
          data={table.getRowModel().rows}
          // @ts-expect-error FlashList props issue
          estimatedItemSize={estimatedItemSize}
          keyExtractor={(row, index) =>
            keyExtractor ? keyExtractor(row.original, index) : row.id
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item: row }) => (
            <View style={styles.row}>
              {row.getVisibleCells().map((cell) => {
                const meta = cell.column.columnDef.meta as { flex?: number; width?: number; align?: 'left' | 'center' | 'right' } | undefined;
                return (
                  <View
                    key={cell.id}
                    style={[
                      styles.cell,
                      meta?.flex ? { flex: meta.flex } : undefined,
                      meta?.width ? { width: meta.width, flexShrink: 0 } : undefined,
                    ]}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </View>
                );
              })}
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.xs,
  },
  headerCell: {
    paddingRight: spacing.md,
    justifyContent: 'center',
  },
  headerText: {
    fontFamily: fonts.semiBold,
    fontSize: textSizes.xsmall,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border || '#e2e8f0',
  },
  cell: {
    paddingRight: spacing.md,
    justifyContent: 'center',
  },
  listContainer: {
    flex: 1,
    minHeight: 200,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  stateContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  stateText: {
    fontFamily: fonts.medium,
    fontSize: textSizes.medium,
    color: colors.text,
  },
});
