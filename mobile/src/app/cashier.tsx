import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import {
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
  cashierSections,
} from '../components/cashier/cashier-screen-data';
import { CashierBottomNav, type CashierSection } from '../components/cashier/cashier-bottom-nav';
import { CashierCartItemRow } from '../components/cashier/cashier-cart-item-row';
import { CashierDashboardHeader } from '../components/cashier/cashier-dashboard-header';
import { CashierHistorySection } from '../components/cashier/cashier-history-section';
import { CashierInventorySection } from '../components/cashier/cashier-inventory-section';
import { CashierKeypad } from '../components/cashier/cashier-keypad';
import { CashierProductCard } from '../components/cashier/cashier-product-card';
import { CashierSettingsSection } from '../components/cashier/cashier-settings-section';
import { type Product } from '../components/admin-products/products-screen-data';
import { AppButton } from '../components/ui/app-button';
import { AppSegmentedControl } from '../components/ui/app-segmented-control';
import { AppHeroAction } from '../components/ui/app-hero-action';
import { AppTextAction } from '../components/ui/app-text-action';
import { FilterChip } from '../components/ui/filter-chip';
import { AdminModalShell } from '../components/ui/admin-modal-shell';
import { ModalActions } from '../components/ui/modal-actions';
import { SectionHeading } from '../components/ui/section-heading';
import { SurfaceCard } from '../components/ui/surface-card';
import { layout, radius, shadows, spacing } from '../constants/design-system';
import { colors, fonts, textRoles, textSizes } from '../constants/theme';
import {
  getCartItemDiscount,
  getCartItemGrossTotal,
  getCartItemNetTotal,
  useCashierCheckout,
} from '../hooks/use-cashier-checkout';
import { useCashierWorkspace } from '../hooks/use-cashier-workspace';
import { useResponsiveLayout } from '../hooks/use-responsive-layout';
import { clearAuthSession } from '../lib/auth-session';
import { formatPaymentMethod } from '../lib/cashier-formatters';
import { formatPeso, normalizeNumber } from '../lib/product-utils';

type CashierParams = {
  name?: string;
};

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
  const { height, isTablet, isWideTablet, compactPhone } = useResponsiveLayout();

  const [activeSection, setActiveSection] = useState<CashierSection>('register');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerFeedback, setScannerFeedback] = useState('');
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const {
    categories,
    dashboard,
    products,
    reloadWorkspace,
    screenError,
  } = useCashierWorkspace();

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

  const {
    activeCheckoutInput,
    activeDiscountItem,
    addToCart,
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
    handleCompleteSale,
    handleKeypadBackspace,
    handleKeypadPress,
    hasEnoughPayment,
    isSubmittingSale,
    paymentMethod,
    remainingBalance,
    saleError,
    setActiveCheckoutInput,
    setPaymentMethod,
    setShowCartModal,
    setShowCheckoutModal,
    setShowSuccessModal,
    showCartModal,
    showCheckoutModal,
    showSuccessModal,
    updateCartItemDiscount,
    updateCartQuantity,
    removeFromCart,
  } = useCashierCheckout({
    cashierDisplayName,
    onSaleCompleted: async () => {
      setActiveSection('history');
      await reloadWorkspace();
    },
    shiftId: dashboard.currentShift?.id ?? null,
  });

  useEffect(() => {
    const interval = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setActiveSection('register');
  }, []);

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
  const productCardWidth = isWideTablet ? '31.5%' : isTablet ? '48.2%' : '48%';
  const showInlineCart = isWideTablet;
  const registerSummaryText = dashboard.currentShift ? 'Shift Active' : 'No active shift';

  async function openProductScanner() {
    setScannerFeedback('');

    if (!cameraPermission?.granted) {
      const nextPermission = await requestCameraPermission();

      if (!nextPermission.granted) {
        setScannerFeedback('Camera permission is required to scan product barcodes.');
        setShowScannerModal(true);
        return;
      }
    }

    setScannerEnabled(true);
    setShowScannerModal(true);
  }

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (!scannerEnabled) {
      return;
    }

    const scannedBarcode = result.data.trim();
    const matchedProduct = products.find(
      (product) => product.barcode?.trim() === scannedBarcode
    );

    setScannerEnabled(false);

    if (!matchedProduct) {
      setScannerFeedback(`No product found for barcode ${scannedBarcode}.`);
      setSearchQuery(scannedBarcode);
      setTimeout(() => setScannerEnabled(true), 1400);
      return;
    }

    addToCart(matchedProduct);
    setSelectedCategory('All');
    setSearchQuery('');
    setScannerFeedback(`${matchedProduct.name} added to cart.`);
    setShowScannerModal(false);
  }

  function renderRegisterSection() {
    return (
      <View style={[styles.registerLayout, showInlineCart && styles.registerLayoutWide]}>
        <View style={[styles.registerMain, showInlineCart && styles.registerMainWide]}>
          <View style={[styles.registerHeaderRow, compactPhone && styles.registerHeaderRowCompact]}>
            <View style={styles.registerHeaderText}>
              <Text style={styles.screenTitle}>New Sale</Text>
              <View style={styles.shiftMetaRow}>
                <View style={styles.shiftDot} />
                <Text style={styles.shiftMetaText}>{registerSummaryText}</Text>
              </View>
            </View>

            <AppHeroAction
              icon={<ScanLine color={colors.textInverse} size={18} strokeWidth={2.2} />}
              label="Scan Product"
              onPress={openProductScanner}
              subtitle="Fast barcode lookup"
              style={[styles.scanProductButton, compactPhone && styles.scanProductButtonCompact]}
            />
          </View>

          <View style={styles.searchActionsRow}>
            <View style={styles.searchBox}>
              <Search color={colors.textTertiary} size={18} strokeWidth={2} />
              <TextInput
                onChangeText={setSearchQuery}
                placeholder="Search products..."
                placeholderTextColor={colors.textSubtle}
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            compactPhone ? styles.scrollContentCompact : undefined,
            isTablet ? styles.scrollContentTablet : undefined,
          ]}
          showsVerticalScrollIndicator={false}>
          <CashierDashboardHeader cashierName={cashierDisplayName} currentDate={currentDate} />

          {activeSection === 'register' ? renderRegisterSection() : null}
          {activeSection === 'history' ? (
            <CashierHistorySection dashboard={dashboard} />
          ) : null}
          {activeSection === 'inventory' ? (
            <CashierInventorySection
              onAddProduct={addToCart}
              productCardWidth={productCardWidth}
              products={products}
            />
          ) : null}
          {activeSection === 'settings' ? (
            <CashierSettingsSection
              cashierName={cashierName}
              onLogout={() => {
                void clearAuthSession().finally(() => {
                  router.replace('/');
                });
              }}
              role={dashboard.cashier.role}
              username={dashboard.cashier.username}
            />
          ) : null}

          {screenError ? <Text style={styles.errorText}>{screenError}</Text> : null}
        </ScrollView>

        {!showInlineCart && cart.length > 0 ? (
          <View style={[styles.checkoutBarWrap, compactPhone && styles.checkoutBarWrapCompact]}>
            <SurfaceCard
              style={[
                styles.checkoutBar,
                compactPhone && styles.checkoutBarCompact,
              ]}>
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
            label="Close Scanner"
            onPress={() => setShowScannerModal(false)}
            variant="secondary"
          />
        }
        height={Math.min(height * 0.74, 620)}
        onClose={() => setShowScannerModal(false)}
        title="Scan Product"
        visible={showScannerModal}>
        <View style={styles.scannerContent}>
          {cameraPermission?.granted ? (
            <View style={styles.cameraFrame}>
              <CameraView
                active={showScannerModal}
                facing="back"
                onBarcodeScanned={scannerEnabled ? handleBarcodeScanned : undefined}
                style={styles.cameraPreview}
              />
              <View style={styles.scanGuide} />
            </View>
          ) : (
            <SurfaceCard style={styles.scannerPermissionCard}>
              <Text style={styles.scannerTitle}>Camera access needed</Text>
              <Text style={styles.scannerCopy}>
                Enable camera permission to scan product barcodes.
              </Text>
              <AppButton
                label="Allow Camera"
                onPress={openProductScanner}
                style={styles.scannerPermissionButton}
                variant="primary"
              />
            </SurfaceCard>
          )}

          <Text style={styles.scannerHint}>
            Point the camera at a product barcode to add it to the cart.
          </Text>
          {scannerFeedback ? <Text style={styles.scannerFeedback}>{scannerFeedback}</Text> : null}
        </View>
      </AdminModalShell>

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
            <AppSegmentedControl
              onChange={setPaymentMethod}
              options={cashierPaymentMethods.map((method) => ({
                icon: method.icon,
                label: method.label,
                value: method.key,
              }))}
              selected={paymentMethod}
              variant="tile"
            />
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
              <CheckCircle2 color={colors.textInverse} size={44} strokeWidth={2.2} />
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
    backgroundColor: colors.backgroundMuted,
  },
  page: {
    flex: 1,
    backgroundColor: colors.backgroundMuted,
  },
  scrollContent: {
    paddingBottom: layout.floatingContentPadding,
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.xl,
  },
  scrollContentCompact: {
    paddingBottom: layout.floatingContentPaddingCompact,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
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
  registerHeaderRowCompact: {
    flexDirection: 'column',
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
  scanProductButtonCompact: {
    minWidth: 0,
    width: '100%',
  },
  shiftDot: {
    backgroundColor: colors.dangerAccent,
    borderRadius: radius.round,
    height: 6,
    marginRight: spacing.sm,
    width: 6,
  },
  shiftMetaText: {
    color: colors.textSoft,
    ...textRoles.label,
    fontSize: textSizes.small,
  },
  searchActionsRow: {
    marginBottom: spacing.md,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.borderInput,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
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
    color: colors.textTertiary,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
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
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
  },
  inlineCartItems: {
    maxHeight: 420,
  },
  cartModalContent: {
    paddingBottom: spacing.md,
  },
  emptyCartText: {
    color: colors.textTertiary,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    paddingVertical: spacing.xl,
    textAlign: 'center',
  },
  scannerContent: {
    flex: 1,
  },
  cameraFrame: {
    backgroundColor: '#111827',
    borderRadius: radius.lg,
    flex: 1,
    minHeight: 320,
    overflow: 'hidden',
  },
  cameraPreview: {
    flex: 1,
  },
  scanGuide: {
    borderColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 2,
    height: 120,
    left: '12%',
    opacity: 0.88,
    position: 'absolute',
    right: '12%',
    top: '36%',
  },
  scannerPermissionCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 320,
    padding: spacing.xl,
  },
  scannerTitle: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  scannerCopy: {
    color: colors.textTertiary,
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlign: 'center',
  },
  scannerPermissionButton: {
    marginTop: spacing.lg,
  },
  scannerHint: {
    color: colors.textSoft,
    fontFamily: fonts.medium,
    fontSize: 13,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  scannerFeedback: {
    color: colors.tertiary,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    marginTop: spacing.sm,
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
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: textSizes.small + 1,
  },
  summaryValue: {
    color: colors.textHeading,
    fontFamily: fonts.medium,
    fontSize: textSizes.small + 1,
  },
  summaryDiscountValue: {
    color: colors.successStrong,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.small + 1,
  },
  summaryDivider: {
    backgroundColor: colors.borderSoft,
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
  checkoutBarWrapCompact: {
    left: spacing.md,
    right: spacing.md,
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
  checkoutBarCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  checkoutBarMeta: {
    color: colors.textOnSecondaryMuted,
    ...textRoles.label,
    fontSize: textSizes.small,
  },
  checkoutBarValue: {
    color: colors.textInverse,
    fontFamily: fonts.bold,
    fontSize: textSizes.title,
    marginTop: spacing.xs,
  },
  checkoutButton: {
    minWidth: 132,
  },
  checkoutModalContent: {
    paddingBottom: spacing.sm,
  },
  checkoutSummaryCard: {
    backgroundColor: colors.cardAlt,
    borderColor: colors.borderMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  checkoutSummaryLabel: {
    color: colors.textSecondary,
    ...textRoles.label,
    fontSize: textSizes.smallCaps,
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
  },
  checkoutSummaryValue: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: textSizes.xlarge,
  },
  checkoutSummaryMeta: {
    color: colors.textSubtle,
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
    marginTop: spacing.xs,
  },
  checkoutInputIndicator: {
    backgroundColor: colors.surfaceInfo,
    borderColor: colors.borderInfo,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  checkoutInputIndicatorLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: textSizes.smallCaps,
    letterSpacing: 1.1,
    marginBottom: spacing.xs,
  },
  checkoutInputIndicatorValue: {
    color: colors.secondary,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.body,
  },
  discountPanel: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.borderPanel,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  discountRow: {
    borderBottomColor: colors.divider,
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
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.body,
  },
  discountItemMeta: {
    color: colors.textTertiary,
    fontFamily: fonts.regular,
    fontSize: textSizes.small,
    marginTop: spacing.xs,
  },
  discountNetTotal: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: textSizes.bodyLarge,
  },
  discountInputRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  discountInputPrefix: {
    color: colors.successStrong,
    fontFamily: fonts.bold,
    fontSize: textSizes.medium,
    marginRight: spacing.sm,
  },
  discountAppliedText: {
    color: colors.successStrong,
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
  },
  checkoutFieldLabel: {
    color: colors.textHeading,
    fontFamily: fonts.medium,
    fontSize: textSizes.smallCaps,
    letterSpacing: 1.3,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  paymentMethodsRow: {
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
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.infoStrong,
    borderWidth: 1.5,
  },
  moneyPrefix: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: textSizes.titleLarge,
    marginRight: spacing.sm,
  },
  moneyValue: {
    color: colors.textDark,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: textSizes.medium,
  },
  discountMoneyField: {
    minHeight: 44,
    width: 190,
  },
  discountPlaceholderText: {
    color: colors.textSubtle,
  },
  activeInputBadge: {
    backgroundColor: colors.surfaceOverlay,
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  activeInputBadgeText: {
    color: colors.infoStrong,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.xsmall,
    letterSpacing: 0.7,
  },
  amountIndicatorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  amountIndicatorCard: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.borderMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    minHeight: 62,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  amountIndicatorCardSuccess: {
    backgroundColor: colors.surfaceSuccess,
    borderColor: colors.borderSuccess,
  },
  amountIndicatorCardFail: {
    backgroundColor: colors.surfaceDanger,
    borderColor: colors.borderDanger,
  },
  amountIndicatorLabel: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: textSizes.smallCaps,
    marginBottom: spacing.xs,
  },
  amountIndicatorValue: {
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.body,
  },
  amountIndicatorValueSuccess: {
    color: colors.successStrong,
  },
  amountIndicatorValueFail: {
    color: colors.danger,
  },
  changeField: {
    alignItems: 'center',
    backgroundColor: colors.surfaceNeutral,
    borderColor: colors.borderMuted,
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
    backgroundColor: colors.surfaceSuccess,
    borderColor: colors.borderSuccess,
  },
  changeFieldFail: {
    backgroundColor: colors.surfaceDanger,
    borderColor: colors.borderDanger,
  },
  changeLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
  },
  changeValue: {
    fontFamily: fonts.bold,
    fontSize: textSizes.title,
  },
  changeValueSuccess: {
    color: colors.success,
  },
  changeValueFail: {
    color: colors.danger,
  },
  saleErrorText: {
    backgroundColor: colors.surfaceDanger,
    borderColor: colors.borderDanger,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.danger,
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
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
    backgroundColor: colors.success,
    borderRadius: radius.round,
    height: 92,
    justifyContent: 'center',
    width: 92,
  },
  successTitle: {
    color: colors.successStrong,
    fontFamily: fonts.bold,
    fontSize: textSizes.xlarge,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  successText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  successCard: {
    borderColor: colors.borderSuccess,
    borderWidth: 1,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  successTotalLabel: {
    color: colors.textSecondary,
    ...textRoles.label,
    fontSize: textSizes.smallCaps,
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  successTotalValue: {
    color: colors.successStrong,
    fontFamily: fonts.bold,
    fontSize: textSizes.hero,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  successMiniRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  successMiniCard: {
    backgroundColor: colors.surfaceSuccess,
    borderRadius: radius.md,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  successMiniLabel: {
    color: colors.textSecondary,
    ...textRoles.label,
    fontSize: textSizes.smallCaps,
    marginBottom: spacing.sm,
  },
  successMiniValue: {
    color: colors.successStrong,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.bodyLarge,
  },
  successBreakdownCard: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.borderSuccess,
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
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: textSizes.small + 1,
  },
  successMetaValue: {
    color: colors.textHeading,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.small + 1,
  },
  settingsCopy: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    lineHeight: 22,
  },
  logoutButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.xl,
  },
  errorText: {
    color: colors.dangerStrong,
    fontFamily: fonts.medium,
    fontSize: textSizes.small + 1,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
});
