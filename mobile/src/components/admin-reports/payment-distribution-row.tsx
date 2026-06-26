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
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View
          style={[
            styles.iconWrap,
            tone === 'success' && styles.iconSuccess,
            tone === 'warning' && styles.iconWarning,
          ]}>
          <Icon
            color={tone === 'success' ? '#1F8A39' : tone === 'warning' ? '#A76300' : '#2750FF'}
            size={18}
            strokeWidth={2}
          />
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>

      <Text style={styles.amount}>
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
    paddingVertical: spacing.md,
  },
  left: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#E9EEFF',
    borderRadius: radius.md,
    height: 34,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 34,
  },
  iconSuccess: {
    backgroundColor: '#E8F7EC',
  },
  iconWarning: {
    backgroundColor: '#FFF4DE',
  },
  label: {
    color: '#1F2330',
    ...textRoles.body,
  },
  amount: {
    color: '#343A49',
    ...textRoles.label,
  },
});
