import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import {
  ArrowRight,
  CheckCircle2,
  LogOut,
  QrCode,
  ScanLine,
  Search,
  ShoppingCart,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  cashierPaymentMethods,
  cashierPerformanceCards,
  cashierSections,
  type CashierDashboardResponse,
  type CashierSaleRecord,
} from '../components/cashier/cashier-screen-data';
import { CashierBottomNav, type CashierSection } from '../components/cashier/cashier-bottom-nav';
import { CashierCartItemRow } from '../components/cashier/cashier-cart-item-row';
import { CashierDashboardHeader } from '../components/cashier/cashier-dashboard-header';
import { CashierKeypad } from '../components/cashier/cashier-keypad';
import { CashierPaymentBreakdownCard } from '../components/cashier/cashier-payment-breakdown-card';
import { CashierPaymentMethodChip } from '../components/cashier/cashier-payment-method-chip';
import { CashierPerformanceCard } from '../components/cashier/cashier-performance-card';
import { CashierProductCard } from '../components/cashier/cashier-product-card';
import { CashierRecentSaleItem } from '../components/cashier/cashier-recent-sale-item';
import { CashierShiftCard } from '../components/cashier/cashier-shift-card';
import { type Category, type Product } from '../components/admin-products/products-screen-data';
import { AppButton } from '../components/ui/app-button';
import { AppHeroAction } from '../components/ui/app-hero-action';
import { AppTextAction } from '../components/ui/app-text-action';
import { FilterChip } from '../components/ui/filter-chip';
import { AdminModalShell } from '../components/ui/admin-modal-shell';
import { ModalActions } from '../components/ui/modal-actions';
import { SectionHeading } from '../components/ui/section-heading';
import { SurfaceCard } from '../components/ui/surface-card';
import { layout, radius, shadows, spacing } from '../constants/design-system';
import { colors, fonts, textRoles } from '../constants/theme';
import { apiClient } from '../lib/api';
import { formatPaymentMethod } from '../lib/cashier-formatters';
import { formatPeso, normalizeNumber } from '../lib/product-utils';

type CashierParams = {
  name?: string;
  userId?: string;
};

type CartItem = {
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

type CompletedSale = {
  amountPaid: number;
  cashierName: string;
  changeAmount: number;
  createdAt: string;
  discountAmount: number;
  paymentMethod: string;
  receiptNumber: string;
  subtotal: number;
  totalAmount: number;
};

type ActiveCheckoutInput =
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
  },
};

function buildReceiptNumber() {
  const stamp = Date.now().toString().slice(-8);
  return `QF-${stamp}`;
}

function formatItemCount(count: number) {
  return `${count} item${count === 1 ? '' : 's'}`;
}

function formatReceiptDateTime(value: string) {
  const date = new Date(value);

  return date.toLocaleString('en-PH', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  });
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

function getCartItemGrossTotal(item: CartItem) {
  return item.price * item.quantity;
}

function getCartItemDiscount(item: CartItem) {
  const parsedDiscount = Number(sanitizeCurrencyInput(item.discountInput)) || 0;
  return Math.max(0, Math.min(parsedDiscount, getCartItemGrossTotal(item)));
}

function getCartItemNetTotal(item: CartItem) {
  return getCartItemGrossTotal(item) - getCartItemDiscount(item);
}

const successColor = '#059669';
const successColorDark = '#047857';
const successSurface = '#ECFDF5';
const failColor = '#DC2626';
const failSurface = '#FEF2F2';
const failBorder = '#FECACA';

function filterProducts(
  products: Product[],
  selectedCategory: string,
  searchQuery: string
) {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'All' || product.category.name === selectedCategory;

    const matchesQuery =
      !normalizedQuery ||
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.category.name.toLowerCase().includes(normalizedQuery) ||
      (product.barcode || '').toLowerCase().includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });
}

export default function CashierScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<CashierParams>();
  const userId = Number(params.userId);
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 820;
  const isWideTablet = width >= 1080;

  const [activeSection, setActiveSection] = useState<CashierSection>('register');
  const [dashboard, setDashboard] = useState<CashierDashboardResponse>(emptyDashboard);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sales, setSales] = useState<CashierSaleRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] =
    useState<(typeof cashierPaymentMethods)[number]['key']>('Cash');
  const [amountReceivedInput, setAmountReceivedInput] = useState('');
  const [showCartModal, setShowCartModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [screenError, setScreenError] = useState('');
  const [saleError, setSaleError] = useState('');
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);
  const [activeCheckoutInput, setActiveCheckoutInput] = useState<ActiveCheckoutInput>({
    type: 'amount',
  });

  const cashierName = useMemo(() => {
    if (dashboard.cashier.name) {
      return dashboard.cashier.name;
    }

    if (typeof params.name === 'string' && params.name.trim()) {
      return params.name.trim();
    }

    return 'Cashier';
  }, [dashboard.cashier.name, params.name]);
  const cashierDisplayName = useMemo(() => {
    if (dashboard.cashier.username?.trim()) {
      return dashboard.cashier.username.trim();
    }

    if (dashboard.cashier.name?.trim()) {
      return dashboard.cashier.name.trim();
    }

    return 'Cashier';
  }, [dashboard.cashier.name, dashboard.cashier.username]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  async function loadScreenData() {
    if (!Number.isInteger(userId) || userId <= 0) {
      setScreenError('Missing cashier account details. Please sign in again.');
      return;
    }

    try {
      setScreenError('');

      const [dashboardResponse, productsResponse, categoriesResponse, salesResponse] =
        await Promise.all([
          apiClient.get<CashierDashboardResponse>(`/cashier/dashboard/${userId}`),
          apiClient.get<Product[]>('/products'),
          apiClient.get<Category[]>('/categories'),
          apiClient.get<CashierSaleRecord[]>('/sales'),
        ]);

      setDashboard(dashboardResponse.data);
      const hasRestrictedCategories = dashboardResponse.data.cashier.allowedCategories.length > 0;
      const allowedIds = new Set(
        dashboardResponse.data.cashier.allowedCategories.map((category) => category.id)
      );
      const visibleCategories = hasRestrictedCategories
        ? categoriesResponse.data.filter((category) => allowedIds.has(category.id))
        : categoriesResponse.data;
      const visibleProducts = hasRestrictedCategories
        ? productsResponse.data.filter((product) => allowedIds.has(product.categoryId))
        : productsResponse.data;

      setProducts(visibleProducts);
      setCategories(visibleCategories);
      setSales(
        salesResponse.data
          .filter((sale) => sale.user?.id === userId)
          .sort(
            (left, right) =>
              new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
          )
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setScreenError(
          error.response?.data?.message ?? 'Could not load cashier workspace right now.'
        );
        return;
      }

      setScreenError('Could not load cashier workspace right now.');
    }
  }

  useEffect(() => {
    loadScreenData();
  }, [userId]);

  useEffect(() => {
    setActiveSection('register');
  }, [userId]);

  useEffect(() => {
    if (selectedCategory === 'All') {
      return;
    }

    const categoryStillExists = categories.some((category) => category.name === selectedCategory);

    if (!categoryStillExists) {
      setSelectedCategory('All');
    }
  }, [categories, selectedCategory]);

  const categoryChips = useMemo(
    () => ['All', ...categories.map((category) => category.name)],
    [categories]
  );

  const filteredProducts = useMemo(
    () => filterProducts(products, selectedCategory, searchQuery),
    [products, selectedCategory, searchQuery]
  );

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
  const recentSales = useMemo(() => sales.slice(0, 8), [sales]);
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
    setShowCartModal(false);
    setShowCheckoutModal(false);
  }

  async function handleCompleteSale() {
    if (!Number.isInteger(userId) || userId <= 0) {
      setSaleError('Missing cashier account details. Please sign in again.');
      return;
    }

    if (cart.length === 0) {
      setSaleError('Add at least one product before completing the sale.');
      return;
    }

    if (amountReceived < cartSubtotal) {
      setSaleError('Amount received must cover the total payable.');
      return;
    }

    try {
      setIsSubmittingSale(true);
      setSaleError('');

      const receiptNumber = buildReceiptNumber();
      await apiClient.post('/sales', {
        amountPaid: amountReceived,
        changeAmount,
        items: cart.map((item) => ({
          price: item.price,
          productId: item.id,
          quantity: item.quantity,
          subtotal: getCartItemNetTotal(item),
        })),
        paymentMethod,
        receiptNumber,
        shiftId: dashboard.currentShift?.id ?? null,
        subtotal: cartGrossSubtotal,
        discountAmount: cartDiscountTotal,
        totalAmount: cartSubtotal,
        userId,
      });

      setCompletedSale({
        amountPaid: amountReceived,
        cashierName: cashierDisplayName,
        changeAmount,
        createdAt: new Date().toISOString(),
        discountAmount: cartDiscountTotal,
        paymentMethod,
        receiptNumber,
        subtotal: cartGrossSubtotal,
        totalAmount: cartSubtotal,
      });
      setCart([]);
      resetSaleFlow();
      setShowSuccessModal(true);
      setActiveSection('history');
      await loadScreenData();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setSaleError(error.response?.data?.message ?? 'Could not complete the sale right now.');
      } else {
        setSaleError('Could not complete the sale right now.');
      }
    } finally {
      setIsSubmittingSale(false);
    }
  }

  const productCardWidth = isWideTablet ? '31.5%' : isTablet ? '48.2%' : '48%';
  const showInlineCart = isWideTablet;
  const registerSummaryText = dashboard.currentShift ? 'Shift Active' : 'No active shift';

  function renderRegisterSection() {
    return (
      <View style={[styles.registerLayout, showInlineCart && styles.registerLayoutWide]}>
        <View style={[styles.registerMain, showInlineCart && styles.registerMainWide]}>
          <View style={styles.registerHeaderRow}>
            <View style={styles.registerHeaderText}>
              <Text style={styles.screenTitle}>New Sale</Text>
              <View style={styles.shiftMetaRow}>
                <View style={styles.shiftDot} />
                <Text style={styles.shiftMetaText}>{registerSummaryText}</Text>
              </View>
            </View>

            <AppHeroAction
              icon={<ScanLine color="#FFFFFF" size={18} strokeWidth={2.2} />}
              label="Scan Product"
              subtitle="Fast barcode lookup"
              style={styles.scanProductButton}
            />
          </View>

          <View style={styles.searchActionsRow}>
            <View style={styles.searchBox}>
              <Search color="#697285" size={18} strokeWidth={2} />
              <TextInput
                onChangeText={setSearchQuery}
                placeholder="Search products..."
                placeholderTextColor="#8A91A4"
                style={styles.searchInput}
                value={searchQuery}
              />
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChipRow}>
            {categoryChips.map((category) => (
              <FilterChip
                key={category}
                active={selectedCategory === category}
                label={category}
                onPress={() => setSelectedCategory(category)}
              />
            ))}
          </ScrollView>

          <View style={styles.productsGrid}>
            {filteredProducts.map((product) => (
              <CashierProductCard
                key={product.id}
                imageUrl={product.imageUrl}
                name={product.name}
                onAdd={() => addToCart(product)}
                price={formatPeso(normalizeNumber(product.price))}
                stock={product.stock}
                style={{ width: productCardWidth }}
              />
            ))}
          </View>

          {filteredProducts.length === 0 ? (
            <SurfaceCard style={styles.emptyStateCard}>
              <Text style={styles.emptyStateTitle}>No products found</Text>
              <Text style={styles.emptyStateText}>
                Try another category or search term.
              </Text>
            </SurfaceCard>
          ) : null}
        </View>

        {showInlineCart ? (
          <SurfaceCard style={styles.inlineCartCard}>
            <View style={styles.inlineCartHeader}>
              <Text style={styles.inlineCartTitle}>Cart Details</Text>
              <Text style={styles.inlineCartCount}>{formatItemCount(cartItemCount)}</Text>
            </View>

            <ScrollView style={styles.inlineCartItems}>
              {cart.length > 0 ? (
                cart.map((item) => (
                  <CashierCartItemRow
                    key={item.id}
                    imageUrl={item.imageUrl}
                    name={item.name}
                    onDecrease={() => updateCartQuantity(item.id, item.quantity - 1)}
                    onIncrease={() => updateCartQuantity(item.id, item.quantity + 1)}
                    onRemove={() => removeFromCart(item.id)}
                    priceText={formatPeso(item.price)}
                    quantity={item.quantity}
                    totalText={formatPeso(item.price * item.quantity)}
                  />
                ))
              ) : (
                <Text style={styles.emptyCartText}>Add products to start a new sale.</Text>
              )}
            </ScrollView>

            <View style={styles.cartSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatPeso(cartGrossSubtotal)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={styles.summaryDiscountValue}>- {formatPeso(cartDiscountTotal)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Items</Text>
                <Text style={styles.summaryValue}>{cartItemCount}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>{formatPeso(cartSubtotal)}</Text>
              </View>
            </View>

            <AppButton
              disabled={cart.length === 0}
              label="Proceed to Checkout"
              onPress={() => setShowCheckoutModal(true)}
              variant="primary"
            />
          </SurfaceCard>
        ) : null}
      </View>
    );
  }

  function renderHistorySection() {
    return (
      <>
        {dashboard.currentShift ? (
          <CashierShiftCard
            durationMinutes={dashboard.currentShift.durationMinutes}
            openingCash={dashboard.currentShift.openingCash}
            startedAt={dashboard.currentShift.startedAt}
            status={dashboard.currentShift.status}
          />
        ) : null}

        <SectionHeading style={styles.sectionLabel}>PERFORMANCE TODAY</SectionHeading>
        <View style={styles.performanceGrid}>
          {cashierPerformanceCards.map((card) => (
            <CashierPerformanceCard
              key={card.key}
              icon={card.icon}
              label={card.label}
              value={
                card.key === 'salesToday'
                  ? formatPeso(dashboard.performance.salesToday)
                  : String(dashboard.performance[card.key])
              }
            />
          ))}
        </View>

        <View style={styles.sectionHeaderRow}>
          <SectionHeading style={styles.sectionHeaderNoMargin}>RECENT SALES</SectionHeading>
          <AppTextAction
            icon={<ArrowRight color={colors.secondary} size={16} strokeWidth={2} />}
            label="VIEW ALL"
          />
        </View>

        <SurfaceCard style={styles.recentSalesCard}>
          {recentSales.length > 0 ? (
            recentSales.map((sale) => (
              <CashierRecentSaleItem
                key={sale.id}
                paymentMethod={sale.paymentMethod}
                receiptNumber={sale.receiptNumber}
                time={sale.createdAt}
                totalAmount={normalizeNumber(sale.totalAmount)}
              />
            ))
          ) : (
            <Text style={styles.emptySalesText}>No sales recorded for this cashier yet.</Text>
          )}
        </SurfaceCard>

        <CashierPaymentBreakdownCard
          drawerVariance={dashboard.totals.drawerVariance}
          paymentBreakdown={dashboard.paymentBreakdown}
          totalReportedSales={dashboard.totals.totalReportedSales}
        />
      </>
    );
  }

  function renderInventorySection() {
    return (
      <>
        <SectionHeading style={styles.sectionLabel}>INVENTORY VIEW</SectionHeading>
        <Text style={styles.inventoryLead}>
          Browse current stock levels and product pricing in the same cashier workspace.
        </Text>
        <View style={styles.productsGrid}>
          {products.map((product) => (
            <CashierProductCard
              key={product.id}
              imageUrl={product.imageUrl}
              name={`${product.name} (${product.stock} ${product.unit})`}
              onAdd={() => addToCart(product)}
              price={formatPeso(normalizeNumber(product.price))}
              stock={product.stock}
              style={{ width: productCardWidth }}
            />
          ))}
        </View>
      </>
    );
  }

  function renderSettingsSection() {
    return (
      <>
        <SectionHeading style={styles.sectionLabel}>CASHIER SETTINGS</SectionHeading>
        <SurfaceCard style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>{cashierName}</Text>
          <Text style={styles.settingsMeta}>@{dashboard.cashier.username}</Text>
          <Text style={styles.settingsMeta}>{dashboard.cashier.role}</Text>
          <View style={styles.settingsDivider} />
          <Text style={styles.settingsCopy}>
            This section is ready for cashier profile, printer, and terminal preferences next.
          </Text>
          <AppButton
            fullWidth={false}
            icon={({ color, size }) => <LogOut color={color} size={size} strokeWidth={2.1} />}
            label="Logout"
            onPress={() => router.replace('/')}
            style={styles.logoutButton}
            variant="danger"
          />
        </SurfaceCard>
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isTablet ? styles.scrollContentTablet : undefined,
          ]}
          showsVerticalScrollIndicator={false}>
          <CashierDashboardHeader cashierName={cashierDisplayName} currentDate={currentDate} />

          {activeSection === 'register' ? renderRegisterSection() : null}
          {activeSection === 'history' ? renderHistorySection() : null}
          {activeSection === 'inventory' ? renderInventorySection() : null}
          {activeSection === 'settings' ? renderSettingsSection() : null}

          {screenError ? <Text style={styles.errorText}>{screenError}</Text> : null}
        </ScrollView>

        {!showInlineCart && cart.length > 0 ? (
          <View style={styles.checkoutBarWrap}>
            <SurfaceCard style={styles.checkoutBar}>
              <View>
                <Text style={styles.checkoutBarMeta}>{formatItemCount(cartItemCount)} Added</Text>
                <Text style={styles.checkoutBarValue}>{formatPeso(cartSubtotal)}</Text>
              </View>
              <AppButton
                fullWidth={false}
                icon={({ color, size }) => (
                  <ShoppingCart color={color} size={size} strokeWidth={2} />
                )}
                label="Checkout"
                onPress={() => setShowCartModal(true)}
                size="sm"
                style={styles.checkoutButton}
                variant="primary"
              />
            </SurfaceCard>
          </View>
        ) : null}

        <CashierBottomNav
          activeKey={activeSection}
          items={cashierSections}
          onSelect={setActiveSection}
        />
      </View>

      <AdminModalShell
        footer={
          <AppButton
            disabled={cart.length === 0}
            label="Proceed to Checkout"
            onPress={() => {
              setShowCartModal(false);
              setShowCheckoutModal(true);
            }}
            variant="primary"
          />
        }
        height={Math.min(height * 0.84, 720)}
        onClose={() => setShowCartModal(false)}
        title="Cart Details"
        visible={!showInlineCart && showCartModal}>
        <ScrollView contentContainerStyle={styles.cartModalContent}>
          <View style={styles.checkoutInputIndicator}>
            <Text style={styles.checkoutInputIndicatorLabel}>NOW EDITING</Text>
            <Text style={styles.checkoutInputIndicatorValue}>
              {activeCheckoutInput.type === 'amount'
                ? 'Amount Received'
                : `Discount - ${activeDiscountItem?.name ?? 'Selected Item'}`}
            </Text>
          </View>

          {cart.length > 0 ? (
            cart.map((item) => (
              <CashierCartItemRow
                key={item.id}
                imageUrl={item.imageUrl}
                name={item.name}
                onDecrease={() => updateCartQuantity(item.id, item.quantity - 1)}
                onIncrease={() => updateCartQuantity(item.id, item.quantity + 1)}
                onRemove={() => removeFromCart(item.id)}
                priceText={formatPeso(item.price)}
                quantity={item.quantity}
                totalText={formatPeso(item.price * item.quantity)}
              />
            ))
          ) : (
            <Text style={styles.emptyCartText}>Your cart is empty.</Text>
          )}
        </ScrollView>

        <View style={styles.cartSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatPeso(cartGrossSubtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={styles.summaryDiscountValue}>- {formatPeso(cartDiscountTotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items</Text>
            <Text style={styles.summaryValue}>{cartItemCount}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{formatPeso(cartSubtotal)}</Text>
          </View>
        </View>
      </AdminModalShell>

      <AdminModalShell
        footer={
          <AppButton
            disabled={!canCompleteSale}
            icon={({ color, size }) => (
              <CheckCircle2 color={color} size={size} strokeWidth={2.2} />
            )}
            label={isSubmittingSale ? 'Completing...' : 'Complete Sale'}
            loading={isSubmittingSale}
            onPress={handleCompleteSale}
            variant="success"
          />
        }
        height={Math.min(height * 0.86, 760)}
        onClose={() => setShowCheckoutModal(false)}
        title="Checkout"
        visible={showCheckoutModal}>
        <ScrollView
          contentContainerStyle={styles.checkoutModalContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.checkoutSummaryCard}>
            <Text style={styles.checkoutSummaryLabel}>TOTAL PAYABLE</Text>
            <Text style={styles.checkoutSummaryValue}>{formatPeso(cartSubtotal)}</Text>
            <Text style={styles.checkoutSummaryMeta}>
              {formatItemCount(cartItemCount)}{cartDiscountTotal > 0 ? ` • ${formatPeso(cartDiscountTotal)} discount` : ''}
            </Text>
          </View>

          {cart.length > 0 ? (
            <>
              <Text style={styles.checkoutFieldLabel}>PRODUCT DISCOUNTS</Text>
              <View style={styles.discountPanel}>
                {cart.map((item) => {
                  const grossTotal = getCartItemGrossTotal(item);
                  const discountAmount = getCartItemDiscount(item);
                  const netTotal = getCartItemNetTotal(item);

                  return (
                    <View key={item.id} style={styles.discountRow}>
                      <View style={styles.discountRowHeader}>
                        <View style={styles.discountItemTextWrap}>
                          <Text numberOfLines={1} style={styles.discountItemName}>
                            {item.name}
                          </Text>
                          <Text style={styles.discountItemMeta}>
                            {item.quantity} x {formatPeso(item.price)} • Max {formatPeso(grossTotal)}
                          </Text>
                        </View>
                        <Text style={styles.discountNetTotal}>{formatPeso(netTotal)}</Text>
                      </View>

                      <View style={styles.discountInputRow}>
                        <Pressable
                          onPress={() =>
                            setActiveCheckoutInput({
                              productId: item.id,
                              type: 'discount',
                            })
                          }
                          style={[
                            styles.moneyField,
                            styles.discountMoneyField,
                            activeCheckoutInput.type === 'discount' &&
                            activeCheckoutInput.productId === item.id
                              ? styles.moneyFieldActive
                              : undefined,
                          ]}>
                          <Text style={styles.discountInputPrefix}>P</Text>
                          <Text
                            style={[
                              styles.moneyValue,
                              !item.discountInput && styles.discountPlaceholderText,
                            ]}>
                            {item.discountInput || '0'}
                          </Text>
                          {activeCheckoutInput.type === 'discount' &&
                          activeCheckoutInput.productId === item.id ? (
                            <View style={styles.activeInputBadge}>
                              <Text style={styles.activeInputBadgeText}>ACTIVE</Text>
                            </View>
                          ) : null}
                        </Pressable>
                        <Text style={styles.discountAppliedText}>
                          Discount: {formatPeso(discountAmount)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          ) : null}

          <Text style={styles.checkoutFieldLabel}>PAYMENT METHOD</Text>
          <View style={styles.paymentMethodsRow}>
            {cashierPaymentMethods.map((method) => (
              <CashierPaymentMethodChip
                active={paymentMethod === method.key}
                icon={method.icon}
                key={method.key}
                label={method.label}
                onPress={() => setPaymentMethod(method.key)}
              />
            ))}
          </View>

          <Text style={styles.checkoutFieldLabel}>AMOUNT RECEIVED</Text>
          <Pressable
            onPress={() => setActiveCheckoutInput({ type: 'amount' })}
            style={[
              styles.moneyField,
              activeCheckoutInput.type === 'amount' ? styles.moneyFieldActive : undefined,
            ]}>
            <Text style={styles.moneyPrefix}>P</Text>
            <Text style={styles.moneyValue}>{amountReceivedInput || '0'}</Text>
            {activeCheckoutInput.type === 'amount' ? (
              <View style={styles.activeInputBadge}>
                <Text style={styles.activeInputBadgeText}>ACTIVE</Text>
              </View>
            ) : null}
          </Pressable>

          <View style={styles.amountIndicatorRow}>
            <View style={styles.amountIndicatorCard}>
              <Text style={styles.amountIndicatorLabel}>Payable</Text>
              <Text style={styles.amountIndicatorValue}>{formatPeso(cartSubtotal)}</Text>
            </View>
            <View style={styles.amountIndicatorCard}>
              <Text style={styles.amountIndicatorLabel}>Received</Text>
              <Text style={styles.amountIndicatorValue}>{formatPeso(amountReceived)}</Text>
            </View>
            <View
              style={[
                styles.amountIndicatorCard,
                hasEnoughPayment ? styles.amountIndicatorCardSuccess : styles.amountIndicatorCardFail,
              ]}>
              <Text style={styles.amountIndicatorLabel}>
                {hasEnoughPayment ? 'Change Due' : 'Remaining'}
              </Text>
              <Text
                style={[
                  styles.amountIndicatorValue,
                  hasEnoughPayment
                    ? styles.amountIndicatorValueSuccess
                    : styles.amountIndicatorValueFail,
                ]}>
                {formatPeso(hasEnoughPayment ? changeAmount : remainingBalance)}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.changeField,
              hasEnoughPayment ? styles.changeFieldSuccess : styles.changeFieldFail,
            ]}>
            <Text style={styles.changeLabel}>CHANGE</Text>
            <Text
              style={[
                styles.changeValue,
                hasEnoughPayment ? styles.changeValueSuccess : styles.changeValueFail,
              ]}>
              {formatPeso(changeAmount)}
            </Text>
          </View>

          <CashierKeypad onBackspace={handleKeypadBackspace} onKeyPress={handleKeypadPress} />
          {saleError ? <Text style={styles.saleErrorText}>{saleError}</Text> : null}
        </ScrollView>
      </AdminModalShell>

      <AdminModalShell
        footer={
          <ModalActions stacked>
            <AppButton
              label="New Sale"
              onPress={() => {
                setShowSuccessModal(false);
                setActiveSection('register');
              }}
              variant="success"
            />
            <AppButton
              icon={({ color, size }) => <QrCode color={color} size={size} strokeWidth={2.1} />}
              label="View Receipt"
              onPress={() => setShowSuccessModal(false)}
              variant="successOutline"
            />
          </ModalActions>
        }
        height={Math.min(height * 0.74, 620)}
        onClose={() => setShowSuccessModal(false)}
        title="Payment Success"
        visible={showSuccessModal}>
        <ScrollView
          contentContainerStyle={styles.successModalContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.successIconWrap}>
            <View style={styles.successIconInner}>
              <CheckCircle2 color="#FFFFFF" size={44} strokeWidth={2.2} />
            </View>
          </View>
          <Text style={styles.successTitle}>Payment Success</Text>
          <Text style={styles.successText}>The transaction has been processed.</Text>

          {completedSale ? (
            <SurfaceCard style={styles.successCard}>
              <Text style={styles.successTotalLabel}>TOTAL PAID</Text>
              <Text style={styles.successTotalValue}>{formatPeso(completedSale.totalAmount)}</Text>

              <View style={styles.successMiniRow}>
                <View style={styles.successMiniCard}>
                  <Text style={styles.successMiniLabel}>CHANGE</Text>
                  <Text style={styles.successMiniValue}>
                    {formatPeso(completedSale.changeAmount)}
                  </Text>
                </View>
                <View style={styles.successMiniCard}>
                  <Text style={styles.successMiniLabel}>RECEIVED</Text>
                  <Text style={styles.successMiniValue}>
                    {formatPeso(completedSale.amountPaid)}
                  </Text>
                </View>
              </View>

              <View style={styles.successBreakdownCard}>
                <View style={styles.successMetaRow}>
                  <Text style={styles.successMetaLabel}>Original Price</Text>
                  <Text style={styles.successMetaValue}>{formatPeso(completedSale.subtotal)}</Text>
                </View>
                <View style={styles.successMetaRow}>
                  <Text style={styles.successMetaLabel}>Discount</Text>
                  <Text style={styles.successMetaValue}>
                    - {formatPeso(completedSale.discountAmount)}
                  </Text>
                </View>
                <View style={styles.successMetaRow}>
                  <Text style={styles.successMetaLabel}>Discounted Price</Text>
                  <Text style={styles.successMetaValue}>
                    {formatPeso(completedSale.totalAmount)}
                  </Text>
                </View>
                <View style={styles.successMetaRow}>
                  <Text style={styles.successMetaLabel}>Payment Method</Text>
                  <Text style={styles.successMetaValue}>
                    {formatPaymentMethod(completedSale.paymentMethod)}
                  </Text>
                </View>
                <View style={styles.successMetaRow}>
                  <Text style={styles.successMetaLabel}>Amount Received</Text>
                  <Text style={styles.successMetaValue}>
                    {formatPeso(completedSale.amountPaid)}
                  </Text>
                </View>
                <View style={styles.successMetaRow}>
                  <Text style={styles.successMetaLabel}>Change</Text>
                  <Text style={styles.successMetaValue}>
                    {formatPeso(completedSale.changeAmount)}
                  </Text>
                </View>
              </View>

              <View style={styles.successMetaRow}>
                <Text style={styles.successMetaLabel}>Receipt No</Text>
                <Text style={styles.successMetaValue}>{completedSale.receiptNumber}</Text>
              </View>
              <View style={styles.successMetaRow}>
                <Text style={styles.successMetaLabel}>Cashier</Text>
                <Text style={styles.successMetaValue}>{completedSale.cashierName}</Text>
              </View>
              <View style={styles.successMetaRow}>
                <Text style={styles.successMetaLabel}>Amount Paid</Text>
                <Text style={styles.successMetaValue}>{formatPeso(completedSale.amountPaid)}</Text>
              </View>
              <View style={styles.successMetaRow}>
                <Text style={styles.successMetaLabel}>Date & Time</Text>
                <Text style={styles.successMetaValue}>
                  {formatReceiptDateTime(completedSale.createdAt)}
                </Text>
              </View>
            </SurfaceCard>
          ) : null}
        </ScrollView>
      </AdminModalShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7FA',
  },
  page: {
    flex: 1,
    backgroundColor: '#F7F7FA',
  },
  scrollContent: {
    paddingBottom: 178,
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.xl,
  },
  scrollContentTablet: {
    alignSelf: 'center',
    maxWidth: 1280,
    width: '100%',
  },
  registerLayout: {
    width: '100%',
  },
  registerLayoutWide: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  registerMain: {
    width: '100%',
  },
  registerMainWide: {
    flex: 1,
  },
  registerHeaderRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  registerHeaderText: {
    flex: 1,
  },
  screenTitle: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: 22,
    marginBottom: spacing.xs,
  },
  shiftMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  scanProductButton: {
    minWidth: 194,
  },
  shiftDot: {
    backgroundColor: '#D22D2D',
    borderRadius: radius.round,
    height: 6,
    marginRight: spacing.sm,
    width: 6,
  },
  shiftMetaText: {
    color: '#4B5563',
    ...textRoles.label,
    fontSize: 12,
  },
  searchActionsRow: {
    marginBottom: spacing.md,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D7DCEC',
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    color: '#232938',
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    marginLeft: spacing.sm,
  },
  categoryChipRow: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  emptyStateCard: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  emptyStateTitle: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    color: '#697285',
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlign: 'center',
  },
  inlineCartCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    width: 360,
  },
  inlineCartHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  inlineCartTitle: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: 20,
  },
  inlineCartCount: {
    color: '#5B6477',
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  inlineCartItems: {
    maxHeight: 420,
  },
  cartModalContent: {
    paddingBottom: spacing.md,
  },
  emptyCartText: {
    color: '#697285',
    fontFamily: fonts.regular,
    fontSize: 14,
    paddingVertical: spacing.xl,
    textAlign: 'center',
  },
  cartSummary: {
    marginTop: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    color: '#5D6476',
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  summaryValue: {
    color: '#2D3342',
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  summaryDiscountValue: {
    color: successColorDark,
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  summaryDivider: {
    backgroundColor: '#E6EAF4',
    height: 1,
    marginVertical: spacing.md,
  },
  totalLabel: {
    color: colors.secondary,
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  totalValue: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  checkoutBarWrap: {
    bottom: 84,
    left: layout.screenPaddingX,
    position: 'absolute',
    right: layout.screenPaddingX,
  },
  checkoutBar: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.floating,
  },
  checkoutBarMeta: {
    color: '#D8DEFF',
    ...textRoles.label,
    fontSize: 12,
  },
  checkoutBarValue: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontSize: 18,
    marginTop: spacing.xs,
  },
  checkoutButton: {
    minWidth: 132,
  },
  checkoutModalContent: {
    paddingBottom: spacing.sm,
  },
  checkoutSummaryCard: {
    backgroundColor: '#F8F9FD',
    borderColor: '#DDE2F0',
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  checkoutSummaryLabel: {
    color: '#5F6678',
    ...textRoles.label,
    fontSize: 11,
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
  },
  checkoutSummaryValue: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: 24,
  },
  checkoutSummaryMeta: {
    color: '#80879A',
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  checkoutInputIndicator: {
    backgroundColor: '#EEF3FF',
    borderColor: '#CAD7FB',
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  checkoutInputIndicatorLabel: {
    color: '#60708D',
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.1,
    marginBottom: spacing.xs,
  },
  checkoutInputIndicatorValue: {
    color: colors.secondary,
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  discountPanel: {
    backgroundColor: '#F8FAFF',
    borderColor: '#DDE4F3',
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  discountRow: {
    borderBottomColor: '#E1E7F2',
    borderBottomWidth: 1,
    paddingVertical: spacing.sm,
  },
  discountRowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  discountItemTextWrap: {
    flex: 1,
    paddingRight: spacing.md,
  },
  discountItemName: {
    color: '#1A2030',
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  discountItemMeta: {
    color: '#697285',
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  discountNetTotal: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  discountInputRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  discountInputPrefix: {
    color: successColorDark,
    fontFamily: fonts.bold,
    fontSize: 16,
    marginRight: spacing.sm,
  },
  discountAppliedText: {
    color: successColorDark,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  checkoutFieldLabel: {
    color: '#434A5B',
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.3,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  moneyField: {
    alignItems: 'center',
    borderColor: colors.secondary,
    borderRadius: radius.md,
    borderWidth: 1.3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  moneyFieldActive: {
    backgroundColor: '#F3F6FF',
    borderColor: '#2A3CC7',
    borderWidth: 1.5,
  },
  moneyPrefix: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: 20,
    marginRight: spacing.sm,
  },
  moneyValue: {
    color: '#1A2030',
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  discountMoneyField: {
    minHeight: 44,
    width: 190,
  },
  discountPlaceholderText: {
    color: '#96A0B5',
  },
  activeInputBadge: {
    backgroundColor: '#E0E7FF',
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  activeInputBadgeText: {
    color: '#3142BD',
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 0.7,
  },
  amountIndicatorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  amountIndicatorCard: {
    backgroundColor: '#F6F8FC',
    borderColor: '#DEE4EF',
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    minHeight: 62,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  amountIndicatorCardSuccess: {
    backgroundColor: successSurface,
    borderColor: '#A7F3D0',
  },
  amountIndicatorCardFail: {
    backgroundColor: failSurface,
    borderColor: failBorder,
  },
  amountIndicatorLabel: {
    color: '#6B7280',
    fontFamily: fonts.medium,
    fontSize: 11,
    marginBottom: spacing.xs,
  },
  amountIndicatorValue: {
    color: '#1A2030',
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  amountIndicatorValueSuccess: {
    color: successColorDark,
  },
  amountIndicatorValueFail: {
    color: failColor,
  },
  changeField: {
    alignItems: 'center',
    backgroundColor: '#F4F4F6',
    borderColor: '#DFE3ED',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  changeFieldSuccess: {
    backgroundColor: successSurface,
    borderColor: '#A7F3D0',
  },
  changeFieldFail: {
    backgroundColor: failSurface,
    borderColor: failBorder,
  },
  changeLabel: {
    color: '#5E6476',
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  changeValue: {
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  changeValueSuccess: {
    color: successColor,
  },
  changeValueFail: {
    color: failColor,
  },
  saleErrorText: {
    backgroundColor: failSurface,
    borderColor: failBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    color: failColor,
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    textAlign: 'center',
  },
  successModalContent: {
    paddingBottom: spacing.sm,
  },
  successIconWrap: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  successIconInner: {
    alignItems: 'center',
    backgroundColor: successColor,
    borderRadius: radius.round,
    height: 92,
    justifyContent: 'center',
    width: 92,
  },
  successTitle: {
    color: successColorDark,
    fontFamily: fonts.bold,
    fontSize: 24,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  successText: {
    color: '#5B6477',
    fontFamily: fonts.regular,
    fontSize: 14,
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  successCard: {
    borderColor: '#A7F3D0',
    borderWidth: 1,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  successTotalLabel: {
    color: '#5C6577',
    ...textRoles.label,
    fontSize: 11,
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  successTotalValue: {
    color: successColorDark,
    fontFamily: fonts.bold,
    fontSize: 30,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  successMiniRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  successMiniCard: {
    backgroundColor: successSurface,
    borderRadius: radius.md,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  successMiniLabel: {
    color: '#5C6577',
    ...textRoles.label,
    fontSize: 11,
    marginBottom: spacing.sm,
  },
  successMiniValue: {
    color: successColorDark,
    fontFamily: fonts.semiBold,
    fontSize: 15,
  },
  successBreakdownCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#D7E3DA',
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  successMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  successMetaLabel: {
    color: '#5B6477',
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  successMetaValue: {
    color: '#1D2433',
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  sectionLabel: {
    marginBottom: spacing.lg,
    marginTop: spacing.section,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    marginTop: spacing.section,
  },
  sectionHeaderNoMargin: {
    marginBottom: 0,
  },
  recentSalesCard: {
    marginBottom: spacing.section,
    overflow: 'hidden',
    paddingVertical: spacing.sm,
  },
  emptySalesText: {
    color: '#697285',
    fontFamily: fonts.regular,
    fontSize: 14,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    textAlign: 'center',
  },
  inventoryLead: {
    color: '#5B6477',
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
  },
  settingsCard: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  settingsTitle: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: 22,
    marginBottom: spacing.xs,
  },
  settingsMeta: {
    color: '#5B6477',
    fontFamily: fonts.medium,
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  settingsDivider: {
    backgroundColor: '#E4E8F2',
    height: 1,
    marginVertical: spacing.lg,
  },
  settingsCopy: {
    color: '#5B6477',
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
  },
  logoutButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.xl,
  },
  errorText: {
    color: '#B3261E',
    fontFamily: fonts.medium,
    fontSize: 13,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
});
