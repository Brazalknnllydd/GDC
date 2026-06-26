import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts, textRoles } from '../../constants/theme';
import { formatCashierTime, formatShiftDuration } from '../../lib/cashier-formatters';
import { formatPeso } from '../../lib/product-utils';

type CashierShiftCardProps = {
  durationMinutes: number;
  openingCash: number;
  startedAt: string;
  status: string;
};

export function CashierShiftCard({
  durationMinutes,
  openingCash,
  startedAt,
  status,
}: CashierShiftCardProps) {
  const startedAtDate = new Date(startedAt);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{status.toUpperCase()}</Text>
        </View>
        <View style={styles.durationWrap}>
          <Text style={styles.metaLabel}>DURATION</Text>
          <Text style={styles.durationValue}>{formatShiftDuration(durationMinutes)}</Text>
        </View>
      </View>

      <Text style={styles.title}>Current Shift</Text>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.metaLabel}>STARTED AT</Text>
          <Text style={styles.metaValue}>{formatCashierTime(startedAtDate)}</Text>
        </View>
        <View>
          <Text style={styles.metaLabel}>OPENING CASH</Text>
          <Text style={styles.metaValue}>{formatPeso(openingCash)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.secondary,
    borderRadius: radius.xxl,
    marginBottom: spacing.section,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.round,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statusDot: {
    backgroundColor: '#5BF08C',
    borderRadius: radius.round,
    height: 8,
    marginRight: spacing.sm,
    width: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontFamily: fonts.medium,
    fontSize: 12,
    letterSpacing: 1,
  },
  durationWrap: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.3,
  },
  durationValue: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontSize: 18,
    marginTop: 4,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: fonts.regular,
    fontSize: 31,
    lineHeight: 36,
    marginTop: spacing.lg,
  },
  divider: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    height: 1,
    marginVertical: spacing.xl,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaValue: {
    color: '#FFFFFF',
    ...textRoles.value,
    fontSize: 16,
    marginTop: 6,
  },
});
