import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { TouchableRipple } from 'react-native-paper';

import { radius, shadows } from '../../constants/design-system';

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
    backgroundColor: '#1A237E',
    borderRadius: radius.round,
    height: 72,
    justifyContent: 'center',
    width: 72,
    ...shadows.floating,
  },
});
