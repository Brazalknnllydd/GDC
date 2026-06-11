import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts } from '../../constants/theme';

type FilterChipProps = {
  active?: boolean;
  label: string;
};

export function FilterChip({ active = false, label }: FilterChipProps) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]}>
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
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
  },
});
