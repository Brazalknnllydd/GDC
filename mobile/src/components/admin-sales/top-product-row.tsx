import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '../../constants/design-system';
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
    paddingVertical: spacing.sm + 2,
  },
  leftColumn: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    marginRight: spacing.md + 2,
  },
  thumb: {
    alignItems: 'center',
    backgroundColor: colors.surfaceBrandMuted,
    borderRadius: radius.md,
    height: 42,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 42,
  },
  thumbEmoji: {
    fontSize: 20,
  },
  name: {
    color: colors.textStrong,
    ...textRoles.value,
    marginBottom: 2,
  },
  soldText: {
    color: colors.textSubtle,
    ...textRoles.label,
  },
  total: {
    color: colors.secondary,
    ...textRoles.value,
  },
});
