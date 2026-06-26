import type { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Surface, TouchableRipple } from 'react-native-paper';

import { layout, spacing } from '../../constants/design-system';
import { colors, textRoles } from '../../constants/theme';

export type CashierSection = 'register' | 'history' | 'inventory' | 'settings';

type CashierBottomNavItem = {
  icon: ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
  key: CashierSection;
  label: string;
};

type CashierBottomNavProps = {
  activeKey: CashierSection;
  items: readonly CashierBottomNavItem[];
  onSelect: (key: CashierSection) => void;
};

export function CashierBottomNav({
  activeKey,
  items,
  onSelect,
}: CashierBottomNavProps) {
  return (
    <Surface elevation={1} style={styles.bottomNav}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.key === activeKey;

        return (
          <TouchableRipple
            key={item.key}
            onPress={() => onSelect(item.key)}
            style={styles.tabItem}>
            <View style={styles.tabContent}>
              <Icon
                color={isActive ? colors.secondary : '#404251'}
                size={22}
                strokeWidth={isActive ? 2.3 : 1.9}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {item.label}
              </Text>
              {isActive ? <View style={styles.activeTabPill} /> : null}
            </View>
          </TouchableRipple>
        );
      })}
    </Surface>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#D7DAE3',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: spacing.md,
    paddingTop: spacing.sm + 2,
  },
  tabItem: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  tabContent: {
    alignItems: 'center',
    minWidth: 58,
    paddingHorizontal: 2,
    position: 'relative',
  },
  tabLabel: {
    color: '#404251',
    ...textRoles.label,
    marginTop: spacing.sm - 2,
  },
  tabLabelActive: {
    color: colors.secondary,
  },
  activeTabPill: {
    backgroundColor: '#E8EBFF',
    borderRadius: 999,
    bottom: -6,
    height: 3,
    position: 'absolute',
    width: 46,
  },
});
