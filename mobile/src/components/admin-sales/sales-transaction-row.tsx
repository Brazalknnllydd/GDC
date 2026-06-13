import { StyleSheet, Text, View } from 'react-native';

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
    paddingVertical: 10,
  },
  receipt: {
    color: '#1B1F2D',
    ...textRoles.value,
    marginBottom: 4,
  },
  subtitle: {
    color: '#72788A',
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
    backgroundColor: '#DFF6E5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    color: '#15803D',
    ...textRoles.label,
  },
});
