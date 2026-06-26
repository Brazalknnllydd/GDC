import type { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts, textRoles } from '../../constants/theme';

type CashierPerformanceCardProps = {
  icon: ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
  label: string;
  value: string;
};

export function CashierPerformanceCard({
  icon: Icon,
  label,
  value,
}: CashierPerformanceCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconBadge}>
        <Icon color={colors.secondary} size={24} strokeWidth={2} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CED3E3',
    borderRadius: radius.xl,
    borderWidth: 1,
    minHeight: 182,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    width: '48%',
  },
  iconBadge: {
    alignItems: 'center',
    backgroundColor: '#F5F7FD',
    borderRadius: radius.md,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  label: {
    color: '#353C47',
    fontFamily: fonts.medium,
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  value: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: 18,
  },
});
