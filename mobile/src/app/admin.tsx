import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Bot,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Package,
  ReceiptText,
  Settings,
  TrendingUp,
  Users,
  X,
} from "lucide-react-native";
import { useLocalSearchParams } from "expo-router";

import { radius, spacing } from "../constants/design-system";
import { colors, fonts, textRoles, textSizes } from "../constants/theme";
import { AdminMetricCard } from "../components/ui/admin-metric-card";
import { AdminBarChart } from "../components/ui/admin-bar-chart";
import { AdminMetricGrid } from "../components/ui/admin-metric-grid";
import { AdminPageScreen } from "../components/ui/admin-page-screen";
import { AiChatModal } from "../components/ui/ai-chat-modal";
import { AppFab } from "../components/ui/app-fab";
import { PaginationControls } from "../components/ui/pagination-controls";
import { SurfaceCard } from "../components/ui/surface-card";
import { tabs as baseTabs } from "../components/admin-products/products-screen-data";
import { apiClient } from "../lib/api";
import { formatPeso, normalizeNumber } from "../lib/product-utils";
import { usePagination } from "../hooks/use-pagination";
import { useResponsiveLayout } from "../hooks/use-responsive-layout";
import type { SaleRecord } from "../lib/sales-types";

type Product = {
  id: number;
  stock: number;
  price: number | string;
};

type Category = {
  id: number;
};

const dashboardTabs = baseTabs.map((tab) =>
  tab.label === "Dashboard"
    ? { ...tab, active: true, route: "/admin" as const }
    : { ...tab, active: false }
);

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isToday(value: string) {
  return (
    startOfDay(new Date(value)).getTime() === startOfDay(new Date()).getTime()
  );
}

function buildSevenDayRevenueSeries(sales: SaleRecord[]) {
  const labels: string[] = [];
  const values: number[] = [];
  const today = startOfDay(new Date());
  const startDate = new Date(today);

  startDate.setDate(startDate.getDate() - 6);

  for (let offset = 0; offset < 7; offset += 1) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + offset);

    labels.push(
      `${day.toLocaleDateString("en-PH", { weekday: "short" })} ${day.getDate()}`
    );
    values.push(
      sales.reduce((sum, sale) => {
        const saleDate = startOfDay(new Date(sale.createdAt));
        return saleDate.getTime() === day.getTime()
          ? sum + normalizeNumber(sale.totalAmount)
          : sum;
      }, 0),
    );
  }

  return { labels, values };
}

export default function AdminScreen() {
  const { compactPhone } = useResponsiveLayout();
  const params = useLocalSearchParams<{ name?: string }>();
  const [showBot, setShowBot] = useState(false);
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await apiClient.get<Product[]>('/products');
      return response.data;
    },
  });
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.get<Category[]>('/categories');
      return response.data;
    },
  });
  const salesQuery = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const response = await apiClient.get<SaleRecord[]>('/sales');
      return response.data.slice().sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      );
    },
  });

  const products = productsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const sales = salesQuery.data ?? [];
  const screenError =
    productsQuery.error?.message ||
    categoriesQuery.error?.message ||
    salesQuery.error?.message ||
    "";

  const displayName = useMemo(() => {
    if (typeof params.name === "string" && params.name.trim()) {
      return params.name.trim();
    }

    return "Admin";
  }, [params.name]);

  const todaySales = useMemo(
    () => sales.filter((sale) => isToday(sale.createdAt)),
    [sales],
  );
  const todaySalesTotal = useMemo(
    () =>
      todaySales.reduce(
        (sum, sale) => sum + normalizeNumber(sale.totalAmount),
        0,
      ),
    [todaySales],
  );
  const lowStockCount = useMemo(
    () => products.filter((product) => product.stock <= 10).length,
    [products],
  );
  const weeklyRevenueChart = useMemo(() => {
    return buildSevenDayRevenueSeries(sales);
  }, [sales]);

  const summaryCards = useMemo(
    () => [
      {
        detail: '',
        detailColor: colors.textHeading,
        title: "TODAY'S SALES",
        value: formatPeso(todaySalesTotal),
      },
      {
        detail: `${sales.length} total transactions`,
        detailColor: colors.textHeading,
        title: "TRANSACTIONS",
        value: String(sales.length),
      },
      {
        detail: `${categories.length} active categories`,
        detailColor: colors.textHeading,
        title: "CATEGORIES",
        value: String(categories.length),
      },
      {
        detail: `${lowStockCount} low in stock`,
        detailColor: lowStockCount > 0 ? colors.danger : colors.textHeading,
        title: "PRODUCTS",
        value: String(products.length),
      },
    ],
    [
      categories.length,
      lowStockCount,
      products.length,
      sales.length,
      todaySales.length,
      todaySalesTotal,
    ],
  );
  const {
    endItem: salesPageEnd,
    page: salesPage,
    paginatedItems: paginatedSales,
    setPage: setSalesPage,
    startItem: salesPageStart,
    totalPages: totalSalesPages,
    visiblePageNumbers,
  } = usePagination({
    items: sales,
    itemsPerPage: 10,
  });

  return (
    <AdminPageScreen
      title="Dashboard"
      introDescription={`Good morning, ${displayName}. Here's today's business snapshot.`}
      bottomNavItems={dashboardTabs}
      floatingContent={
        <AppFab
          icon={<Bot color="#FFFFFF" size={28} strokeWidth={2.2} />}
          onPress={() => setShowBot(true)}
          style={{ position: 'absolute', bottom: 95, right: 20, zIndex: 10 }}
        />
      }
    >
      <AiChatModal visible={showBot} onClose={() => setShowBot(false)} />
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

      <SurfaceCard
        style={[styles.revenueCard, compactPhone && styles.revenueCardCompact]}
      >
        <View
          style={[
            styles.revenueHeader,
            compactPhone && styles.revenueHeaderCompact,
          ]}
        >
          <Text style={styles.revenueTitle}>Weekly Revenue</Text>
          <View
            style={[
              styles.periodPill,
              compactPhone && styles.periodPillCompact,
            ]}
          >
            <CalendarDays
              color={colors.textHeading}
              size={14}
              strokeWidth={1.9}
            />
            <Text style={styles.periodText}>LIVE DATA</Text>
          </View>
        </View>
        <Text style={styles.revenueRangeText}>
          Last 7 days
        </Text>

        <AdminBarChart
          emptyDescription="Revenue will appear once sales are recorded."
          emptyTitle="Weekly revenue is empty"
          height={250}
          labels={weeklyRevenueChart.labels}
          values={weeklyRevenueChart.values}
        />
      </SurfaceCard>

      <View style={styles.transactionsHeader}>
        <Text style={styles.transactionsHeading}>RECENT TRANSACTIONS</Text>
      </View>

      <SurfaceCard
        style={[styles.tableCard, compactPhone && styles.tableCardCompact]}
      >
        {sales.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={{ minWidth: "100%" }}
          >
            <View style={[styles.table, { minWidth: "100%" }]}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>
                  RECEIPT NO.
                </Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>
                  DATE SOLD
                </Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>
                  PAYMENT
                </Text>
                <Text
                  style={[
                    styles.tableHeaderCell,
                    { width: 120, textAlign: "right" },
                  ]}
                >
                  TOTAL
                </Text>
              </View>
              <View style={styles.tableRows}>
                {paginatedSales.map((transaction) => (
                  <View key={transaction.id} style={styles.tableRow}>
                    <Text
                      style={[
                        styles.tableCell,
                        { flex: 1.5, ...textRoles.value, color: colors.textStrong },
                      ]}
                    >
                      {transaction.receiptNumber}
                    </Text>
                    <Text style={[styles.tableCellSecondary, { flex: 1.5 }]}>
                      {new Date(transaction.createdAt).toLocaleString("en-PH", {
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                    <Text style={[styles.tableCellSecondary, { flex: 1 }]}>
                      {transaction.paymentMethod}
                    </Text>
                    <Text style={[styles.tableCellAmount, { width: 120 }]}>
                      {formatPeso(normalizeNumber(transaction.totalAmount))}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.tableFooter}>
                <PaginationControls
                  borderless
                  currentPage={salesPage}
                  endItem={salesPageEnd}
                  onPageChange={(page) => setSalesPage(page)}
                  startItem={salesPageStart}
                  totalItems={sales.length}
                  totalPages={totalSalesPages}
                  visiblePageNumbers={visiblePageNumbers}
                />
              </View>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>No transactions yet.</Text>
          </View>
        )}
      </SurfaceCard>

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
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 26,
  },
  revenueHeaderCompact: {
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  revenueTitle: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: 21,
  },
  revenueRangeText: {
    color: colors.textTertiary,
    ...textRoles.label,
    marginBottom: spacing.sm,
    marginTop: -8,
  },
  periodPill: {
    alignItems: "center",
    backgroundColor: colors.surfaceNeutral,
    borderRadius: radius.sm,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  periodPillCompact: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 7,
  },
  periodText: {
    color: colors.textHeading,
    ...textRoles.label,
  },
  transactionsHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    marginTop: spacing.block,
  },
  transactionsHeading: {
    color: colors.textStrong,
    ...textRoles.label,
    fontSize: textSizes.medium,
    letterSpacing: 2.2,
  },
  tableCard: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: "hidden",
  },
  tableCardCompact: {
    marginHorizontal: -spacing.md,
    borderRadius: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  table: {
    backgroundColor: colors.card,
    minWidth: 800,
  },
  tableHeader: {
    backgroundColor: colors.surfaceSoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderPanel,
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: spacing.md,
  },
  tableHeaderCell: {
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: textSizes.smallCaps,
    letterSpacing: 1.2,
  },
  tableRows: {
    backgroundColor: "#FFFFFF",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderPanel,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: spacing.md,
  },
  tableCell: {
    color: colors.textStrong,
    ...textRoles.body,
    fontSize: 15,
  },
  tableCellSecondary: {
    color: colors.textSecondary,
    ...textRoles.body,
    fontSize: 14,
  },
  tableCellAmount: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: 16,
    textAlign: "right",
  },
  tableFooter: {
    backgroundColor: colors.surfaceSoft,
    borderTopWidth: 1,
    borderTopColor: colors.borderPanel,
    paddingVertical: 16,
    paddingHorizontal: 24,
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
