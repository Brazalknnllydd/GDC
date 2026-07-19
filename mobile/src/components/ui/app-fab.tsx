import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { TouchableRipple } from 'react-native-paper';

import { controlHeights, radius, shadows } from '../../constants/design-system';
import { colors } from '../../constants/theme';

type AppFabProps = {
  icon: ReactNode;
  onPress?: () => void;
  style?: object;
};

export function AppFab({ icon, onPress, style }: AppFabProps) {
  return (
    <TouchableRipple borderless onPress={onPress} style={[styles.fab, style]}>
      <View style={styles.content}>{icon}</View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  fab: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: radius.round,
    height: controlHeights.fab,
    justifyContent: 'center',
    width: controlHeights.fab,
    ...shadows.floating,
  },
});
