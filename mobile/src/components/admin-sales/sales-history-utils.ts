import type { MonthRangeValue } from './month-range-picker';
import type { CashierHistoryState, CashierHistoryTable, SaleRecord } from './sales-history-types';
import { normalizeNumber } from '../../lib/product-utils';

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date) {
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

export function formatMonthRangeLabel(range: MonthRangeValue) {
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

export function formatMonthRangeForFilename(range: MonthRangeValue) {
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

export function isWithinMonthRange(dateValue: string, range: MonthRangeValue) {
  if (!range.startMonth || !range.endMonth) {
    return true;
  }

  const date = new Date(dateValue);
  const rangeStart = startOfMonth(range.startMonth);
  const rangeEnd = endOfMonth(range.endMonth);

  return date >= rangeStart && date <= rangeEnd;
}

export function buildMonthlyChartSeries(sales: SaleRecord[], range: MonthRangeValue) {
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

export function getCashierName(sale: SaleRecord) {
  return sale.user?.name?.trim() || sale.user?.username?.trim() || 'Cashier';
}

export function getCashierKey(sale: SaleRecord) {
  return sale.user?.id ? `user-${sale.user.id}` : `name-${getCashierName(sale)}`;
}

export function createDefaultHistoryState(): CashierHistoryState {
  return {
    calendarYear: new Date().getFullYear(),
    monthRange: {
      endMonth: null,
      startMonth: null,
    },
    page: 1,
    pickerVisible: false,
  };
}

function getVisiblePageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  if (currentPage <= 1) {
    return [0, 1, 2, 3, 4];
  }

  if (currentPage >= totalPages - 2) {
    return Array.from({ length: 5 }, (_, index) => totalPages - 5 + index);
  }

  return Array.from({ length: 5 }, (_, index) => currentPage - 2 + index);
}

export function buildCashierHistoryTables(
  historyTransactions: SaleRecord[],
  cashierHistoryState: Record<string, CashierHistoryState>,
  itemsPerPage: number
): CashierHistoryTable[] {
  const grouped = new Map<string, { cashierName: string; sales: SaleRecord[] }>();

  historyTransactions.forEach((sale) => {
    const cashierKey = getCashierKey(sale);
    const current = grouped.get(cashierKey) || {
      cashierName: getCashierName(sale),
      sales: [],
    };

    current.sales.push(sale);
    grouped.set(cashierKey, current);
  });

  return [...grouped.entries()].map(([cashierKey, group]) => {
    const state = cashierHistoryState[cashierKey] || createDefaultHistoryState();
    const filteredSales = group.sales.filter((sale) =>
      isWithinMonthRange(sale.createdAt, state.monthRange)
    );
    const totalPages = Math.ceil(filteredSales.length / itemsPerPage) || 1;
    const activePage = Math.min(state.page, totalPages);
    const startIndex = (activePage - 1) * itemsPerPage;

    return {
      activePage,
      cashierKey,
      cashierName: group.cashierName,
      filteredSales,
      paginatedSales: filteredSales.slice(startIndex, startIndex + itemsPerPage),
      state,
      totalPages,
      visiblePageNumbers: getVisiblePageNumbers(activePage - 1, totalPages),
    };
  });
}
