import * as Print from 'expo-print';
import { Platform } from 'react-native';

import type { Product } from '../components/admin-products/products-screen-data';
import type { CashierDashboardResponse } from '../components/cashier/cashier-screen-data';
import { shareExportFile } from './export-file';
import { formatPaymentMethod } from './cashier-formatters';
import { formatExportAmount, normalizeNumber } from './product-utils';
import { downloadWebPdfReport } from './web-pdf-export';

type CashierDailyReportOptions = {
  cashierName: string;
  dashboard: CashierDashboardResponse;
  products: Product[];
};

type ReportSale = CashierDashboardResponse['recentSales'][number];

const reportColors = {
  border: '#DDE4F3',
  card: '#F8FAFF',
  danger: '#B91C1C',
  label: '#6B7280',
  muted: '#5B6477',
  primary: '#1A237E',
  success: '#047857',
  text: '#131927',
  warning: '#8A5A00',
};

function escapeHtml(value: string | number) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatReportDate(value: Date) {
  return value.toLocaleDateString('en-PH', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatReportDateTime(value: string | Date) {
  return new Date(value).toLocaleString('en-PH', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatFileDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getSaleItemCount(sale: ReportSale) {
  return (sale.items ?? []).reduce((sum, item) => sum + normalizeNumber(item.quantity), 0);
}

function formatSaleItems(sale: ReportSale) {
  const items = sale.items ?? [];

  if (items.length === 0) {
    return 'No item details';
  }

  return items
    .map((item, index) => {
      const productName = item.product?.name || `Item ${index + 1}`;
      const quantity = normalizeNumber(item.quantity);

      return `${productName} x ${quantity}`;
    })
    .join(', ');
}

function getCompletedSales(sales: ReportSale[]) {
  return sales.filter((sale) => sale.status !== 'voided');
}

function getLowStockCount(products: Product[]) {
  return products.filter((product) => product.stock > 0 && product.stock <= 10).length;
}

function getInventoryValue(products: Product[]) {
  return products.reduce(
    (sum, product) => sum + normalizeNumber(product.price) * product.stock,
    0
  );
}

function buildSalesRows(sales: ReportSale[]) {
  if (sales.length === 0) {
    return '<tr><td colspan="8" class="empty">No sales recorded for this cashier today.</td></tr>';
  }

  return sales
    .map((sale) => {
      const isVoided = sale.status === 'voided';
      const statusLabel = sale.status ? sale.status : 'completed';

      return `
        <tr class="${isVoided ? 'muted-row' : ''}">
          <td>${escapeHtml(formatSaleItems(sale))}</td>
          <td>${escapeHtml(formatReportDateTime(sale.createdAt || sale.time))}</td>
          <td>${escapeHtml(sale.customerName || 'Walk-in')}</td>
          <td>${escapeHtml(formatPaymentMethod(sale.paymentMethod))}</td>
          <td>${escapeHtml(getSaleItemCount(sale))}</td>
          <td>${escapeHtml(statusLabel)}</td>
          <td class="amount">${escapeHtml(formatExportAmount(sale.changeAmount))}</td>
          <td class="amount strong">${escapeHtml(formatExportAmount(sale.totalAmount))}</td>
        </tr>
      `;
    })
    .join('');
}

function buildProductRows(products: Product[]) {
  if (products.length === 0) {
    return '<tr><td colspan="6" class="empty">No products available in the cashier inventory.</td></tr>';
  }

  return products
    .slice()
    .sort((left, right) => {
      const categoryCompare = (left.category?.name || '').localeCompare(right.category?.name || '');

      if (categoryCompare !== 0) {
        return categoryCompare;
      }

      return left.name.localeCompare(right.name);
    })
    .map((product) => {
      const stockClass = product.stock === 0 ? 'danger' : product.stock <= 10 ? 'warning' : 'success';
      const unit = product.unit || 'pcs';

      return `
        <tr>
          <td>${escapeHtml(product.name)}</td>
          <td>${escapeHtml(product.category?.name || 'Uncategorized')}</td>
          <td>${escapeHtml(product.barcode || '-')}</td>
          <td class="amount">${escapeHtml(formatExportAmount(product.price))}</td>
          <td class="${stockClass}">${escapeHtml(product.stock)}</td>
          <td>${escapeHtml(unit)}</td>
        </tr>
      `;
    })
    .join('');
}

function buildPaymentRows(paymentBreakdown: CashierDashboardResponse['paymentBreakdown']) {
  if (paymentBreakdown.length === 0) {
    return '<tr><td colspan="2" class="empty">No payment data available.</td></tr>';
  }

  return paymentBreakdown
    .map(
      (payment) => `
        <tr>
          <td>${escapeHtml(formatPaymentMethod(payment.method))}</td>
          <td class="amount strong">${escapeHtml(formatExportAmount(payment.total))}</td>
        </tr>
      `
    )
    .join('');
}

function buildWebPdfTables(dashboard: CashierDashboardResponse, products: Product[]) {
  return [
    {
      title: 'Payment Breakdown',
      headers: ['Payment Method', 'Total'],
      rows: dashboard.paymentBreakdown.map((payment) => [
        formatPaymentMethod(payment.method),
        formatExportAmount(payment.total),
      ]),
      emptyText: 'No payment data available.',
    },
    {
      title: 'All Sales Today',
      headers: ['Items Bought', 'Date/Time', 'Customer', 'Method', 'Items', 'Status', 'Change', 'Total'],
      rows: dashboard.recentSales.map((sale) => [
        formatSaleItems(sale),
        formatReportDateTime(sale.createdAt || sale.time),
        sale.customerName || 'Walk-in',
        formatPaymentMethod(sale.paymentMethod),
        String(getSaleItemCount(sale)),
        sale.status || 'completed',
        formatExportAmount(sale.changeAmount),
        formatExportAmount(sale.totalAmount),
      ]),
      emptyText: 'No sales recorded for this cashier today.',
    },
    {
      title: 'Products Remaining',
      headers: ['Product', 'Category', 'Barcode', 'Price', 'Stock', 'Unit'],
      rows: products
        .slice()
        .sort((left, right) => {
          const categoryCompare = (left.category?.name || '').localeCompare(right.category?.name || '');

          if (categoryCompare !== 0) {
            return categoryCompare;
          }

          return left.name.localeCompare(right.name);
        })
        .map((product) => [
          product.name,
          product.category?.name || 'Uncategorized',
          product.barcode || '-',
          formatExportAmount(product.price),
          String(product.stock),
          product.unit || 'pcs',
        ]),
      emptyText: 'No products available in the cashier inventory.',
    },
  ];
}

function buildCashierDailyReportHtml({
  cashierName,
  dashboard,
  products,
}: CashierDailyReportOptions) {
  const now = new Date();
  const sales = dashboard.recentSales;
  const completedSales = getCompletedSales(sales);
  const totalItems = completedSales.reduce((sum, sale) => sum + getSaleItemCount(sale), 0);

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>GDC Cashier Daily Report</title>
        <style>
          body {
            color: ${reportColors.text};
            font-family: Arial, sans-serif;
            padding: 24px;
          }
          .header {
            align-items: center;
            border-bottom: 2px solid ${reportColors.border};
            display: flex;
            justify-content: space-between;
            padding-bottom: 18px;
          }
          .brand {
            color: ${reportColors.primary};
            font-size: 24px;
            font-weight: 700;
            margin: 0;
          }
          .subtitle {
            color: ${reportColors.label};
            font-size: 11px;
            letter-spacing: 1.5px;
            margin: 6px 0 0;
            text-transform: uppercase;
          }
          .report-date {
            color: ${reportColors.primary};
            font-size: 14px;
            font-weight: 700;
            text-align: right;
          }
          .meta {
            color: ${reportColors.muted};
            display: flex;
            flex-wrap: wrap;
            gap: 8px 24px;
            margin: 16px 0 20px;
          }
          .meta p {
            margin: 0;
          }
          .summary-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 22px;
          }
          .summary-card {
            background: ${reportColors.card};
            border: 1px solid ${reportColors.border};
            border-radius: 10px;
            box-sizing: border-box;
            padding: 13px 15px;
            width: calc(25% - 9px);
          }
          .summary-label {
            color: ${reportColors.label};
            font-size: 10px;
            letter-spacing: 1px;
            margin: 0 0 7px;
            text-transform: uppercase;
          }
          .summary-value {
            color: ${reportColors.primary};
            font-size: 18px;
            font-weight: 700;
            margin: 0;
          }
          h2 {
            color: ${reportColors.primary};
            font-size: 17px;
            margin: 24px 0 10px;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th, td {
            border: 1px solid ${reportColors.border};
            font-size: 10px;
            padding: 7px 8px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background: #EEF2FF;
            color: ${reportColors.primary};
            font-size: 9px;
            letter-spacing: 0.7px;
            text-transform: uppercase;
          }
          .amount {
            text-align: right;
            white-space: nowrap;
          }
          .strong {
            font-weight: 700;
          }
          .success {
            color: ${reportColors.success};
            font-weight: 700;
          }
          .warning {
            color: ${reportColors.warning};
            font-weight: 700;
          }
          .danger {
            color: ${reportColors.danger};
            font-weight: 700;
          }
          .muted-row {
            color: ${reportColors.label};
            text-decoration: line-through;
          }
          .empty {
            color: ${reportColors.label};
            padding: 14px;
            text-align: center;
          }
          .footer {
            color: ${reportColors.label};
            font-size: 10px;
            margin-top: 22px;
            text-align: right;
          }
          @media print {
            body {
              padding: 18px;
            }
            .summary-card {
              width: calc(25% - 9px);
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <p class="brand">GDC Inventory Pro</p>
            <p class="subtitle">Cashier Daily Export</p>
          </div>
          <div class="report-date">${escapeHtml(formatReportDate(now))}</div>
        </div>

        <div class="meta">
          <p><strong>Cashier:</strong> ${escapeHtml(cashierName)}</p>
          <p><strong>Generated:</strong> ${escapeHtml(formatReportDateTime(now))}</p>
          <p><strong>Shift:</strong> ${escapeHtml(dashboard.currentShift?.status || 'No active shift')}</p>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <p class="summary-label">Sales Today</p>
            <p class="summary-value">${escapeHtml(formatExportAmount(dashboard.performance.salesToday))}</p>
          </div>
          <div class="summary-card">
            <p class="summary-label">Transactions</p>
            <p class="summary-value">${escapeHtml(completedSales.length)}</p>
          </div>
          <div class="summary-card">
            <p class="summary-label">Items Sold</p>
            <p class="summary-value">${escapeHtml(totalItems)}</p>
          </div>
          <div class="summary-card">
            <p class="summary-label">Products Remaining</p>
            <p class="summary-value">${escapeHtml(products.length)}</p>
          </div>
          <div class="summary-card">
            <p class="summary-label">Inventory Value</p>
            <p class="summary-value">${escapeHtml(formatExportAmount(getInventoryValue(products)))}</p>
          </div>
          <div class="summary-card">
            <p class="summary-label">Low Stock</p>
            <p class="summary-value">${escapeHtml(getLowStockCount(products))}</p>
          </div>
          <div class="summary-card">
            <p class="summary-label">Opening Cash</p>
            <p class="summary-value">${escapeHtml(formatExportAmount(dashboard.currentShift?.openingCash ?? 0))}</p>
          </div>
          <div class="summary-card">
            <p class="summary-label">Expected Cash</p>
            <p class="summary-value">${escapeHtml(formatExportAmount(dashboard.currentShift?.expectedCashOnHand ?? 0))}</p>
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
          <tbody>${buildPaymentRows(dashboard.paymentBreakdown)}</tbody>
        </table>

        <h2>All Sales Today</h2>
        <table>
          <thead>
            <tr>
              <th>Items Bought</th>
              <th>Date/Time</th>
              <th>Customer</th>
              <th>Method</th>
              <th>Items</th>
              <th>Status</th>
              <th>Change</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>${buildSalesRows(sales)}</tbody>
        </table>

        <h2>Products Remaining</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Barcode</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>${buildProductRows(products)}</tbody>
        </table>

        <p class="footer">Prepared by GDC Inventory Pro</p>
      </body>
    </html>
  `;
}

export async function exportCashierDailyPdfReport(options: CashierDailyReportOptions) {
  const fileName = `gdc-cashier-daily-report-${formatFileDate(new Date())}.pdf`;
  const html = buildCashierDailyReportHtml(options);
  const completedSales = getCompletedSales(options.dashboard.recentSales);
  const totalItems = completedSales.reduce((sum, sale) => sum + getSaleItemCount(sale), 0);

  if (Platform.OS === 'web') {
    await downloadWebPdfReport({
      fileName,
      title: 'Cashier Daily Export',
      subtitle: 'GDC Inventory Pro',
      metadata: [
        { label: 'Cashier', value: options.cashierName },
        { label: 'Generated', value: formatReportDateTime(new Date()) },
        { label: 'Shift', value: options.dashboard.currentShift?.status || 'No active shift' },
      ],
      summary: [
        { label: 'Sales Today', value: formatExportAmount(options.dashboard.performance.salesToday) },
        { label: 'Transactions', value: String(completedSales.length) },
        { label: 'Items Sold', value: String(totalItems) },
        { label: 'Products Remaining', value: String(options.products.length) },
        { label: 'Inventory Value', value: formatExportAmount(getInventoryValue(options.products)) },
        { label: 'Low Stock', value: String(getLowStockCount(options.products)) },
      ],
      tables: buildWebPdfTables(options.dashboard, options.products),
      footer: 'Prepared by GDC Inventory Pro',
    });
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });

  await shareExportFile(uri, {
    dialogTitle: 'Share Cashier Daily Report',
    fileName,
    mimeType: 'application/pdf',
    uti: 'com.adobe.pdf',
  });
}
