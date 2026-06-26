import { StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';

import { colors, textRoles, textSizes } from '../../constants/theme';

type FilterChipProps = {
  active?: boolean;
  label: string;
  onPress?: () => void;
};

export function FilterChip({ active = false, label, onPress }: FilterChipProps) {
  return (
    <Chip
      mode={active ? 'flat' : 'outlined'}
      onPress={onPress}
      selected={active}
      showSelectedCheck={false}
      showSelectedOverlay={false}
      style={[styles.chip, active && styles.chipActive]}
      textStyle={[styles.chipText, active && styles.chipTextActive]}>
      {label}
    </Chip>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CFD5E3',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 18,
  },
  chipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  chipText: {
    color: '#2E3242',
    ...textRoles.label,
    fontSize: textSizes.medium,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});
