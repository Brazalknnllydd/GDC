import { useMemo } from 'react';

import type { MonthRangeValue } from '../components/admin-sales/month-range-picker';
import type { SaleRecord } from '../lib/sales-types';
import {
  buildMonthlyChartSeries,
  isWithinMonthRange,
} from '../components/admin-sales/sales-history-utils';
import { formatPeso, normalizeNumber } from '../lib/product-utils';

export type ExportRow = {
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
export type PaymentSummary = {
  cash: number;
  gcash: number;
};
export type SalesTotals = {
  averageSale: number;
  profit: number;
  totalSales: number;
  transactions: number;
};
export type TopProduct = {
  emoji: string;
  name: string;
  soldText: string;
  total: string;
};

type UseSalesAnalyticsParams = {
  formatExportDate: (value: string) => string;
  overviewMonthRange: MonthRangeValue;
  sales: SaleRecord[];
};

export function useSalesAnalytics({
  formatExportDate,
  overviewMonthRange,
  sales,
}: UseSalesAnalyticsParams) {
  const filteredSales = useMemo(
    () =>
      sales.filter(
        (sale) =>
          sale.status !== 'voided' &&
          sale.saleType !== 'INTERNAL_CASHIER' &&
          isWithinMonthRange(sale.createdAt, overviewMonthRange)
      ),
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
    } satisfies SalesTotals;
  }, [filteredSales]);

  const chartBars = useMemo(
    () => buildMonthlyChartSeries(filteredSales, overviewMonthRange),
    [filteredSales, overviewMonthRange]
  );

  const paymentMethodCards = useMemo(() => {
    const methods = [
      { key: 'Cash', label: 'CASH' },
      { key: 'GCash', label: 'GCASH' },
    ] as const;

    return methods.map((method) => ({
      label: method.label,
      value: formatPeso(
        filteredSales
          .filter((sale) => sale.paymentMethod === method.key)
          .reduce((sum, sale) => sum + normalizeNumber(sale.totalAmount), 0)
      ),
    }));
  }, [filteredSales]);

  const topProducts = useMemo<TopProduct[]>(() => {
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
        emoji: 'Pkg',
        name,
        soldText: `${value.quantity} unit${value.quantity === 1 ? '' : 's'} sold`,
        total: formatPeso(value.total),
      }))
      .sort(
        (left, right) =>
          Number(right.total.replace(/[^\d.]/g, '')) - Number(left.total.replace(/[^\d.]/g, ''))
      )
      .slice(0, 5);
  }, [filteredSales]);

  const exportRows = useMemo<ExportRow[]>(
    () =>
      filteredSales.flatMap((sale) =>
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
      ),
    [filteredSales, formatExportDate]
  );

  const paymentSummary = useMemo<PaymentSummary>(
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

  return {
    chartBars,
    exportRows,
    filteredSales,
    paymentMethodCards,
    paymentSummary,
    topProducts,
    totals,
  };
}

