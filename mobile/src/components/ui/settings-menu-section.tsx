import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ComponentType } from 'react';
import { ChevronRight } from 'lucide-react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, textRoles, textSizes } from '../../constants/theme';
import { SectionHeading } from './section-heading';
import { SurfaceCard } from './surface-card';

type IconProps = {
  color?: string;
  size?: number;
  strokeWidth?: number;
};

type SettingsItem = {
  label: string;
  icon: ComponentType<IconProps>;
};

type SettingsMenuSectionProps = {
  title: string;
  items: SettingsItem[];
};

export function SettingsMenuSection({ title, items }: SettingsMenuSectionProps) {
  return (
    <View>
      <SectionHeading style={styles.sectionLabel}>{title}</SectionHeading>

      <SurfaceCard style={styles.sectionCard}>
        {items.map((item, index) => {
          const Icon = item.icon;
          const isLast = index === items.length - 1;

          return (
            <Pressable
              key={item.label}
              style={[styles.menuRow, !isLast && styles.menuRowBorder]}>
              <View style={styles.menuRowLeft}>
                <View style={styles.iconChip}>
                  <Icon color={colors.secondary} size={16} strokeWidth={2} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>

              <ChevronRight color={colors.textTertiary} size={18} strokeWidth={2} />
            </Pressable>
          );
        })}
      </SurfaceCard>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    color: colors.textSubtle,
    fontSize: textSizes.xsmall,
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm + 2,
    marginTop: spacing.lg + 2,
  },
  sectionCard: {
    borderColor: colors.borderMuted,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  menuRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 58,
    paddingHorizontal: spacing.md + 2,
  },
  menuRowBorder: {
    borderBottomColor: colors.borderSoft,
    borderBottomWidth: 1,
  },
  menuRowLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  iconChip: {
    alignItems: 'center',
    borderRadius: spacing.sm,
    height: 26,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 26,
  },
  menuLabel: {
    color: colors.textStrong,
    ...textRoles.label,
    fontSize: textSizes.small + 1,
  },
});
