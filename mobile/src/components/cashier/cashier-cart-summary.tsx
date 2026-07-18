import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { spacing } from '../../constants/design-system';
import { colors, fonts } from '../../constants/theme';
import { formatPeso } from '../../lib/product-utils';

type CashierCartSummaryProps = {
  grossSubtotal: number;
  discountTotal: number;
  itemCount: number;
  netSubtotal: number;
  style?: StyleProp<ViewStyle>;
};

export function CashierCartSummary({
  grossSubtotal,
  discountTotal,
  itemCount,
  netSubtotal,
  style,
}: CashierCartSummaryProps) {
  return (
    <View style={[styles.cartSummary, style]}>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Subtotal</Text>
        <Text style={styles.summaryValue}>{formatPeso(grossSubtotal)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Discount</Text>
        <Text style={styles.summaryDiscountValue}>- {formatPeso(discountTotal)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Items</Text>
        <Text style={styles.summaryValue}>{itemCount}</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryRow}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>{formatPeso(netSubtotal)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cartSummary: {
    marginTop: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    color: '#5D6476',
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  summaryValue: {
    color: '#2D3342',
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  summaryDiscountValue: {
    color: '#047857', // successColorDark
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  summaryDivider: {
    backgroundColor: '#E6EAF4',
    height: 1,
    marginVertical: spacing.md,
  },
  totalLabel: {
    color: colors.secondary,
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  totalValue: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: 18,
  },
});
