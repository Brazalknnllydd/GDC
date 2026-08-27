import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { radius } from '../../constants/design-system';
import { colors } from '../../constants/theme';

type SurfaceCardProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function SurfaceCard({ children, onPress, style }: SurfaceCardProps) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed, style]}>
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.borderStrong,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        // boxShadow avoids the deprecated shadow* prop warning on web
        boxShadow: '0px 4px 10px rgba(19, 25, 39, 0.07)',
      } as object,
      default: {
        shadowColor: colors.textStrong,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
      },
    }),
  },
  cardPressed: {
    opacity: 0.88,
  },
});
