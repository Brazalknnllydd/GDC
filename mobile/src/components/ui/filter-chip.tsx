import { StyleSheet, useWindowDimensions } from 'react-native';
import { Chip } from 'react-native-paper';

import { colors, textRoles, textSizes } from '../../constants/theme';
import { radius, spacing } from '../../constants/design-system';

type FilterChipProps = {
  active?: boolean;
  label: string;
  onPress?: () => void;
};

export function FilterChip({ active = false, label, onPress }: FilterChipProps) {
  const { width } = useWindowDimensions();
  const isCompactPhone = width < 430;

  return (
    <Chip
      mode={active ? 'flat' : 'outlined'}
      onPress={onPress}
      selected={active}
      showSelectedCheck={false}
      showSelectedOverlay={false}
      style={[
        styles.chip,
        isCompactPhone ? styles.chipCompact : undefined,
        active && styles.chipActive,
      ]}
      textStyle={[
        styles.chipText,
        isCompactPhone ? styles.chipTextCompact : undefined,
        active && styles.chipTextActive,
      ]}>
      {label}
    </Chip>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.borderStrong,
    borderRadius: radius.round,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: spacing.lg,
  },
  chipCompact: {
    minHeight: 36,
    paddingHorizontal: spacing.md + 2,
  },
  chipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  chipText: {
    color: colors.textHeading,
    ...textRoles.label,
    fontSize: textSizes.body,
  },
  chipTextCompact: {
    fontSize: textSizes.small,
  },
  chipTextActive: {
    color: colors.textInverse,
  },
});
