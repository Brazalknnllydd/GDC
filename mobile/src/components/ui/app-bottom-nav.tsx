import type { ComponentType } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Surface, TouchableRipple } from 'react-native-paper';

import { layout, radius, spacing } from '../../constants/design-system';
import { colors, textRoles, textSizes } from '../../constants/theme';

type NavIconProps = {
  color?: string;
  size?: number;
  strokeWidth?: number;
};

type AppBottomNavItem<T extends string> = {
  icon: ComponentType<NavIconProps>;
  key: T;
  label: string;
};

type AppBottomNavProps<T extends string> = {
  activeKey: T;
  activeMarker?: 'top-line' | 'bottom-pill';
  items: readonly AppBottomNavItem<T>[];
  justify?: 'space-around' | 'space-between';
  onSelect: (key: T) => void;
  stretchItems?: boolean;
};

export function AppBottomNav<T extends string>({
  activeKey,
  activeMarker = 'bottom-pill',
  items,
  justify = 'space-between',
  onSelect,
  stretchItems = true,
}: AppBottomNavProps<T>) {
  return (
    <Surface elevation={1} style={[styles.bottomNav, stylesByJustify[justify]]}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.key === activeKey;

        return (
          <TouchableRipple
            key={item.key}
            onPress={() => {
              if (Platform.OS === 'web' && typeof document !== 'undefined') {
                (document.activeElement as any)?.blur();
              }
              onSelect(item.key);
            }}
            style={[styles.tabItem, stretchItems && styles.tabItemStretch]}>
            <View style={styles.tabContent}>
              <Icon
                color={isActive ? colors.secondary : colors.textHeading}
                size={20}
                strokeWidth={isActive ? 2.3 : 1.9}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {item.label}
              </Text>
              {isActive ? (
                <View
                  style={[
                    activeMarker === 'top-line' ? styles.activeTabLine : styles.activeTabPill,
                  ]}
                />
              ) : null}
            </View>
          </TouchableRipple>
        );
      })}
    </Surface>
  );
}

const stylesByJustify = StyleSheet.create({
  'space-around': {
    justifyContent: 'space-around',
  },
  'space-between': {
    justifyContent: 'space-between',
  },
});

const styles = StyleSheet.create({
  bottomNav: {
    backgroundColor: colors.card,
    borderTopColor: colors.borderInput,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingBottom: spacing.sm + 2,
    paddingTop: spacing.xs + 2,
  },
  tabItem: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  tabItemStretch: {
    flex: 1,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.xs,
    position: 'relative',
  },
  tabLabel: {
    color: colors.textHeading,
    ...textRoles.label,
    fontSize: textSizes.small,
    lineHeight: 15,
    marginTop: spacing.xs,
    minHeight: 15,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: colors.secondary,
  },
  activeTabLine: {
    backgroundColor: colors.secondary,
    borderRadius: radius.round,
    height: 3,
    position: 'absolute',
    top: -layout.screenPaddingTop / 2 + 1,
    width: 54,
  },
  activeTabPill: {
    backgroundColor: colors.surfaceOverlay,
    borderRadius: radius.round,
    bottom: -6,
    height: 3,
    position: 'absolute',
    width: 40,
  },
});
