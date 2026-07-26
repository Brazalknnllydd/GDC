import { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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
  UserCircle2,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

import {
  cashierPaymentMethods,
  cashierSections,
} from '../components/cashier/cashier-screen-data';
import { CashierBottomNav, type CashierSection } from '../components/cashier/cashier-bottom-nav';
import { CashierCartItemRow } from '../components/cashier/cashier-cart-item-row';
import { CashierCustomersSection } from '../components/cashier/cashier-customers-section';
import { CashierDashboardHeader } from '../components/cashier/cashier-dashboard-header';
import { CashierHistorySection } from '../components/cashier/cashier-history-section';
import { CashierInventorySection } from '../components/cashier/cashier-inventory-section';
import { CashierKeypad } from '../components/cashier/cashier-keypad';
import { CashierProductCard } from '../components/cashier/cashier-product-card';
import { CashierSettingsSection } from '../components/cashier/cashier-settings-section';
import { ShiftCloseModal } from '../components/cashier/shift-close-modal';
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
import { useCashierStore } from '../store/cashier-store';
import { CartModal, CheckoutModal, SuccessModal } from '../components/cashier/cashier-modals';
import { handlePrintReceipt } from '../lib/receipt-template';
import { useResponsiveLayout } from '../hooks/use-responsive-layout';
import { clearAuthSession } from '../lib/auth-session';
import { formatPaymentMethod } from '../lib/cashier-formatters';
import { formatPeso, normalizeNumber } from '../lib/product-utils';
import { apiClient } from '../lib/api';

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
  const { categories, dashboard, products, loadWorkspace: reloadWorkspace, screenError } = useCashierStore();

  useEffect(() => {
    reloadWorkspace();
  }, [reloadWorkspace]);

  // Shift states
  const [showOpeningCashModal, setShowOpeningCashModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [openingCashInput, setOpeningCashInput] = useState('');
  const [isSavingOpeningCash, setIsSavingOpeningCash] = useState(false);
  const [selectedSaleDetails, setSelectedSaleDetails] = useState<any | null>(null);

  const handleUpdateOpeningCash = async () => {
    const cleanInput = openingCashInput.replace(/,/g, '');
    const amount = Number(cleanInput);
    if (isNaN(amount) || amount < 0) {
      alert('Please enter a valid positive number');
      return;
    }

    setIsSavingOpeningCash(true);
    try {
      await apiClient.put('/cashier/shift/opening-cash', {
        openingCash: amount,
      });
      await reloadWorkspace();
      setShowOpeningCashModal(false);
      setOpeningCashInput('');
    } catch (err) {
      console.error('Failed to update opening cash:', err);
      alert('Failed to update opening cash. Please try again.');
    } finally {
      setIsSavingOpeningCash(false);
    }
  };

  async function handlePrintReceipt(sale: any) {
    if (!sale) return;

    let logoUri = '';
    try {
      const logoAsset = Asset.fromModule(require('../../assets/images/logo.jpg'));
      if (!logoAsset.localUri && Platform.OS !== 'web') {
        await logoAsset.downloadAsync();
      }
      if (Platform.OS === 'web') {
        logoUri = logoAsset.uri;
      } else {
        const localUri = logoAsset.localUri || logoAsset.uri;
        const base64 = await FileSystem.readAsStringAsync(localUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        logoUri = `data:image/jpeg;base64,${base64}`;
      }
    } catch (e) {
      console.error('Failed to load receipt logo:', e);
    }

    const itemsHtml = sale.items && Array.isArray(sale.items)
      ? sale.items.map((item: any) => `
        <tr>
          <td style="padding: 6px 0; font-family: monospace;">${item.product?.name || 'Item'} x ${item.quantity}</td>
          <td style="padding: 6px 0; font-family: monospace; text-align: right;">${formatPeso(normalizeNumber(item.price ?? item.subtotal) * item.quantity)}</td>
        </tr>
      `).join('')
      : '';

    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            @media print {
              @page {
                margin: 0;
              }
              body {
                margin: 1.6cm;
              }
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              color: #111;
              padding: 20px;
              margin: 0;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .logo-img {
              width: 72px;
              height: 72px;
              border-radius: 36px;
              object-fit: cover;
              margin-bottom: 8px;
            }
            .title {
              font-size: 20px;
              font-weight: bold;
              margin: 0 0 4px;
            }
            .subtitle {
              font-size: 12px;
              margin: 0;
            }
            .divider {
              border-top: 1px dashed #333;
              margin: 15px 0;
            }
            .details-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 14px;
            }
            .totals-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 14px;
              margin-top: 10px;
            }
            .totals-table td {
              padding: 4px 0;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoUri ? `<img src="${logoUri}" class="logo-img" />` : ''}
            <h1 class="title">GDC POS RECEIPT</h1>
            <p class="subtitle">GDC Store</p>
            <p class="subtitle">Date: ${new Date(sale.createdAt).toLocaleString()}</p>
            <p class="subtitle">Receipt No: ${sale.receiptNumber}</p>
            <p class="subtitle">Cashier: ${sale.cashierName}</p>
            <p class="subtitle">Customer: ${sale.customerName ?? sale.customer?.name ?? 'Walk-in'}</p>
          </div>

          <div class="divider"></div>

          <table class="details-table">
            <thead>
              <tr>
                <th style="text-align: left; padding-bottom: 8px;">Item</th>
                <th style="text-align: right; padding-bottom: 8px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="divider"></div>

          <table class="totals-table">
            <tr>
              <td>Subtotal:</td>
              <td style="text-align: right;">${formatPeso(sale.subtotal)}</td>
            </tr>
            <tr>
              <td>Discount:</td>
              <td style="text-align: right;">- ${formatPeso(sale.discountAmount)}</td>
            </tr>
            <tr style="font-weight: bold; font-size: 16px;">
              <td>TOTAL:</td>
              <td style="text-align: right;">${formatPeso(sale.totalAmount)}</td>
            </tr>
            <tr>
              <td>Amount Paid:</td>
              <td style="text-align: right;">${formatPeso(sale.amountPaid)}</td>
            </tr>
            <tr>
              <td>Change:</td>
              <td style="text-align: right;">${formatPeso(sale.changeAmount)}</td>
            </tr>
          </table>

          <div class="divider"></div>

          <div class="footer">
            <p style="margin: 0 0 6px;">Thank you for shopping with us!</p>
            <p style="margin: 0;">Please visit again.</p>
          </div>
        </body>
      </html>
    `;

    try {
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        } else {
          alert('Popup blocker is active. Please allow popups to view receipt.');
        }
      } else {
        await Print.printAsync({ html });
      }
    } catch (error) {
      console.error('Failed to print receipt:', error);
      alert('Could not print receipt.');
    }
  }

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

  const { cart, addToCart, setShowCartModal, setShowCheckoutModal, handleCompleteSale, completedSale, setShowSuccessModal, updateCartQuantity, removeFromCart } = useCashierStore();
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartGrossSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartDiscountTotal = cart.reduce((sum, item) => {
    const discountStr = item.discountInput ? item.discountInput.replace(/[^\d.]/g, '') : '0';
    return sum + (Number(discountStr) || 0);
  }, 0);
  const cartSubtotal = cart.reduce((sum, item) => {
    const gross = item.price * item.quantity;
    const discountStr = item.discountInput ? item.discountInput.replace(/[^\d.]/g, '') : '0';
    const discount = Number(discountStr) || 0;
    return sum + (gross - Math.min(gross, discount));
  }, 0);

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
          <CashierDashboardHeader 
            cashierName={cashierDisplayName} 
            currentDate={currentDate} 
          />

          {activeSection === 'register' ? renderRegisterSection() : null}
          {activeSection === 'history' ? (
            <CashierHistorySection
              dashboard={dashboard}
              onEditOpeningCash={() => {
                setOpeningCashInput(
                  dashboard.currentShift?.openingCash !== undefined
                    ? String(dashboard.currentShift.openingCash)
                    : ''
                );
                setShowOpeningCashModal(true);
              }}
              onSelectSale={(sale) => setSelectedSaleDetails(sale)}
            />
          ) : null}
          {activeSection === 'inventory' ? (
            <CashierInventorySection
              onAddProduct={addToCart}
              productCardWidth={productCardWidth}
              products={products}
            />
          ) : null}
          {activeSection === 'customers' ? (
            <CashierCustomersSection />
          ) : null}
          {activeSection === 'settings' ? (
            <CashierSettingsSection
              cashierName={cashierName}
              onCloseShift={() => setShowCloseShiftModal(true)}
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


      {/* Shift Close Modal */}
      <ShiftCloseModal
        shiftId={dashboard.currentShift?.id}
        visible={showCloseShiftModal}
        onClose={() => setShowCloseShiftModal(false)}
        onSuccess={async () => {
          setShowCloseShiftModal(false);
          await reloadWorkspace();
          // Optionally redirect back to login or cashier-shift
          router.replace('/cashier-shift');
        }}
      />
      {/* Opening Cash Input Modal */}
      <AdminModalShell
        footer={
          <ModalActions>
            <AppButton
              label="Cancel"
              onPress={() => setShowOpeningCashModal(false)}
              variant="secondary"
            />
            <AppButton
              disabled={isSavingOpeningCash}
              label={isSavingOpeningCash ? 'Saving...' : 'Save'}
              onPress={handleUpdateOpeningCash}
              variant="primary"
            />
          </ModalActions>
        }
        height={260}
        onClose={() => setShowOpeningCashModal(false)}
        title="Set Opening Cash"
        visible={showOpeningCashModal}>
        <View style={styles.modalInputWrap}>
          <Text style={styles.modalInputLabel}>Opening Cash Amount (₱)</Text>
          <TextInput
            style={styles.modalTextInput}
            keyboardType="numeric"
            placeholder="0.00"
            value={openingCashInput}
            onChangeText={setOpeningCashInput}
          />
        </View>
      </AdminModalShell>

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

      <CartModal />
      <CheckoutModal onComplete={() => handleCompleteSale(cashierDisplayName, dashboard.currentShift?.id ?? null, async () => { setActiveSection('history'); await reloadWorkspace(); })} />
      <SuccessModal onNewSale={() => { setShowSuccessModal(false); setActiveSection('register'); }} onViewReceipt={() => { setShowSuccessModal(false); setSelectedSaleDetails(completedSale); }} />

      {/* Sale Details / Digital Receipt Modal */}
      <AdminModalShell
        footer={
          <ModalActions>
            <AppButton
              label="Print Receipt"
              onPress={() => handlePrintReceipt(selectedSaleDetails)}
              variant="primary"
            />
            <AppButton
              label="Close"
              onPress={() => setSelectedSaleDetails(null)}
              variant="secondary"
            />
          </ModalActions>
        }
        height={Math.min(height * 0.85, 680)}
        onClose={() => setSelectedSaleDetails(null)}
        title="Receipt Details"
        visible={selectedSaleDetails !== null}>
        {selectedSaleDetails ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
            {/* Store Header */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: colors.secondary }}>GDC STORE</Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary }}>POS Receipt</Text>
            </View>

            <SurfaceCard style={{ padding: 16, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary }}>Receipt No</Text>
                <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.textStrong }}>#{selectedSaleDetails.receiptNumber}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary }}>Date & Time</Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.textStrong }}>{formatReceiptDateTime(selectedSaleDetails.createdAt || selectedSaleDetails.time)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary }}>Cashier</Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.textStrong }}>{selectedSaleDetails.cashierName}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary }}>Customer</Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.textStrong }}>
                  {selectedSaleDetails.customerName ?? selectedSaleDetails.customer?.name ?? 'Walk-in'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary }}>Payment Method</Text>
                <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.secondary }}>{formatPaymentMethod(selectedSaleDetails.paymentMethod)}</Text>
              </View>
            </SurfaceCard>

            <Text style={{ fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.2, color: colors.textSecondary, marginBottom: 8 }}>ITEMS PURCHASED</Text>
            <SurfaceCard style={{ paddingVertical: 8, paddingHorizontal: 16, marginBottom: 16 }}>
              {selectedSaleDetails.items && selectedSaleDetails.items.map((item: any, idx: number) => (
                <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomColor: colors.divider, borderBottomWidth: idx === selectedSaleDetails.items.length - 1 ? 0 : 1 }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: colors.textStrong }}>{item.product?.name || 'Item'}</Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary }}>{item.quantity} x {formatPeso(item.price)}</Text>
                  </View>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: colors.textStrong, alignSelf: 'center' }}>
                    {formatPeso(item.price * item.quantity)}
                  </Text>
                </View>
              ))}
            </SurfaceCard>

            <SurfaceCard style={{ padding: 16 }}>
              {selectedSaleDetails.discountAmount > 0 ? (
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary }}>Subtotal</Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.textStrong }}>{formatPeso(selectedSaleDetails.subtotal)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary }}>Discount</Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.danger }}>- {formatPeso(selectedSaleDetails.discountAmount)}</Text>
                  </View>
                  <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: 8 }} />
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: colors.textStrong }}>TOTAL AMOUNT</Text>
                <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: colors.secondary }}>{formatPeso(selectedSaleDetails.totalAmount)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary }}>Amount Paid</Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.textStrong }}>{formatPeso(selectedSaleDetails.amountPaid)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.success }}>Change</Text>
                <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.success }}>{formatPeso(selectedSaleDetails.changeAmount)}</Text>
              </View>
            </SurfaceCard>
          </ScrollView>
        ) : null}
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
  customerTypeRow: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  customerTypeOption: {
    alignItems: 'center',
    backgroundColor: colors.surfaceNeutral,
    borderColor: colors.borderMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  customerTypeOptionActive: {
    backgroundColor: colors.surfaceBrandMuted,
    borderColor: colors.secondary,
  },
  customerTypeRadio: {
    alignItems: 'center',
    borderColor: colors.borderMuted,
    borderRadius: 9,
    borderWidth: 2,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  customerTypeRadioActive: {
    borderColor: colors.secondary,
  },
  customerTypeRadioDot: {
    backgroundColor: colors.secondary,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  customerTypeLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: textSizes.body,
  },
  customerTypeLabelActive: {
    color: colors.secondary,
  },
  customerSearchWrap: {
    marginBottom: spacing.md,
  },
  customerSearchBox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceNeutral,
    borderColor: colors.borderMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  customerSearchInput: {
    color: colors.textStrong,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
  },
  customerSearchHint: {
    color: colors.textSubtle,
    fontFamily: fonts.regular,
    fontSize: textSizes.small,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  customerResultsList: {
    backgroundColor: colors.card,
    borderColor: colors.borderMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  customerResultRow: {
    alignItems: 'center',
    borderBottomColor: colors.divider,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  customerResultName: {
    color: colors.textStrong,
    fontFamily: fonts.medium,
    fontSize: textSizes.body,
  },
  customerResultMeta: {
    color: colors.textSubtle,
    fontFamily: fonts.regular,
    fontSize: textSizes.small,
  },
  customerSelectedRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceBrandMuted,
    borderColor: colors.secondary,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  customerSelectedName: {
    color: colors.secondary,
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.body,
  },
  customerClearText: {
    color: colors.textSubtle,
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
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
  botFab: {
    position: 'absolute',
    bottom: 95,
    right: 20,
    backgroundColor: colors.secondary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 25, 39, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: colors.borderSoft,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  botTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botIconBadge: {
    backgroundColor: colors.surfaceBrandMuted,
    borderRadius: 12,
    padding: 8,
  },
  modalTitle: {
    color: colors.textStrong,
    ...textRoles.value,
    fontSize: 16,
  },
  modalSubtitle: {
    color: colors.success,
    ...textRoles.label,
    fontSize: 12,
    marginTop: 1,
  },
  closeButton: {
    backgroundColor: colors.surfaceNeutral,
    borderRadius: 20,
    padding: 6,
  },
  messagesList: {
    padding: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
    marginVertical: 4,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowBot: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    maxWidth: '82%',
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexShrink: 1,
  },
  messageBubbleUser: {
    backgroundColor: colors.secondary,
    borderBottomRightRadius: 4,
  },
  messageBubbleBot: {
    backgroundColor: colors.surfaceInfo,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    ...textRoles.body,
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextUser: {
    color: colors.white,
  },
  messageTextBot: {
    color: colors.textDark,
  },
  messageTime: {
    ...textRoles.label,
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeUser: {
    color: colors.textOnSecondaryMuted,
  },
  messageTimeBot: {
    color: colors.textSubtle,
  },
  loadingIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  loadingText: {
    color: colors.textSubtle,
    ...textRoles.label,
    fontSize: 12,
  },
  inputArea: {
    alignItems: 'center',
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  chatInput: {
    backgroundColor: colors.surfaceNeutral,
    borderRadius: 24,
    color: colors.textStrong,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  sendButton: {
    backgroundColor: colors.secondary,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceOverlayMuted,
  },
  modalInputWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  modalInputLabel: {
    color: colors.textSecondary,
    ...textRoles.label,
    marginBottom: spacing.sm,
  },
  modalTextInput: {
    backgroundColor: colors.surfaceNeutral,
    borderRadius: radius.md,
    color: colors.textStrong,
    fontFamily: fonts.regular,
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: 16,
  },
});
