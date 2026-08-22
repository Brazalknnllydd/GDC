import { NativeModules, Platform } from 'react-native';
import { Buffer } from 'buffer';
import * as Print from 'expo-print';
import { formatPeso, normalizeNumber } from './product-utils';
import type { CompletedSale } from '../store/cashier-store';
import { usePrinterStore } from '../store/printer-store';
import { useToastStore } from '../store/toast-store';

let BLEPrinter: any = null;
if (Platform.OS === 'android') {
  try {
    BLEPrinter = require('react-native-thermal-receipt-printer').BLEPrinter;
  } catch(e) {}
}

let isPrinting = false;

function formatReceiptDateTime(value: string) {
  const date = new Date(value);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours();
  const hour = hours % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const meridiem = hours >= 12 ? 'PM' : 'AM';

  return `${month}/${day}/${year}, ${hour}:${minutes}:${seconds} ${meridiem}`;
}

function printerText(value: string) {
  return value.replace(/[^\x20-\x7E\r\n]/g, '');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shortenProductName(name: string) {
  const baseName = name.replace(/\s*\([^)]*\)/g, '').trim();
  const maxLength = 32;
  return baseName.length > maxLength
    ? `${baseName.slice(0, maxLength - 3).trimEnd()}...`
    : baseName;
}

export async function handlePrintReceipt(sale: CompletedSale | null) {
  if (!sale) return;
  if (isPrinting) return;
  isPrinting = true;

  try {
  const itemsHtml = sale.items && Array.isArray(sale.items)
    ? sale.items.map((item: any) => `
      <tr>
        <td>${escapeHtml(shortenProductName(item.product?.name || 'Item'))} x ${item.quantity}</td>
        <td class="amount">${escapeHtml(formatPeso(normalizeNumber(item.price ?? item.subtotal) * item.quantity))}</td>
      </tr>
    `).join('')
    : '';

  const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @media print {
            @page {
              margin: 0;
            }
            body {
              margin: 0;
            }
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            color: #111;
            padding: 78px 14px 0;
            margin: 0;
            font-size: 11px;
          }
          .header {
            text-align: center;
            margin-bottom: 13px;
          }
          .title {
            font-size: 14px;
            font-weight: bold;
            margin: 0 0 5px;
          }
          .subtitle {
            font-size: 9px;
            line-height: 12px;
            margin: 0;
          }
          .divider {
            border-top: 1px dashed #777;
            margin: 13px 0;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          .details-table th {
            padding-bottom: 9px;
          }
          .details-table td {
            padding: 0 0 13px;
            white-space: nowrap;
          }
          .details-table th:first-child,
          .details-table td:first-child {
            text-align: left;
          }
          .details-table th:last-child,
          .details-table td:last-child {
            text-align: right;
          }
          .amount {
            font-weight: bold;
          }
          .totals-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          .totals-table td {
            padding: 3px 0;
          }
          .totals-table td:last-child {
            text-align: right;
          }
          .total-row {
            font-weight: bold;
          }
          .footer {
            text-align: center;
            font-size: 9px;
            line-height: 15px;
            margin-top: 21px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">GDC POS RECEIPT</h1>
          <p class="subtitle">GDC Store</p>
          <p class="subtitle">Date: ${formatReceiptDateTime(sale.createdAt)}</p>
          <p class="subtitle">Receipt No: ${escapeHtml(sale.receiptNumber)}</p>
          <p class="subtitle">Cashier: ${escapeHtml(sale.cashierName)}</p>
          <p class="subtitle">Customer: ${escapeHtml(String(sale.customerName ?? sale.customerId ?? 'Walk-in'))}</p>
        </div>

        <div class="divider"></div>

        <table class="details-table">
          <thead>
            <tr>
              <th style="text-align: left; padding-bottom: 8px;">Item</th>
              <th style="text-align: right; padding-bottom: 8px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider"></div>

        <table class="totals-table">
          <tr>
            <td>Subtotal:</td>
            <td style="text-align: right;">${escapeHtml(formatPeso(sale.subtotal))}</td>
          </tr>
          <tr>
            <td>Discount:</td>
            <td style="text-align: right;">- ${escapeHtml(formatPeso(sale.discountAmount))}</td>
          </tr>
            <tr class="total-row">
            <td>TOTAL:</td>
            <td style="text-align: right;">${escapeHtml(formatPeso(sale.totalAmount))}</td>
          </tr>
          <tr>
            <td>Amount Paid:</td>
            <td style="text-align: right;">${escapeHtml(formatPeso(sale.amountPaid))}</td>
          </tr>
          <tr>
            <td>Change:</td>
            <td style="text-align: right;">${escapeHtml(formatPeso(sale.changeAmount))}</td>
          </tr>
        </table>

        <div class="divider"></div>

        <div class="footer">
          <p style="margin: 0 0 6px;">Thank you for shopping with us!</p>
          <p style="margin: 0;">Please visit again.</p>
        </div>
      </body>
    </html>
  `;

    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      } else {
        alert('Popup blocker is active. Please allow popups to view receipt.');
      }
    } else if (Platform.OS === 'android') {
      const printerMacAddress = usePrinterStore.getState().printerMacAddress;
      const isPrinterConnected = usePrinterStore.getState().isPrinterConnected;
      
      if (!printerMacAddress || !isPrinterConnected || !BLEPrinter) {
        useToastStore.getState().showToast(
          'No printer connected. Connect a Bluetooth printer in Settings first.',
          'error'
        );
        return;
      }

      if (printerMacAddress && BLEPrinter) {
        // Direct Bluetooth ESC/POS printing
        const lineLen = 32;
        const formatPrinterAmount = (value: number) => normalizeNumber(value).toFixed(2);
        const center = (text: string) => {
          const spaces = Math.max(0, Math.floor((lineLen - text.length) / 2));
          return ' '.repeat(spaces) + text + '\n';
        };
        const row = (left: string, right: string) => {
          const spaces = Math.max(0, lineLen - left.length - right.length);
          return left + ' '.repeat(spaces) + right + '\n';
        };

        let bill = '';
        bill += center('GDC POS RECEIPT');
        bill += center('GDC Store');
        bill += '\n';
        bill += `Date: ${formatReceiptDateTime(sale.createdAt)}\n`;
        bill += `Receipt No: ${printerText(sale.receiptNumber)}\n`;
        bill += `Cashier: ${printerText(sale.cashierName)}\n`;
        bill += `Customer: ${printerText(String(sale.customerName ?? sale.customerId ?? 'Walk-in'))}\n`;
        bill += '-'.repeat(lineLen) + '\n';
        
        for (const item of sale.items || []) {
            const itemAmount = formatPrinterAmount(normalizeNumber(item.price ?? item.subtotal) * item.quantity);
           const itemRightColumn = `x${item.quantity} ${itemAmount}`;
            bill += row(printerText(shortenProductName(item.product?.name || 'Item')), itemRightColumn);
        }
        
        bill += '-'.repeat(lineLen) + '\n';
          bill += row('Subtotal:', formatPrinterAmount(sale.subtotal));
          bill += row('Discount:', `-${formatPrinterAmount(sale.discountAmount)}`);
          bill += row('TOTAL:', formatPrinterAmount(sale.totalAmount));
          bill += row('Paid:', formatPrinterAmount(sale.amountPaid));
          bill += row('Change:', formatPrinterAmount(sale.changeAmount));
        bill += '\n';
        bill += center('Thank you for shopping!');
        bill += '\n\n\n';

        const rawPrinter = NativeModules.RNBLEPrinter;
        if (!rawPrinter?.printRawData) {
          throw new Error('Bluetooth printer module is unavailable');
        }

        const printerBytes = Buffer.concat([
          Buffer.from([0x1b, 0x40]),
          Buffer.from(printerText(bill).replace(/\r?\n/g, '\r\n'), 'ascii'),
          Buffer.from([0x0d, 0x0a, 0x0d, 0x0a, 0x0d, 0x0a]),
        ]);

        await new Promise<void>((resolve, reject) => {
          rawPrinter.printRawData(printerBytes.toString('base64'), (error: unknown) => {
            if (error) {
              reject(error);
              return;
            }
            resolve();
          });
        });
        useToastStore.getState().showToast('Receipt sent to printer.', 'success');
      } else {
        // Fallback to Expo Print
        await Print.printAsync({ html });
      }
    } else {
      const printerUrl = usePrinterStore.getState().printerUrl;
      await Print.printAsync({ html, printerUrl: printerUrl || undefined });
    }
  } catch (error) {
    console.error('Failed to print receipt:', error);
    useToastStore.getState().showToast('Could not print receipt. Check the printer connection and try again.', 'error');
  } finally {
    isPrinting = false;
  }
}

