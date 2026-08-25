import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts, textRoles, textSizes } from '../../constants/theme';

type CategoryPerformanceRowProps = {
  isFallback?: boolean;
  label: string;
  percentage: number;
  soldCount: number;
};

export function CategoryPerformanceRow({
  isFallback = false,
  label,
  percentage,
  soldCount,
}: CategoryPerformanceRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.metaGroup}>
          {!isFallback && (
            <Text style={styles.soldCount}>
              {soldCount} sold
            </Text>
          )}
          <Text style={styles.value}>{percentage}%</Text>
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.lg,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.textStrong,
    flex: 1,
    ...textRoles.body,
  },
  metaGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  soldCount: {
    backgroundColor: colors.surfaceBrandSoft,
    borderRadius: radius.round,
    color: colors.secondary,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.small,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  value: {
    color: colors.textSoft,
    ...textRoles.label,
    minWidth: 34,
    textAlign: 'right',
  },
  track: {
    backgroundColor: colors.dividerStrong,
    borderRadius: radius.round,
    height: 7,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: colors.secondary,
    borderRadius: radius.round,
    height: '100%',
  },
});
