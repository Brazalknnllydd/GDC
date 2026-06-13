import type { ComponentType } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, textRoles } from '../../constants/theme';

type IconProps = {
  color?: string;
  size?: number;
  strokeWidth?: number;
};

type ReportActionButtonProps = {
  icon: ComponentType<IconProps>;
  label: string;
};

export function ReportActionButton({ icon: Icon, label }: ReportActionButtonProps) {
  return (
    <Pressable style={styles.button}>
      <Icon color={colors.secondary} size={18} strokeWidth={2} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CED3E3',
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 76,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  label: {
    color: '#555C6F',
    ...textRoles.label,
    marginTop: 10,
  },
});
