import { useMemo, useState } from 'react';

import type { Product } from '../components/admin-products/products-screen-data';
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

type UseCashierCheckoutParams = {
  cashierDisplayName: string;
  onSaleCompleted?: () => void | Promise<void>;
  shiftId: number | null;
};

export function useCashierCheckout({
  cashierDisplayName,
  onSaleCompleted,
  shiftId,
}: UseCashierCheckoutParams) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'GCash'>('Cash');
  const [amountReceivedInput, setAmountReceivedInput] = useState('');
  const [showCartModal, setShowCartModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [saleError, setSaleError] = useState('');
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);
  const [activeCheckoutInput, setActiveCheckoutInput] = useState<ActiveCheckoutInput>({
    type: 'amount',
  });
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);

  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );
  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + getCartItemNetTotal(item), 0),
    [cart]
  );
  const cartGrossSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + getCartItemGrossTotal(item), 0),
    [cart]
  );
  const cartDiscountTotal = useMemo(
    () => cart.reduce((sum, item) => sum + getCartItemDiscount(item), 0),
    [cart]
  );
  const amountReceived = Number(amountReceivedInput) || 0;
  const changeAmount = Math.max(amountReceived - cartSubtotal, 0);
  const hasEnoughPayment = cartSubtotal > 0 && amountReceived >= cartSubtotal;
  const remainingBalance = Math.max(cartSubtotal - amountReceived, 0);
  const canCompleteSale = !isSubmittingSale && cart.length > 0 && hasEnoughPayment;
  const activeDiscountItem = useMemo(
    () =>
      activeCheckoutInput.type === 'discount'
        ? cart.find((item) => item.id === activeCheckoutInput.productId) ?? null
        : null,
    [activeCheckoutInput, cart]
  );

  function addToCart(product: Product) {
    const price = normalizeNumber(product.price);

    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);

      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, item.stock),
              }
            : item
        );
      }

      return [
        ...currentCart,
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
      ];
    });
  }

  function updateCartQuantity(productId: number, nextQuantity: number) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: Math.max(1, Math.min(nextQuantity, item.stock)),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(productId: number) {
    setCart((currentCart) => currentCart.filter((item) => item.id !== productId));
  }

  function updateCartItemDiscount(productId: number, nextValue: string) {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              discountInput: sanitizeCurrencyInput(nextValue),
            }
          : item
      )
    );
  }

  function handleKeypadPress(value: string) {
    setSaleError('');

    if (activeCheckoutInput.type === 'discount') {
      setCart((currentCart) =>
        currentCart.map((item) =>
          item.id === activeCheckoutInput.productId
            ? {
                ...item,
                discountInput: appendCurrencyInput(item.discountInput, value),
              }
            : item
        )
      );
      return;
    }

    setAmountReceivedInput((currentValue) => appendCurrencyInput(currentValue, value));
  }

  function handleKeypadBackspace() {
    if (activeCheckoutInput.type === 'discount') {
      setCart((currentCart) =>
        currentCart.map((item) =>
          item.id === activeCheckoutInput.productId
            ? {
                ...item,
                discountInput: item.discountInput.slice(0, -1),
              }
            : item
        )
      );
      return;
    }

    setAmountReceivedInput((currentValue) => currentValue.slice(0, -1));
  }

  function resetSaleFlow() {
    setAmountReceivedInput('');
    setPaymentMethod('Cash');
    setSaleError('');
    setActiveCheckoutInput({ type: 'amount' });
    setCustomerId(null);
    setCustomerName(null);
    setShowCartModal(false);
    setShowCheckoutModal(false);
  }

  async function handleCompleteSale() {
    if (cart.length === 0) {
      setSaleError('Add at least one product before completing the sale.');
      return false;
    }

    if (amountReceived < cartSubtotal) {
      setSaleError('Amount received must cover the total payable.');
      return false;
    }

    try {
      setIsSubmittingSale(true);
      setSaleError('');

      const receiptNumber = buildReceiptNumber();
      await apiClient.post('/sales', {
        amountPaid: amountReceived,
        changeAmount,
        customerId: customerId ?? null,
        discountAmount: cartDiscountTotal,
        items: cart.map((item) => ({
          price: item.price,
          productId: item.id,
          quantity: item.quantity,
          subtotal: getCartItemNetTotal(item),
        })),
        paymentMethod,
        receiptNumber,
        shiftId,
        subtotal: cartGrossSubtotal,
        totalAmount: cartSubtotal,
      });

      setCompletedSale({
        amountPaid: amountReceived,
        cashierName: cashierDisplayName,
        changeAmount,
        createdAt: new Date().toISOString(),
        customerId,
        customerName,
        discountAmount: cartDiscountTotal,
        paymentMethod,
        receiptNumber,
        subtotal: cartGrossSubtotal,
        totalAmount: cartSubtotal,
        items: cart.map((item) => ({
          price: item.price,
          product: { name: item.name },
          quantity: item.quantity,
          subtotal: getCartItemNetTotal(item),
        })),
      });
      setCart([]);
      resetSaleFlow();
      setShowSuccessModal(true);

      if (onSaleCompleted) {
        await onSaleCompleted();
      }

      return true;
    } catch (error) {
      setSaleError(getApiErrorMessage(error, 'Could not complete the sale right now.'));
      return false;
    } finally {
      setIsSubmittingSale(false);
    }
  }

  return {
    activeCheckoutInput,
    activeDiscountItem,
    amountReceived,
    amountReceivedInput,
    canCompleteSale,
    cart,
    cartDiscountTotal,
    cartGrossSubtotal,
    cartItemCount,
    cartSubtotal,
    changeAmount,
    completedSale,
    customerId,
    customerName,
    handleCompleteSale,
    handleKeypadBackspace,
    handleKeypadPress,
    hasEnoughPayment,
    isSubmittingSale,
    paymentMethod,
    remainingBalance,
    saleError,
    setActiveCheckoutInput,
    setAmountReceivedInput,
    setCustomerId,
    setCustomerName,
    setPaymentMethod,
    setSaleError,
    setShowCartModal,
    setShowCheckoutModal,
    setShowSuccessModal,
    showCartModal,
    showCheckoutModal,
    showSuccessModal,
    updateCartItemDiscount,
    updateCartQuantity,
    addToCart,
    removeFromCart,
  };
}
