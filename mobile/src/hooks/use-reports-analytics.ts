import { useMemo } from 'react';

import type { MonthRangeValue } from '../components/admin-sales/month-range-picker';
import type { SaleRecord } from '../lib/sales-types';

type ReportProduct = {
  category: {
    name: string;
  };
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
  return date >= startOfMonth(range.startMonth) && date <= endOfMonth(range.endMonth);
}

function buildMonthlyLineSeries(
  sales: SaleRecord[],
  range: MonthRangeValue,
  normalizeNumber: (value: number | string | undefined) => number
) {
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

type UseReportsAnalyticsParams = {
  formatPeso: (value: number) => string;
  normalizeNumber: (value: number | string | undefined) => number;
  products: ReportProduct[];
  reportMonthRange: MonthRangeValue;
  sales: SaleRecord[];
};

export function useReportsAnalytics({
  formatPeso,
  normalizeNumber,
  products,
  reportMonthRange,
  sales,
}: UseReportsAnalyticsParams) {
  const filteredSales = useMemo(
    () => sales.filter((sale) => isWithinMonthRange(sale.createdAt, reportMonthRange)),
    [reportMonthRange, sales]
  );

  const totals = useMemo(() => {
    const revenue = filteredSales.reduce((sum, sale) => sum + normalizeNumber(sale.totalAmount), 0);
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
  }, [filteredSales, normalizeNumber, products]);

  const reportMetrics = useMemo(
    () => [
      {
        detail: 'Total discounts applied',
        title: 'DISCOUNTS GIVEN',
        tone: 'default' as const,
        value: formatPeso(totals.discounts),
      },
      {
        detail: `${totals.transactions} completed transactions`,
        title: 'ITEMS SOLD',
        tone: 'default' as const,
        value: String(totals.itemsSold),
      },
      {
        detail: 'Items per transaction',
        title: 'AVG BASKET',
        tone: 'default' as const,
        value: totals.averageBasket.toFixed(1),
      },
      {
        detail: 'Categories tracked in inventory',
        title: 'ACTIVE CATEGORIES',
        tone: 'default' as const,
        value: String(totals.activeCategories),
      },
    ],
    [formatPeso, totals]
  );

  const chartSeries = useMemo(
    () => buildMonthlyLineSeries(filteredSales, reportMonthRange, normalizeNumber),
    [filteredSales, normalizeNumber, reportMonthRange]
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
        label: config.label,
        percentageText: `(${percentage}%)`,
        tone: config.tone,
      };
    });
  }, [filteredSales, formatPeso, normalizeNumber]);

  const insightCards = useMemo(() => {
    const bestCategory = categoryPerformance[0]?.label || 'No categories yet';
    const topPayment =
      paymentDistribution
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
  }, [categoryPerformance, filteredSales, normalizeNumber, paymentDistribution]);

  return {
    categoryPerformance,
    chartSeries,
    filteredSales,
    insightCards,
    paymentDistribution,
    reportMetrics,
    totals,
  };
}
