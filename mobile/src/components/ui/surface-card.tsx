import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import type { ReactNode } from 'react';

import { radius, shadows } from '../../constants/design-system';

type SurfaceCardProps = ViewProps & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function SurfaceCard({ children, style, ...rest }: SurfaceCardProps) {
  return (
    <View {...rest} style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CED3E3',
    borderRadius: radius.xl,
    borderWidth: 1,
    ...shadows.card,
  },
});
