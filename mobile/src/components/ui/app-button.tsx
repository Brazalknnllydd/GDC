import type { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Button } from 'react-native-paper';

import { controlHeights, radius, spacing } from '../../constants/design-system';
import { colors, fonts, textSizes } from '../../constants/theme';

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
  sm: controlHeights.sm,
  md: controlHeights.md,
  lg: controlHeights.lg,
  xl: controlHeights.xl,
};

const sizePaddings: Record<AppButtonSize, number> = {
  sm: spacing.sm,
  md: spacing.lg,
  lg: spacing.lg,
  xl: spacing.lg,
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
    backgroundColor: colors.dangerStrong,
    borderColor: colors.dangerStrong,
    borderWidth: 0,
    mode: 'contained',
    textColor: colors.textInverse,
  },
  dangerOutline: {
    backgroundColor: colors.card,
    borderColor: colors.borderDangerSoft,
    borderWidth: 1.2,
    mode: 'outlined',
    textColor: colors.dangerStrong,
  },
  primary: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    borderWidth: 0,
    mode: 'contained',
    textColor: colors.textInverse,
  },
  secondary: {
    backgroundColor: colors.card,
    borderColor: colors.borderInfoStrong,
    borderWidth: 1.2,
    mode: 'outlined',
    textColor: colors.infoStrong,
  },
  success: {
    backgroundColor: colors.success,
    borderColor: colors.success,
    borderWidth: 0,
    mode: 'contained',
    textColor: colors.textInverse,
  },
  successOutline: {
    backgroundColor: colors.surfaceSuccess,
    borderColor: colors.borderSuccess,
    borderWidth: 1.2,
    mode: 'outlined',
    textColor: colors.successStrong,
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
  const { width } = useWindowDimensions();
  const isCompactPhone = width < 430;
  const variantStyle = variantStyles[variant];

  return (
    <Button
      buttonColor={variantStyle.backgroundColor}
      contentStyle={[
        styles.content,
        {
          justifyContent: 'center',
          minHeight: sizeHeights[size],
          paddingHorizontal: sizePaddings[size],
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
          <View style={styles.iconWrap}>{icon({ color: variantStyle.textColor, size: 16 })}</View>
        ) : null}
        <Text
          style={[
            styles.label,
            isCompactPhone ? styles.labelCompact : undefined,
            { color: variantStyle.textColor },
          ]}>
          {label}
        </Text>
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
    fontSize: textSizes.bodyLarge,
    lineHeight: 17,
    textAlign: 'center',
  },
  labelCompact: {
    fontSize: textSizes.body,
    lineHeight: 16,
  },
});
