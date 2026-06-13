import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, Download, History, Wallet } from 'lucide-react-native';

import { chartTabs, fallbackSales, paymentMethodCards, rangeOptions, topProducts } from '../components/admin-sales/sales-screen-data';
import { PaymentMethodCard } from '../components/admin-sales/payment-method-card';
import { SalesSummaryCard } from '../components/admin-sales/sales-summary-card';
import { SalesTransactionRow } from '../components/admin-sales/sales-transaction-row';
import { TopProductRow } from '../components/admin-sales/top-product-row';
import { layout, radius, spacing } from '../constants/design-system';
import { AdminMetricGrid } from '../components/ui/admin-metric-grid';
import { AdminPageScreen } from '../components/ui/admin-page-screen';
import { SurfaceCard } from '../components/ui/surface-card';
import { colors, fonts, textRoles, textSizes } from '../constants/theme';
import { apiClient } from '../lib/api';
import { tabs as productTabs } from '../components/admin-products/products-screen-data';

type CustomerRef = {
  name: string;
} | null;

type SaleItem = {
  id?: number;
  quantity: number;
  subtotal: number;
  product?: {
    name: string;
  };
};

type SaleRecord = {
  id: number;
  receiptNumber: string;
  totalAmount: number | string;
  subtotal?: number | string;
  amountPaid: number | string;
  changeAmount: number | string;
  paymentMethod: string;
  customer?: CustomerRef;
  createdAt: string;
  items: SaleItem[];
};

function formatPeso(value: number) {
  return `P${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function normalizeNumber(value: number | string | undefined) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    return Number(value) || 0;
  }

  return 0;
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isInSelectedRange(dateValue: string, range: (typeof rangeOptions)[number]) {
  const date = new Date(dateValue);
  const now = new Date();

  if (range === 'Today') {
    return date.toDateString() === now.toDateString();
  }

  if (range === 'This Week') {
    return date >= startOfWeek(now);
  }

  if (range === 'This Month') {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  return true;
}

function describeCustomer(customer: CustomerRef, paymentMethod: string) {
  return `${customer?.name || 'Walk-in'} | ${paymentMethod}`;
}

function buildDailyChartHeights(sales: SaleRecord[]) {
  const slots = [8, 10, 12, 14, 16, 18, 20];

  const totals = slots.map((hour) => {
    const slotTotal = sales.reduce((sum, sale) => {
      const saleHour = new Date(sale.createdAt).getHours();

      if (saleHour < hour || saleHour >= hour + 2) {
        return sum;
      }

      return sum + normalizeNumber(sale.totalAmount);
    }, 0);

    return slotTotal;
  });

  const peak = Math.max(...totals, 1);

  return slots.map((hour, index) => ({
    hourLabel: `${String(hour).padStart(2, '0')}:00`,
    height: Math.max(28, Math.round((totals[index] / peak) * 166)),
    active: totals[index] === peak && peak > 0,
  }));
}

function buildWeeklyChartHeights(sales: SaleRecord[]) {
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const totals = dayLabels.map((_, index) =>
    sales.reduce((sum, sale) => {
      const saleDate = new Date(sale.createdAt);
      const day = saleDate.getDay();
      const mondayBasedDay = day === 0 ? 6 : day - 1;

      if (mondayBasedDay !== index) {
        return sum;
      }

      return sum + normalizeNumber(sale.totalAmount);
    }, 0)
  );

  const peak = Math.max(...totals, 1);

  return dayLabels.map((label, index) => ({
    hourLabel: label,
    height: Math.max(28, Math.round((totals[index] / peak) * 166)),
    active: totals[index] === peak && peak > 0,
  }));
}

export default function AdminSalesScreen() {
  const [selectedRange, setSelectedRange] = useState<(typeof rangeOptions)[number]>('Today');
  const [selectedChartTab, setSelectedChartTab] = useState<(typeof chartTabs)[number]>('Daily');
  const [sales, setSales] = useState<SaleRecord[]>(fallbackSales);

  useEffect(() => {
    async function loadSales() {
      try {
        const response = await apiClient.get<SaleRecord[]>('/sales');
        if (response.data.length > 0) {
          setSales(response.data);
        }
      } catch {
        // Keep fallback sales when the API is offline during local UI work.
      }
    }

    loadSales();
  }, []);

  const filteredSales = useMemo(
    () => sales.filter((sale) => isInSelectedRange(sale.createdAt, selectedRange)),
    [sales, selectedRange]
  );

  const totals = useMemo(() => {
    const totalSales = filteredSales.reduce((sum, sale) => sum + normalizeNumber(sale.totalAmount), 0);
    const grossRevenue = filteredSales.reduce((sum, sale) => sum + normalizeNumber(sale.subtotal), 0);
    const profit = grossRevenue * 0.36;
    const transactions = filteredSales.length;
    const averageSale = transactions ? totalSales / transactions : 0;

    return {
      averageSale,
      profit,
      totalSales,
      transactions,
    };
  }, [filteredSales]);

  const chartBars = useMemo(
    () => (selectedChartTab === 'Daily' ? buildDailyChartHeights(filteredSales) : buildWeeklyChartHeights(filteredSales)),
    [filteredSales, selectedChartTab]
  );

  const recentTransactions = useMemo(() => filteredSales.slice(0, 2), [filteredSales]);
  const displayDate = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    []
  );

  const salesTabs = productTabs.map((tab) =>
    tab.label === 'Sales'
      ? { ...tab, active: true, route: '/admin-sales' as const }
      : { ...tab, active: false }
  );

  return (
    <AdminPageScreen
      title="Sales"
      introDescription="Monitor transactions, revenue, and business performance"
      bottomNavItems={salesTabs}
      introChildren={
        <View style={styles.dateRow}>
          <CalendarDays color="#707688" size={15} strokeWidth={1.9} />
          <Text style={styles.dateText}>{displayDate}</Text>
        </View>
      }>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rangeTabsRow}>
        {rangeOptions.map((option) => (
          <Pressable
            key={option}
            onPress={() => setSelectedRange(option)}
            style={styles.rangeTabButton}>
            <Text style={[styles.rangeTabText, selectedRange === option && styles.rangeTabTextActive]}>
              {option}
            </Text>
            {selectedRange === option ? <View style={styles.rangeTabUnderline} /> : null}
          </Pressable>
        ))}
      </ScrollView>

      <AdminMetricGrid>
        <SalesSummaryCard
          title="TOTAL SALES"
          value={formatPeso(totals.totalSales)}
          detail="+12%"
          detailTone="positive"
        />
        <SalesSummaryCard
          title="PROFIT"
          value={formatPeso(totals.profit)}
          detail="+8%"
          detailTone="positive"
        />
        <SalesSummaryCard
          title="TRANSACTIONS"
          value={String(totals.transactions)}
          detail="Daily target: 400"
        />
        <SalesSummaryCard
          title="AVG SALE"
          value={formatPeso(totals.averageSale)}
          detail="-2%"
          detailTone="negative"
        />
      </AdminMetricGrid>

      <SurfaceCard style={styles.analyticsCard}>
        <View style={styles.analyticsHeader}>
          <Text style={styles.analyticsTitle}>Revenue Analytics</Text>
          <View style={styles.analyticsToggle}>
            {chartTabs.map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setSelectedChartTab(tab)}
                style={[styles.analyticsToggleButton, selectedChartTab === tab && styles.analyticsToggleButtonActive]}>
                <Text
                  style={[
                    styles.analyticsToggleText,
                    selectedChartTab === tab && styles.analyticsToggleTextActive,
                  ]}>
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.chartShell}>
          <View style={styles.chartGridLineTop} />
          <View style={styles.chartGridLineBottom} />
          <View style={styles.chartColumns}>
            {chartBars.map((bar) => (
              <View key={bar.hourLabel} style={styles.chartColumn}>
                <View
                  style={[
                    styles.chartBar,
                    { height: bar.height },
                    bar.active ? styles.chartBarActive : styles.chartBarInactive,
                  ]}
                />
                <Text style={styles.chartHourLabel}>{bar.hourLabel}</Text>
              </View>
            ))}
          </View>
        </View>
      </SurfaceCard>

      <View style={styles.paymentMethodsRow}>
        {paymentMethodCards.map((card) => (
          <PaymentMethodCard key={card.label} icon={card.icon} label={card.label} value={card.value} />
        ))}
      </View>

      <View style={styles.insightBanner}>
        <View style={styles.insightIconWrap}>
          <Wallet color={colors.secondary} size={22} strokeWidth={2} />
        </View>
        <View style={styles.insightTextWrap}>
          <Text style={styles.insightLabel}>BUSINESS INSIGHT</Text>
          <Text style={styles.insightText}>Most Profitable: Atlantic Salmon</Text>
        </View>
      </View>

      <SurfaceCard style={styles.listCard}>
        <Text style={styles.cardHeading}>Top Selling Products</Text>
        <View style={styles.cardList}>
          {topProducts.map((product, index) => (
            <View key={product.name}>
              <TopProductRow {...product} />
              {index < topProducts.length - 1 ? <View style={styles.separator} /> : null}
            </View>
          ))}
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.listCard}>
        <View style={styles.listCardHeader}>
          <Text style={styles.cardHeading}>Recent Transactions</Text>
          <Pressable>
            <Text style={styles.viewAllText}>View All</Text>
          </Pressable>
        </View>

        <View style={styles.cardList}>
          {recentTransactions.map((sale, index) => (
            <View key={sale.id}>
              <SalesTransactionRow
                amount={formatPeso(normalizeNumber(sale.totalAmount))}
                receiptNumber={sale.receiptNumber}
                status="Completed"
                subtitle={describeCustomer(sale.customer ?? null, sale.paymentMethod)}
              />
              {index < recentTransactions.length - 1 ? <View style={styles.separator} /> : null}
            </View>
          ))}
        </View>
      </SurfaceCard>

      <View style={styles.footerActions}>
        <Pressable style={styles.secondaryFooterButton}>
          <History color={colors.secondary} size={18} strokeWidth={2.1} />
          <Text style={styles.secondaryFooterButtonText}>Sales History</Text>
        </Pressable>
        <Pressable style={styles.primaryFooterButton}>
          <Download color="#FFFFFF" size={18} strokeWidth={2.1} />
          <Text style={styles.primaryFooterButtonText}>Export Report</Text>
        </Pressable>
      </View>
    </AdminPageScreen>
  );
}

const styles = StyleSheet.create({
  dateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: -14,
    marginBottom: 18,
  },
  dateText: {
    color: '#697082',
    fontFamily: fonts.medium,
    fontSize: 13,
    marginLeft: 6,
  },
  rangeTabsRow: {
    gap: radius.xl,
    marginBottom: radius.xl,
    paddingBottom: 2,
  },
  rangeTabButton: {
    paddingBottom: 8,
    position: 'relative',
  },
  rangeTabText: {
    color: '#1F2434',
    ...textRoles.label,
    letterSpacing: 1.2,
  },
  rangeTabTextActive: {
    color: colors.secondary,
    fontFamily: fonts.bold,
  },
  rangeTabUnderline: {
    backgroundColor: colors.secondary,
    borderRadius: 999,
    bottom: 0,
    height: 2,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  analyticsCard: {
    marginTop: layout.cardGap + spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  analyticsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  analyticsTitle: {
    color: colors.secondary,
    ...textRoles.value,
  },
  analyticsToggle: {
    backgroundColor: '#F0F1F5',
    borderRadius: radius.md,
    flexDirection: 'row',
    padding: 4,
  },
  analyticsToggleButton: {
    borderRadius: radius.sm - 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  analyticsToggleButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  analyticsToggleText: {
    color: '#34394A',
    ...textRoles.label,
  },
  analyticsToggleTextActive: {
    color: '#161B29',
  },
  chartShell: {
    backgroundColor: '#F6F7FB',
    borderColor: '#DCE1EE',
    borderRadius: layout.cardGap,
    borderWidth: 1,
    minHeight: 240,
    overflow: 'hidden',
    paddingBottom: 18,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    position: 'relative',
  },
  chartGridLineTop: {
    borderColor: '#C8CCDA',
    borderStyle: 'dashed',
    borderTopWidth: 1,
    left: 10,
    position: 'absolute',
    right: 10,
    top: 88,
  },
  chartGridLineBottom: {
    borderColor: '#C8CCDA',
    borderStyle: 'dashed',
    borderTopWidth: 1,
    left: 10,
    position: 'absolute',
    right: 10,
    top: 148,
  },
  chartColumns: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 28,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  chartBar: {
    borderRadius: 999,
    marginBottom: 10,
    width: 4,
  },
  chartBarActive: {
    backgroundColor: colors.secondary,
  },
  chartBarInactive: {
    backgroundColor: '#B4BCFF',
  },
  chartHourLabel: {
    color: '#6B7280',
    ...textRoles.label,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
    marginTop: layout.cardGap + spacing.sm,
  },
  insightBanner: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    flexDirection: 'row',
    marginTop: layout.cardGap,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md + 2,
  },
  insightIconWrap: {
    alignItems: 'center',
    backgroundColor: '#DDE2FF',
    borderRadius: radius.md,
    height: 42,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 42,
  },
  insightTextWrap: {
    flex: 1,
  },
  insightLabel: {
    color: '#D9DEFF',
    ...textRoles.label,
    letterSpacing: 1.4,
    marginBottom: 2,
  },
  insightText: {
    color: '#FFFFFF',
    ...textRoles.value,
  },
  listCard: {
    marginTop: layout.cardGap + spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  listCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardHeading: {
    color: colors.secondary,
    ...textRoles.value,
    marginBottom: 8,
  },
  viewAllText: {
    color: colors.secondary,
    ...textRoles.label,
  },
  cardList: {
    paddingTop: 2,
  },
  separator: {
    backgroundColor: '#E5E8F0',
    height: 1,
    width: '100%',
  },
  footerActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.section,
  },
  secondaryFooterButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: colors.secondary,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 54,
  },
  secondaryFooterButtonText: {
    color: colors.secondary,
    ...textRoles.label,
    marginLeft: 8,
  },
  primaryFooterButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 54,
  },
  primaryFooterButtonText: {
    color: '#FFFFFF',
    ...textRoles.label,
    marginLeft: 8,
  },
});
