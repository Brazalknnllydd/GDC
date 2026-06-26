import type { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Button } from 'react-native-paper';

import { radius, spacing } from '../../constants/design-system';
import { fonts } from '../../constants/theme';

type AppButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'successOutline'
  | 'danger'
  | 'dangerOutline';

type AppButtonSize = 'sm' | 'md' | 'lg' | 'xl';

type AppButtonProps = {
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: (props: { color: string; size: number }) => ReactNode;
  label: string;
  loading?: boolean;
  onPress?: () => void;
  size?: AppButtonSize;
  style?: StyleProp<ViewStyle>;
  variant?: AppButtonVariant;
};

const sizeHeights: Record<AppButtonSize, number> = {
  sm: 42,
  md: 52,
  lg: 62,
  xl: 86,
};

const variantStyles: Record<
  AppButtonVariant,
  {
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    mode: 'contained' | 'outlined';
    textColor: string;
  }
> = {
  danger: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
    borderWidth: 0,
    mode: 'contained',
    textColor: '#FFFFFF',
  },
  dangerOutline: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E3B6B2',
    borderWidth: 1.2,
    mode: 'outlined',
    textColor: '#B3261E',
  },
  primary: {
    backgroundColor: '#1A237E',
    borderColor: '#1A237E',
    borderWidth: 0,
    mode: 'contained',
    textColor: '#FFFFFF',
  },
  secondary: {
    backgroundColor: '#FFFFFF',
    borderColor: '#AEB5D0',
    borderWidth: 1.2,
    mode: 'outlined',
    textColor: '#495098',
  },
  success: {
    backgroundColor: '#059669',
    borderColor: '#059669',
    borderWidth: 0,
    mode: 'contained',
    textColor: '#FFFFFF',
  },
  successOutline: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1.2,
    mode: 'outlined',
    textColor: '#047857',
  },
};

export function AppButton({
  disabled = false,
  fullWidth = true,
  icon,
  label,
  loading = false,
  onPress,
  size = 'md',
  style,
  variant = 'primary',
}: AppButtonProps) {
  const variantStyle = variantStyles[variant];

  return (
    <Button
      buttonColor={variantStyle.backgroundColor}
      contentStyle={[
        styles.content,
        {
          justifyContent: 'center',
          minHeight: sizeHeights[size],
        },
      ]}
      disabled={disabled}
      loading={loading}
      mode={variantStyle.mode}
      onPress={onPress}
      style={[
        styles.button,
        {
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          borderColor: variantStyle.borderColor,
          borderWidth: variantStyle.borderWidth,
          opacity: disabled ? 0.58 : 1,
        },
        style,
      ]}
      uppercase={false}>
      <View style={styles.inner}>
        {icon ? (
          <View style={styles.iconWrap}>{icon({ color: variantStyle.textColor, size: 18 })}</View>
        ) : null}
        <Text style={[styles.label, { color: variantStyle.textColor }]}>{label}</Text>
      </View>
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.lg,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  iconWrap: {
    marginRight: spacing.sm,
  },
  inner: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  label: {
    includeFontPadding: false,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    textAlign: 'center',
  },
});
