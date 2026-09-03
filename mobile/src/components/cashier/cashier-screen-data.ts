import {
  CreditCard,
  LayoutDashboard,
  Package,
  Receipt,
  Printer,
  ReceiptText,
  ScanLine,
  Settings,
  ShoppingCart,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react-native';

import type { CashierSection } from './cashier-bottom-nav';

export type CashierDashboardResponse = {
  cashier: {
    allowedCategories: {
      id: number;
      name: string;
    }[];
    id: number;
    name: string;
    role: string;
    username: string;
    canSupplyCashiers?: boolean;
  };
  currentShift: {
    id: number;
    durationMinutes: number;
    expectedCashOnHand: number;
    openingCash: number;
    startedAt: string;
    status: string;
  } | null;
  paymentBreakdown: {
    method: string;
    total: number;
  }[];
  internalRecipientCashiers?: {
    id: number;
    name: string;
    username: string;
  }[];
  inventoryProducts?: {
    id: number;
    name: string;
    description?: string | null;
    imageUrl: string | null;
    barcode: string | null;
    price: number | string;
    cashierPrice?: number | string | null;
    costPrice: number | string;
    defaultPrice?: number | string;
    stock: number;
    weight: number | null;
    unit: string;
    categoryId: number;
    createdAt: string;
    updatedAt: string;
    category: {
      id: number;
      description: string | null;
      name: string;
      createdAt: string;
      updatedAt: string;
    };
    sourceCashiers?: {
      id: number;
      name: string;
      quantity: number;
      username: string;
    }[];
  }[];
  performance: {
    itemsSold: number;
    salesToday: number;
    served: number;
    transactions: number;
  };
  recentSales: {
    id: number;
    paymentMethod: string;
    status?: string;
    receiptNumber: string;
    time: string;
    createdAt: string;
    totalAmount: number;
    customerName: string | null;
    changeAmount: number;
    cashierName: string;
    recipientCashierName?: string | null;
    recipientUserId?: number | null;
    saleType?: string;
    discountAmount?: number;
    subtotal: number;
    amountPaid: number;
    items?: {
      price?: number | string;
      product?: {
        name: string;
      };
      quantity: number | string;
      subtotal: number | string;
    }[];
  }[];
  recentExpenses?: {
    amount: number;
    createdAt: string;
    description: string;
    expenseDate: string;
    id: number;
    shiftId?: number | null;
  }[];
  totals: {
    drawerVariance: number;
    totalReportedSales: number;
    cashReceived?: number;
    changeGiven?: number;
    expenses?: number;
  };
};

export type CashierSaleRecord = {
  id: number;
  receiptNumber: string;
  totalAmount: number | string;
  subtotal?: number | string;
  amountPaid: number | string;
  changeAmount: number | string;
  paymentMethod: string;
  status?: string;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    username: string;
  };
  items: {
    id?: number;
    quantity: number;
    subtotal: number | string;
    product?: {
      id: number;
      name: string;
      barcode?: string | null;
    };
  }[];
};

export const cashierPerformanceCards = [
  { key: 'salesToday', label: 'SALES TODAY', icon: Wallet },
  { key: 'transactions', label: 'TRANSACTIONS', icon: ReceiptText },
  { key: 'itemsSold', label: 'ITEMS SOLD', icon: ShoppingCart },
  { key: 'served', label: 'SERVED', icon: Users },
] as const;

export const cashierQuickActions = [
  { label: 'New Sale', icon: ShoppingCart, target: 'register' as CashierSection },
  { label: 'Scan', icon: ScanLine, target: 'register' as CashierSection },
  { label: 'Customers', icon: UserPlus, target: 'history' as CashierSection },
  { label: 'Receipts', icon: Printer, target: 'history' as CashierSection },
] as const;

export const cashierPaymentMethods = [
  { key: 'Cash', label: 'Cash', icon: Wallet },
  { key: 'GCash', label: 'GCash', icon: CreditCard },
  { key: 'Utang', label: 'Utang (Credit)', icon: UserPlus },
] as const;

export const cashierSections = [
  { key: 'register' as CashierSection, label: 'Register', icon: LayoutDashboard },
  { key: 'history' as CashierSection, label: 'History', icon: ReceiptText },
  { key: 'inventory' as CashierSection, label: 'Inventory', icon: Package },
  { key: 'expenses' as CashierSection, label: 'Expenses', icon: Receipt },
  { key: 'customers' as CashierSection, label: 'Customers', icon: Users },
  { key: 'settings' as CashierSection, label: 'Settings', icon: Settings },
] as const;
