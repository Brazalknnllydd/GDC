import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';

import type { MonthRangeValue } from './month-range-picker';
import {
  formatMonthRangeForFilename,
  formatMonthRangeLabel,
} from './sales-history-utils';
import { colors } from '../../constants/theme';
import { getAssetDataUri } from '../../lib/asset-data-uri';
import { formatExportAmount } from '../../lib/product-utils';
import { shareExportFile } from '../../lib/export-file';
import type {
  ExportRow,
  PaymentSummary,
  SalesTotals,
  TopProduct,
} from '../../hooks/use-sales-analytics';

export type ExportFormat = 'excel' | 'pdf';

type SalesReportExportParams = {
  exportRows: ExportRow[];
  format: ExportFormat;
  formatExportDate: (value: string) => string;
  overviewMonthRange: MonthRangeValue;
  paymentSummary: PaymentSummary;
  topProducts: TopProduct[];
  totals: SalesTotals;
};

const pdfColors = {
  border: colors.borderPanel,
  card: colors.surfaceSubtle,
  label: colors.muted,
  text: colors.textStrong,
  title: colors.secondary,
  thBackground: colors.surfaceBrandSoft,
};

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

async function getLogoDataUri() {
  if (Platform.OS === 'web') {
    return Asset.fromModule(require('../../../assets/images/logo.jpg')).uri;
  }

  return getAssetDataUri(require('../../../assets/images/logo.jpg'));
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

async function exportExcelReport({
  exportRows,
  formatExportDate,
  overviewMonthRange,
  paymentSummary,
  totals,
}: SalesReportExportParams) {
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

function buildPdfReportHtml({
  exportRows,
  formatExportDate,
  logoDataUri,
  overviewMonthRange,
  paymentSummary,
  topProducts,
  totals,
}: SalesReportExportParams & { logoDataUri: string }) {
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

  return `
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
}

async function exportPdfReport(params: SalesReportExportParams) {
  const fileName = `gdc-sales-report-${formatMonthRangeForFilename(params.overviewMonthRange)}.pdf`;
  const logoDataUri = await getLogoDataUri();
  const html = buildPdfReportHtml({ ...params, logoDataUri });

  if (Platform.OS === 'web') {
    openPrintableWebReport(html);
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  await shareFile(uri, fileName, 'application/pdf', 'Share PDF Report', 'com.adobe.pdf');
}

export async function exportSalesReport(params: SalesReportExportParams) {
  if (params.format === 'excel') {
    await exportExcelReport(params);
  } else {
    await exportPdfReport(params);
  }
}
