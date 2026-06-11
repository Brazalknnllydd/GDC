import { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BarChart3,
  Bell,
  FileText,
  LayoutDashboard,
  Package,
  Plus,
  ReceiptText,
  Settings,
  ShoppingCart,
  Users,
  Warehouse,
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { colors, fonts } from '../constants/theme';
import { AdminBottomNav } from '../components/ui/admin-bottom-nav';
import { SectionHeading } from '../components/ui/section-heading';
import { SurfaceCard } from '../components/ui/surface-card';

const summaryCards = [
  { title: "TODAY'S SALES", value: 'P152,450', detail: '+12.5%', tone: 'up' as const },
  { title: "TODAY'S PROFIT", value: 'P42,120', detail: '+8.2%', tone: 'up' as const },
  { title: 'TRANSACTIONS', value: '124', detail: 'Avg. P1,229 / order', tone: 'neutral' as const },
  { title: 'PRODUCTS', value: '1,248', detail: '24 Low in Stock', tone: 'neutral' as const },
];

const actions = [
  { label: 'New Sale', icon: ShoppingCart },
  { label: 'Products', icon: Package, route: '/admin-products' as const },
  { label: 'Inventory', icon: Warehouse },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Users', icon: Users },
  { label: 'Settings', icon: Settings, route: '/admin-settings' as const },
];

const revenueBars = [
  { day: 'MON', height: 86, active: false },
  { day: 'TUE', height: 114, active: false },
  { day: 'WED', height: 66, active: false },
  { day: 'THU', height: 152, active: false },
  { day: 'FRI', height: 104, active: false },
  { day: 'SAT', height: 182, active: true },
  { day: 'SUN', height: 76, active: false },
];

const transactions = [
  { id: '8429', method: 'Card', time: '2 mins ago', amount: 'P2,840.00', status: 'SUCCESS' },
  { id: '8428', method: 'Cash', time: '15 mins ago', amount: 'P4,150.00', status: 'SUCCESS' },
];

const tabs = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true, route: '/admin' as const },
  { label: 'Products', icon: Package, active: false, route: '/admin-products' as const },
  { label: 'Sales', icon: ReceiptText, active: false },
  { label: 'Reports', icon: BarChart3, active: false },
  { label: 'Settings', icon: Settings, active: false, route: '/admin-settings' as const },
];

export default function AdminScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string }>();

  const displayName = useMemo(() => {
    if (typeof params.name === 'string' && params.name.trim()) {
      return params.name.trim();
    }

    return 'Admin';
  }, [params.name]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerIdentity}>
            <Image
              source={require('../../assets/images/logo.jpg')}
              style={styles.avatar}
              resizeMode="cover"
            />
            <Text style={styles.headerTitle}>Good Morning, {displayName}</Text>
          </View>

          <Pressable style={styles.bellButton}>
            <Bell color="#383B4F" size={24} strokeWidth={1.9} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryGrid}>
            {summaryCards.map((card) => (
              <SurfaceCard key={card.title} style={styles.metricCard}>
                <Text style={styles.metricTitle}>{card.title}</Text>
                <Text style={styles.metricValue}>{card.value}</Text>
                <Text
                  style={[
                    styles.metricDetail,
                    card.tone === 'up' ? styles.metricDetailUp : styles.metricDetailNeutral,
                  ]}>
                  {card.detail}
                </Text>
              </SurfaceCard>
            ))}
          </View>

          <SectionHeading style={styles.sectionLabel}>QUICK ACTIONS</SectionHeading>
          <View style={styles.actionsGrid}>
            {actions.map((action) => {
              const Icon = action.icon;

              return (
                <Pressable
                  key={action.label}
                  onPress={() => action.route && router.push(action.route)}
                  style={styles.actionCard}>
                  <Icon color={colors.secondary} size={31} strokeWidth={1.9} />
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <SurfaceCard style={styles.revenueCard}>
            <View style={styles.revenueHeader}>
              <Text style={styles.revenueTitle}>Weekly Revenue</Text>
              <View style={styles.periodPill}>
                <Text style={styles.periodText}>LAST 7 DAYS</Text>
              </View>
            </View>

            <View style={styles.chartArea}>
              {revenueBars.map((bar) => (
                <View key={bar.day} style={styles.chartColumn}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: bar.height,
                        backgroundColor: bar.active ? colors.secondary : '#ECECEF',
                      },
                    ]}
                  />
                  <Text style={styles.chartLabel}>{bar.day}</Text>
                </View>
              ))}
            </View>
          </SurfaceCard>

          <View style={styles.transactionsHeader}>
            <SectionHeading style={styles.sectionLabel}>RECENT TRANSACTIONS</SectionHeading>
            <Pressable>
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          </View>

          <View style={styles.transactionsList}>
            {transactions.map((transaction) => (
              <SurfaceCard key={transaction.id} style={styles.transactionCard}>
                <View style={styles.receiptBadge}>
                  <FileText color={colors.secondary} size={25} strokeWidth={1.9} />
                </View>

                <View style={styles.transactionBody}>
                  <View>
                    <Text style={styles.transactionTitle}>Sale #{transaction.id}</Text>
                    <Text style={styles.transactionMeta}>
                      {transaction.method} | {transaction.time}
                    </Text>
                  </View>

                  <View style={styles.transactionAmountWrap}>
                    <Text style={styles.transactionAmount}>{transaction.amount}</Text>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusText}>{transaction.status}</Text>
                    </View>
                  </View>
                </View>
              </SurfaceCard>
            ))}
          </View>
        </ScrollView>

        <Pressable style={styles.fab}>
          <Plus color="#FFFFFF" size={34} strokeWidth={2.2} />
        </Pressable>

        <AdminBottomNav items={tabs} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7FA',
  },
  page: {
    flex: 1,
    backgroundColor: '#F7F7FA',
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#D7DAE3',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  headerIdentity: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
  },
  avatar: {
    borderRadius: 24,
    height: 48,
    marginRight: 12,
    width: 48,
  },
  headerTitle: {
    color: colors.secondary,
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 29,
  },
  bellButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 120,
    paddingHorizontal: 22,
    paddingTop: 22,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  metricCard: {
    minHeight: 146,
    paddingHorizontal: 22,
    paddingVertical: 22,
    width: '47.5%',
  },
  metricTitle: {
    color: '#303546',
    fontFamily: fonts.medium,
    fontSize: 14,
    letterSpacing: 2.4,
    marginBottom: 18,
  },
  metricValue: {
    color: '#111111',
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 33,
    marginBottom: 10,
  },
  metricDetail: {
    fontSize: 13,
  },
  metricDetailUp: {
    color: '#D40019',
    fontFamily: fonts.bold,
  },
  metricDetailNeutral: {
    color: '#454853',
    fontFamily: fonts.regular,
  },
  sectionLabel: {
    marginBottom: 18,
    marginTop: 34,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  actionCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CED3E3',
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 114,
    paddingHorizontal: 16,
    paddingVertical: 20,
    width: '30.8%',
  },
  actionLabel: {
    color: '#161A25',
    fontFamily: fonts.medium,
    fontSize: 16,
    marginTop: 16,
  },
  revenueCard: {
    borderRadius: 22,
    marginTop: 34,
    paddingBottom: 20,
    paddingHorizontal: 18,
    paddingTop: 26,
  },
  revenueHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 26,
  },
  revenueTitle: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: 21,
  },
  periodPill: {
    backgroundColor: '#F0F1F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  periodText: {
    color: '#3F4454',
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  chartArea: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 250,
    paddingHorizontal: 6,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    borderRadius: 2,
    marginBottom: 14,
    width: 38,
  },
  chartLabel: {
    color: '#303443',
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  transactionsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewAllText: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: 15,
    marginTop: 18,
  },
  transactionsList: {
    gap: 14,
  },
  transactionCard: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  receiptBadge: {
    alignItems: 'center',
    backgroundColor: '#F3F4F7',
    borderRadius: 12,
    height: 60,
    justifyContent: 'center',
    marginRight: 16,
    width: 60,
  },
  transactionBody: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionTitle: {
    color: '#151821',
    fontFamily: fonts.bold,
    fontSize: 19,
    marginBottom: 4,
  },
  transactionMeta: {
    color: '#404552',
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  transactionAmountWrap: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: 20,
    marginBottom: 8,
  },
  statusPill: {
    backgroundColor: '#DDF9E3',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusText: {
    color: '#117A38',
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  fab: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 36,
    bottom: 104,
    height: 72,
    justifyContent: 'center',
    position: 'absolute',
    right: 22,
    shadowColor: '#0C2546',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    width: 72,
  },
});
