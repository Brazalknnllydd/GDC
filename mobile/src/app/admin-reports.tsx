import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, CreditCard, Download } from 'lucide-react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import {
  MonthRangePicker,
  type MonthRangeValue,
} from '../components/admin-sales/month-range-picker';
import { CategoryPerformanceRow } from '../components/admin-reports/category-performance-row';
import { PaymentDistributionRow } from '../components/admin-reports/payment-distribution-row';
import { AdminLineChart } from '../components/ui/admin-line-chart';
import { AdminMetricCard } from '../components/ui/admin-metric-card';
import { AdminMetricGrid } from '../components/ui/admin-metric-grid';
import { AdminPageScreen } from '../components/ui/admin-page-screen';
import { SurfaceCard } from '../components/ui/surface-card';
import { layout, radius, spacing } from '../constants/design-system';
import { colors, textRoles, textSizes } from '../constants/theme';
import { apiClient } from '../lib/api';
import { formatPeso, normalizeNumber } from '../lib/product-utils';
import { tabs as productTabs } from '../components/admin-products/products-screen-data';

type Product = {
  id: number;
  category: {
    name: string;
  };
};

type SaleItem = {
  quantity: number;
  subtotal: number | string;
  product?: {
    name: string;
  };
};

type SaleRecord = {
  totalAmount: number | string;
  discountAmount?: number | string;
  paymentMethod: string;
  createdAt: string;
  items: SaleItem[];
};



function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-PH', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function formatMonthLabel(value: Date | null) {
  if (!value) {
    return 'Select month';
  }

  return value.toLocaleDateString('en-PH', {
    month: 'long',
    year: 'numeric',
  });
}

function formatMonthRangeLabel(range: MonthRangeValue) {
  if (!range.startMonth && !range.endMonth) {
    return 'All months';
  }

  if (range.startMonth && range.endMonth) {
    const startValue = formatMonthLabel(range.startMonth);
    const endValue = formatMonthLabel(range.endMonth);

    if (
      range.startMonth.getFullYear() === range.endMonth.getFullYear() &&
      range.startMonth.getMonth() === range.endMonth.getMonth()
    ) {
      return startValue;
    }

    return `${startValue} - ${endValue}`;
  }

  return formatMonthLabel(range.startMonth || range.endMonth);
}

function isWithinMonthRange(dateValue: string, range: MonthRangeValue) {
  if (!range.startMonth || !range.endMonth) {
    return true;
  }

  const date = new Date(dateValue);
  return date >= startOfMonth(range.startMonth) && date <= endOfMonth(range.endMonth);
}

function buildMonthlyLineSeries(sales: SaleRecord[], range: MonthRangeValue) {
  if (!range.startMonth || !range.endMonth) {
    return { discountValues: [], labels: [], revenueValues: [] };
  }

  const labels: string[] = [];
  const revenueValues: number[] = [];
  const discountValues: number[] = [];
  const cursor = startOfMonth(range.startMonth);
  const endCursor = startOfMonth(range.endMonth);

  while (cursor.getTime() <= endCursor.getTime()) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    labels.push(
      cursor.toLocaleDateString('en-PH', {
        month: 'short',
        year:
          range.startMonth.getFullYear() === range.endMonth.getFullYear() ? undefined : '2-digit',
      })
    );

    revenueValues.push(
      sales.reduce((sum, sale) => {
        const saleDate = new Date(sale.createdAt);
        return saleDate.getFullYear() === year && saleDate.getMonth() === month
          ? sum + normalizeNumber(sale.totalAmount)
          : sum;
      }, 0)
    );

    discountValues.push(
      sales.reduce((sum, sale) => {
        const saleDate = new Date(sale.createdAt);
        return saleDate.getFullYear() === year && saleDate.getMonth() === month
          ? sum + normalizeNumber(sale.discountAmount)
          : sum;
      }, 0)
    );

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return { discountValues, labels, revenueValues };
}

function escapeHtml(value: string | number) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default function AdminReportsScreen() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [screenError, setScreenError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showRangePicker, setShowRangePicker] = useState(false);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [reportMonthRange, setReportMonthRange] = useState<MonthRangeValue>(() => {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      endMonth: currentMonth,
      startMonth: currentMonth,
    };
  });

  const reportTabs = productTabs.map((tab) =>
    tab.label === 'Reports'
      ? { ...tab, active: true, route: '/admin-reports' as const }
      : { ...tab, active: false }
  );

  useEffect(() => {
    async function loadReportsData() {
      try {
        setScreenError('');
        const [salesResponse, productsResponse] = await Promise.all([
          apiClient.get<SaleRecord[]>('/sales'),
          apiClient.get<Product[]>('/products'),
        ]);
        setSales(salesResponse.data);
        setProducts(productsResponse.data);
      } catch {
        setScreenError('Could not load report data right now.');
      }
    }

    loadReportsData();
  }, []);

  const filteredSales = useMemo(
    () => sales.filter((sale) => isWithinMonthRange(sale.createdAt, reportMonthRange)),
    [reportMonthRange, sales]
  );

  const totals = useMemo(() => {
    const revenue = filteredSales.reduce(
      (sum, sale) => sum + normalizeNumber(sale.totalAmount),
      0
    );
    const discounts = filteredSales.reduce(
      (sum, sale) => sum + normalizeNumber(sale.discountAmount),
      0
    );
    const itemsSold = filteredSales.reduce(
      (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );
    const averageBasket = filteredSales.length === 0 ? 0 : itemsSold / filteredSales.length;
    const activeCategories = new Set(products.map((product) => product.category.name)).size;

    return {
      activeCategories,
      averageBasket,
      discounts,
      itemsSold,
      revenue,
      transactions: filteredSales.length,
    };
  }, [filteredSales, products]);

  const reportMetrics = useMemo(
    () => [
      {
        title: 'DISCOUNTS GIVEN',
        value: formatPeso(totals.discounts),
        detail: 'Total discounts applied',
        tone: 'default' as const,
      },
      {
        title: 'ITEMS SOLD',
        value: String(totals.itemsSold),
        detail: `${totals.transactions} completed transactions`,
        tone: 'default' as const,
      },
      {
        title: 'AVG BASKET',
        value: totals.averageBasket.toFixed(1),
        detail: 'Items per transaction',
        tone: 'default' as const,
      },
      {
        title: 'ACTIVE CATEGORIES',
        value: String(totals.activeCategories),
        detail: 'Categories tracked in inventory',
        tone: 'default' as const,
      },
    ],
    [totals]
  );

  const chartSeries = useMemo(
    () => buildMonthlyLineSeries(filteredSales, reportMonthRange),
    [filteredSales, reportMonthRange]
  );

  const categoryPerformance = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((product) => {
      counts.set(product.category.name, (counts.get(product.category.name) || 0) + 1);
    });
    const total = Math.max(products.length, 1);

    return [...counts.entries()]
      .map(([label, count]) => ({
        label,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((left, right) => right.percentage - left.percentage);
  }, [products]);

  const paymentDistribution = useMemo(() => {
    const totalRevenue = Math.max(
      filteredSales.reduce((sum, sale) => sum + normalizeNumber(sale.totalAmount), 0),
      1
    );

    return [
      { key: 'Cash', label: 'Cash', tone: 'success' as const },
      { key: 'GCash', label: 'GCash', tone: 'primary' as const },
    ].map((config) => {
      const amount = filteredSales
        .filter((sale) => sale.paymentMethod === config.key)
        .reduce((sum, sale) => sum + normalizeNumber(sale.totalAmount), 0);
      const percentage = filteredSales.length === 0 ? 0 : Math.round((amount / totalRevenue) * 100);

      return {
        amount: formatPeso(amount),
        icon: CreditCard,
        label: config.label,
        percentageText: `(${percentage}%)`,
        tone: config.tone,
      };
    });
  }, [filteredSales]);

  const insightCards = useMemo(() => {
    const bestCategory = categoryPerformance[0]?.label || 'No categories yet';
    const topPayment = paymentDistribution
      .slice()
      .sort((left, right) => {
        const leftValue = Number(left.amount.replace(/[^\d.]/g, '')) || 0;
        const rightValue = Number(right.amount.replace(/[^\d.]/g, '')) || 0;
        return rightValue - leftValue;
      })[0]?.label || 'No payment data';
    const peakSalesDay = filteredSales.length
      ? new Date(
          filteredSales
            .slice()
            .sort(
              (left, right) =>
                normalizeNumber(right.totalAmount) - normalizeNumber(left.totalAmount)
            )[0].createdAt
        ).toLocaleDateString('en-US', { weekday: 'long' })
      : 'No sales yet';

    return { bestCategory, peakSalesDay, topPayment };
  }, [categoryPerformance, filteredSales, paymentDistribution]);

  async function getLogoDataUri() {
    const logoAsset = Asset.fromModule(require('../../assets/images/logo.jpg'));

    if (!logoAsset.localUri && Platform.OS !== 'web') {
      await logoAsset.downloadAsync();
    }

    if (Platform.OS === 'web') {
      return logoAsset.uri;
    }

    const logoUri = logoAsset.localUri || logoAsset.uri;
    const base64 = await FileSystem.readAsStringAsync(logoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return `data:image/jpeg;base64,${base64}`;
  }

  function openPrintableWebReport(html: string) {
    if (typeof window === 'undefined') {
      throw new Error('Print preview is not available in this environment.');
    }

    const reportWindow = window.open('', '_blank', 'noopener,noreferrer,width=960,height=720');

    if (!reportWindow) {
      throw new Error('Please allow pop-ups to export the PDF report.');
    }

    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();
    reportWindow.focus();
    setTimeout(() => reportWindow.print(), 400);
  }

  async function shareFile(uri: string) {
    const available = await Sharing.isAvailableAsync();

    if (!available) {
      Alert.alert('Sharing unavailable', 'File sharing is not available on this device.');
      return;
    }

    await Sharing.shareAsync(uri, {
      UTI: 'com.adobe.pdf',
      dialogTitle: 'Share PDF Report',
      mimeType: 'application/pdf',
    });
  }

  async function handleExportPdf() {
    try {
      setIsExporting(true);
      setScreenError('');

      const logoDataUri = await getLogoDataUri();
      const rangeLabel = formatMonthRangeLabel(reportMonthRange);
      const generatedAt = formatDateTime(new Date().toISOString());
      const categoryRows =
        categoryPerformance.length > 0
          ? categoryPerformance
              .map(
                (category) => `
                  <tr>
                    <td>${escapeHtml(category.label)}</td>
                    <td>${escapeHtml(category.percentage)}%</td>
                  </tr>
                `
              )
              .join('')
          : '<tr><td colspan="2">No category coverage data available.</td></tr>';
      const paymentRows =
        paymentDistribution.length > 0
          ? paymentDistribution
              .map(
                (payment) => `
                  <tr>
                    <td>${escapeHtml(payment.label)}</td>
                    <td>${escapeHtml(payment.amount)}</td>
                    <td>${escapeHtml(payment.percentageText)}</td>
                  </tr>
                `
              )
              .join('')
          : '<tr><td colspan="3">No payment data available.</td></tr>';

      const html = `
        <html>
          <head>
            <meta charset="utf-8" />
            <title>GDC Reports Summary</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                color: #1b1f2d;
                padding: 24px;
              }
              .header {
                align-items: center;
                border-bottom: 2px solid #d9def0;
                display: flex;
                gap: 16px;
                padding-bottom: 18px;
              }
              .logo {
                border-radius: 14px;
                height: 64px;
                object-fit: cover;
                width: 64px;
              }
              .title {
                color: #1a237e;
                font-size: 24px;
                font-weight: 700;
                margin: 0;
              }
              .subtitle {
                color: #5d6476;
                font-size: 12px;
                letter-spacing: 2px;
                margin: 4px 0 0;
                text-transform: uppercase;
              }
              .meta {
                margin-top: 20px;
              }
              .meta p {
                margin: 4px 0;
              }
              .summary-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                margin: 22px 0;
              }
              .summary-card {
                background: #f7f8fc;
                border: 1px solid #dce1ee;
                border-radius: 14px;
                box-sizing: border-box;
                min-width: 220px;
                padding: 14px 16px;
                width: calc(50% - 6px);
              }
              .summary-label {
                color: #6b7280;
                font-size: 11px;
                letter-spacing: 1px;
                margin: 0 0 8px;
                text-transform: uppercase;
              }
              .summary-value {
                color: #1a237e;
                font-size: 22px;
                font-weight: 700;
                margin: 0;
              }
              h2 {
                color: #1a237e;
                font-size: 18px;
                margin: 28px 0 12px;
              }
              table {
                border-collapse: collapse;
                width: 100%;
              }
              th, td {
                border: 1px solid #dce1ee;
                font-size: 11px;
                padding: 8px 10px;
                text-align: left;
              }
              th {
                background: #eef2ff;
                color: #1a237e;
              }
              .insight-grid {
                display: flex;
                gap: 12px;
                margin-top: 18px;
              }
              .insight-box {
                background: #f6f7fb;
                border: 1px solid #dce1ee;
                border-radius: 14px;
                flex: 1;
                padding: 14px 16px;
              }
              .insight-label {
                color: #6b7280;
                font-size: 11px;
                letter-spacing: 1px;
                margin: 0 0 6px;
                text-transform: uppercase;
              }
              .insight-value {
                color: #1b1f2d;
                font-size: 18px;
                font-weight: 700;
                margin: 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <img class="logo" src="${logoDataUri}" />
              <div>
                <p class="title">Admin Reports</p>
                <p class="subtitle">GDC Inventory Pro</p>
              </div>
            </div>

            <div class="meta">
              <p><strong>Month Range:</strong> ${escapeHtml(rangeLabel)}</p>
              <p><strong>Generated:</strong> ${escapeHtml(generatedAt)}</p>
            </div>

            <div class="summary-grid">
              <div class="summary-card">
                <p class="summary-label">Discounts Given</p>
                <p class="summary-value">${escapeHtml(formatPeso(totals.discounts))}</p>
              </div>
              <div class="summary-card">
                <p class="summary-label">Items Sold</p>
                <p class="summary-value">${escapeHtml(totals.itemsSold)}</p>
              </div>
              <div class="summary-card">
                <p class="summary-label">Average Basket</p>
                <p class="summary-value">${escapeHtml(totals.averageBasket.toFixed(1))}</p>
              </div>
              <div class="summary-card">
                <p class="summary-label">Active Categories</p>
                <p class="summary-value">${escapeHtml(totals.activeCategories)}</p>
              </div>
            </div>

            <div class="insight-grid">
              <div class="insight-box">
                <p class="insight-label">Peak Sales Day</p>
                <p class="insight-value">${escapeHtml(insightCards.peakSalesDay)}</p>
              </div>
              <div class="insight-box">
                <p class="insight-label">Top Payment</p>
                <p class="insight-value">${escapeHtml(insightCards.topPayment)}</p>
              </div>
              <div class="insight-box">
                <p class="insight-label">Best Category</p>
                <p class="insight-value">${escapeHtml(insightCards.bestCategory)}</p>
              </div>
            </div>

            <h2>Payment Distribution</h2>
            <table>
              <thead>
                <tr>
                  <th>Payment Method</th>
                  <th>Total</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                ${paymentRows}
              </tbody>
            </table>

            <h2>Catalog Category Coverage</h2>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Coverage</th>
                </tr>
              </thead>
              <tbody>
                ${categoryRows}
              </tbody>
            </table>
          </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        openPrintableWebReport(html);
        return;
      }

      const { uri } = await Print.printToFileAsync({ html });
      await shareFile(uri);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not export the report right now.';
      setScreenError(message);
      Alert.alert('Export failed', message);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <AdminPageScreen
      title="Reports"
      introDescription="Review store insights, payment mix, category coverage, and export-ready summaries."
      bottomNavItems={reportTabs}
      introChildren={
        <View style={styles.filterToolbar}>
          <Pressable
            disabled={isExporting}
            onPress={handleExportPdf}
            style={[styles.toolbarIconButton, isExporting && styles.toolbarIconButtonDisabled]}>
            <Download color={colors.secondary} size={18} strokeWidth={2} />
          </Pressable>
        </View>
      }>
      <SurfaceCard style={styles.rangeCard}>
        <View style={styles.rangeCardHeader}>
          <View style={styles.rangeTextBlock}>
            <Text style={styles.rangeLabel}>Reports Month Range</Text>
            <Text style={styles.rangeValue}>{formatMonthRangeLabel(reportMonthRange)}</Text>
            <Text style={styles.rangeHelp}>
              Filter all report metrics, trends, and insights by a selected month span.
            </Text>
          </View>

          <Pressable
            onPress={() => setShowRangePicker((current) => !current)}
            style={styles.calendarButton}>
            <CalendarDays color={colors.secondary} size={16} strokeWidth={2} />
            <Text style={styles.calendarButtonText}>
              {showRangePicker ? 'Hide Calendar' : 'Choose Range'}
            </Text>
          </Pressable>
        </View>

        {showRangePicker ? (
          <View>
            <MonthRangePicker
              displayYear={calendarYear}
              onChangeRange={setReportMonthRange}
              onChangeYear={setCalendarYear}
              range={reportMonthRange}
            />

            <View style={styles.rangeActions}>
              <Pressable
                onPress={() => {
                  const now = new Date();
                  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                  setReportMonthRange({
                    endMonth: currentMonth,
                    startMonth: currentMonth,
                  });
                  setCalendarYear(now.getFullYear());
                }}
                style={styles.rangeActionButton}>
                <Text style={styles.rangeActionText}>This Month</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  const now = new Date();
                  setReportMonthRange({
                    endMonth: new Date(now.getFullYear(), 11, 1),
                    startMonth: new Date(now.getFullYear(), 0, 1),
                  });
                  setCalendarYear(now.getFullYear());
                }}
                style={styles.rangeActionButton}>
                <Text style={styles.rangeActionText}>This Year</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </SurfaceCard>

      <AdminMetricGrid>
        {reportMetrics.map((metric) => (
          <AdminMetricCard
            key={metric.title}
            detail={metric.detail}
            title={metric.title}
            tone={metric.tone}
            value={metric.value}
          />
        ))}
      </AdminMetricGrid>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Monthly Report Trend</Text>
      </View>

      <SurfaceCard style={styles.analyticsCard}>
        <View style={styles.analyticsLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendRevenue]} />
            <Text style={styles.legendText}>Revenue</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendDiscounts]} />
            <Text style={styles.legendText}>Discounts</Text>
          </View>
        </View>

        {chartSeries.labels.length > 0 ? (
          <AdminLineChart
            datasets={[
              { color: colors.secondary, data: chartSeries.revenueValues },
              { color: colors.tertiary, data: chartSeries.discountValues },
            ]}
            height={220}
            labels={chartSeries.labels}
          />
        ) : (
          <Text style={styles.emptyStateText}>Analytics will appear once report data is available.</Text>
        )}
      </SurfaceCard>

      <Text style={styles.sectionEyebrow}>Admin Highlights</Text>
      <View style={styles.insightsStack}>
        <SurfaceCard style={styles.heroInsightCard}>
          <Text style={styles.heroInsightLabel}>PEAK SALES DAY</Text>
          <Text style={styles.heroInsightValue}>{insightCards.peakSalesDay}</Text>
          <Text style={styles.heroInsightCopy}>
            Strongest day within the selected reporting range.
          </Text>
        </SurfaceCard>

        <View style={styles.insightPair}>
          <SurfaceCard style={[styles.insightTile, styles.insightTilePrimary]}>
            <Text style={styles.insightTileLabel}>TOP PAYMENT</Text>
            <Text style={styles.insightTileValueLight}>{insightCards.topPayment}</Text>
          </SurfaceCard>
          <SurfaceCard style={[styles.insightTile, styles.insightTileSoft]}>
            <Text style={styles.insightTileLabelSoft}>BEST CATEGORY</Text>
            <Text style={styles.insightTileValueDark}>{insightCards.bestCategory}</Text>
          </SurfaceCard>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Catalog Category Coverage</Text>
      <SurfaceCard style={styles.performanceCard}>
        {categoryPerformance.length > 0 ? (
          categoryPerformance.map((category) => (
            <CategoryPerformanceRow key={category.label} {...category} />
          ))
        ) : (
          <Text style={styles.emptyStateText}>Category coverage will appear after products are added.</Text>
        )}
      </SurfaceCard>

      <Text style={styles.sectionTitle}>Payment Distribution</Text>
      <SurfaceCard style={styles.paymentCard}>
        {paymentDistribution.map((payment) => (
          <PaymentDistributionRow key={payment.label} {...payment} />
        ))}
      </SurfaceCard>

      {screenError ? <Text style={styles.screenErrorText}>{screenError}</Text> : null}
    </AdminPageScreen>
  );
}

const styles = StyleSheet.create({
  filterToolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: -4,
  },
  toolbarIconButton: {
    alignItems: 'center',
    backgroundColor: '#F4F6FF',
    borderColor: '#C7D3FF',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  toolbarIconButtonDisabled: {
    opacity: 0.52,
  },
  rangeCard: {
    backgroundColor: '#FBFBFE',
    borderColor: '#D9DFF0',
    marginBottom: layout.cardGap + spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  rangeCardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  rangeTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  rangeLabel: {
    color: '#6A7285',
    ...textRoles.label,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  rangeValue: {
    color: '#1B1F2D',
    ...textRoles.value,
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 4,
  },
  rangeHelp: {
    color: '#5D6476',
    ...textRoles.body,
    fontSize: 14,
    lineHeight: 21,
  },
  calendarButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderColor: '#CBD5FF',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  calendarButtonText: {
    color: colors.secondary,
    ...textRoles.label,
    fontSize: 13,
  },
  rangeActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  rangeActionButton: {
    backgroundColor: '#F3F4F8',
    borderColor: '#D4D9E7',
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rangeActionText: {
    color: '#40485A',
    ...textRoles.label,
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.block,
  },
  sectionTitle: {
    color: '#171C28',
    ...textRoles.value,
    fontSize: textSizes.large,
  },
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  analyticsLegend: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: spacing.lg,
  },
  legendDot: {
    borderRadius: radius.round,
    height: 8,
    marginRight: spacing.sm,
    width: 8,
  },
  legendRevenue: {
    backgroundColor: colors.secondary,
  },
  legendDiscounts: {
    backgroundColor: colors.tertiary,
  },
  legendText: {
    color: '#5A6071',
    ...textRoles.label,
  },
  sectionEyebrow: {
    color: '#7A8092',
    ...textRoles.label,
    letterSpacing: 1.3,
    marginBottom: spacing.md,
    marginTop: spacing.block,
    textTransform: 'uppercase',
  },
  insightsStack: {
    marginBottom: spacing.section,
  },
  heroInsightCard: {
    backgroundColor: '#1A237E',
    borderColor: '#1A237E',
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  heroInsightLabel: {
    color: '#D7DBFF',
    ...textRoles.label,
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  heroInsightValue: {
    color: '#FFFFFF',
    ...textRoles.heading,
    fontSize: 30,
    marginBottom: 6,
  },
  heroInsightCopy: {
    color: '#D8DEFF',
    ...textRoles.body,
    fontSize: 14,
  },
  insightPair: {
    flexDirection: 'row',
    gap: layout.cardGap,
  },
  insightTile: {
    flex: 1,
    minHeight: 110,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  insightTilePrimary: {
    backgroundColor: '#D32F2F',
    borderColor: '#C12227',
  },
  insightTileSoft: {
    backgroundColor: '#F3F4F8',
    borderColor: '#D7DDEC',
  },
  insightTileLabel: {
    color: '#FFE4E4',
    ...textRoles.label,
    marginBottom: 8,
  },
  insightTileLabelSoft: {
    color: '#747B8D',
    ...textRoles.label,
    marginBottom: 8,
  },
  insightTileValueLight: {
    color: '#FFFFFF',
    ...textRoles.value,
    fontSize: textSizes.large - 1,
    lineHeight: 30,
  },
  insightTileValueDark: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: textSizes.large - 1,
    lineHeight: 30,
  },
  performanceCard: {
    marginBottom: spacing.section,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  paymentCard: {
    marginBottom: spacing.section,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  emptyStateText: {
    color: '#5D6476',
    ...textRoles.body,
    fontSize: 15,
  },
  screenErrorText: {
    color: '#B3261E',
    ...textRoles.label,
    fontSize: 13,
    marginTop: spacing.md,
  },
});
