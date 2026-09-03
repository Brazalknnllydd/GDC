import type { MonthRangeValue } from './month-range-picker';
import type { SaleRecord } from '../../lib/sales-types';

export type { CustomerRef, SaleItem, SaleRecord } from '../../lib/sales-types';

export type HistoryFilter = 'All' | 'Cash' | 'GCash';

export type CashierHistoryState = {
  calendarYear: number;
  monthRange: MonthRangeValue;
  page: number;
  pickerVisible: boolean;
};

export type CashierHistoryTable = {
  activePage: number;
  cashierKey: string;
  cashierName: string;
  filteredSales: SaleRecord[];
  paginatedSales: SaleRecord[];
  state: CashierHistoryState;
  totalPages: number;
  visiblePageNumbers: number[];
};
