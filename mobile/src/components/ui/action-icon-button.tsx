import type { ComponentType } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { radius } from '../../constants/design-system';
import { colors } from '../../constants/theme';

type ActionIconButtonProps = {
  accessibilityLabel: string;
  disabled?: boolean;
  icon: ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
  onPress: () => void;
};

export function ActionIconButton({
  accessibilityLabel,
  disabled = false,
  icon: Icon,
  onPress,
}: ActionIconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled ? styles.buttonPressed : undefined,
        disabled ? styles.buttonDisabled : undefined,
      ]}>
      <Icon color={colors.textTertiary} size={17} strokeWidth={2.1} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radius.round,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  buttonPressed: {
    backgroundColor: colors.surfaceNeutral,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});
