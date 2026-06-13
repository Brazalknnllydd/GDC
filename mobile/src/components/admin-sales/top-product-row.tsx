import { StyleSheet, Text, View } from 'react-native';

import { colors, textRoles } from '../../constants/theme';

type TopProductRowProps = {
  emoji: string;
  name: string;
  soldText: string;
  total: string;
};

export function TopProductRow({ emoji, name, soldText, total }: TopProductRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.leftColumn}>
        <View style={styles.thumb}>
          <Text style={styles.thumbEmoji}>{emoji}</Text>
        </View>
        <View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.soldText}>{soldText}</Text>
        </View>
      </View>

      <Text style={styles.total}>{total}</Text>
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
  leftColumn: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    marginRight: 14,
  },
  thumb: {
    alignItems: 'center',
    backgroundColor: '#EAF0FF',
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    marginRight: 12,
    width: 42,
  },
  thumbEmoji: {
    fontSize: 20,
  },
  name: {
    color: '#181D2A',
    ...textRoles.value,
    marginBottom: 2,
  },
  soldText: {
    color: '#757B8B',
    ...textRoles.label,
  },
  total: {
    color: colors.secondary,
    ...textRoles.value,
  },
});
