import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts, textRoles, textSizes } from '../../constants/theme';
import { formatCashierTime } from '../../lib/cashier-formatters';
import { formatPeso } from '../../lib/product-utils';

type CashierShiftCardProps = {
  startedAt: string;
  status: string;
  openingCash?: number;
  expectedCashOnHand?: number;
};

export function CashierShiftCard({
  startedAt,
  status,
  openingCash,
  expectedCashOnHand,
}: CashierShiftCardProps) {
  const startedAtDate = new Date(startedAt);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{status.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.title}>Current Shift</Text>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.metaLabel}>STARTED AT</Text>
          <Text style={styles.metaValue}>{formatCashierTime(startedAtDate)}</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.metaLabel}>OPENING CASH</Text>
          <Text style={styles.metaValue}>
            {openingCash !== undefined ? formatPeso(openingCash) : 'Not set'}
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={styles.metaLabel}>EXPECTED CASH</Text>
          <Text style={styles.metaValue}>
            {expectedCashOnHand !== undefined ? formatPeso(expectedCashOnHand) : 'Not set'}
          </Text>
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
    backgroundColor: colors.overlayInverse12,
    borderRadius: radius.round,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statusDot: {
    backgroundColor: colors.accentDot,
    borderRadius: radius.round,
    height: 8,
    marginRight: spacing.sm,
    width: 8,
  },
  statusText: {
    color: colors.textInverse,
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
    letterSpacing: 1,
  },
  metaLabel: {
    color: colors.overlayInverse72,
    fontFamily: fonts.medium,
    fontSize: textSizes.smallCaps,
    letterSpacing: 1.3,
  },
  title: {
    color: colors.textInverse,
    fontFamily: fonts.regular,
    fontSize: textSizes.hero + 1,
    lineHeight: 36,
    marginTop: spacing.lg,
  },
  divider: {
    backgroundColor: colors.overlayInverse12,
    height: 1,
    marginVertical: spacing.xl,
  },
  bottomRow: {
    flexDirection: 'row',
  },
  metaValue: {
    color: colors.textInverse,
    ...textRoles.value,
    fontSize: textSizes.medium,
    marginTop: 6,
  },
});
