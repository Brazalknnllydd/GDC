import { StyleSheet, Text, View } from 'react-native';
import { Package } from 'lucide-react-native';

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
          <Package color={colors.secondary} size={18} strokeWidth={2.1} />
        </View>
        <View style={styles.textBlock}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.name}>
            {name}
          </Text>
          <Text numberOfLines={1} style={styles.soldText}>
            {soldText}
          </Text>
        </View>
      </View>

      <Text numberOfLines={1} style={styles.total}>
        {total}
      </Text>
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
    marginRight: spacing.md,
    minWidth: 0,
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
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: colors.textStrong,
    ...textRoles.value,
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 1,
  },
  soldText: {
    color: colors.textSubtle,
    ...textRoles.label,
    fontSize: 11,
    lineHeight: 15,
  },
  total: {
    color: colors.secondary,
    fontFamily: textRoles.value.fontFamily,
    fontSize: 15,
    lineHeight: 20,
    marginLeft: spacing.sm,
    textAlign: 'right',
  },
});
