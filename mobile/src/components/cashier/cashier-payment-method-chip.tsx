import type { ComponentType } from 'react';
import { StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts } from '../../constants/theme';

type CashierPaymentMethodChipProps = {
  active: boolean;
  icon: ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
  label: string;
  onPress: () => void;
};

export function CashierPaymentMethodChip({
  active,
  icon: Icon,
  label,
  onPress,
}: CashierPaymentMethodChipProps) {
  return (
    <Chip
      icon={() => (
        <Icon
          color={active ? '#FFFFFF' : colors.secondary}
          size={18}
          strokeWidth={active ? 2.2 : 1.9}
        />
      )}
      mode={active ? 'flat' : 'outlined'}
      onPress={onPress}
      selected={active}
      showSelectedCheck={false}
      style={[styles.chip, active && styles.chipActive]}
      textStyle={[styles.label, active && styles.labelActive]}>
      {label}
    </Chip>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    borderColor: '#D6DBE8',
    borderRadius: radius.md,
    justifyContent: 'center',
    flexBasis: 0,
    flexGrow: 1,
    minHeight: 56,
    minWidth: 140,
  },
  chipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  label: {
    color: colors.secondary,
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 4,
  },
  labelActive: {
    color: '#FFFFFF',
  },
});
