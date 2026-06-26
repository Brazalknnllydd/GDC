import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Surface, TouchableRipple } from 'react-native-paper';

import { layout, spacing } from '../../constants/design-system';
import { colors, textRoles } from '../../constants/theme';
import type { BottomNavItem } from '../../lib/app-routes';

type AdminBottomNavProps = {
  items: BottomNavItem[];
};

export function AdminBottomNav({ items }: AdminBottomNavProps) {
  const router = useRouter();

  return (
    <Surface elevation={1} style={styles.bottomNav}>
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <TouchableRipple
            key={item.label}
            onPress={() => item.route && router.push(item.route)}
            style={styles.tabItem}>
            <View style={styles.tabContent}>
              <Icon
                color={item.active ? colors.secondary : '#404251'}
                size={24}
                strokeWidth={item.active ? 2.3 : 1.9}
              />
              <Text style={[styles.tabLabel, item.active && styles.tabLabelActive]}>
                {item.label}
              </Text>
              {item.active && <View style={styles.activeTabLine} />}
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
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    paddingTop: spacing.sm + 2,
  },
  tabItem: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: spacing.xs,
    position: 'relative',
  },
  tabLabel: {
    textAlign: 'center',
    color: '#404251',
    ...textRoles.label,
    fontSize: 13,
    lineHeight: 16,
    marginTop: spacing.xs + 1,
    minHeight: 16,
  },
  tabLabelActive: {
    color: colors.secondary,
  },
  activeTabLine: {
    backgroundColor: colors.secondary,
    borderRadius: 999,
    height: 3,
    position: 'absolute',
    top: -layout.screenPaddingTop / 2 + 1,
    width: 62,
  },
});
