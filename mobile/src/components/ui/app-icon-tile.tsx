import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TouchableRipple } from 'react-native-paper';

import { radius, spacing } from '../../constants/design-system';
import { textRoles } from '../../constants/theme';

type AppIconTileProps = {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
};

export function AppIconTile({ icon, label, onPress }: AppIconTileProps) {
  return (
    <TouchableRipple onPress={onPress} style={styles.button}>
      <View style={styles.content}>
        {icon}
        <Text style={styles.label}>{label}</Text>
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CED3E3',
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    minHeight: 76,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 76,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  label: {
    color: '#555C6F',
    ...textRoles.label,
    marginTop: 10,
    textAlign: 'center',
  },
});
