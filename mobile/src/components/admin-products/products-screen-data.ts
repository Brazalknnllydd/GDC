import { BarChart3, LayoutDashboard, Package, ReceiptText, Settings } from 'lucide-react-native';

export const baseOverviewCards = [
  { title: 'TOTAL\nPRODUCTS', value: '0', detail: 'Live inventory count', accent: 'success' as const },
  { title: 'LOW STOCK', value: '0', detail: 'Requires Action', accent: 'danger' as const },
  { title: 'CATEGORIES', value: '0', detail: 'Active Sections', accent: 'default' as const },
  { title: 'INVENTORY VALUE', value: 'P0.00', detail: 'Market Valuation', accent: 'default' as const },
];

export const tabs = [
  { label: 'Dashboard', icon: LayoutDashboard, active: false, route: '/admin' as const },
  { label: 'Products', icon: Package, active: true, route: '/admin-products' as const },
  { label: 'Sales', icon: ReceiptText, active: false, route: '/admin-sales' as const },
  { label: 'Reports', icon: BarChart3, active: false, route: '/admin-reports' as const },
  { label: 'Settings', icon: Settings, active: false, route: '/admin-settings' as const },
];

export type Category = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: number;
  name: string;
  barcode: string | null;
  price: number | string;
  costPrice: number | string;
  stock: number;
  weight: number | null;
  unit: string;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
  category: Category;
};
