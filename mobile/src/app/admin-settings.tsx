import { Pressable, StyleSheet, Text } from 'react-native';
import {
  LogOut,
  MapPinned,
  Percent,
  ReceiptText,
  Settings2,
  ShieldCheck,
  Store,
  UserCog,
  Users,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { radius, spacing } from '../constants/design-system';
import { colors, textRoles, textSizes } from '../constants/theme';
import { tabs as productTabs } from '../components/admin-products/products-screen-data';
import { AdminPageScreen } from '../components/ui/admin-page-screen';
import { SettingsMenuSection } from '../components/ui/settings-menu-section';

const sections = [
  {
    title: 'ORGANIZATION',
    items: [
      { label: 'User Management', icon: Users },
      { label: 'Roles & Permissions', icon: ShieldCheck },
      { label: 'Station Assignment', icon: MapPinned },
    ],
  },
  {
    title: 'AUDITING',
    items: [
      { label: 'Sales History', icon: ReceiptText },
      { label: 'Product Log', icon: UserCog },
    ],
  },
  {
    title: 'CONFIGURATION',
    items: [
      { label: 'Discount Rules', icon: Percent },
      { label: 'Store Settings', icon: Store },
      { label: 'Tax Configuration', icon: Settings2 },
    ],
  },
];

export default function AdminSettingsScreen() {
  const router = useRouter();
  const settingsTabs = productTabs.map((tab) =>
    tab.label === 'Settings'
      ? { ...tab, active: true, route: '/admin-settings' as const }
      : { ...tab, active: false }
  );

  return (
    <AdminPageScreen
      title="Settings"
      introDescription="Manage your workflows, staff, and system preferences."
      bottomNavItems={settingsTabs}>
      {sections.map((section) => (
        <SettingsMenuSection key={section.title} title={section.title} items={section.items} />
      ))}

      <Pressable onPress={() => router.replace('/')} style={styles.logoutButton}>
        <LogOut color="#FFFFFF" size={16} strokeWidth={2.2} />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </AdminPageScreen>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    alignItems: 'center',
    backgroundColor: '#C91F25',
    borderRadius: radius.sm - 4,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    minHeight: 36,
    paddingHorizontal: 18,
  },
  logoutText: {
    color: '#FFFFFF',
    ...textRoles.label,
    fontSize: textSizes.small + 1,
    marginLeft: 8,
  },
});
