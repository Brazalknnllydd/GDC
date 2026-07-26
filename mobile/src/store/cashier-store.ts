import { create } from 'zustand';

import type { Product, Category } from '../components/admin-products/products-screen-data';
import type { CashierDashboardResponse } from '../components/cashier/cashier-screen-data';
import { apiClient } from '../lib/api';
import { getApiErrorMessage } from '../lib/api-errors';
import { normalizeNumber } from '../lib/product-utils';

export type CartItem = {
  barcode: string | null;
  categoryName: string;
  discountInput: string;
  id: number;
  imageUrl: string | null;
  name: string;
  price: number;
  quantity: number;
  stock: number;
};

export type CompletedSale = {
  amountPaid: number;
  cashierName: string;
  changeAmount: number;
  createdAt: string;
  customerId?: number | null;
  customerName?: string | null;
  discountAmount: number;
  paymentMethod: string;
  receiptNumber: string;
  subtotal: number;
  totalAmount: number;
  items?: { product?: { name: string }; price: number; quantity: number; subtotal: number }[];
};

export type ActiveCheckoutInput =
  | { type: 'amount' }
  | {
      productId: number;
      type: 'discount';
    };

const emptyDashboard: CashierDashboardResponse = {
  cashier: {
    allowedCategories: [],
    id: 0,
    name: 'Cashier',
    role: 'Cashier',
    username: 'cashier',
  },
  currentShift: null,
  paymentBreakdown: [],
  performance: {
    itemsSold: 0,
    salesToday: 0,
    served: 0,
    transactions: 0,
  },
  recentSales: [],
  totals: {
    drawerVariance: 0,
    totalReportedSales: 0,
    cashReceived: 0,
    changeGiven: 0,
  },
};

function buildReceiptNumber() {
  const stamp = Date.now().toString().slice(-8);
  return `QF-${stamp}`;
}

function sanitizeCurrencyInput(value: string) {
  const cleaned = value.replace(/[^\d.]/g, '');
  const [whole = '', decimal = ''] = cleaned.split('.');

  if (!cleaned.includes('.')) {
    return whole;
  }

  return `${whole}.${decimal.slice(0, 2)}`;
}

function appendCurrencyInput(currentValue: string, nextKey: string) {
  if (nextKey === '.' && currentValue.includes('.')) {
    return currentValue;
  }

  if (nextKey === '.' && !currentValue) {
    return '0.';
  }

  if (currentValue === '0' && nextKey !== '.') {
    return nextKey;
  }

  return sanitizeCurrencyInput(`${currentValue}${nextKey}`);
}

export function getCartItemGrossTotal(item: CartItem) {
  return item.price * item.quantity;
}

export function getCartItemDiscount(item: CartItem) {
  const parsedDiscount = Number(sanitizeCurrencyInput(item.discountInput)) || 0;
  return Math.max(0, Math.min(parsedDiscount, getCartItemGrossTotal(item)));
}

export function getCartItemNetTotal(item: CartItem) {
  return getCartItemGrossTotal(item) - getCartItemDiscount(item);
}

type CashierState = {
  // Workspace state
  dashboard: CashierDashboardResponse;
  products: Product[];
  categories: Category[];
  screenError: string;
  isWorkspaceLoading: boolean;

  // Checkout state
  cart: CartItem[];
  paymentMethod: 'Cash' | 'GCash';
  amountReceivedInput: string;
  showCartModal: boolean;
  showCheckoutModal: boolean;
  showSuccessModal: boolean;
  saleError: string;
  isSubmittingSale: boolean;
  completedSale: CompletedSale | null;
  activeCheckoutInput: ActiveCheckoutInput;
  customerId: number | null;
  customerName: string | null;
};

type CashierActions = {
  loadWorkspace: () => Promise<void>;
  setScreenError: (error: string) => void;

  addToCart: (product: Product) => void;
  updateCartQuantity: (productId: number, nextQuantity: number) => void;
  removeFromCart: (productId: number) => void;
  updateCartItemDiscount: (productId: number, nextValue: string) => void;
  
  handleKeypadPress: (value: string) => void;
  handleKeypadBackspace: () => void;
  
  setPaymentMethod: (method: 'Cash' | 'GCash') => void;
  setActiveCheckoutInput: (input: ActiveCheckoutInput) => void;
  setCustomerId: (id: number | null) => void;
  setCustomerName: (name: string | null) => void;
  setAmountReceivedInput: (val: string) => void;
  setSaleError: (val: string) => void;
  
  setShowCartModal: (val: boolean) => void;
  setShowCheckoutModal: (val: boolean) => void;
  setShowSuccessModal: (val: boolean) => void;
  
  resetSaleFlow: () => void;
  handleCompleteSale: (cashierDisplayName: string, shiftId: number | null, onSaleCompleted?: () => void | Promise<void>) => Promise<boolean>;
};

export const useCashierStore = create<CashierState & CashierActions>((set, get) => ({
  // Workspace state
  dashboard: emptyDashboard,
  products: [],
  categories: [],
  screenError: '',
  isWorkspaceLoading: false,

  // Checkout state
  cart: [],
  paymentMethod: 'Cash',
  amountReceivedInput: '',
  showCartModal: false,
  showCheckoutModal: false,
  showSuccessModal: false,
  saleError: '',
  isSubmittingSale: false,
  completedSale: null,
  activeCheckoutInput: { type: 'amount' },
  customerId: null,
  customerName: null,

  // Actions
  setScreenError: (screenError) => set({ screenError }),
  loadWorkspace: async () => {
    set({ isWorkspaceLoading: true, screenError: '' });
    try {
      const [dashboardResponse, productsResponse, categoriesResponse] =
        await Promise.all([
          apiClient.get<CashierDashboardResponse>('/cashier/dashboard/me'),
          apiClient.get<Product[]>('/products'),
          apiClient.get<Category[]>('/categories'),
        ]);

      const dashboard = dashboardResponse.data;
      const hasRestrictedCategories = dashboard.cashier.allowedCategories.length > 0;
      const allowedIds = new Set(
        dashboard.cashier.allowedCategories.map((category) => category.id)
      );
      
      const visibleCategories = hasRestrictedCategories
        ? categoriesResponse.data.filter((category) => allowedIds.has(category.id))
        : categoriesResponse.data;
        
      const visibleProducts = hasRestrictedCategories
        ? productsResponse.data.filter((product) => allowedIds.has(product.categoryId))
        : productsResponse.data;

      set({
        dashboard,
        categories: visibleCategories,
        products: visibleProducts,
      });
    } catch (error) {
      set({ screenError: getApiErrorMessage(error, 'Could not load cashier workspace right now.') });
    } finally {
      set({ isWorkspaceLoading: false });
    }
  },

  addToCart: (product) => {
    set((state) => {
      const price = normalizeNumber(product.price);
      const existingItem = state.cart.find((item) => item.id === product.id);

      if (existingItem) {
        return {
          cart: state.cart.map((item) =>
            item.id === product.id
              ? {
                  ...item,
                  quantity: Math.min(item.quantity + 1, item.stock),
                }
              : item
          ),
        };
      }

      return {
        cart: [
          ...state.cart,
          {
            barcode: product.barcode,
            categoryName: product.category.name,
            discountInput: '',
            id: product.id,
            imageUrl: product.imageUrl,
            name: product.name,
            price,
            quantity: 1,
            stock: product.stock,
          },
        ],
      };
    });
  },

  updateCartQuantity: (productId, nextQuantity) => {
    set((state) => ({
      cart: state.cart
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: Math.max(1, Math.min(nextQuantity, item.stock)),
              }
            : item
        )
        .filter((item) => item.quantity > 0),
    }));
  },

  removeFromCart: (productId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== productId),
    }));
  },

  updateCartItemDiscount: (productId, nextValue) => {
    set((state) => ({
      cart: state.cart.map((item) =>
        item.id === productId
          ? {
              ...item,
              discountInput: sanitizeCurrencyInput(nextValue),
            }
          : item
      ),
    }));
  },

  handleKeypadPress: (value) => {
    const state = get();
    set({ saleError: '' });

    if (state.activeCheckoutInput.type === 'discount') {
      const productId = state.activeCheckoutInput.productId;
      set({
        cart: state.cart.map((item) =>
          item.id === productId
            ? {
                ...item,
                discountInput: appendCurrencyInput(item.discountInput, value),
              }
            : item
        ),
      });
      return;
    }

    set({ amountReceivedInput: appendCurrencyInput(state.amountReceivedInput, value) });
  },

  handleKeypadBackspace: () => {
    const state = get();
    if (state.activeCheckoutInput.type === 'discount') {
      const productId = state.activeCheckoutInput.productId;
      set({
        cart: state.cart.map((item) =>
          item.id === productId
            ? {
                ...item,
                discountInput: item.discountInput.slice(0, -1),
              }
            : item
        ),
      });
      return;
    }

    set({ amountReceivedInput: state.amountReceivedInput.slice(0, -1) });
  },

  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setActiveCheckoutInput: (activeCheckoutInput) => set({ activeCheckoutInput }),
  setCustomerId: (customerId) => set({ customerId }),
  setCustomerName: (customerName) => set({ customerName }),
  setAmountReceivedInput: (amountReceivedInput) => set({ amountReceivedInput }),
  setSaleError: (saleError) => set({ saleError }),
  
  setShowCartModal: (showCartModal) => set({ showCartModal }),
  setShowCheckoutModal: (showCheckoutModal) => set({ showCheckoutModal }),
  setShowSuccessModal: (showSuccessModal) => set({ showSuccessModal }),

  resetSaleFlow: () => {
    set({
      amountReceivedInput: '',
      paymentMethod: 'Cash',
      saleError: '',
      activeCheckoutInput: { type: 'amount' },
      customerId: null,
      customerName: null,
      showCartModal: false,
      showCheckoutModal: false,
    });
  },

  handleCompleteSale: async (cashierDisplayName, shiftId, onSaleCompleted) => {
    const state = get();
    const cartGrossSubtotal = state.cart.reduce((sum, item) => sum + getCartItemGrossTotal(item), 0);
    const cartDiscountTotal = state.cart.reduce((sum, item) => sum + getCartItemDiscount(item), 0);
    const cartSubtotal = state.cart.reduce((sum, item) => sum + getCartItemNetTotal(item), 0);
    const amountReceived = Number(state.amountReceivedInput) || 0;
    const changeAmount = Math.max(amountReceived - cartSubtotal, 0);

    if (state.cart.length === 0) {
      set({ saleError: 'Add at least one product before completing the sale.' });
      return false;
    }

    if (amountReceived < cartSubtotal) {
      set({ saleError: 'Amount received must cover the total payable.' });
      return false;
    }

    try {
      set({ isSubmittingSale: true, saleError: '' });

      const receiptNumber = buildReceiptNumber();
      await apiClient.post('/sales', {
        amountPaid: amountReceived,
        changeAmount,
        customerId: state.customerId ?? null,
        discountAmount: cartDiscountTotal,
        items: state.cart.map((item) => ({
          price: item.price,
          productId: item.id,
          quantity: item.quantity,
          subtotal: getCartItemNetTotal(item),
        })),
        paymentMethod: state.paymentMethod,
        receiptNumber,
        shiftId,
        subtotal: cartGrossSubtotal,
        totalAmount: cartSubtotal,
      });

      const completedSale: CompletedSale = {
        amountPaid: amountReceived,
        cashierName: cashierDisplayName,
        changeAmount,
        createdAt: new Date().toISOString(),
        customerId: state.customerId,
        customerName: state.customerName,
        discountAmount: cartDiscountTotal,
        paymentMethod: state.paymentMethod,
        receiptNumber,
        subtotal: cartGrossSubtotal,
        totalAmount: cartSubtotal,
        items: state.cart.map((item) => ({
          price: item.price,
          product: { name: item.name },
          quantity: item.quantity,
          subtotal: getCartItemNetTotal(item),
        })),
      };

      set({ completedSale, cart: [] });
      get().resetSaleFlow();
      set({ showSuccessModal: true });

      if (onSaleCompleted) {
        await onSaleCompleted();
      }

      return true;
    } catch (error) {
      set({ saleError: getApiErrorMessage(error, 'Could not complete the sale right now.') });
      return false;
    } finally {
      set({ isSubmittingSale: false });
    }
  },
}));
