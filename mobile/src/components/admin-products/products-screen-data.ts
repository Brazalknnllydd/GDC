import { BarChart3, FileText, LayoutDashboard, Package, ReceiptText, Settings, Truck, Users } from 'lucide-react-native';

export const baseOverviewCards = [
  { title: 'TOTAL PRODUCTS', value: '0', detail: 'Live inventory count', accent: 'success' as const },
  { title: 'LOW STOCK', value: '0', detail: 'Requires Action', accent: 'danger' as const },
  { title: 'CATEGORIES', value: '0', detail: 'Active Sections', accent: 'default' as const },
  { title: 'INVENTORY VALUE', value: 'P0.00', detail: 'Market Valuation', accent: 'default' as const },
];

export const tabs = [
  { label: 'Dashboard', icon: LayoutDashboard, active: false, route: '/admin' as const },
  { label: 'Products', icon: Package, active: true, route: '/admin-products' as const },
  { label: 'Customers', icon: Users, active: false, route: '/admin-customers' as const },
  { label: 'Suppliers', icon: Truck, active: false, route: '/admin-suppliers' as const },
  { label: 'Sales', icon: ReceiptText, active: false, route: '/admin-sales' as const },
  { label: 'Shifts', icon: FileText, active: false, route: '/admin-shifts' as const },
  { label: 'Reports', icon: BarChart3, active: false, route: '/admin-reports' as const },
  { label: 'Settings', icon: Settings, active: false, route: '/admin-settings' as const },
];

export type Category = {
  id: number;
  description: string | null;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: number;
  name: string;
  description?: string | null;
  imageUrl: string | null;
  barcode: string | null;
  price: number | string;
  defaultPrice?: number | string;
  cashierPrice?: number | string | null;
  costPrice: number | string;
  stock: number;
  weight: number | null;
  unit: string;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
  category: Category;
  sourceCashiers?: {
    id: number;
    name: string;
    quantity: number;
    username: string;
  }[];
};
