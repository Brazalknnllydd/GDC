import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { CheckCircle2, QrCode } from 'lucide-react-native';

import { useCashierStore, getCartItemGrossTotal, getCartItemDiscount, getCartItemNetTotal } from '../../store/cashier-store';
import { AdminModalShell } from '../ui/admin-modal-shell';
import { ModalActions } from '../ui/modal-actions';
import { AppButton } from '../ui/app-button';
import { SurfaceCard } from '../ui/surface-card';
import { AppSegmentedControl } from '../ui/app-segmented-control';
import { CashierCartItemRow } from './cashier-cart-item-row';
import { CashierKeypad } from './cashier-keypad';
import { cashierPaymentMethods } from './cashier-screen-data';
import { formatPeso } from '../../lib/product-utils';
import { formatPaymentMethod } from '../../lib/cashier-formatters';
import { apiClient } from '../../lib/api';
import { colors, fonts, textSizes } from '../../constants/theme';
import { spacing, radius } from '../../constants/design-system';

export function CartModal() {
  const { height } = useWindowDimensions();
  const {
    cart,
    showCartModal,
    setShowCartModal,
    setShowCheckoutModal,
    updateCartQuantity,
    removeFromCart,
    activeCheckoutInput,
    selectedCustomerId,
    selectedCustomerName,
    setShowCustomerModal,
  } = useCashierStore();

  const cartGrossSubtotal = cart.reduce((sum, item) => sum + getCartItemGrossTotal(item), 0);
  const cartDiscountTotal = cart.reduce((sum, item) => sum + getCartItemDiscount(item), 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + getCartItemNetTotal(item), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const activeDiscountItem = activeCheckoutInput.type === 'discount'
    ? cart.find((item) => item.id === activeCheckoutInput.productId) ?? null
    : null;

  return (
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
      visible={showCartModal}
    >
      <ScrollView
        contentContainerStyle={styles.modalContent}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={styles.modalScroll}>
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
          <Text style={styles.emptyText}>Your cart is empty.</Text>
        )}
      </ScrollView>

      <View style={{ paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: textSizes.small, color: colors.textSecondary, fontFamily: fonts.medium }}>CUSTOMER</Text>
          <Text style={{ fontSize: textSizes.body, color: colors.text, fontFamily: fonts.bold }}>
            {selectedCustomerName || 'Walk-in'}
          </Text>
        </View>
        <AppButton 
          label={selectedCustomerId ? "Change" : "Attach"} 
          variant="secondary" 
          size="sm" 
          onPress={() => {
            setShowCustomerModal(true);
          }}
          fullWidth={false}
        />
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatPeso(cartGrossSubtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Discount</Text>
          <Text style={styles.summaryValue}>- {formatPeso(cartDiscountTotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Items</Text>
          <Text style={styles.summaryValue}>{cartItemCount}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>{formatPeso(cartSubtotal)}</Text>
        </View>
      </View>
    </AdminModalShell>
  );
}

export function SuccessModal({ onNewSale, onViewReceipt }: { onNewSale: () => void, onViewReceipt: () => void }) {
  const { height } = useWindowDimensions();
  const { showSuccessModal, setShowSuccessModal, completedSale } = useCashierStore();

  return (
    <AdminModalShell
      footer={
        <ModalActions stacked>
          <AppButton
            label="New Sale"
            onPress={onNewSale}
            variant="success"
          />
          <AppButton
            icon={({ color, size }) => <QrCode color={color} size={size} strokeWidth={2.1} />}
            label="View Receipt"
            onPress={onViewReceipt}
            variant="successOutline"
          />
        </ModalActions>
      }
      height={Math.min(height * 0.74, 620)}
      onClose={() => setShowSuccessModal(false)}
      title="Payment Success"
      visible={showSuccessModal}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.modalContent}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <CheckCircle2 color={colors.success} size={64} strokeWidth={2.2} />
          <Text style={{ fontFamily: fonts.bold, fontSize: 24, marginTop: 10 }}>Payment Success</Text>
        </View>

        {completedSale ? (
          <>
            <SurfaceCard style={{ padding: 16, marginBottom: 16 }}>
              <View style={styles.detailRow}>
                <Text style={styles.summaryLabel}>Receipt No</Text>
                <Text style={styles.detailValue}>#{completedSale.receiptNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.summaryLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>
                  {new Date(completedSale.createdAt).toLocaleString('en-PH', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.summaryLabel}>Cashier</Text>
                <Text style={styles.detailValue}>{completedSale.cashierName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.summaryLabel}>Customer</Text>
                <Text style={styles.detailValue}>{completedSale.customerName || 'Walk-in'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.summaryLabel}>Payment Method</Text>
                <Text style={styles.detailValue}>{formatPaymentMethod(completedSale.paymentMethod)}</Text>
              </View>
            </SurfaceCard>

            {completedSale.items?.length ? (
              <SurfaceCard style={{ padding: 16, marginBottom: 16 }}>
                <Text style={styles.sectionTitle}>ITEMS SOLD</Text>
                {completedSale.items.map((item, index) => (
                  <View
                    key={`${item.product?.name || 'item'}-${index}`}
                    style={[
                      styles.itemRow,
                      index < completedSale.items!.length - 1 && styles.itemRowBorder,
                    ]}>
                    <View style={{ flex: 1, paddingRight: spacing.sm }}>
                      <Text style={styles.itemName}>{item.product?.name || 'Item'}</Text>
                      <Text style={styles.itemMeta}>
                        {item.quantity} x {formatPeso(item.price)}
                      </Text>
                    </View>
                    <Text style={styles.itemTotal}>{formatPeso(item.subtotal)}</Text>
                  </View>
                ))}
              </SurfaceCard>
            ) : null}

            <SurfaceCard style={{ padding: 16 }}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatPeso(completedSale.subtotal)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={styles.summaryDiscountValue}>- {formatPeso(completedSale.discountAmount)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
                <Text style={styles.totalValue}>{formatPeso(completedSale.totalAmount)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Paid</Text>
                <Text style={styles.summaryValue}>{formatPeso(completedSale.amountPaid)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Change</Text>
                <Text style={styles.totalValue}>{formatPeso(completedSale.changeAmount)}</Text>
              </View>
            </SurfaceCard>
          </>
        ) : null}
      </ScrollView>
    </AdminModalShell>
  );
}

export function CheckoutModal({ onComplete }: { onComplete: () => void }) {
  const { height } = useWindowDimensions();
  const {
    showCheckoutModal,
    setShowCheckoutModal,
    cart,
    activeCheckoutInput,
    setActiveCheckoutInput,
    paymentMethod,
    setPaymentMethod,
    amountReceivedInput,
    handleKeypadPress,
    handleKeypadBackspace,
    saleError,
    isSubmittingSale,
  } = useCashierStore();



  const cartGrossSubtotal = cart.reduce((sum, item) => sum + getCartItemGrossTotal(item), 0);
  const cartDiscountTotal = cart.reduce((sum, item) => sum + getCartItemDiscount(item), 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + getCartItemNetTotal(item), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const amountReceived = Number(amountReceivedInput) || 0;
  const changeAmount = Math.max(amountReceived - cartSubtotal, 0);
  const remainingBalance = Math.max(cartSubtotal - amountReceived, 0);
  const hasEnoughPayment = cartSubtotal > 0 && amountReceived >= cartSubtotal;
  const isUtangValid = paymentMethod === 'Utang';
  const canCompleteSale = !isSubmittingSale && cart.length > 0 && (paymentMethod === 'Utang' ? true : hasEnoughPayment);

  return (
    <AdminModalShell
      footer={
        <AppButton
          disabled={!canCompleteSale}
          icon={({ color, size }) => <CheckCircle2 color={color} size={size} strokeWidth={2.2} />}
          label={isSubmittingSale ? 'Completing...' : 'Complete Sale'}
          loading={isSubmittingSale}
          onPress={onComplete}
          variant="success"
        />
      }
      height={Math.min(height * 0.86, 760)}
      onClose={() => setShowCheckoutModal(false)}
      title="Checkout"
      visible={showCheckoutModal}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
        <SurfaceCard style={{ padding: 16, marginBottom: 16 }}>
          <Text style={styles.summaryLabel}>TOTAL PAYABLE</Text>
          <Text style={styles.totalValue}>{formatPeso(cartSubtotal)}</Text>
          <Text style={styles.summaryLabel}>{cartItemCount} items</Text>
          <Text style={styles.discountLine}>Discount: - {formatPeso(cartDiscountTotal)}</Text>
        </SurfaceCard>



        <Text style={styles.fieldLabel}>ITEM DISCOUNTS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {cart.map((item) => {
            const isActive = activeCheckoutInput.type === 'discount' && activeCheckoutInput.productId === item.id;
            const itemDiscount = getCartItemDiscount(item);
            return (
              <Pressable
                key={item.id}
                onPress={() => setActiveCheckoutInput({ type: 'discount', productId: item.id })}
                style={[styles.discountCard, isActive && styles.discountCardActive]}
              >
                <Text style={styles.discountItemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.discountAmount}>
                  ₱ {item.discountInput || '0'}
                </Text>
                {itemDiscount > 0 && (
                  <Text style={{ fontSize: 10, color: colors.success }}>Valid discount</Text>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.fieldLabel}>PAYMENT METHOD</Text>
        <View style={{ marginBottom: 16 }}>
          <AppSegmentedControl
            onChange={setPaymentMethod}
            options={cashierPaymentMethods.map((m) => ({ icon: m.icon, label: m.label, value: m.key }))}
            selected={paymentMethod}
            variant="tile"
          />
        </View>

        <Text style={styles.fieldLabel}>AMOUNT RECEIVED</Text>
        <Pressable
          onPress={() => setActiveCheckoutInput({ type: 'amount' })}
          style={[styles.moneyField, activeCheckoutInput.type === 'amount' && styles.moneyFieldActive]}
        >
          <Text style={styles.moneyValue}>₱ {amountReceivedInput || '0'}</Text>
        </Pressable>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payable</Text>
            <Text style={styles.summaryValue}>{formatPeso(cartSubtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Received</Text>
            <Text style={styles.summaryValue}>{formatPeso(amountReceived)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>{hasEnoughPayment ? 'Change Due' : 'Remaining'}</Text>
            <Text style={styles.totalValue}>{formatPeso(hasEnoughPayment ? changeAmount : remainingBalance)}</Text>
          </View>
        </View>

        {saleError ? <Text style={{ color: colors.danger, marginTop: 10, marginBottom: 10, textAlign: 'center', fontFamily: fonts.medium }}>{saleError}</Text> : null}

        <CashierKeypad onBackspace={handleKeypadBackspace} onKeyPress={handleKeypadPress} />
      </ScrollView>
    </AdminModalShell>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    flexGrow: 1,
    padding: spacing.md,
  },
  modalScroll: {
    flex: 1,
  },
  emptyText: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
  },
  summaryContainer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderPanel,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  detailValue: {
    color: colors.textStrong,
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    textAlign: 'right',
  },
  summaryValue: {
    fontFamily: fonts.semiBold,
    color: colors.textStrong,
  },
  summaryDiscountValue: {
    color: colors.successStrong,
    fontFamily: fonts.semiBold,
  },
  totalLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textStrong,
  },
  totalValue: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.primary,
  },
  fieldLabel: {
    fontFamily: fonts.bold,
    fontSize: textSizes.smallCaps,
    color: colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  moneyField: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.borderPanel,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  moneyFieldActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  moneyValue: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.textStrong,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.borderPanel,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    color: colors.textStrong,
  },
  customerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  customerResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderPanel,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  customerResultName: {
    fontFamily: fonts.medium,
    fontSize: textSizes.body,
    color: colors.textStrong,
  },
  customerResultPhone: {
    fontFamily: fonts.regular,
    fontSize: textSizes.xsmall,
    color: colors.textTertiary,
  },

  discountCard: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.borderPanel,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginRight: spacing.sm,
    width: 120,
    alignItems: 'center',
  },
  discountCardActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  discountItemName: {
    fontFamily: fonts.medium,
    fontSize: textSizes.xsmall,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  discountAmount: {
    fontFamily: fonts.bold,
    fontSize: textSizes.body,
    color: colors.textStrong,
  },
  discountLine: {
    color: colors.successStrong,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: textSizes.smallCaps,
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  itemRowBorder: {
    borderBottomColor: colors.divider,
    borderBottomWidth: 1,
  },
  itemName: {
    color: colors.textStrong,
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  itemMeta: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 2,
  },
  itemTotal: {
    alignSelf: 'center',
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
});
