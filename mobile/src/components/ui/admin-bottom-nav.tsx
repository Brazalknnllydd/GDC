import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { ComponentType } from 'react';

import { colors, fonts } from '../../constants/theme';

type IconProps = {
  color?: string;
  size?: number;
  strokeWidth?: number;
};

type NavItem = {
  label: string;
  icon: ComponentType<IconProps>;
  active?: boolean;
  route?: '/admin' | '/admin-products' | '/admin-settings';
};

type AdminBottomNavProps = {
  items: NavItem[];
};

export function AdminBottomNav({ items }: AdminBottomNavProps) {
  const router = useRouter();

  return (
    <View style={styles.bottomNav}>
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Pressable
            key={item.label}
            onPress={() => item.route && router.push(item.route)}
            style={styles.tabItem}>
            <Icon
              color={item.active ? colors.secondary : '#404251'}
              size={24}
              strokeWidth={item.active ? 2.3 : 1.9}
            />
            <Text style={[styles.tabLabel, item.active && styles.tabLabelActive]}>
              {item.label}
            </Text>
            {item.active && <View style={styles.activeTabLine} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#D7DAE3',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 12,
    paddingTop: 10,
  },
  tabItem: {
    alignItems: 'center',
    minWidth: 58,
    position: 'relative',
  },
  tabLabel: {
    color: '#404251',
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 6,
  },
  tabLabelActive: {
    color: colors.secondary,
    fontFamily: fonts.bold,
  },
  activeTabLine: {
    backgroundColor: colors.secondary,
    borderRadius: 999,
    height: 3,
    position: 'absolute',
    top: -10,
    width: 62,
  },
});
