import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TouchableRipple } from 'react-native-paper';

import { spacing } from '../../constants/design-system';
import { colors, textRoles } from '../../constants/theme';

type AppTextActionProps = {
  icon?: ReactNode;
  label: string;
  onPress?: () => void;
};

export function AppTextAction({ icon, label, onPress }: AppTextActionProps) {
  return (
    <TouchableRipple borderless onPress={onPress} style={styles.button}>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        {icon}
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    borderRadius: 999,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  label: {
    color: colors.secondary,
    ...textRoles.label,
    fontSize: 14,
    marginRight: spacing.xs,
  },
});
