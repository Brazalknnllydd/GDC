import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Banknote, CreditCard, QrCode } from 'lucide-react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts, textRoles, textSizes } from '../../constants/theme';
import { formatCashierTime, formatPaymentMethod } from '../../lib/cashier-formatters';
import { formatPeso } from '../../lib/product-utils';

type CashierRecentSaleItemProps = {
  paymentMethod: string;
  receiptNumber: string;
  time: string;
  totalAmount: number;
  onPress?: () => void;
};

function getPaymentMeta(paymentMethod: string) {
  const normalized = paymentMethod.trim().toLowerCase();

  if (normalized === 'cash') {
    return {
      backgroundColor: colors.surfaceSuccessMuted,
      icon: Banknote,
      iconColor: colors.successBright,
    };
  }

  if (normalized === 'maya') {
    return {
      backgroundColor: colors.surfacePurple,
      icon: QrCode,
      iconColor: colors.purple,
    };
  }

  return {
    backgroundColor: colors.surfaceInfoMuted,
    icon: CreditCard,
    iconColor: colors.info,
  };
}

export function CashierRecentSaleItem({
  paymentMethod,
  receiptNumber,
  time,
  totalAmount,
  onPress,
}: CashierRecentSaleItemProps) {
  const paymentMeta = getPaymentMeta(paymentMethod);
  const Icon = paymentMeta.icon;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomColor: colors.divider,
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
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: textSizes.medium,
    marginBottom: 3,
  },
  metaText: {
    color: colors.textSoft,
    ...textRoles.label,
    fontSize: textSizes.small,
  },
  amountText: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: textSizes.medium + 1,
  },
});
