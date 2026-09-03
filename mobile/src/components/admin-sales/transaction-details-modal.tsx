import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { AdminModalShell } from '../ui/admin-modal-shell';
import { colors, textRoles } from '../../constants/theme';
import { radius, spacing } from '../../constants/design-system';
import { formatPeso, normalizeNumber } from '../../lib/product-utils';
import { getCashierName } from './sales-history-utils';
import type { SaleRecord } from './sales-history-types';

const itemColumns = {
  price: 112,
  product: 210,
  quantity: 82,
  subtotal: 122,
};
const itemTableWidth = Object.values(itemColumns).reduce((sum, width) => sum + width, 0);

type TransactionDetailsModalProps = {
  compact: boolean;
  formatDateTime: (value: string) => string;
  isTablet: boolean;
  onClose: () => void;
  sale: SaleRecord | null;
};

export function TransactionDetailsModal({
  compact,
  formatDateTime,
  isTablet,
  onClose,
  sale,
}: TransactionDetailsModalProps) {
  const { height, width } = useWindowDimensions();
  const isLandscape = width > height;

  return (
    <AdminModalShell
      compact={compact}
      height={Math.min(height * (isLandscape ? 0.84 : 0.78), isTablet ? 720 : 640)}
      maxWidth={isTablet || isLandscape ? 820 : 460}
      onClose={onClose}
      title={sale ? `Transaction ${sale.receiptNumber}` : 'Transaction Details'}
      visible={Boolean(sale)}
      widthRatio={isTablet || isLandscape ? 0.82 : 0.94}>
      {sale ? (
        <ScrollView
          contentContainerStyle={styles.content}
          nestedScrollEnabled
          showsVerticalScrollIndicator>
          <View style={styles.summaryGrid}>
            <SummaryItem label="Receipt No" value={sale.receiptNumber} />
            <SummaryItem label="Date Sold" value={formatDateTime(sale.createdAt)} />
            <SummaryItem label="Cashier" value={getCashierName(sale)} />
            <SummaryItem
              label={sale.saleType === 'INTERNAL_CASHIER' ? 'Recipient Cashier' : 'Customer'}
              value={
                sale.saleType === 'INTERNAL_CASHIER'
                  ? sale.recipientUser?.name || 'Cashier'
                  : sale.customer?.name || 'Walk-in'
              }
            />
            <SummaryItem label="Payment" value={sale.paymentMethod} />
            <SummaryItem
              label="Sale Type"
              value={sale.saleType === 'INTERNAL_CASHIER' ? 'Internal Cashier' : 'Customer'}
            />
            <SummaryItem
              emphasized={sale.status === 'voided' || sale.saleType === 'INTERNAL_CASHIER'}
              label="Status"
              value={sale.status === 'voided' ? 'voided' : sale.saleType === 'INTERNAL_CASHIER' ? 'internal' : sale.status || 'completed'}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.tableScroller}>
            <View style={[styles.table, { minWidth: itemTableWidth }]}>
              <View style={[styles.tableHeader, isTablet && styles.tableHeaderTablet]}>
                <Text style={[styles.tableHeaderCell, isTablet && styles.tableHeaderCellTablet, { width: itemColumns.product }]}>PRODUCT</Text>
                <Text style={[styles.tableHeaderCell, isTablet && styles.tableHeaderCellTablet, styles.amountCell, { width: itemColumns.quantity }]}>QTY</Text>
                <Text style={[styles.tableHeaderCell, isTablet && styles.tableHeaderCellTablet, styles.amountCell, { width: itemColumns.price }]}>PRICE</Text>
                <Text style={[styles.tableHeaderCell, isTablet && styles.tableHeaderCellTablet, styles.amountCell, { width: itemColumns.subtotal }]}>SUBTOTAL</Text>
              </View>

              <View style={styles.tableRows}>
                {sale.items.map((item, index) => (
                  <View key={`${sale.id}-${item.id ?? index}`} style={[styles.tableRow, isTablet && styles.tableRowTablet]}>
                    <Text numberOfLines={2} style={[styles.tableCell, isTablet && styles.tableCellTablet, { color: colors.textStrong, width: itemColumns.product }]}>
                      {item.product?.name || `Item ${index + 1}`}
                    </Text>
                    <Text style={[styles.tableCell, isTablet && styles.tableCellTablet, styles.amountCell, { width: itemColumns.quantity }]}>
                      {normalizeNumber(item.quantity)}
                    </Text>
                    <Text style={[styles.tableCell, isTablet && styles.tableCellTablet, styles.amountCell, { width: itemColumns.price }]}>
                      {formatPeso(normalizeNumber(item.price ?? item.subtotal))}
                    </Text>
                    <Text style={[styles.tableCell, isTablet && styles.tableCellTablet, styles.amountCell, { ...textRoles.value, color: colors.textStrong, width: itemColumns.subtotal }]}>
                      {formatPeso(normalizeNumber(item.subtotal))}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.totals}>
            <TotalRow label="Subtotal" value={formatPeso(normalizeNumber(sale.subtotal))} />
            <TotalRow label="Discount" value={formatPeso(normalizeNumber(sale.discountAmount))} />
            <TotalRow label="Amount Paid" value={formatPeso(normalizeNumber(sale.amountPaid))} />
            <TotalRow label="Change" value={formatPeso(normalizeNumber(sale.changeAmount))} />
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{formatPeso(normalizeNumber(sale.totalAmount))}</Text>
            </View>
          </View>
        </ScrollView>
      ) : null}
    </AdminModalShell>
  );
}

function SummaryItem({
  emphasized = false,
  label,
  value,
}: {
  emphasized?: boolean;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, emphasized && styles.statusVoided]}>{value}</Text>
    </View>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.totalRow}>
      <Text style={styles.totalLabel}>{label}</Text>
      <Text style={styles.totalValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryItem: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.borderPanel,
    borderRadius: radius.md,
    borderWidth: 1,
    flexBasis: '31%',
    flexGrow: 1,
    minWidth: 150,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  summaryLabel: {
    color: colors.muted,
    ...textRoles.label,
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    color: colors.textStrong,
    ...textRoles.value,
    fontSize: 14,
    lineHeight: 20,
  },
  statusVoided: {
    color: colors.danger,
  },
  table: {
    backgroundColor: '#FFFFFF',
    marginTop: 0,
    overflow: 'hidden',
    width: '100%',
  },
  tableScroller: {
    flexGrow: 1,
  },
  tableHeader: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderBottomColor: colors.borderPanel,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tableHeaderTablet: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  tableHeaderCell: {
    color: colors.textSecondary,
    ...textRoles.label,
    fontSize: 12,
    paddingRight: spacing.md,
  },
  tableHeaderCellTablet: {
    fontSize: 13,
  },
  tableRows: {
    backgroundColor: '#FFFFFF',
  },
  tableRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomColor: colors.borderPanel,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 1,
  },
  tableRowTablet: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  tableCell: {
    color: '#475467',
    ...textRoles.body,
    fontSize: 13,
    paddingRight: spacing.md,
  },
  tableCellTablet: {
    fontSize: 15,
  },
  amountCell: {
    textAlign: 'right',
  },
  totals: {
    alignSelf: 'flex-end',
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.borderPanel,
    borderRadius: radius.md,
    borderWidth: 1,
    minWidth: 260,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: '100%',
  },
  totalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 2,
  },
  totalLabel: {
    color: colors.textSecondary,
    ...textRoles.body,
    fontSize: 14,
  },
  totalValue: {
    color: colors.textStrong,
    ...textRoles.value,
    fontSize: 14,
  },
  grandTotalRow: {
    borderTopColor: colors.borderPanel,
    borderTopWidth: 1,
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
  },
  grandTotalLabel: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: 16,
  },
  grandTotalValue: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: 18,
  },
});
