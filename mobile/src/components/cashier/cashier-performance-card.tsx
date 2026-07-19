import type { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts, textRoles, textSizes } from '../../constants/theme';
import { useResponsiveLayout } from '../../hooks/use-responsive-layout';
import { SurfaceCard } from '../ui/surface-card';

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
  const { compactPhone } = useResponsiveLayout();

  return (
    <SurfaceCard style={[styles.card, compactPhone && styles.cardCompact]}>
      <View style={styles.contentWrap}>
        <View style={styles.iconBadge}>
          <Icon color={colors.secondary} size={24} strokeWidth={2} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.label, compactPhone && styles.labelCompact]}>{label}</Text>
          <Text style={[styles.value, compactPhone && styles.valueCompact]}>{value}</Text>
        </View>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 160,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flexBasis: '48.8%',
  },
  cardCompact: {
    minHeight: 144,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  contentWrap: {
    flex: 1,
    justifyContent: 'space-between',
  },
  iconBadge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceHeader,
    borderRadius: radius.md,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  content: {
    marginTop: spacing.xl,
  },
  label: {
    color: colors.textHeading,
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  labelCompact: {
    fontSize: textSizes.smallCaps,
    letterSpacing: 1.1,
    marginBottom: spacing.sm,
  },
  value: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: textSizes.title,
  },
  valueCompact: {
    fontSize: textSizes.medium,
  },
});
