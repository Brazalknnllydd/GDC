import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { TouchableRipple } from 'react-native-paper';

import { radius, shadows, spacing } from '../../constants/design-system';
import { colors, fonts, textSizes } from '../../constants/theme';

type AppHeroActionProps = {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  subtitle?: string;
};

export function AppHeroAction({
  icon,
  label,
  onPress,
  style,
  subtitle,
}: AppHeroActionProps) {
  return (
    <TouchableRipple onPress={onPress} style={[styles.button, style]}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>{icon}</View>
        <View style={styles.textWrap}>
          <Text style={styles.label}>{label}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'stretch',
    backgroundColor: colors.hero,
    borderRadius: radius.lg,
    minHeight: 62,
    minWidth: 194,
    ...shadows.floating,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconWrap: {
    marginRight: spacing.sm,
  },
  label: {
    color: colors.textInverse,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.bodyLarge,
  },
  subtitle: {
    color: colors.textOnSecondaryMuted,
    fontFamily: fonts.medium,
    fontSize: textSizes.smallCaps,
    marginTop: 2,
  },
  textWrap: {
    alignItems: 'flex-start',
  },
});
