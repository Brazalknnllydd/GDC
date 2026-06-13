import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, textRoles, textSizes } from '../../constants/theme';

type FilterChipProps = {
  active?: boolean;
  label: string;
  onPress?: () => void;
};

export function FilterChip({ active = false, label, onPress }: FilterChipProps) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CFD5E3',
    borderRadius: 999,
    borderWidth: 1,
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
