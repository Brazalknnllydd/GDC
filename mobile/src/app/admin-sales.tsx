import { useEffect, useMemo, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarDays, Download, History, QrCode, WalletCards, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';

import {
  MonthRangePicker,
  type MonthRangeValue,
} from '../components/admin-sales/month-range-picker';
import { PaymentMethodCard } from '../components/admin-sales/payment-method-card';
import { SalesSummaryCard } from '../components/admin-sales/sales-summary-card';
import { TopProductRow } from '../components/admin-sales/top-product-row';
import { AdminBarChart } from '../components/ui/admin-bar-chart';
import { AppButton } from '../components/ui/app-button';
import { layout, radius, spacing } from '../constants/design-system';
import { AdminMetricGrid } from '../components/ui/admin-metric-grid';
import { AdminPageScreen } from '../components/ui/admin-page-screen';
import { PaginationControls } from '../components/ui/pagination-controls';
import { SurfaceCard } from '../components/ui/surface-card';
import { colors, fonts, textRoles, textSizes } from '../constants/theme';
import { useResponsiveLayout } from '../hooks/use-responsive-layout';
import { apiClient } from '../lib/api';
import { formatExportAmount, formatPeso, normalizeNumber } from '../lib/product-utils';
import { shareExportFile } from '../lib/export-file';
import { tabs as productTabs } from '../components/admin-products/products-screen-data';

type CustomerRef = {
  name: string;
} | null;

type SaleItem = {
  id?: number;
  price?: number | string;
  quantity: number;
  subtotal: number | string;
  product?: {
    costPrice?: number | string;
    name: string;
  };
};

type SaleRecord = {
  id: number;
  receiptNumber: string;
  totalAmount: number | string;
  subtotal?: number | string;
  discountAmount?: number | string;
  amountPaid: number | string;
  changeAmount: number | string;
  paymentMethod: string;
  status?: string;
  user?: {
    name: string;
  } | null;
  customer?: CustomerRef;
  createdAt: string;
  items: SaleItem[];
};

type HistoryFilter = 'All' | 'Cash' | 'GCash';
type ExportRow = {
  cashierName: string;
  customerName: string;
  lineTotal: number;
  paymentMethod: string;
  productName: string;
  quantity: number;
  receiptNumber: string;
  soldAt: string;
  totalSaleAmount: number;
  unitPrice: number;
};
type HistoryEntry = {
  id: string;
  cashierName: string;
  dateSold: string;
  price: string;
  productName: string;
};
type ExportFormat = 'excel' | 'pdf';



function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatExportDate(value: string) {
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

function formatMonthRangeForFilename(range: MonthRangeValue) {
  if (!range.startMonth && !range.endMonth) {
    return 'all-months';
  }

  const parts = [range.startMonth || range.endMonth, range.endMonth || range.startMonth]
    .filter((value): value is Date => Boolean(value))
    .map((value) =>
      value.toLocaleDateString('en-PH', {
        month: 'short',
        year: 'numeric',
      })
    )
    .map((value) => value.replace(/\s+/g, '-').toLowerCase());

  return [...new Set(parts)].join('-to-');
}

function isWithinMonthRange(dateValue: string, range: MonthRangeValue) {
  if (!range.startMonth || !range.endMonth) {
    return true;
  }

  const date = new Date(dateValue);
  const rangeStart = startOfMonth(range.startMonth);
  const rangeEnd = endOfMonth(range.endMonth);

  return date >= rangeStart && date <= rangeEnd;
}

function buildMonthlyChartSeries(sales: SaleRecord[], range: MonthRangeValue) {
  if (!range.startMonth || !range.endMonth) {
    return {
      labels: [],
      values: [],
    };
  }

  const labels: string[] = [];
  const values: number[] = [];
  const cursor = startOfMonth(range.startMonth);
  const endCursor = startOfMonth(range.endMonth);

  while (cursor.getTime() <= endCursor.getTime()) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const label = cursor.toLocaleDateString('en-PH', {
      month: 'short',
      year: range.startMonth.getFullYear() === range.endMonth.getFullYear() ? undefined : '2-digit',
    });

    labels.push(label);
    values.push(
      sales.reduce((sum, sale) => {
        const saleDate = new Date(sale.createdAt);
        return saleDate.getFullYear() === year && saleDate.getMonth() === month
          ? sum + normalizeNumber(sale.totalAmount)
          : sum;
      }, 0)
    );

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return { labels, values };
}

function escapeCsvValue(value: string | number) {
  const stringValue = String(value ?? '');
  return `"${stringValue.replace(/"/g, '""')}"`;
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
  card: colors.surfaceSubtle,
  label: colors.muted,
  text: colors.textStrong,
  title: colors.secondary,
  thBackground: colors.surfaceBrandSoft,
};

export default function AdminSalesScreen() {
  const { compactPhone, isTablet } = useResponsiveLayout();
  const [selectedHistoryFilter, setSelectedHistoryFilter] = useState<HistoryFilter>('All');
  const [selectedExportFormat, setSelectedExportFormat] = useState<ExportFormat>('excel');
  const [isExportVisible, setIsExportVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [showOverviewMonthRangePicker, setShowOverviewMonthRangePicker] = useState(false);
  const [overviewCalendarYear, setOverviewCalendarYear] = useState(new Date().getFullYear());
  const [overviewMonthRange, setOverviewMonthRange] = useState<MonthRangeValue>(() => {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      endMonth: currentMonth,
      startMonth: currentMonth,
    };
  });
  const [showMonthRangePicker, setShowMonthRangePicker] = useState(false);
  const [historyCalendarYear, setHistoryCalendarYear] = useState(new Date().getFullYear());
  const [historyMonthRange, setHistoryMonthRange] = useState<MonthRangeValue>({
    endMonth: null,
    startMonth: null,
  });
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [screenError, setScreenError] = useState('');

  useEffect(() => {
    setHistoryPage(1);
  }, [selectedHistoryFilter, historyMonthRange]);

  useEffect(() => {
    async function loadSales() {
      try {
        setScreenError('');
        const response = await apiClient.get<SaleRecord[]>('/sales');
        setSales(response.data);
      } catch {
        setScreenError('Could not load sales right now.');
      }
    }

    loadSales();
  }, []);

  const filteredSales = useMemo(
    () => sales.filter((sale) => sale.status !== 'voided' && isWithinMonthRange(sale.createdAt, overviewMonthRange)),
    [overviewMonthRange, sales]
  );

  const totals = useMemo(() => {
    const totalSales = filteredSales.reduce(
      (sum, sale) => sum + normalizeNumber(sale.totalAmount),
      0
    );
    const totalCost = filteredSales.reduce(
      (sum, sale) =>
        sum +
        sale.items.reduce(
          (itemSum, item) =>
            itemSum +
            normalizeNumber(item.product?.costPrice) * normalizeNumber(item.quantity),
          0
        ),
      0
    );
    const profit = totalSales - totalCost;
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
    () => buildMonthlyChartSeries(filteredSales, overviewMonthRange),
    [filteredSales, overviewMonthRange]
  );

  const paymentMethodCards = useMemo(() => {
    const methods = [
      { icon: WalletCards, key: 'Cash', label: 'CASH' },
      { icon: QrCode, key: 'GCash', label: 'GCASH' },
    ] as const;

    return methods.map((method) => ({
      icon: method.icon,
      label: method.label,
      value: formatPeso(
        filteredSales
          .filter((sale) => sale.paymentMethod === method.key)
          .reduce((sum, sale) => sum + normalizeNumber(sale.totalAmount), 0)
      ),
    }));
  }, [filteredSales]);


  const topProducts = useMemo(() => {
    const aggregated = new Map<string, { quantity: number; total: number }>();

    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const name = item.product?.name || 'Unnamed Product';
        const current = aggregated.get(name) || { quantity: 0, total: 0 };
        aggregated.set(name, {
          quantity: current.quantity + item.quantity,
          total: current.total + normalizeNumber(item.subtotal),
        });
      });
    });

    return [...aggregated.entries()]
      .map(([name, value]) => ({
        emoji: '📦',
        name,
        soldText: `${value.quantity} unit${value.quantity === 1 ? '' : 's'} sold`,
        total: formatPeso(value.total),
      }))
      .sort((left, right) => Number(right.total.replace(/[^\d.]/g, '')) - Number(left.total.replace(/[^\d.]/g, '')))
      .slice(0, 5);
  }, [filteredSales]);

  const historyTransactions = useMemo(() => {
    const filteredByMethod =
      selectedHistoryFilter === 'All'
        ? sales
        : sales.filter((sale) => sale.paymentMethod === selectedHistoryFilter);

    return filteredByMethod
      .filter((sale) => isWithinMonthRange(sale.createdAt, historyMonthRange))
      .slice()
      .sort((left, right) => {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      });
  }, [sales, historyMonthRange, selectedHistoryFilter]);

  const itemsPerPage = 10;
  const totalHistoryPages = Math.ceil(historyTransactions.length / itemsPerPage) || 1;
  const paginatedHistoryTransactions = useMemo(() => {
    const start = (historyPage - 1) * itemsPerPage;
    return historyTransactions.slice(start, start + itemsPerPage);
  }, [historyTransactions, historyPage]);

  const historyEntries = useMemo<HistoryEntry[]>(() => {
    return historyTransactions.flatMap((sale) =>
      sale.items.map((item, index) => ({
        id: `${sale.id}-${item.id ?? index}`,
        cashierName: sale.user?.name || 'Cashier',
        dateSold: formatDateTime(sale.createdAt),
        price: formatPeso(normalizeNumber(item.price ?? item.subtotal)),
        productName: item.product?.name || 'Unnamed Product',
      }))
    );
  }, [historyTransactions]);

  const exportRows = useMemo<ExportRow[]>(() => {
    return filteredSales.flatMap((sale) =>
      sale.items.map((item, index) => ({
        cashierName: sale.user?.name || 'Cashier',
        customerName: sale.customer?.name || 'Walk-in',
        lineTotal: normalizeNumber(item.subtotal),
        paymentMethod: sale.paymentMethod,
        productName: item.product?.name || `Item ${index + 1}`,
        quantity: normalizeNumber(item.quantity),
        receiptNumber: sale.receiptNumber,
        soldAt: formatExportDate(sale.createdAt),
        totalSaleAmount: normalizeNumber(sale.totalAmount),
        unitPrice: normalizeNumber(item.price ?? item.subtotal),
      }))
    );
  }, [filteredSales]);

  const paymentSummary = useMemo(
    () => ({
      cash: filteredSales
        .filter((sale) => sale.paymentMethod === 'Cash')
        .reduce((sum, sale) => sum + normalizeNumber(sale.totalAmount), 0),
      gcash: filteredSales
        .filter((sale) => sale.paymentMethod === 'GCash')
        .reduce((sum, sale) => sum + normalizeNumber(sale.totalAmount), 0),
    }),
    [filteredSales]
  );

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
    setTimeout(() => {
      reportWindow.print();
    }, 400);
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
    const fileName = `gdc-sales-report-${formatMonthRangeForFilename(overviewMonthRange)}.csv`;
    const rangeLabel = formatMonthRangeLabel(overviewMonthRange);
    const lines = [
      [escapeCsvValue('GDC Inventory Pro Sales Report')],
      [escapeCsvValue(`Range: ${rangeLabel}`)],
      [escapeCsvValue(`Generated: ${formatExportDate(new Date().toISOString())}`)],
      [],
      [escapeCsvValue('Summary')],
      [escapeCsvValue('Total Sales'), escapeCsvValue(formatExportAmount(totals.totalSales))],
      [escapeCsvValue('Profit'), escapeCsvValue(formatExportAmount(totals.profit))],
      [escapeCsvValue('Transactions'), escapeCsvValue(totals.transactions)],
      [escapeCsvValue('Average Sale'), escapeCsvValue(formatExportAmount(totals.averageSale))],
      [escapeCsvValue('Cash Sales'), escapeCsvValue(formatExportAmount(paymentSummary.cash))],
      [escapeCsvValue('GCash Sales'), escapeCsvValue(formatExportAmount(paymentSummary.gcash))],
      [],
      [
        'Receipt No.',
        'Date Sold',
        'Cashier',
        'Customer',
        'Payment Method',
        'Product',
        'Quantity',
        'Unit Price',
        'Line Total',
        'Sale Total',
      ].map(escapeCsvValue),
      ...exportRows.map((row) =>
        [
          row.receiptNumber,
          row.soldAt,
          row.cashierName,
          row.customerName,
          row.paymentMethod,
          row.productName,
          row.quantity,
          formatExportAmount(row.unitPrice),
          formatExportAmount(row.lineTotal),
          formatExportAmount(row.totalSaleAmount),
        ].map(escapeCsvValue)
      ),
    ];
    const csvContent = lines.map((line) => line.join(',')).join('\n');

    if (Platform.OS === 'web') {
      downloadWebFile(csvContent, fileName, 'text/csv;charset=utf-8;');
      return;
    }

    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(
      fileUri,
      csvContent,
      { encoding: FileSystem.EncodingType.UTF8 }
    );

    await shareFile(
      fileUri,
      fileName,
      'text/csv',
      'Share Excel Report',
      'public.comma-separated-values-text'
    );
  }

  async function exportPdfReport() {
    const logoDataUri = await getLogoDataUri();
    const rangeLabel = formatMonthRangeLabel(overviewMonthRange);
    const generatedAt = formatExportDate(new Date().toISOString());
    const topProductMarkup =
      topProducts.length > 0
        ? topProducts
            .map(
              (product) => `
                <tr>
                  <td>${escapeHtml(product.name)}</td>
                  <td>${escapeHtml(product.soldText)}</td>
                  <td>${escapeHtml(formatExportAmount(product.total))}</td>
                </tr>
              `
            )
            .join('')
        : `
          <tr>
            <td colspan="3">No top-selling products for this range.</td>
          </tr>
        `;
    const salesRowsMarkup =
      exportRows.length > 0
        ? exportRows
            .map(
              (row) => `
                <tr>
                  <td>${escapeHtml(row.receiptNumber)}</td>
                  <td>${escapeHtml(row.soldAt)}</td>
                  <td>${escapeHtml(row.cashierName)}</td>
                  <td>${escapeHtml(row.customerName)}</td>
                  <td>${escapeHtml(row.paymentMethod)}</td>
                  <td>${escapeHtml(row.productName)}</td>
                  <td>${escapeHtml(row.quantity)}</td>
                  <td>${escapeHtml(formatExportAmount(row.unitPrice))}</td>
                  <td>${escapeHtml(formatExportAmount(row.lineTotal))}</td>
                </tr>
              `
            )
            .join('')
        : `
          <tr>
            <td colspan="9">No sales data available for this range.</td>
          </tr>
        `;

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>GDC Sales Report</title>
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
            .brand-title {
              color: ${pdfColors.title};
              font-size: 24px;
              font-weight: 700;
              margin: 0;
            }
            .brand-subtitle {
              color: ${colors.textSecondary};
              font-size: 12px;
              letter-spacing: 2px;
              margin: 4px 0 0;
              text-transform: uppercase;
            }
            .meta {
              margin-top: 22px;
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
              background: ${pdfColors.card};
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
              margin-top: 8px;
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
            .footer {
              color: ${pdfColors.label};
              font-size: 10px;
              margin-top: 24px;
              text-align: right;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img class="logo" src="${logoDataUri}" />
            <div>
              <p class="brand-title">Sales Report</p>
              <p class="brand-subtitle">GDC Inventory Pro</p>
            </div>
          </div>

          <div class="meta">
            <p><strong>Range:</strong> ${escapeHtml(rangeLabel)}</p>
            <p><strong>Generated:</strong> ${escapeHtml(generatedAt)}</p>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <p class="summary-label">Total Sales</p>
              <p class="summary-value">${escapeHtml(formatExportAmount(totals.totalSales))}</p>
            </div>
            <div class="summary-card">
              <p class="summary-label">Profit</p>
              <p class="summary-value">${escapeHtml(formatExportAmount(totals.profit))}</p>
            </div>
            <div class="summary-card">
              <p class="summary-label">Transactions</p>
              <p class="summary-value">${escapeHtml(totals.transactions)}</p>
            </div>
            <div class="summary-card">
              <p class="summary-label">Average Sale</p>
              <p class="summary-value">${escapeHtml(formatExportAmount(totals.averageSale))}</p>
            </div>
          </div>

          <h2>Payment Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Payment Method</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cash</td>
                <td>${escapeHtml(formatExportAmount(paymentSummary.cash))}</td>
              </tr>
              <tr>
                <td>GCash</td>
                <td>${escapeHtml(formatExportAmount(paymentSummary.gcash))}</td>
              </tr>
            </tbody>
          </table>

          <h2>Top Selling Products</h2>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Units Sold</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${topProductMarkup}
            </tbody>
          </table>

          <h2>Detailed Sales</h2>
          <table>
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Date Sold</th>
                <th>Cashier</th>
                <th>Customer</th>
                <th>Payment</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              ${salesRowsMarkup}
            </tbody>
          </table>

          <p class="footer">Prepared by GDC Inventory Pro</p>
        </body>
      </html>
    `;

    if (Platform.OS === 'web') {
      openPrintableWebReport(html);
      return;
    }

    const { uri } = await Print.printToFileAsync({ html });
    await shareFile(uri, fileName, 'application/pdf', 'Share PDF Report', 'com.adobe.pdf');
  }

  async function handleExportReport() {
    try {
      setIsExporting(true);
      setScreenError('');

      if (selectedExportFormat === 'excel') {
        await exportExcelReport();
      } else {
        await exportPdfReport();
      }
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
      title="Sales"
      introDescription="Monitor transactions, revenue, and business performance"
      bottomNavItems={salesTabs}
      introChildren={
        <View style={styles.dateRow}>
          <CalendarDays color={colors.textTertiary} size={15} strokeWidth={1.9} />
          <Text style={styles.dateText}>{displayDate}</Text>
        </View>
      }>
      <SurfaceCard style={[styles.overviewFilterCard, compactPhone && styles.overviewFilterCardCompact]}>
        <View style={[styles.historyRangeHeader, compactPhone && styles.historyRangeHeaderCompact]}>
          <View style={styles.rangeTextBlock}>
            <Text style={styles.historyRangeLabel}>Overview Month Range</Text>
            <Text style={styles.historyRangeValue}>{formatMonthRangeLabel(overviewMonthRange)}</Text>
          </View>

          <Pressable
            onPress={() => setShowOverviewMonthRangePicker((current) => !current)}
            style={[styles.historyCalendarButton, compactPhone && styles.historyCalendarButtonCompact]}>
            <CalendarDays color={colors.secondary} size={16} strokeWidth={2} />
            <Text style={styles.historyCalendarButtonText}>
              {showOverviewMonthRangePicker ? 'Hide Calendar' : 'Choose Range'}
            </Text>
          </Pressable>
        </View>

        {showOverviewMonthRangePicker ? (
          <View>
            <MonthRangePicker
              displayYear={overviewCalendarYear}
              onChangeRange={setOverviewMonthRange}
              onChangeYear={setOverviewCalendarYear}
              range={overviewMonthRange}
            />

            <View style={[styles.historyRangeActions, compactPhone && styles.historyRangeActionsCompact]}>
              <Pressable
                onPress={() => {
                  const now = new Date();
                  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                  setOverviewMonthRange({
                    endMonth: currentMonth,
                    startMonth: currentMonth,
                  });
                  setOverviewCalendarYear(now.getFullYear());
                }}
                style={styles.historyRangeActionButton}>
                <Text style={styles.historyRangeActionText}>This Month</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  const now = new Date();
                  const startMonth = new Date(now.getFullYear(), 0, 1);
                  const endMonth = new Date(now.getFullYear(), 11, 1);
                  setOverviewMonthRange({
                    endMonth,
                    startMonth,
                  });
                  setOverviewCalendarYear(now.getFullYear());
                }}
                style={styles.historyRangeActionButton}>
                <Text style={styles.historyRangeActionText}>This Year</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </SurfaceCard>

      <AdminMetricGrid>
        <SalesSummaryCard title="TOTAL SALES" value={formatPeso(totals.totalSales)} detail={`${totals.transactions} transactions`} />
        <SalesSummaryCard title="PROFIT" value={formatPeso(totals.profit)} detail="Sales minus product cost" />
        <SalesSummaryCard title="TRANSACTIONS" value={String(totals.transactions)} detail="Completed sales" />
        <SalesSummaryCard title="AVG SALE" value={formatPeso(totals.averageSale)} detail="Average per sale" />
      </AdminMetricGrid>

      <SurfaceCard style={[styles.analyticsCard, compactPhone && styles.analyticsCardCompact]}>
        <View style={styles.analyticsHeader}>
          <View>
            <Text style={styles.analyticsTitle}>Revenue Analytics</Text>
            <Text style={styles.analyticsSubtitle}>Monthly view based on selected month range</Text>
            <Text style={styles.analyticsRangeLabel}>{formatMonthRangeLabel(overviewMonthRange)}</Text>
          </View>
        </View>

        <AdminBarChart
          emptyDescription="Select a month range that includes completed sales to populate the chart."
          emptyTitle="No revenue for this range"
          height={240}
          labels={chartBars.labels}
          values={chartBars.values}
        />
      </SurfaceCard>

      <View style={styles.paymentMethodsRow}>
        {paymentMethodCards.map((card) => (
          <PaymentMethodCard key={card.label} icon={card.icon} label={card.label} value={card.value} />
        ))}
      </View>

      <SurfaceCard style={styles.listCard}>
        <Text style={styles.cardHeading}>Top Selling Products</Text>
        <View style={styles.cardList}>
          {topProducts.length > 0 ? (
            topProducts.map((product, index) => (
              <View key={product.name}>
                <TopProductRow {...product} />
                {index < topProducts.length - 1 ? <View style={styles.separator} /> : null}
              </View>
            ))
          ) : (
            <Text style={styles.emptyStateText}>Top products will appear once items are sold.</Text>
          )}
        </View>
      </SurfaceCard>

      <View style={[styles.footerActions, compactPhone && styles.footerActionsCompact]}>
        <AppButton
          icon={({ color, size }) => <Download color={color} size={size} strokeWidth={2.1} />}
          label="Export Report"
          variant="primary"
          onPress={() => {
            setIsExportVisible((current) => !current);
          }}
        />
      </View>

      <SurfaceCard style={[styles.historyCard, compactPhone && styles.historyCardCompact]}>
        <View style={styles.historyHeader}>
          <View style={styles.rangeTextBlock}>
            <Text style={styles.cardHeading}>Sales History</Text>
            <Text style={styles.historySubtitle}>
              See which cashier sold which product, the price, and the date sold.
            </Text>
          </View>
          <View style={styles.historyBadge}>
            <Text style={styles.historyBadgeText}>{historyEntries.length} items</Text>
          </View>
        </View>

        <View style={[styles.historyRangeHeader, compactPhone && styles.historyRangeHeaderCompact]}>
          <View style={styles.rangeTextBlock}>
            <Text style={styles.historyRangeLabel}>Month Range</Text>
            <Text style={styles.historyRangeValue}>{formatMonthRangeLabel(historyMonthRange)}</Text>
          </View>

          <Pressable
            onPress={() => setShowMonthRangePicker((current) => !current)}
            style={[styles.historyCalendarButton, compactPhone && styles.historyCalendarButtonCompact]}>
            <CalendarDays color={colors.secondary} size={16} strokeWidth={2} />
            <Text style={styles.historyCalendarButtonText}>
              {showMonthRangePicker ? 'Hide Calendar' : 'Choose Range'}
            </Text>
          </Pressable>
        </View>

        {showMonthRangePicker ? (
          <View>
            <MonthRangePicker
              displayYear={historyCalendarYear}
              onChangeRange={setHistoryMonthRange}
              onChangeYear={setHistoryCalendarYear}
              range={historyMonthRange}
            />

            <View style={[styles.historyRangeActions, compactPhone && styles.historyRangeActionsCompact]}>
              <Pressable
                onPress={() => {
                  const now = new Date();
                  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                  setHistoryMonthRange({
                    endMonth: currentMonth,
                    startMonth: currentMonth,
                  });
                  setHistoryCalendarYear(now.getFullYear());
                }}
                style={styles.historyRangeActionButton}>
                <Text style={styles.historyRangeActionText}>This Month</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setHistoryMonthRange({ endMonth: null, startMonth: null });
                  setHistoryCalendarYear(new Date().getFullYear());
                }}
                style={styles.historyRangeActionButton}>
                <Text style={styles.historyRangeActionText}>Clear</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.historyFilterRow}>
          {(['All', 'Cash', 'GCash'] as const).map((filter) => (
            <Pressable
              key={filter}
              onPress={() => setSelectedHistoryFilter(filter)}
              style={[
                styles.historyFilterChip,
                selectedHistoryFilter === filter && styles.historyFilterChipActive,
              ]}>
              <Text
                style={[
                  styles.historyFilterText,
                  selectedHistoryFilter === filter && styles.historyFilterTextActive,
                ]}>
                {filter}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={{ minWidth: '100%' }}
        >
          <View style={[styles.table, { minWidth: '100%' }]}>
            {/* Table Header */}
            <View style={[styles.tableHeader, isTablet && styles.tableHeaderTablet]}>
              <Text style={[styles.tableHeaderCell, isTablet && styles.tableHeaderCellTablet, { flex: 1.2, minWidth: 82 }]}>RECEIPT NO</Text>
              <Text style={[styles.tableHeaderCell, isTablet && styles.tableHeaderCellTablet, { flex: 1.6, minWidth: 112 }]}>DATE SOLD</Text>
              <Text style={[styles.tableHeaderCell, isTablet && styles.tableHeaderCellTablet, { flex: 1.3, minWidth: 86 }]}>CASHIER</Text>
              <Text style={[styles.tableHeaderCell, isTablet && styles.tableHeaderCellTablet, { flex: 1.3, minWidth: 86 }]}>CUSTOMER</Text>
              <Text style={[styles.tableHeaderCell, isTablet && styles.tableHeaderCellTablet, { flex: 1, minWidth: 64 }]}>PAYMENT</Text>
              <Text style={[styles.tableHeaderCell, isTablet && styles.tableHeaderCellTablet, { flex: 1.1, minWidth: 76, textAlign: 'right' }]}>TOTAL</Text>
            </View>

            {/* Table Rows */}
            <View style={styles.tableRows}>
              {paginatedHistoryTransactions.length > 0 ? (
                paginatedHistoryTransactions.map((sale) => (
                  <View key={sale.id} style={[styles.tableRow, isTablet && styles.tableRowTablet]}>
                    <Text style={[styles.tableCell, isTablet && styles.tableCellTablet, { flex: 1.2, minWidth: 82, fontFamily: fonts.semiBold, color: colors.textStrong }]}>
                      {sale.receiptNumber}
                    </Text>
                    <Text style={[styles.tableCell, isTablet && styles.tableCellTablet, { flex: 1.6, minWidth: 112 }]}>
                      {formatDateTime(sale.createdAt)}
                    </Text>
                    <Text style={[styles.tableCell, isTablet && styles.tableCellTablet, { flex: 1.3, minWidth: 86 }]}>
                      {sale.user?.name || 'Cashier'}
                    </Text>
                    <Text style={[styles.tableCell, isTablet && styles.tableCellTablet, { flex: 1.3, minWidth: 86, color: sale.customer ? colors.textSecondary : colors.textSubtle }]}>
                      {sale.customer?.name || 'Walk-in'}
                    </Text>
                    <Text style={[styles.tableCell, isTablet && styles.tableCellTablet, { flex: 1, minWidth: 64, color: sale.status === 'voided' ? colors.danger : undefined }]}>
                      {sale.paymentMethod}
                      {sale.status === 'voided' ? '\n(Voided)' : ''}
                    </Text>
                    <Text style={[styles.tableCell, isTablet && styles.tableCellTablet, { flex: 1.1, minWidth: 76, textAlign: 'right', fontFamily: fonts.semiBold, color: sale.status === 'voided' ? colors.textTertiary : colors.textStrong, textDecorationLine: sale.status === 'voided' ? 'line-through' : 'none' }]}>
                      {formatPeso(normalizeNumber(sale.totalAmount))}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyTableRow}>
                  <Text style={styles.emptyStateText}>No history found for this filter.</Text>
                </View>
              )}
            </View>

            {/* Table Footer Pagination */}
            <View style={styles.tableFooter}>
              <PaginationControls
                borderless
                currentPage={historyPage - 1}
                endItem={Math.min(historyPage * itemsPerPage, historyTransactions.length)}
                onPageChange={(page) => setHistoryPage(page + 1)}
                startItem={(historyPage - 1) * itemsPerPage + 1}
                totalItems={historyTransactions.length}
                totalPages={totalHistoryPages}
                visiblePageNumbers={Array.from({ length: Math.min(5, totalHistoryPages) }, (_, i) => i)}
              />
            </View>
          </View>
        </ScrollView>
      </SurfaceCard>

      {isExportVisible ? (
        <SurfaceCard style={styles.exportCard}>
          <Text style={styles.cardHeading}>Export Report</Text>
          <Text style={styles.exportSubtitle}>
            Excel is best for filtering and accounting. PDF is best for printing and sharing.
          </Text>

          <View style={styles.exportOptionsColumn}>
            <Pressable
              onPress={() => setSelectedExportFormat('excel')}
              style={[
                styles.exportOption,
                selectedExportFormat === 'excel' && styles.exportOptionActive,
              ]}>
              <View style={styles.exportOptionHeader}>
                <Text style={styles.exportOptionTitle}>Excel Report</Text>
                <View style={styles.recommendedPill}>
                  <Text style={styles.recommendedPillText}>Recommended</Text>
                </View>
              </View>
              <Text style={styles.exportOptionBody}>
                Best for sorting transactions, filtering by cashier or payment method, and monthly accounting.
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedExportFormat('pdf')}
              style={[
                styles.exportOption,
                selectedExportFormat === 'pdf' && styles.exportOptionActive,
              ]}>
              <View style={styles.exportOptionHeader}>
                <Text style={styles.exportOptionTitle}>PDF Report</Text>
              </View>
              <Text style={styles.exportOptionBody}>
                Best for a clean printable summary with totals, top products, and transaction highlights.
              </Text>
            </Pressable>
          </View>

          <AppButton
            label={selectedExportFormat === 'excel' ? 'Export as Excel' : 'Export as PDF'}
            loading={isExporting}
            onPress={handleExportReport}
            variant="primary"
          />
        </SurfaceCard>
      ) : null}

      {screenError ? <Text style={styles.screenErrorText}>{screenError}</Text> : null}
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
    color: colors.textTertiary,
    fontFamily: fonts.medium,
    fontSize: 13,
    marginLeft: 6,
  },
  overviewFilterCard: {
    marginBottom: layout.cardGap + spacing.sm,
    minHeight: 108,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  overviewFilterCardCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  analyticsCard: {
    marginTop: layout.cardGap + spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  analyticsCardCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
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
    fontSize: 21,
    lineHeight: 26,
  },
  analyticsSubtitle: {
    color: colors.textTertiary,
    ...textRoles.label,
    marginTop: spacing.xs,
  },
  analyticsRangeLabel: {
    color: colors.textStrong,
    ...textRoles.value,
    fontSize: 18,
    lineHeight: 26,
    marginTop: spacing.xs,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
    marginTop: layout.cardGap + spacing.sm,
    width: '100%',
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
  cardList: {
    paddingTop: 2,
  },
  separator: {
    backgroundColor: colors.divider,
    height: 1,
    width: '100%',
  },
  footerActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.section,
  },
  footerActionsCompact: {
    flexDirection: 'column',
  },
  historyCard: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  historyCardCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  historyHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  historySubtitle: {
    color: colors.textSecondary,
    ...textRoles.body,
    fontSize: 14,
    maxWidth: '88%',
  },
  historyBadge: {
    backgroundColor: colors.surfaceBrandSoft,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  historyBadgeText: {
    color: colors.secondary,
    ...textRoles.label,
  },
  historyRangeHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  historyRangeHeaderCompact: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  rangeTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  historyRangeLabel: {
    color: colors.muted,
    ...textRoles.label,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  historyRangeValue: {
    color: colors.textStrong,
    ...textRoles.value,
    fontSize: 18,
    lineHeight: 28,
  },
  historyCalendarButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceInfo,
    borderColor: colors.borderInfoStrong,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 148,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  historyCalendarButtonCompact: {
    minHeight: 42,
    minWidth: 0,
    paddingHorizontal: spacing.md,
    width: '100%',
  },
  historyCalendarButtonText: {
    color: colors.secondary,
    ...textRoles.label,
    fontSize: 13,
  },
  historyRangeActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  historyRangeActionsCompact: {
    flexWrap: 'wrap',
  },
  historyRangeActionButton: {
    backgroundColor: colors.surfaceNeutral,
    borderColor: colors.borderMuted,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  historyRangeActionText: {
    color: colors.textHeading,
    ...textRoles.label,
  },
  historyFilterRow: {
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: 2,
  },
  historyFilterChip: {
    backgroundColor: colors.surfaceNeutral,
    borderColor: colors.borderMuted,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  historyFilterChipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  historyFilterText: {
    color: colors.textHeading,
    ...textRoles.label,
  },
  historyFilterTextActive: {
    color: colors.textInverse,
  },
  historyList: {
    paddingTop: 2,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  historyRowMain: {
    flex: 1,
    marginRight: spacing.md,
  },
  historyReceipt: {
    color: colors.textStrong,
    ...textRoles.value,
    marginBottom: 4,
  },
  historyMeta: {
    color: colors.muted,
    ...textRoles.label,
    lineHeight: 18,
    marginBottom: 2,
  },
  historyAmountColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  historyAmount: {
    color: colors.secondary,
    ...textRoles.value,
    marginBottom: 4,
  },
  historyChange: {
    color: colors.muted,
    ...textRoles.label,
  },
  exportCard: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  exportSubtitle: {
    color: colors.textSecondary,
    ...textRoles.body,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  exportOptionsColumn: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  exportOption: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.borderMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  exportOptionActive: {
    backgroundColor: colors.surfaceBrandSoft,
    borderColor: colors.borderInfoStrong,
  },
  exportOptionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  exportOptionTitle: {
    color: colors.textStrong,
    ...textRoles.value,
  },
  exportOptionBody: {
    color: colors.textSecondary,
    ...textRoles.body,
    fontSize: 14,
    lineHeight: 22,
  },
  recommendedPill: {
    backgroundColor: colors.surfaceSuccessMuted,
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  },
  recommendedPillText: {
    color: colors.successBright,
    ...textRoles.label,
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
  table: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  tableHeader: {
    backgroundColor: colors.surfaceSoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderPanel,
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.md,
  },
  tableHeaderTablet: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  tableHeaderCell: {
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: textSizes.xsmall,
    letterSpacing: 0.7,
  },
  tableHeaderCellTablet: {
    fontSize: textSizes.small,
  },
  tableRows: {
    backgroundColor: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm + 1,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderPanel,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    gap: spacing.md,
  },
  tableRowTablet: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  tableCell: {
    color: '#475467',
    fontFamily: fonts.regular,
    fontSize: textSizes.small,
  },
  tableCellTablet: {
    fontSize: textSizes.body,
  },
  emptyTableRow: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  tableFooter: {
    backgroundColor: colors.surfaceSoft,
    borderTopWidth: 1,
    borderTopColor: colors.borderPanel,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
});
