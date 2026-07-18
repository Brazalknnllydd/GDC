import type { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TouchableRipple } from 'react-native-paper';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts, textRoles, textSizes } from '../../constants/theme';

type IconProps = {
  color?: string;
  size?: number;
  strokeWidth?: number;
};

export type AppSegmentedOption<T extends string> = {
  icon?: ComponentType<IconProps>;
  label: string;
  value: T;
};

type AppSegmentedControlProps<T extends string> = {
  onChange: (value: T) => void;
  options: readonly AppSegmentedOption<T>[];
  selected: T;
  variant?: 'compact' | 'tile';
};

export function AppSegmentedControl<T extends string>({
  onChange,
  options,
  selected,
  variant = 'compact',
}: AppSegmentedControlProps<T>) {
  return (
    <View style={[styles.container, variant === 'tile' && styles.containerTile]}>
      {options.map((option) => {
        const active = option.value === selected;
        const Icon = option.icon;

        return (
          <TouchableRipple
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.optionButton,
              variant === 'tile' && styles.optionButtonTile,
              active && styles.optionButtonActive,
              active && variant === 'tile' && styles.optionButtonTileActive,
            ]}>
            <View style={[styles.optionContent, variant === 'tile' && styles.optionContentTile]}>
              {Icon ? (
                <Icon
                  color={active ? colors.textInverse : colors.secondary}
                  size={18}
                  strokeWidth={active ? 2.2 : 1.9}
                />
              ) : null}
              <Text
                style={[
                  styles.optionText,
                  variant === 'tile' && styles.optionTextTile,
                  active && styles.optionTextActive,
                  active && variant === 'tile' && styles.optionTextTileActive,
                ]}>
                {option.label}
              </Text>
            </View>
          </TouchableRipple>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceNeutral,
    borderRadius: radius.md,
    flexDirection: 'row',
    padding: spacing.xs,
  },
  containerTile: {
    backgroundColor: 'transparent',
    gap: spacing.sm,
    padding: 0,
  },
  optionButton: {
    borderRadius: radius.sm - 1,
  },
  optionButtonTile: {
    borderColor: colors.borderMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
  },
  optionButtonActive: {
    backgroundColor: colors.card,
  },
  optionButtonTileActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  optionContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
  },
  optionContentTile: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 56,
  },
  optionText: {
    color: colors.textHeading,
    ...textRoles.label,
  },
  optionTextTile: {
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
  },
  optionTextActive: {
    color: colors.secondary,
    fontFamily: fonts.bold,
  },
  optionTextTileActive: {
    color: colors.textInverse,
  },
});
