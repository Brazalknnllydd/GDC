import { StyleSheet, Text, View } from 'react-native';
import { Banknote, CreditCard, QrCode } from 'lucide-react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts, textRoles } from '../../constants/theme';
import { formatCashierTime, formatPaymentMethod } from '../../lib/cashier-formatters';
import { formatPeso } from '../../lib/product-utils';

type CashierRecentSaleItemProps = {
  paymentMethod: string;
  receiptNumber: string;
  time: string;
  totalAmount: number;
};

function getPaymentMeta(paymentMethod: string) {
  const normalized = paymentMethod.trim().toLowerCase();

  if (normalized === 'cash') {
    return {
      backgroundColor: '#EAF8EF',
      icon: Banknote,
      iconColor: '#16A34A',
    };
  }

  if (normalized === 'maya') {
    return {
      backgroundColor: '#F5EDFF',
      icon: QrCode,
      iconColor: '#7C3AED',
    };
  }

  return {
    backgroundColor: '#EEF4FF',
    icon: CreditCard,
    iconColor: '#2563EB',
  };
}

export function CashierRecentSaleItem({
  paymentMethod,
  receiptNumber,
  time,
  totalAmount,
}: CashierRecentSaleItemProps) {
  const paymentMeta = getPaymentMeta(paymentMethod);
  const Icon = paymentMeta.icon;

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: paymentMeta.backgroundColor }]}>
        <Icon color={paymentMeta.iconColor} size={22} strokeWidth={2} />
      </View>

      <View style={styles.body}>
        <View>
          <Text style={styles.receiptText}>#{receiptNumber}</Text>
          <Text style={styles.metaText}>
            {formatCashierTime(new Date(time))} • {formatPaymentMethod(paymentMethod)}
          </Text>
        </View>
        <Text style={styles.amountText}>{formatPeso(totalAmount)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomColor: '#E3E7F1',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 44,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 44,
  },
  body: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptText: {
    color: '#111827',
    fontFamily: fonts.bold,
    fontSize: 16,
    marginBottom: 3,
  },
  metaText: {
    color: '#4B5563',
    ...textRoles.label,
    fontSize: 12,
  },
  amountText: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: 17,
  },
});
