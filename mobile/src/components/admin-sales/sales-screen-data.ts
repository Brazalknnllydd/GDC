import { CreditCard, QrCode, WalletCards } from 'lucide-react-native';

export const rangeOptions = ['Today', 'This Week', 'This Month', 'Custom Range'] as const;
export const chartTabs = ['Daily', 'Weekly'] as const;

export const fallbackSales = [
  {
    id: 1,
    receiptNumber: 'REC-9942',
    totalAmount: 1200,
    amountPaid: 1200,
    changeAmount: 0,
    paymentMethod: 'GCash',
    customer: null,
    createdAt: '2026-06-12T08:15:00.000Z',
    items: [
      {
        product: { name: 'Whole Frozen Chicken' },
        quantity: 3,
        subtotal: 1200,
      },
    ],
  },
  {
    id: 2,
    receiptNumber: 'REC-9941',
    totalAmount: 3450,
    amountPaid: 3500,
    changeAmount: 50,
    paymentMethod: 'Cash',
    customer: { name: 'Store Pickup' },
    createdAt: '2026-06-12T10:40:00.000Z',
    items: [
      {
        product: { name: 'Atlantic Salmon' },
        quantity: 2,
        subtotal: 2400,
      },
      {
        product: { name: 'Whole Frozen Chicken' },
        quantity: 1,
        subtotal: 1050,
      },
    ],
  },
  {
    id: 3,
    receiptNumber: 'REC-9940',
    totalAmount: 980,
    amountPaid: 1000,
    changeAmount: 20,
    paymentMethod: 'Maya',
    customer: null,
    createdAt: '2026-06-11T16:25:00.000Z',
    items: [
      {
        product: { name: 'Mixed Vegetables' },
        quantity: 4,
        subtotal: 980,
      },
    ],
  },
];

export const topProducts = [
  { emoji: '🍗', name: 'Whole Frozen Chicken', soldText: '156 units sold', total: 'P70,200' },
  { emoji: '🍣', name: 'Atlantic Salmon', soldText: '42 units sold', total: 'P50,400' },
];

export const paymentMethodCards = [
  { label: 'CASH', value: 'P82k', icon: WalletCards },
  { label: 'GCASH', value: 'P45k', icon: QrCode },
  { label: 'MAYA', value: 'P15k', icon: CreditCard },
];
