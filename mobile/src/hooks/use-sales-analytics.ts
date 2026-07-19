import { useMemo } from 'react';

import type { MonthRangeValue } from '../components/admin-sales/month-range-picker';
import type { SaleRecord } from '../lib/sales-types';

export type HistoryFilter = 'All' | 'Cash' | 'GCash';
export type HistoryEntry = {
  id: string;
  cashierName: string;
  dateSold: string;
  price: string;
  productName: string;
};
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

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
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

function buildMonthlyChartSeries(
  sales: SaleRecord[],
  range: MonthRangeValue,
  normalizeNumber: (value: number | string | undefined) => number
) {
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

type UseSalesAnalyticsParams = {
  formatDateTime: (value: string) => string;
  formatExportDate: (value: string) => string;
  formatPeso: (value: number) => string;
  historyMonthRange: MonthRangeValue;
  normalizeNumber: (value: number | string | undefined) => number;
  overviewMonthRange: MonthRangeValue;
  sales: SaleRecord[];
  selectedHistoryFilter: HistoryFilter;
};

export function useSalesAnalytics({
  formatDateTime,
  formatExportDate,
  formatPeso,
  historyMonthRange,
  normalizeNumber,
  overviewMonthRange,
  sales,
  selectedHistoryFilter,
}: UseSalesAnalyticsParams) {
  const filteredSales = useMemo(
    () => sales.filter((sale) => isWithinMonthRange(sale.createdAt, overviewMonthRange)),
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
  }, [filteredSales, normalizeNumber]);

  const chartBars = useMemo(
    () => buildMonthlyChartSeries(filteredSales, overviewMonthRange, normalizeNumber),
    [filteredSales, overviewMonthRange, normalizeNumber]
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
  }, [filteredSales, formatPeso, normalizeNumber]);

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
  }, [filteredSales, formatPeso, normalizeNumber]);

  const historyTransactions = useMemo(() => {
    const filteredByMethod =
      selectedHistoryFilter === 'All'
        ? sales
        : sales.filter((sale) => sale.paymentMethod === selectedHistoryFilter);

    return filteredByMethod
      .filter((sale) => isWithinMonthRange(sale.createdAt, historyMonthRange))
      .slice()
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }, [historyMonthRange, sales, selectedHistoryFilter]);

  const historyEntries = useMemo<HistoryEntry[]>(
    () =>
      historyTransactions.flatMap((sale) =>
        sale.items.map((item, index) => ({
          id: `${sale.id}-${item.id ?? index}`,
          cashierName: sale.user?.name || 'Cashier',
          dateSold: formatDateTime(sale.createdAt),
          price: formatPeso(normalizeNumber(item.price ?? item.subtotal)),
          productName: item.product?.name || 'Unnamed Product',
        }))
      ),
    [formatDateTime, formatPeso, historyTransactions, normalizeNumber]
  );

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
    [filteredSales, formatExportDate, normalizeNumber]
  );

  const paymentSummary = useMemo(
    () => ({
      cash: filteredSales
        .filter((sale) => sale.paymentMethod === 'Cash')
        .reduce((sum, sale) => sum + normalizeNumber(sale.totalAmount), 0),
      gcash: filteredSales
        .filter((sale) => sale.paymentMethod === 'GCash')
        .reduce((sum, sale) => sum + normalizeNumber(sale.totalAmount), 0),
    }),
    [filteredSales, normalizeNumber]
  );

  return {
    chartBars,
    exportRows,
    filteredSales,
    historyEntries,
    historyTransactions,
    paymentMethodCards,
    paymentSummary,
    topProducts,
    totals,
  };
}
