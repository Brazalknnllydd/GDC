import { create } from 'zustand';

import type { Product, Category } from '../components/admin-products/products-screen-data';
import type { CashierDashboardResponse } from '../components/cashier/cashier-screen-data';
import { apiClient } from '../lib/api';
import { getApiErrorMessage } from '../lib/api-errors';
import { normalizeNumber } from '../lib/product-utils';

export type CartItem = {
  barcode: string | null;
  categoryName: string;
  id: number;
  imageUrl: string | null;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  discountInput?: string;
};

export type CompletedSale = {
  id: number;
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
  const parsedDiscount = Number(sanitizeCurrencyInput(item.discountInput ?? '')) || 0;
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
  hasLoadedWorkspace: boolean;

  // Checkout state
  cart: CartItem[];
  paymentMethod: 'Cash' | 'GCash' | 'Utang';
  amountReceivedInput: string;
  showCartModal: boolean;
  showCheckoutModal: boolean;
  showSuccessModal: boolean;
  saleError: string;
  isSubmittingSale: boolean;
  completedSale: CompletedSale | null;
  activeCheckoutInput: ActiveCheckoutInput;
  selectedCustomerId: number | null;
  selectedCustomerName: string | null;
  showCustomerModal: boolean;
  toast: { message: string; type: 'success' | 'error' } | null;
};

type CashierActions = {
  loadWorkspace: (options?: { force?: boolean }) => Promise<void>;
  setScreenError: (error: string) => void;

  clearCart: () => void;
  addToCart: (product: Product) => void;
  updateCartQuantity: (productId: number, nextQuantity: number) => void;
  removeFromCart: (productId: number) => void;
  updateCartItemDiscount: (productId: number, nextValue: string) => void;
  
  handleKeypadPress: (value: string) => void;
  handleKeypadBackspace: () => void;
  
  setPaymentMethod: (method: 'Cash' | 'GCash' | 'Utang') => void;
  setActiveCheckoutInput: (input: ActiveCheckoutInput) => void;
  setCustomer: (id: number | null, name: string | null) => void;
  setAmountReceivedInput: (val: string) => void;
  setSaleError: (val: string) => void;
  
  setShowCartModal: (val: boolean) => void;
  setShowCheckoutModal: (val: boolean) => void;
  setShowSuccessModal: (val: boolean) => void;
  setShowCustomerModal: (val: boolean) => void;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
  
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
  hasLoadedWorkspace: false,

  // Checkout state
  cart: [],
  paymentMethod: 'Cash',
  amountReceivedInput: '',
  showCartModal: false,
  showCheckoutModal: false,
  showSuccessModal: false,
  showCustomerModal: false,
  saleError: '',
  isSubmittingSale: false,
  completedSale: null,
  activeCheckoutInput: { type: 'amount' },
  selectedCustomerId: null,
  selectedCustomerName: null,
  toast: null,

  // Actions
  setScreenError: (screenError) => set({ screenError }),
  loadWorkspace: async (options) => {
    if (get().isWorkspaceLoading) {
      return;
    }

    if (get().hasLoadedWorkspace && !options?.force) {
      return;
    }

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
        hasLoadedWorkspace: true,
      });
    } catch (error) {
      set({ screenError: getApiErrorMessage(error, 'Could not load cashier workspace right now.') });
    } finally {
      set({ isWorkspaceLoading: false });
    }
  },

  clearCart: () => set({ cart: [], amountReceivedInput: '', selectedCustomerId: null, selectedCustomerName: null }),

  addToCart: (product) => {
    set((state) => {
      const existingItemIndex = state.cart.findIndex((item) => item.id === product.id);

      if (existingItemIndex >= 0) {
        const updatedCart = [...state.cart];
        const existingItem = updatedCart[existingItemIndex];
        if (existingItem.quantity >= (product as Product).stock) {
          return state; // Reached stock limit
        }

        updatedCart[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + 1,
        };
        return { cart: updatedCart };
      }

      if ((product as Product).stock === 0) {
        return state; // Cannot add out of stock item
      }

      return {
        cart: [
          ...state.cart,
          {
            barcode: (product as Product).barcode,
            categoryName: 'Product',
            id: product.id,
            discountInput: '',
            imageUrl: (product as Product).imageUrl,
            name: product.name,
            price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
            quantity: 1,
            stock: (product as Product).stock,
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
                discountInput: appendCurrencyInput(item.discountInput || '', value),
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
                discountInput: (item.discountInput || '').slice(0, -1),
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
  setCustomer: (id, name) => set({ selectedCustomerId: id, selectedCustomerName: name }),
  setAmountReceivedInput: (amountReceivedInput) => set({ amountReceivedInput }),
  setSaleError: (saleError) => set({ saleError }),
  setToast: (toast) => set({ toast }),
  
  setShowCartModal: (showCartModal) => set({ showCartModal }),
  setShowCheckoutModal: (showCheckoutModal) => set({ showCheckoutModal }),
  setShowSuccessModal: (showSuccessModal) => set({ showSuccessModal }),
  setShowCustomerModal: (showCustomerModal) => set({ showCustomerModal }),

  resetSaleFlow: () => {
    set({
      amountReceivedInput: '',
      paymentMethod: 'Cash',
      saleError: '',
      activeCheckoutInput: { type: 'amount' },
      selectedCustomerId: null,
      selectedCustomerName: null,
      showCartModal: false,
      showCheckoutModal: false,
      toast: null,
    });
  },

  handleCompleteSale: async (cashierDisplayName, shiftId, onSaleCompleted) => {
    const state = get();
    const cartGrossSubtotal = state.cart.reduce((sum, item) => sum + getCartItemGrossTotal(item), 0);
    const cartDiscountTotal = state.cart.reduce((sum, item) => sum + getCartItemDiscount(item), 0);
    const cartSubtotal = state.cart.reduce((sum, item) => sum + getCartItemNetTotal(item), 0);
    
    let amountReceived = Number(state.amountReceivedInput) || 0;
    let changeAmount = Math.max(amountReceived - cartSubtotal, 0);
    let status = 'completed';

    if (state.paymentMethod === 'Utang') {
      status = 'pending';
    }

    if (state.cart.length === 0) {
      set({ saleError: 'Add at least one product before completing the sale.' });
      return false;
    }

    if (state.paymentMethod !== 'Utang' && amountReceived < cartSubtotal) {
      set({ saleError: 'Amount received must cover the total payable.' });
      return false;
    }

    try {
      set({ isSubmittingSale: true, saleError: '' });

      const receiptNumber = buildReceiptNumber();
      const response = await apiClient.post('/sales', {
        amountPaid: amountReceived,
        changeAmount,
        customerId: state.selectedCustomerId,
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
        status,
      });

      const createdSale = response.data;

      const completedSale: CompletedSale = {
        id: createdSale.id,
        amountPaid: amountReceived,
        cashierName: cashierDisplayName,
        changeAmount,
        createdAt: new Date().toISOString(),
        customerId: state.selectedCustomerId,
        customerName: state.selectedCustomerName,
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
      get().setToast({ message: 'Sale completed successfully', type: 'success' });

      if (onSaleCompleted) {
        await onSaleCompleted();
      }

      return true;
    } catch (error) {
      const msg = getApiErrorMessage(error, 'Could not complete the sale right now.');
      set({ saleError: msg });
      get().setToast({ message: msg, type: 'error' });
      return false;
    } finally {
      set({ isSubmittingSale: false });
    }
  },
}));
