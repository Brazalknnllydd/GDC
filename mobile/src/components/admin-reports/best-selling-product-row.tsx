import { StyleSheet, Text, View } from 'react-native';

import { colors, textRoles } from '../../constants/theme';

type BestSellingProductRowProps = {
  amount: string;
  name: string;
  note: string;
  noteTone?: 'success' | 'neutral' | 'muted';
  unitsText: string;
};

export function BestSellingProductRow({
  amount,
  name,
  note,
  noteTone = 'neutral',
  unitsText,
}: BestSellingProductRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.units}>{unitsText}</Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.amount}>{amount}</Text>
        <Text
          style={[
            styles.note,
            noteTone === 'success' && styles.noteSuccess,
            noteTone === 'muted' && styles.noteMuted,
          ]}>
          {note}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  left: {
    flex: 1,
    marginRight: 16,
  },
  name: {
    color: colors.secondary,
    ...textRoles.value,
    marginBottom: 3,
  },
  units: {
    color: colors.textSubtle,
    ...textRoles.label,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    color: colors.textStrong,
    ...textRoles.value,
    marginBottom: 3,
  },
  note: {
    color: colors.secondary,
    ...textRoles.label,
  },
  noteSuccess: {
    color: colors.successBright,
  },
  noteMuted: {
    color: colors.textSubtle,
  },
});
