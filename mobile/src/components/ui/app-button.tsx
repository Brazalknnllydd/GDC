import React, { type ReactNode, type ComponentType } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

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
  icon?: ComponentType<{ color?: string; size?: number }> | ReactNode;
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
    textColor: string;
  }
> = {
  danger: {
    backgroundColor: colors.dangerStrong,
    borderColor: colors.dangerStrong,
    borderWidth: 0,
    textColor: colors.textInverse,
  },
  dangerOutline: {
    backgroundColor: colors.card,
    borderColor: colors.borderDangerSoft,
    borderWidth: 1.2,
    textColor: colors.dangerStrong,
  },
  primary: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    borderWidth: 0,
    textColor: colors.textInverse,
  },
  secondary: {
    backgroundColor: colors.card,
    borderColor: colors.borderInfoStrong,
    borderWidth: 1.2,
    textColor: colors.infoStrong,
  },
  success: {
    backgroundColor: colors.success,
    borderColor: colors.success,
    borderWidth: 0,
    textColor: colors.textInverse,
  },
  successOutline: {
    backgroundColor: colors.surfaceSuccess,
    borderColor: colors.borderSuccess,
    borderWidth: 1.2,
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
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          alignSelf: fullWidth ? 'stretch' : undefined,
          backgroundColor: variantStyle.backgroundColor,
          borderColor: variantStyle.borderColor,
          borderWidth: variantStyle.borderWidth,
          minHeight: sizeHeights[size],
          opacity: isDisabled ? 0.58 : pressed ? 0.82 : 1,
          paddingHorizontal: sizePaddings[size],
        },
        style,
      ]}>
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator
            color={variantStyle.textColor}
            size="small"
            style={styles.spinner}
          />
        ) : null}
        {icon && !loading ? (
          <View style={styles.iconWrap}>
            {(() => {
              const IconCandidate = (icon as any)?.default ?? icon;
              if (React.isValidElement(IconCandidate)) return IconCandidate;
              if (typeof IconCandidate === 'function' || typeof IconCandidate === 'object') {
                try {
                  const IconComp = IconCandidate as ComponentType<{ color?: string; size?: number }>;
                  return <IconComp color={variantStyle.textColor} size={16} />;
                } catch {
                  return null;
                }
              }
              return null;
            })()}
          </View>
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.lg,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  inner: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  iconWrap: {
    marginRight: spacing.sm,
  },
  spinner: {
    marginRight: spacing.sm,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: textSizes.bodyLarge,
    includeFontPadding: false,
    lineHeight: 17,
    textAlign: 'center',
  },
  labelCompact: {
    fontSize: textSizes.body,
    lineHeight: 16,
  },
});
