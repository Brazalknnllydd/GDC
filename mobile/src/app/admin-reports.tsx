import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, CreditCard, Download } from 'lucide-react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';

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
import {
  ReportExportOptions,
  type ReportExportFormat,
} from '../components/ui/report-export-options';
import { SurfaceCard } from '../components/ui/surface-card';
import { layout, radius, spacing } from '../constants/design-system';
import { colors, textRoles, textSizes } from '../constants/theme';
import { useReportsAnalytics } from '../hooks/use-reports-analytics';
import { useResponsiveLayout } from '../hooks/use-responsive-layout';
import { apiClient } from '../lib/api';
import { formatExportAmount, formatPeso, normalizeNumber } from '../lib/product-utils';
import { shareExportFile } from '../lib/export-file';
import type { SaleRecord } from '../lib/sales-types';
import { downloadWebPdfReport } from '../lib/web-pdf-export';
import { tabs as productTabs } from '../components/admin-products/products-screen-data';

type Product = {
  id: number;
  category: {
    name: string;
  };
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

function formatMonthRangeForFilename(range: MonthRangeValue) {
  if (!range.startMonth && !range.endMonth) {
    return 'all-months';
  }

  const months = [range.startMonth || range.endMonth, range.endMonth || range.startMonth]
    .filter((value): value is Date => Boolean(value))
    .map((value) =>
      value.toLocaleDateString('en-PH', {
        month: 'short',
        year: 'numeric',
      })
    )
    .map((value) => value.replace(/\s+/g, '-').toLowerCase());

  return [...new Set(months)].join('-to-');
}

function escapeCsvValue(value: string | number) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function escapeHtml(value: string | number) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const pdfColors = {
  border: colors.borderPanel,
  box: colors.surfaceSubtle,
  label: colors.muted,
  text: colors.textStrong,
  title: colors.secondary,
  thBackground: colors.surfaceBrandSoft,
};

export default function AdminReportsScreen() {
  const { compactPhone } = useResponsiveLayout();
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [screenError, setScreenError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isExportVisible, setIsExportVisible] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState<ReportExportFormat>('excel');
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

  const { categoryPerformance, chartSeries, insightCards, paymentDistribution, reportMetrics, totals } =
    useReportsAnalytics({
      formatPeso,
      normalizeNumber,
      products,
      reportMonthRange,
      sales,
    });

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

  function downloadWebFile(content: string, fileName: string, mimeType: string) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('Web download is not available in this environment.');
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }

  async function shareFile(
    uri: string,
    fileName: string,
    mimeType: string,
    dialogTitle: string,
    uti?: string
  ) {
    await shareExportFile(uri, { dialogTitle, fileName, mimeType, uti });
  }

  async function exportExcelReport() {
    const rangeLabel = formatMonthRangeLabel(reportMonthRange);
    const lines = [
      [escapeCsvValue('GDC Inventory Pro Reports Summary')],
      [escapeCsvValue(`Range: ${rangeLabel}`)],
      [escapeCsvValue(`Generated: ${formatDateTime(new Date().toISOString())}`)],
      [],
      [escapeCsvValue('Summary')],
      [escapeCsvValue('Discounts Given'), escapeCsvValue(formatExportAmount(totals.discounts))],
      [escapeCsvValue('Items Sold'), escapeCsvValue(totals.itemsSold)],
      [escapeCsvValue('Average Basket'), escapeCsvValue(totals.averageBasket.toFixed(1))],
      [escapeCsvValue('Active Categories'), escapeCsvValue(totals.activeCategories)],
      [],
      [escapeCsvValue('Payment Method'), escapeCsvValue('Total'), escapeCsvValue('Share')],
      ...paymentDistribution.map((payment) =>
        [payment.label, formatExportAmount(payment.amount), payment.percentageText].map(escapeCsvValue)
      ),
      [],
      [escapeCsvValue('Category'), escapeCsvValue('Catalog Coverage')],
      ...categoryPerformance.map((category) =>
        [category.label, `${category.percentage}%`].map(escapeCsvValue)
      ),
    ];
    const csvContent = lines.map((line) => line.join(',')).join('\n');
    const fileName = `gdc-reports-summary-${formatMonthRangeForFilename(reportMonthRange)}.csv`;

    if (Platform.OS === 'web') {
      downloadWebFile(csvContent, fileName, 'text/csv;charset=utf-8;');
      return;
    }

    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    await shareFile(
      fileUri,
      fileName,
      'text/csv',
      'Share Excel Report',
      'public.comma-separated-values-text'
    );
  }

  async function handleExportReport() {
    if (selectedExportFormat === 'pdf') {
      await handleExportPdf();
      return;
    }

    try {
      setIsExporting(true);
      setScreenError('');
      await exportExcelReport();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not export the report right now.';
      setScreenError(message);
      Alert.alert('Export failed', message);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleExportPdf() {
    try {
      setIsExporting(true);
      setScreenError('');

      const logoDataUri = await getLogoDataUri();
      const rangeLabel = formatMonthRangeLabel(reportMonthRange);
      const generatedAt = formatDateTime(new Date().toISOString());
      const fileName = `gdc-reports-summary-${formatMonthRangeForFilename(reportMonthRange)}.pdf`;
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
                    <td>${escapeHtml(formatExportAmount(payment.amount))}</td>
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
                color: ${pdfColors.text};
                padding: 24px;
              }
              .header {
                align-items: center;
                border-bottom: 2px solid ${pdfColors.border};
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
                color: ${pdfColors.title};
                font-size: 24px;
                font-weight: 700;
                margin: 0;
              }
              .subtitle {
                color: ${colors.textSecondary};
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
                background: ${pdfColors.box};
                border: 1px solid ${pdfColors.border};
                border-radius: 14px;
                box-sizing: border-box;
                min-width: 220px;
                padding: 14px 16px;
                width: calc(50% - 6px);
              }
              .summary-label {
                color: ${pdfColors.label};
                font-size: 11px;
                letter-spacing: 1px;
                margin: 0 0 8px;
                text-transform: uppercase;
              }
              .summary-value {
                color: ${pdfColors.title};
                font-size: 22px;
                font-weight: 700;
                margin: 0;
              }
              h2 {
                color: ${pdfColors.title};
                font-size: 18px;
                margin: 28px 0 12px;
              }
              table {
                border-collapse: collapse;
                width: 100%;
              }
              th, td {
                border: 1px solid ${pdfColors.border};
                font-size: 11px;
                padding: 8px 10px;
                text-align: left;
              }
              th {
                background: ${pdfColors.thBackground};
                color: ${pdfColors.title};
              }
              .insight-grid {
                display: flex;
                gap: 12px;
                margin-top: 18px;
              }
              .insight-box {
                background: ${pdfColors.box};
                border: 1px solid ${pdfColors.border};
                border-radius: 14px;
                flex: 1;
                padding: 14px 16px;
              }
              .insight-label {
                color: ${pdfColors.label};
                font-size: 11px;
                letter-spacing: 1px;
                margin: 0 0 6px;
                text-transform: uppercase;
              }
              .insight-value {
                color: ${pdfColors.text};
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
                <p class="summary-value">${escapeHtml(formatExportAmount(totals.discounts))}</p>
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
        await downloadWebPdfReport({
          fileName,
          title: 'Admin Reports',
          subtitle: 'GDC Inventory Pro',
          metadata: [
            { label: 'Month Range', value: rangeLabel },
            { label: 'Generated', value: generatedAt },
          ],
          summary: [
            { label: 'Discounts Given', value: formatExportAmount(totals.discounts) },
            { label: 'Items Sold', value: String(totals.itemsSold) },
            { label: 'Average Basket', value: totals.averageBasket.toFixed(1) },
            { label: 'Active Categories', value: String(totals.activeCategories) },
          ],
          tables: [
            {
              headers: ['Payment Method', 'Total', 'Share'],
              rows: paymentDistribution.map((payment) => [
                payment.label,
                formatExportAmount(payment.amount),
                payment.percentageText,
              ]),
              title: 'Payment Distribution',
            },
            {
              emptyText: 'No category coverage data available.',
              headers: ['Category', 'Coverage'],
              rows: categoryPerformance.map((category) => [
                category.label,
                `${category.percentage}%`,
              ]),
              title: 'Catalog Category Coverage',
            },
          ],
          footer: 'Prepared by GDC Inventory Pro',
        });
        return;
      }

      const { uri } = await Print.printToFileAsync({ html });
      await shareFile(uri, fileName, 'application/pdf', 'Share PDF Report', 'com.adobe.pdf');
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
      bottomNavItems={reportTabs}>
      <SurfaceCard style={[styles.rangeCard, compactPhone && styles.rangeCardCompact]}>
        <View style={[styles.rangeCardHeader, compactPhone && styles.rangeCardHeaderCompact]}>
          <View style={styles.rangeTextBlock}>
            <Text style={styles.rangeLabel}>Reports Month Range</Text>
            <Text style={styles.rangeValue}>{formatMonthRangeLabel(reportMonthRange)}</Text>
            <Text style={styles.rangeHelp}>
              Filter all report metrics, trends, and insights by a selected month span.
            </Text>
          </View>

          <View style={[styles.rangeActionsBlock, compactPhone && styles.rangeActionsBlockCompact]}>
            <Pressable
              disabled={isExporting}
              onPress={() => setIsExportVisible((current) => !current)}
              style={[
                styles.toolbarIconButton,
                compactPhone && styles.toolbarIconButtonCompact,
                isExporting && styles.toolbarIconButtonDisabled,
              ]}>
              <Download color={colors.secondary} size={18} strokeWidth={2} />
            </Pressable>

            <Pressable
              onPress={() => setShowRangePicker((current) => !current)}
              style={[styles.calendarButton, compactPhone && styles.calendarButtonCompact]}>
              <CalendarDays color={colors.secondary} size={16} strokeWidth={2} />
              <Text style={styles.calendarButtonText}>
                {showRangePicker ? 'Hide Calendar' : 'Choose Range'}
              </Text>
            </Pressable>
          </View>
        </View>

        {showRangePicker ? (
          <View>
            <MonthRangePicker
              displayYear={calendarYear}
              onChangeRange={setReportMonthRange}
              onChangeYear={setCalendarYear}
              range={reportMonthRange}
            />

            <View style={[styles.rangeActions, compactPhone && styles.rangeActionsCompact]}>
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

      {isExportVisible ? (
        <ReportExportOptions
          format={selectedExportFormat}
          isExporting={isExporting}
          onExport={handleExportReport}
          onFormatChange={setSelectedExportFormat}
        />
      ) : null}

      <View style={isExportVisible ? styles.metricsAfterExport : undefined}>
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
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Monthly Report Trend</Text>
      </View>

      <SurfaceCard style={[styles.analyticsCard, compactPhone && styles.analyticsCardCompact]}>
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

      <Text style={styles.sectionTitle}>
        {categoryPerformance.length > 0 && !categoryPerformance[0].isFallback
          ? 'Sales by Category'
          : 'Catalog Category Coverage'}
      </Text>
      <SurfaceCard style={styles.performanceCard}>
        {categoryPerformance.length > 0 ? (
          categoryPerformance.map((category) => (
            <CategoryPerformanceRow key={category.label} {...category} />
          ))
        ) : (
          <Text style={styles.emptyStateText}>No sales data for the selected period.</Text>
        )}
      </SurfaceCard>

      <Text style={styles.sectionTitle}>Payment Distribution</Text>
      <SurfaceCard style={styles.paymentCard}>
        {paymentDistribution.map((payment) => (
          <PaymentDistributionRow key={payment.label} {...payment} icon={CreditCard} />
        ))}
      </SurfaceCard>

      {screenError ? <Text style={styles.screenErrorText}>{screenError}</Text> : null}
    </AdminPageScreen>
  );
}

const styles = StyleSheet.create({
  toolbarIconButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceInfo,
    borderColor: colors.borderInfoStrong,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  toolbarIconButtonCompact: {
    alignSelf: 'stretch',
    width: '100%',
  },
  toolbarIconButtonDisabled: {
    opacity: 0.52,
  },
  rangeCard: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.borderPanel,
    marginBottom: layout.cardGap + spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  rangeCardCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rangeCardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  rangeCardHeaderCompact: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  rangeActionsBlock: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  rangeActionsBlockCompact: {
    alignSelf: 'stretch',
    width: '100%',
  },
  rangeTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  rangeLabel: {
    color: colors.textTertiary,
    ...textRoles.label,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  rangeValue: {
    color: colors.textStrong,
    ...textRoles.value,
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 4,
  },
  rangeHelp: {
    color: colors.textSecondary,
    ...textRoles.body,
    fontSize: 14,
    lineHeight: 21,
  },
  calendarButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceBrandSoft,
    borderColor: colors.borderInfoStrong,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  calendarButtonCompact: {
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: spacing.md,
    width: '100%',
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
  rangeActionsCompact: {
    flexWrap: 'wrap',
  },
  rangeActionButton: {
    backgroundColor: colors.surfaceNeutral,
    borderColor: colors.borderMuted,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rangeActionText: {
    color: colors.textHeading,
    ...textRoles.label,
  },
  metricsAfterExport: {
    marginTop: layout.cardGap,
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.block,
  },
  sectionTitle: {
    color: colors.textStrong,
    ...textRoles.value,
    fontSize: textSizes.large,
  },
  analyticsCard: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  analyticsCardCompact: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
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
    color: colors.textSecondary,
    ...textRoles.label,
  },
  sectionEyebrow: {
    color: colors.textSubtle,
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
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  heroInsightLabel: {
    color: colors.textOnSecondaryMuted,
    ...textRoles.label,
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  heroInsightValue: {
    color: colors.textInverse,
    ...textRoles.heading,
    fontSize: 30,
    marginBottom: 6,
  },
  heroInsightCopy: {
    color: colors.textOnSecondaryMuted,
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
    backgroundColor: colors.tertiary,
    borderColor: colors.dangerAccent,
  },
  insightTileSoft: {
    backgroundColor: colors.surfaceNeutral,
    borderColor: colors.borderMuted,
  },
  insightTileLabel: {
    color: colors.borderDanger,
    ...textRoles.label,
    marginBottom: 8,
  },
  insightTileLabelSoft: {
    color: colors.textSubtle,
    ...textRoles.label,
    marginBottom: 8,
  },
  insightTileValueLight: {
    color: colors.textInverse,
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
    color: colors.textSecondary,
    ...textRoles.body,
    fontSize: 15,
    lineHeight: 22,
  },
  screenErrorText: {
    color: colors.dangerStrong,
    ...textRoles.label,
    fontSize: 13,
    marginTop: spacing.md,
  },
});
