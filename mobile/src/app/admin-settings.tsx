import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
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

import { colors, fonts } from '../constants/theme';
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft color={colors.secondary} size={24} strokeWidth={2.2} />
          </Pressable>

          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Settings & Control</Text>
            <Text style={styles.headerSubtitle}>
              Manage your workflows, staff, and system preferences.
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {sections.map((section) => (
            <SettingsMenuSection key={section.title} title={section.title} items={section.items} />
          ))}

          <Pressable onPress={() => router.replace('/')} style={styles.logoutButton}>
            <LogOut color="#FFFFFF" size={16} strokeWidth={2.2} />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F7FB',
  },
  page: {
    flex: 1,
    backgroundColor: '#F6F7FB',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    paddingBottom: 10,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  backButton: {
    marginRight: 10,
    paddingTop: 2,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    color: '#232939',
    fontFamily: fonts.bold,
    fontSize: 20,
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#667085',
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
  },
  scrollContent: {
    paddingBottom: 28,
    paddingHorizontal: 6,
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: '#C91F25',
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 36,
    paddingHorizontal: 18,
  },
  logoutText: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontSize: 13,
    marginLeft: 8,
  },
});
