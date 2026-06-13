import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BarChart3,
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

import { layout, radius, shadows, spacing } from '../constants/design-system';
import { colors, textRoles, textSizes } from '../constants/theme';
import { AdminMetricCard } from '../components/ui/admin-metric-card';
import { AdminMetricGrid } from '../components/ui/admin-metric-grid';
import { AdminPageScreen } from '../components/ui/admin-page-screen';
import { SectionHeading } from '../components/ui/section-heading';
import { SurfaceCard } from '../components/ui/surface-card';

const summaryCards = [
  { title: "TODAY'S SALES", value: 'P152,450', detail: '+12.5%', tone: 'up' as const },
  { title: "TODAY'S PROFIT", value: 'P42,120', detail: '+8.2%', tone: 'up' as const },
  { title: 'TRANSACTIONS', value: '124', detail: 'Avg. P1,229 / order', tone: 'neutral' as const },
  { title: 'PRODUCTS', value: '1,248', detail: '24 Low in Stock', tone: 'neutral' as const },
];

const actions = [
  { label: 'New Sale', icon: ShoppingCart, route: '/admin-sales' as const },
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
  { label: 'Sales', icon: ReceiptText, active: false, route: '/admin-sales' as const },
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
    <AdminPageScreen
      title="Dashboard"
      introDescription={`Good morning, ${displayName}. Here's today's business snapshot.`}
      bottomNavItems={tabs}
      floatingContent={
        <Pressable style={styles.fab}>
          <Plus color="#FFFFFF" size={34} strokeWidth={2.2} />
        </Pressable>
      }>
      <AdminMetricGrid>
        {summaryCards.map((card) => (
          <AdminMetricCard
            key={card.title}
            detail={card.detail}
            detailColor={card.tone === 'up' ? '#D40019' : '#454853'}
            minHeight={146}
            title={card.title}
            titleColor="#303546"
            titleLetterSpacing={2.4}
            titleMarginBottom={18}
            value={card.value}
            valueColor="#111111"
            valueFontSize={28}
            valueLineHeight={33}
            valueMarginBottom={10}
          />
        ))}
      </AdminMetricGrid>

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
    </AdminPageScreen>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    marginBottom: radius.xl,
    marginTop: spacing.block,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layout.cardGap,
  },
  actionCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CED3E3',
    borderRadius: radius.xl,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 114,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    width: '30.8%',
  },
  actionLabel: {
    color: '#161A25',
    ...textRoles.label,
    fontSize: textSizes.medium,
    marginTop: 16,
  },
  revenueCard: {
    borderRadius: 22,
    marginTop: spacing.block,
    paddingBottom: spacing.xl,
    paddingHorizontal: radius.xl,
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
    ...textRoles.value,
    fontSize: 21,
  },
  periodPill: {
    backgroundColor: '#F0F1F5',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  periodText: {
    color: '#3F4454',
    ...textRoles.label,
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
    ...textRoles.label,
  },
  transactionsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewAllText: {
    color: colors.secondary,
    ...textRoles.label,
    fontSize: 15,
    marginTop: radius.xl,
  },
  transactionsList: {
    gap: 14,
  },
  transactionCard: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: radius.xl,
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
    ...textRoles.value,
    fontSize: 19,
    marginBottom: 4,
  },
  transactionMeta: {
    color: '#404552',
    ...textRoles.label,
    fontSize: 14,
  },
  transactionAmountWrap: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    color: colors.secondary,
    ...textRoles.value,
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
    ...textRoles.label,
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
    ...shadows.floating,
    width: 72,
  },
});
