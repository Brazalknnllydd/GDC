import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, textRoles } from '../../constants/theme';

type SalesTransactionRowProps = {
  amount: string;
  receiptNumber: string;
  status: string;
  subtitle: string;
};

export function SalesTransactionRow({
  amount,
  receiptNumber,
  status,
  subtitle,
}: SalesTransactionRowProps) {
  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.receipt}>#{receiptNumber}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.rightColumn}>
        <Text style={styles.amount}>{amount}</Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
  },
  receipt: {
    color: colors.textStrong,
    ...textRoles.value,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textSubtle,
    ...textRoles.label,
  },
  rightColumn: {
    alignItems: 'flex-end',
  },
  amount: {
    color: colors.secondary,
    ...textRoles.value,
    marginBottom: 6,
  },
  statusPill: {
    backgroundColor: colors.surfaceSuccessMuted,
    borderRadius: radius.round,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    color: colors.successBright,
    ...textRoles.label,
  },
});
