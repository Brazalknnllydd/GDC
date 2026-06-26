import { StyleSheet, Text, View } from 'react-native';
import { TouchableRipple } from 'react-native-paper';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts, textRoles } from '../../constants/theme';

type AppSegmentedControlProps<T extends string> = {
  onChange: (value: T) => void;
  options: readonly T[];
  selected: T;
};

export function AppSegmentedControl<T extends string>({
  onChange,
  options,
  selected,
}: AppSegmentedControlProps<T>) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const active = option === selected;

        return (
          <TouchableRipple
            key={option}
            onPress={() => onChange(option)}
            style={[styles.optionButton, active && styles.optionButtonActive]}>
            <View style={styles.optionContent}>
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{option}</Text>
            </View>
          </TouchableRipple>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F1F5',
    borderRadius: radius.md,
    flexDirection: 'row',
    padding: 4,
  },
  optionButton: {
    borderRadius: radius.sm - 1,
  },
  optionButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  optionContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  optionText: {
    color: '#34394A',
    ...textRoles.label,
  },
  optionTextActive: {
    color: colors.secondary,
    fontFamily: fonts.bold,
  },
});
