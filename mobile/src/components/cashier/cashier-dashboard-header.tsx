import { StyleSheet, Text, View } from 'react-native';
import { Avatar, IconButton, Surface } from 'react-native-paper';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts, textRoles, textSizes } from '../../constants/theme';
import { formatCashierDate, formatCashierTime } from '../../lib/cashier-formatters';

type CashierDashboardHeaderProps = {
  cashierName: string;
  currentDate: Date;
};

export function CashierDashboardHeader({
  cashierName,
  currentDate,
}: CashierDashboardHeaderProps) {
  return (
    <Surface elevation={0} style={styles.header}>
      <View style={styles.identityWrap}>
        <Avatar.Image
          size={54}
          source={require('../../../assets/images/logo.jpg')}
          style={styles.logo}
        />
        <View style={styles.identityTextWrap}>
          <Text style={styles.greetingLabel}>GOOD MORNING,</Text>
          <Text numberOfLines={1} style={styles.cashierName}>
            {cashierName}
          </Text>
        </View>
      </View>

      <View style={styles.rightMetaWrap}>
        <Text style={styles.dateText}>{formatCashierDate(currentDate)}</Text>
        <Text style={styles.timeText}>{formatCashierTime(currentDate)}</Text>
      </View>

    </Surface>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  identityWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
  },
  logo: {
    borderColor: colors.borderStrong,
    borderRadius: radius.round,
    borderWidth: 1,
    marginRight: spacing.md,
  },
  identityTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  greetingLabel: {
    color: colors.textHeading,
    fontFamily: fonts.medium,
    fontSize: textSizes.smallCaps,
    letterSpacing: 1.1,
    marginBottom: 3,
  },
  cashierName: {
    color: colors.secondary,
    ...textRoles.heading,
    fontSize: 18,
    lineHeight: 24,
  },
  rightMetaWrap: {
    alignItems: 'flex-end',
    minWidth: 84,
  },
  dateText: {
    color: colors.textHeading,
    fontFamily: fonts.regular,
    fontSize: textSizes.smallCaps,
    marginBottom: 2,
  },
  timeText: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: textSizes.title,
    lineHeight: 22,
  },
});
