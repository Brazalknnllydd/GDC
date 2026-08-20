import { Platform } from 'react-native';
import * as Print from 'expo-print';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { formatPeso, normalizeNumber } from './product-utils';
import type { CompletedSale } from '../store/cashier-store';
import { usePrinterStore } from '../store/printer-store';

let BLEPrinter: any = null;
if (Platform.OS === 'android') {
  try {
    BLEPrinter = require('react-native-thermal-receipt-printer').BLEPrinter;
  } catch(e) {}
}

export async function handlePrintReceipt(sale: CompletedSale | null) {
  if (!sale) return;

  let logoUri = '';
  try {
    const logoAsset = Asset.fromModule(require('../../assets/images/logo.jpg'));
    if (!logoAsset.localUri && Platform.OS !== 'web') {
      await logoAsset.downloadAsync();
    }
    if (Platform.OS === 'web') {
      logoUri = logoAsset.uri;
    } else {
      const localUri = logoAsset.localUri || logoAsset.uri;
      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      logoUri = `data:image/jpeg;base64,${base64}`;
    }
  } catch (e) {
    console.error('Failed to load receipt logo:', e);
  }

  const itemsHtml = sale.items && Array.isArray(sale.items)
    ? sale.items.map((item: any) => `
      <tr>
        <td style="padding: 6px 0; font-family: monospace;">${item.product?.name || 'Item'} x ${item.quantity}</td>
        <td style="padding: 6px 0; font-family: monospace; text-align: right;">${formatPeso(normalizeNumber(item.price ?? item.subtotal) * item.quantity)}</td>
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
              margin: 1.6cm;
            }
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            color: #111;
            padding: 20px;
            margin: 0;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .logo-img {
            width: 72px;
            height: 72px;
            border-radius: 36px;
            object-fit: cover;
            margin-bottom: 8px;
          }
          .title {
            font-size: 20px;
            font-weight: bold;
            margin: 0 0 4px;
          }
          .subtitle {
            font-size: 12px;
            margin: 0;
          }
          .divider {
            border-top: 1px dashed #333;
            margin: 15px 0;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
          }
          .totals-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
            margin-top: 10px;
          }
          .totals-table td {
            padding: 4px 0;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoUri ? `<img src="${logoUri}" class="logo-img" />` : ''}
          <h1 class="title">GDC POS RECEIPT</h1>
          <p class="subtitle">GDC Store</p>
          <p class="subtitle">Date: ${new Date(sale.createdAt).toLocaleString()}</p>
          <p class="subtitle">Receipt No: ${sale.receiptNumber}</p>
          <p class="subtitle">Cashier: ${sale.cashierName}</p>
          <p class="subtitle">Customer: ${sale.customerName ?? sale.customerId ?? 'Walk-in'}</p>
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
            <td style="text-align: right;">${formatPeso(sale.subtotal)}</td>
          </tr>
          <tr>
            <td>Discount:</td>
            <td style="text-align: right;">- ${formatPeso(sale.discountAmount)}</td>
          </tr>
          <tr style="font-weight: bold; font-size: 16px;">
            <td>TOTAL:</td>
            <td style="text-align: right;">${formatPeso(sale.totalAmount)}</td>
          </tr>
          <tr>
            <td>Amount Paid:</td>
            <td style="text-align: right;">${formatPeso(sale.amountPaid)}</td>
          </tr>
          <tr>
            <td>Change:</td>
            <td style="text-align: right;">${formatPeso(sale.changeAmount)}</td>
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

  try {
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
      
      if (printerMacAddress && BLEPrinter) {
        // Direct Bluetooth ESC/POS printing
        const lineLen = 32;
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
        bill += `Date: ${new Date(sale.createdAt).toLocaleString()}\n`;
        bill += `Receipt No: ${sale.receiptNumber}\n`;
        bill += `Cashier: ${sale.cashierName}\n`;
        bill += `Customer: ${sale.customerName ?? sale.customerId ?? 'Walk-in'}\n`;
        bill += '-'.repeat(lineLen) + '\n';
        
        for (const item of sale.items || []) {
           const itemName = (item.product?.name || 'Item').substring(0, 18);
           const qtyAndPrice = `x${item.quantity} ${formatPeso(normalizeNumber(item.price ?? item.subtotal) * item.quantity)}`;
           bill += row(itemName, qtyAndPrice);
        }
        
        bill += '-'.repeat(lineLen) + '\n';
        bill += row('Subtotal:', formatPeso(sale.subtotal));
        bill += row('Discount:', `-${formatPeso(sale.discountAmount)}`);
        bill += row('TOTAL:', formatPeso(sale.totalAmount));
        bill += row('Paid:', formatPeso(sale.amountPaid));
        bill += row('Change:', formatPeso(sale.changeAmount));
        bill += '\n';
        bill += center('Thank you for shopping!');
        bill += '\n\n\n';

        await BLEPrinter.printBill(bill, { beep: false, cut: false, tailingLine: true });
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
    alert('Could not print receipt.');
  }
}
