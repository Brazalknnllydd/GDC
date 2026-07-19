import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { Card } from 'react-native-paper';

import { radius, shadows } from '../../constants/design-system';
import { colors } from '../../constants/theme';

type SurfaceCardProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function SurfaceCard({ children, onPress, style }: SurfaceCardProps) {
  return (
    <Card mode="contained" onPress={onPress} style={[styles.card, style]}>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.borderStrong,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.card,
  },
});
