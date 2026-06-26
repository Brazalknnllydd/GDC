import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ComponentType } from 'react';
import { ChevronRight } from 'lucide-react-native';

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

              <ChevronRight color="#666E84" size={18} strokeWidth={2} />
            </Pressable>
          );
        })}
      </SurfaceCard>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    color: '#7A8092',
    fontSize: 10,
    letterSpacing: 1.4,
    marginBottom: 8,
    marginLeft: 10,
    marginTop: 18,
  },
  sectionCard: {
    borderColor: '#D8DDE8',
    borderRadius: 10,
    overflow: 'hidden',
  },
  menuRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 58,
    paddingHorizontal: 14,
  },
  menuRowBorder: {
    borderBottomColor: '#E6EAF2',
    borderBottomWidth: 1,
  },
  menuRowLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  iconChip: {
    alignItems: 'center',
    borderRadius: 8,
    height: 26,
    justifyContent: 'center',
    marginRight: 12,
    width: 26,
  },
  menuLabel: {
    color: '#1F2430',
    ...textRoles.label,
    fontSize: textSizes.small + 1,
  },
});
