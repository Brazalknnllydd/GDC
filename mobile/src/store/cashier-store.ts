import { create } from 'zustand';

import type { Product, Category } from '../components/admin-products/products-screen-data';
import type { CashierDashboardResponse } from '../components/cashier/cashier-screen-data';
import { apiClient } from '../lib/api';
import { getApiErrorMessage } from '../lib/api-errors';

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
  recipientCashierName?: string | null;
  recipientUserId?: number | null;
  receiptNumber: string;
  saleType?: string;
  subtotal: number;
  totalAmount: number;
  items?: { product?: { name: string }; price: number; quantity: number; subtotal: number }[];
};

export type BuyerMode = 'customer' | 'cashier';

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
    canSupplyCashiers: false,
  },
  currentShift: null,
  internalRecipientCashiers: [],
  inventoryProducts: [],
  paymentBreakdown: [],
  performance: {
    itemsSold: 0,
    salesToday: 0,
    served: 0,
    transactions: 0,
  },
  recentExpenses: [],
  recentSales: [],
  totals: {
    drawerVariance: 0,
    totalReportedSales: 0,
    cashReceived: 0,
    changeGiven: 0,
    expenses: 0,
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
  buyerMode: BuyerMode;
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
  selectedRecipientCashierId: number | null;
  selectedRecipientCashierName: string | null;
  showCustomerModal: boolean;
  toast: { message: string; type: 'success' | 'error' } | null;
};

type CashierActions = {
  loadWorkspace: (options?: { force?: boolean }) => Promise<void>;
  resetWorkspace: () => void;
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
  setBuyerMode: (mode: BuyerMode) => void;
  setCustomer: (id: number | null, name: string | null) => void;
  setRecipientCashier: (id: number | null, name: string | null) => void;
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
  buyerMode: 'customer',
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
  selectedRecipientCashierId: null,
  selectedRecipientCashierName: null,
  toast: null,

  // Actions
  resetWorkspace: () =>
    set({
      activeCheckoutInput: { type: 'amount' },
      amountReceivedInput: '',
      buyerMode: 'customer',
      cart: [],
      categories: [],
      completedSale: null,
      dashboard: emptyDashboard,
      hasLoadedWorkspace: false,
      isSubmittingSale: false,
      isWorkspaceLoading: false,
      paymentMethod: 'Cash',
      products: [],
      saleError: '',
      screenError: '',
      selectedCustomerId: null,
      selectedCustomerName: null,
      selectedRecipientCashierId: null,
      selectedRecipientCashierName: null,
      showCartModal: false,
      showCheckoutModal: false,
      showCustomerModal: false,
      showSuccessModal: false,
      toast: null,
    }),
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
      const isCashier = dashboard.cashier.role.toLowerCase() === 'cashier';
      const allowedIds = new Set(
        dashboard.cashier.allowedCategories.map((category) => category.id)
      );
      
      const visibleCategories = hasRestrictedCategories
        ? categoriesResponse.data.filter((category) => allowedIds.has(category.id))
        : categoriesResponse.data;
        
      const inventoryProducts = dashboard.inventoryProducts ?? [];
      const visibleProductsSource = isCashier ? inventoryProducts : productsResponse.data;
      const visibleProducts = hasRestrictedCategories
        ? visibleProductsSource.filter((product) => allowedIds.has(product.categoryId))
        : visibleProductsSource;

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

  clearCart: () => set({
    amountReceivedInput: '',
    buyerMode: 'customer',
    cart: [],
    selectedCustomerId: null,
    selectedCustomerName: null,
    selectedRecipientCashierId: null,
    selectedRecipientCashierName: null,
  }),

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
  setBuyerMode: (buyerMode) => set((state) => ({
    buyerMode,
    paymentMethod: buyerMode === 'cashier' ? 'Cash' : state.paymentMethod,
    selectedCustomerId: buyerMode === 'cashier' ? null : state.selectedCustomerId,
    selectedCustomerName: buyerMode === 'cashier' ? null : state.selectedCustomerName,
    selectedRecipientCashierId: buyerMode === 'customer' ? null : state.selectedRecipientCashierId,
    selectedRecipientCashierName: buyerMode === 'customer' ? null : state.selectedRecipientCashierName,
  })),
  setCustomer: (id, name) => set({ selectedCustomerId: id, selectedCustomerName: name }),
  setRecipientCashier: (id, name) => set({ selectedRecipientCashierId: id, selectedRecipientCashierName: name }),
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
      buyerMode: 'customer',
      paymentMethod: 'Cash',
      saleError: '',
      activeCheckoutInput: { type: 'amount' },
      selectedCustomerId: null,
      selectedCustomerName: null,
      selectedRecipientCashierId: null,
      selectedRecipientCashierName: null,
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

    if (state.buyerMode === 'cashier') {
      if (!state.dashboard.cashier.canSupplyCashiers) {
        set({ saleError: 'This cashier cannot sell to cashier inventory.' });
        return false;
      }

      if (!state.selectedRecipientCashierId) {
        set({ saleError: 'Choose Cashier C or Cashier D before completing this sale.' });
        return false;
      }

      status = 'completed';
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
        customerId: state.buyerMode === 'customer' ? state.selectedCustomerId : null,
        discountAmount: cartDiscountTotal,
        items: state.cart.map((item) => ({
          price: item.price,
          productId: item.id,
          quantity: item.quantity,
          subtotal: getCartItemNetTotal(item),
        })),
        paymentMethod: state.buyerMode === 'cashier' ? 'Cash' : state.paymentMethod,
        recipientUserId: state.buyerMode === 'cashier' ? state.selectedRecipientCashierId : null,
        receiptNumber,
        saleType: state.buyerMode === 'cashier' ? 'INTERNAL_CASHIER' : 'CUSTOMER',
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
        customerId: state.buyerMode === 'customer' ? state.selectedCustomerId : null,
        customerName: state.buyerMode === 'customer' ? state.selectedCustomerName : null,
        discountAmount: cartDiscountTotal,
        paymentMethod: state.buyerMode === 'cashier' ? 'Cash' : state.paymentMethod,
        recipientCashierName: state.selectedRecipientCashierName,
        recipientUserId: state.selectedRecipientCashierId,
        receiptNumber,
        saleType: state.buyerMode === 'cashier' ? 'INTERNAL_CASHIER' : 'CUSTOMER',
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
