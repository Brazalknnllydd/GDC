import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { TouchableRipple } from 'react-native-paper';

import { radius, shadows, spacing } from '../../constants/design-system';
import { fonts } from '../../constants/theme';

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
    backgroundColor: '#133CBE',
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
    color: '#FFFFFF',
    fontFamily: fonts.semiBold,
    fontSize: 15,
  },
  subtitle: {
    color: '#D8E4FF',
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 2,
  },
  textWrap: {
    alignItems: 'flex-start',
  },
});
