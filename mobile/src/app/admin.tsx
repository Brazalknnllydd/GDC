import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BarChart3,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Package,
  ReceiptText,
  Settings,
} from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';

import { radius, spacing } from '../constants/design-system';
import { colors, textRoles, textSizes } from '../constants/theme';
import { AdminMetricCard } from '../components/ui/admin-metric-card';
import { AdminBarChart } from '../components/ui/admin-bar-chart';
import { AdminMetricGrid } from '../components/ui/admin-metric-grid';
import { AdminPageScreen } from '../components/ui/admin-page-screen';
import { SurfaceCard } from '../components/ui/surface-card';
import { apiClient } from '../lib/api';
import { formatPeso, normalizeNumber } from '../lib/product-utils';
import { useResponsiveLayout } from '../hooks/use-responsive-layout';

type Product = {
  id: number;
  stock: number;
  price: number | string;
};

type Category = {
  id: number;
};

type SaleRecord = {
  id: number;
  receiptNumber: string;
  totalAmount: number | string;
  paymentMethod: string;
  createdAt: string;
};

const tabs = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true, route: '/admin' as const },
  { label: 'Products', icon: Package, active: false, route: '/admin-products' as const },
  { label: 'Sales', icon: ReceiptText, active: false, route: '/admin-sales' as const },
  { label: 'Reports', icon: BarChart3, active: false, route: '/admin-reports' as const },
  { label: 'Settings', icon: Settings, active: false, route: '/admin-settings' as const },
];

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isToday(value: string) {
  return startOfDay(new Date(value)).getTime() === startOfDay(new Date()).getTime();
}

export default function AdminScreen() {
  const { compactPhone } = useResponsiveLayout();
  const params = useLocalSearchParams<{ name?: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [screenError, setScreenError] = useState('');

  const displayName = useMemo(() => {
    if (typeof params.name === 'string' && params.name.trim()) {
      return params.name.trim();
    }

    return 'Admin';
  }, [params.name]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setScreenError('');
        const [productsResponse, categoriesResponse, salesResponse] = await Promise.all([
          apiClient.get<Product[]>('/products'),
          apiClient.get<Category[]>('/categories'),
          apiClient.get<SaleRecord[]>('/sales'),
        ]);

        setProducts(productsResponse.data);
        setCategories(categoriesResponse.data);
        setSales(
          salesResponse.data.sort(
            (left, right) =>
              new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
          )
        );
      } catch {
        setScreenError('Could not load dashboard data right now.');
      }
    }

    loadDashboardData();
  }, []);

  const todaySales = useMemo(() => sales.filter((sale) => isToday(sale.createdAt)), [sales]);
  const todaySalesTotal = useMemo(
    () => todaySales.reduce((sum, sale) => sum + normalizeNumber(sale.totalAmount), 0),
    [todaySales]
  );
  const lowStockCount = useMemo(
    () => products.filter((product) => product.stock <= 10).length,
    [products]
  );
  const weeklyRevenueChart = useMemo(() => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const totals = labels.map((_, index) =>
      sales.reduce((sum, sale) => {
        const saleDate = new Date(sale.createdAt);
        const day = saleDate.getDay();
        const mondayBasedDay = day === 0 ? 6 : day - 1;
        return mondayBasedDay === index ? sum + normalizeNumber(sale.totalAmount) : sum;
      }, 0)
    );

    return { labels, values: totals };
  }, [sales]);

  const summaryCards = useMemo(
    () => [
      {
        detail: `${todaySales.length} transactions today`,
        detailColor: colors.textHeading,
        title: "TODAY'S SALES",
        value: formatPeso(todaySalesTotal),
      },
      {
        detail: `${sales.length} total transactions`,
        detailColor: colors.textHeading,
        title: 'TRANSACTIONS',
        value: String(sales.length),
      },
      {
        detail: `${categories.length} active categories`,
        detailColor: colors.textHeading,
        title: 'CATEGORIES',
        value: String(categories.length),
      },
      {
        detail: `${lowStockCount} low in stock`,
        detailColor: lowStockCount > 0 ? colors.danger : colors.textHeading,
        title: 'PRODUCTS',
        value: String(products.length),
      },
    ],
    [categories.length, lowStockCount, products.length, sales.length, todaySales.length, todaySalesTotal]
  );

  return (
    <AdminPageScreen
      title="Dashboard"
      introDescription={`Good morning, ${displayName}. Here's today's business snapshot.`}
      bottomNavItems={tabs}>
      <AdminMetricGrid>
        {summaryCards.map((card) => (
          <AdminMetricCard
            key={card.title}
            detail={card.detail}
            detailColor={card.detailColor}
            minHeight={compactPhone ? 138 : 146}
            title={card.title}
            titleColor={colors.textHeading}
            titleLetterSpacing={compactPhone ? 1 : 1.8}
            titleMarginBottom={compactPhone ? 12 : 16}
            value={card.value}
            valueColor={colors.neutral}
            valueFontSize={compactPhone ? 24 : 28}
            valueLineHeight={compactPhone ? 28 : 33}
            valueMarginBottom={compactPhone ? 8 : 10}
          />
        ))}
      </AdminMetricGrid>

      <SurfaceCard style={[styles.revenueCard, compactPhone && styles.revenueCardCompact]}>
        <View style={[styles.revenueHeader, compactPhone && styles.revenueHeaderCompact]}>
          <Text style={styles.revenueTitle}>Weekly Revenue</Text>
          <View style={[styles.periodPill, compactPhone && styles.periodPillCompact]}>
            <CalendarDays color={colors.textHeading} size={14} strokeWidth={1.9} />
            <Text style={styles.periodText}>LIVE DATA</Text>
          </View>
        </View>

        {sales.length > 0 ? (
          <AdminBarChart
            height={250}
            labels={weeklyRevenueChart.labels}
            values={weeklyRevenueChart.values}
          />
        ) : (
          <Text style={styles.emptyCardText}>Revenue will appear once sales are recorded.</Text>
        )}
      </SurfaceCard>

      <View style={styles.transactionsHeader}>
        <Text style={styles.transactionsHeading}>RECENT TRANSACTIONS</Text>
      </View>

      <View style={styles.transactionsList}>
        {sales.length > 0 ? (
          sales.slice(0, 5).map((transaction) => (
            <SurfaceCard
              key={transaction.id}
              style={[styles.transactionCard, compactPhone && styles.transactionCardCompact]}>
              <View style={[styles.receiptBadge, compactPhone && styles.receiptBadgeCompact]}>
                <FileText color={colors.secondary} size={25} strokeWidth={1.9} />
              </View>

              <View style={[styles.transactionBody, compactPhone && styles.transactionBodyCompact]}>
                <View>
                  <Text style={styles.transactionTitle}>{transaction.receiptNumber}</Text>
                  <Text style={styles.transactionMeta}>
                    {transaction.paymentMethod} |{' '}
                    {new Date(transaction.createdAt).toLocaleString('en-PH', {
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      month: 'short',
                    })}
                  </Text>
                </View>

                <View style={styles.transactionAmountWrap}>
                  <Text style={styles.transactionAmount}>
                    {formatPeso(normalizeNumber(transaction.totalAmount))}
                  </Text>
                </View>
              </View>
            </SurfaceCard>
          ))
        ) : (
          <SurfaceCard style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>No transactions yet.</Text>
          </SurfaceCard>
        )}
      </View>

      {screenError ? <Text style={styles.errorText}>{screenError}</Text> : null}
    </AdminPageScreen>
  );
}

const styles = StyleSheet.create({
  revenueCard: {
    borderRadius: 22,
    marginTop: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: radius.xl,
    paddingTop: 26,
  },
  revenueCardCompact: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  revenueHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 26,
  },
  revenueHeaderCompact: {
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  revenueTitle: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: 21,
  },
  periodPill: {
    alignItems: 'center',
    backgroundColor: colors.surfaceNeutral,
    borderRadius: radius.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  periodPillCompact: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 7,
  },
  periodText: {
    color: colors.textHeading,
    ...textRoles.label,
  },
  transactionsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    marginTop: spacing.block,
  },
  transactionsHeading: {
    color: colors.textStrong,
    ...textRoles.label,
    fontSize: textSizes.medium,
    letterSpacing: 2.2,
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
  transactionCardCompact: {
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  receiptBadge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceNeutral,
    borderRadius: 12,
    height: 60,
    justifyContent: 'center',
    marginRight: 16,
    width: 60,
  },
  receiptBadgeCompact: {
    height: 48,
    marginRight: 12,
    width: 48,
  },
  transactionBody: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionBodyCompact: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  transactionTitle: {
    color: colors.textStrong,
    ...textRoles.value,
    fontSize: 19,
    marginBottom: 4,
  },
  transactionMeta: {
    color: colors.textHeading,
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
  },
  emptyCard: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  emptyCardText: {
    color: colors.textSecondary,
    ...textRoles.body,
    fontSize: 15,
    lineHeight: 22,
  },
  errorText: {
    color: colors.dangerStrong,
    ...textRoles.label,
    fontSize: 13,
    marginTop: spacing.lg,
  },
});
