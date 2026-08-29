import type { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, textRoles } from '../../constants/theme';

type IconProps = {
  color?: string;
  size?: number;
  strokeWidth?: number;
};

type PaymentDistributionRowProps = {
  amount: string;
  icon: ComponentType<IconProps>;
  label: string;
  percentageText: string;
  tone?: 'success' | 'primary' | 'warning';
};

export function PaymentDistributionRow({
  amount,
  icon: Icon,
  label,
  percentageText,
  tone = 'primary',
}: PaymentDistributionRowProps) {
  const iconColor =
    tone === 'success' ? colors.successStrong : tone === 'warning' ? colors.warningStrong : colors.infoStrong;

  return (
    <View
      style={[
        styles.row,
        tone === 'success' && styles.rowSuccess,
        tone === 'warning' && styles.rowWarning,
        tone === 'primary' && styles.rowPrimary,
      ]}>
      <View style={styles.left}>
        <View
          style={[
            styles.iconWrap,
            tone === 'success' && styles.iconSuccess,
            tone === 'warning' && styles.iconWarning,
            tone === 'primary' && styles.iconPrimary,
          ]}>
          <Icon color={iconColor} size={18} strokeWidth={2} />
        </View>
        <Text style={[styles.label, tone === 'success' && styles.labelSuccess]}>{label}</Text>
      </View>

      <Text style={[styles.amount, tone === 'success' && styles.amountSuccess]}>
        {amount} {percentageText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.borderPanel,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowSuccess: {
    backgroundColor: colors.surfaceSuccessMuted,
    borderColor: colors.borderSuccess,
  },
  rowPrimary: {
    backgroundColor: colors.surfaceInfoMuted,
    borderColor: colors.borderInfo,
  },
  rowWarning: {
    backgroundColor: colors.surfaceWarningSoft,
    borderColor: colors.warning,
  },
  left: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceInfo,
    borderRadius: radius.md,
    height: 34,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 34,
  },
  iconPrimary: {
    backgroundColor: colors.surfaceInfoMuted,
  },
  iconSuccess: {
    backgroundColor: colors.surfaceSuccessSoft,
  },
  iconWarning: {
    backgroundColor: colors.surfaceWarningSoft,
  },
  label: {
    color: colors.textStrong,
    ...textRoles.body,
  },
  labelSuccess: {
    color: colors.successStrong,
  },
  amount: {
    color: colors.textHeading,
    ...textRoles.label,
  },
  amountSuccess: {
    color: colors.successStrong,
  },
});
