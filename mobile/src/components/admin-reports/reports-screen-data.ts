import {
  BarChart3,
  CreditCard,
  Download,
  FileSpreadsheet,
  LayoutDashboard,
  Package,
  Printer,
  ReceiptText,
  Settings,
} from 'lucide-react-native';

export const reportMetrics = [
  { title: 'REVENUE', value: 'P245,000', detail: '↗ 12% vs last month', tone: 'success' as const },
  { title: 'PROFIT', value: 'P82,400', detail: '↗ 8% vs last month', tone: 'success' as const },
  { title: 'TRANSACTIONS', value: '542', detail: '→ Stable', tone: 'default' as const },
  { title: 'ITEMS SOLD', value: '1,250', detail: '↘ 4% vs last month', tone: 'danger' as const },
];

export const salesAnalyticsTabs = ['Daily', 'Weekly', 'Monthly'] as const;

export const salesAnalyticsBars = [
  { label: 'Week 1', revenueHeight: 68, profitHeight: 46, active: false },
  { label: 'Week 2', revenueHeight: 108, profitHeight: 72, active: false },
  { label: 'Week 3', revenueHeight: 78, profitHeight: 52, active: false },
  { label: 'Week 4', revenueHeight: 134, profitHeight: 92, active: false },
  { label: 'Week 5', revenueHeight: 90, profitHeight: 60, active: false },
  { label: 'Week 6', revenueHeight: 152, profitHeight: 108, active: true },
  { label: 'Week 7', revenueHeight: 116, profitHeight: 82, active: false },
];

export const insightCards = [
  {
    title: 'PEAK SALES DAY',
    value: 'Friday',
    tone: 'primary' as const,
  },
  {
    title: 'BEST PRODUCT',
    value: 'Atlantic Salmon',
    tone: 'danger' as const,
  },
  {
    title: 'BEST CATEGORY',
    value: 'Poultry',
    tone: 'neutral' as const,
  },
];

export const bestSellingProducts = [
  { name: 'Whole Frozen Chicken', amount: 'P63,000', unitsText: '420 units sold', note: 'Top Growth', noteTone: 'success' as const },
  { name: 'Atlantic Salmon', amount: 'P55,500', unitsText: '185 units sold', note: 'High Margin', noteTone: 'neutral' as const },
  { name: 'Organic Broccoli', amount: 'P12,400', unitsText: '310 units sold', note: 'Stable', noteTone: 'muted' as const },
];

export const categoryPerformance = [
  { label: 'Poultry', percentage: 45 },
  { label: 'Seafood', percentage: 30 },
  { label: 'Vegetables', percentage: 25 },
];

export const paymentDistribution = [
  { label: 'Cash', amount: 'P142,000', percentageText: '(58%)', tone: 'success' as const, icon: CreditCard },
  { label: 'GCash', amount: 'P78,500', percentageText: '(32%)', tone: 'primary' as const, icon: CreditCard },
  { label: 'Maya', amount: 'P24,500', percentageText: '(10%)', tone: 'warning' as const, icon: CreditCard },
];

export const exportActions = [
  { label: 'EXPORT PDF', icon: Download },
  { label: 'EXPORT EXCEL', icon: FileSpreadsheet },
  { label: 'PRINT REPORT', icon: Printer },
];

export const reportTabs = [
  { label: 'Dashboard', icon: LayoutDashboard, active: false, route: '/admin' as const },
  { label: 'Products', icon: Package, active: false, route: '/admin-products' as const },
  { label: 'Sales', icon: ReceiptText, active: false, route: '/admin-sales' as const },
  { label: 'Reports', icon: BarChart3, active: true, route: '/admin-reports' as const },
  { label: 'Settings', icon: Settings, active: false, route: '/admin-settings' as const },
];
