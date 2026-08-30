import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Plus, PencilLine, Trash2, Truck } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { tabs as baseTabs, type Category, type Product } from '../components/admin-products/products-screen-data';
import { AdminModalShell } from '../components/ui/admin-modal-shell';
import { AdminPageScreen } from '../components/ui/admin-page-screen';
import { AppButton } from '../components/ui/app-button';
import { AppDataTable, AppDataTableCell, AppDataTableHeader, AppDataTableRow } from '../components/ui/app-data-table';
import { AppSelect } from '../components/ui/app-select';
import { ModalActions } from '../components/ui/modal-actions';
import { ProductFormInput } from '../components/ui/product-form-input';
import { SurfaceCard } from '../components/ui/surface-card';
import { colors, fonts, textRoles, textSizes } from '../constants/theme';
import { radius, spacing } from '../constants/design-system';
import { useRefreshHandler } from '../hooks/use-refresh-handler';
import { useResponsiveLayout } from '../hooks/use-responsive-layout';
import { apiClient } from '../lib/api';
import { getApiErrorMessage } from '../lib/api-errors';
import { formatPeso, normalizeNumber } from '../lib/product-utils';
import { useToastStore } from '../store/toast-store';

type Supplier = {
  createdAt: string;
  id: number;
  name: string;
  notes: string | null;
  phone: string | null;
};

type SupplierPurchaseItem = {
  id: number;
  lineTotal: number | string;
  product: Product;
  productId: number;
  quantity: number;
  salePrice: number | string;
  unitCost: number | string;
};

type SupplierPurchase = {
  chequeCreditDate: string;
  createdAt: string;
  id: number;
  items: SupplierPurchaseItem[];
  notes: string | null;
  purchaseDate: string;
  referenceNumber: string | null;
  supplier: Supplier;
  supplierId: number;
  totalAmount: number | string;
};

type SupplierForm = {
  name: string;
  notes: string;
  phone: string;
};

type PurchaseLineForm = {
  categoryId: string;
  existingItemId?: number;
  mode: 'existing' | 'new';
  productId: string;
  productName: string;
  barcode: string;
  description: string;
  quantity: string;
  salePrice: string;
  unit: string;
  unitCost: string;
  weight: string;
};

type PurchaseForm = {
  chequeCreditDate: string;
  notes: string;
  purchaseDate: string;
  referenceNumber: string;
  supplierId: string;
  supplierName: string;
  supplierNotes: string;
  supplierPhone: string;
  supplierMode: 'existing' | 'new';
  items: PurchaseLineForm[];
};

const newSupplierOption = 'Add new supplier';
const newProductOption = 'Add new product';
const emptySuppliers: Supplier[] = [];
const emptyPurchases: SupplierPurchase[] = [];
const emptyProducts: Product[] = [];
const emptyCategories: Category[] = [];

function formatDateInput(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string) {
  return new Date(value).toLocaleDateString('en-PH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function createEmptyPurchaseLine(): PurchaseLineForm {
  return {
    barcode: '',
    categoryId: '',
    description: '',
    mode: 'existing',
    productId: '',
    productName: '',
    quantity: '1',
    salePrice: '',
    unit: 'pcs',
    unitCost: '',
    weight: '',
  };
}

function createEmptyPurchaseForm(): PurchaseForm {
  const today = formatDateInput(new Date());

  return {
    chequeCreditDate: today,
    items: [createEmptyPurchaseLine()],
    notes: '',
    purchaseDate: today,
    referenceNumber: '',
    supplierId: '',
    supplierMode: 'existing',
    supplierName: '',
    supplierNotes: '',
    supplierPhone: '',
  };
}

function buildLineFromPurchaseItem(item: SupplierPurchaseItem): PurchaseLineForm {
  return {
    barcode: item.product.barcode || '',
    categoryId: String(item.product.categoryId),
    description: item.product.description || '',
    existingItemId: item.id,
    mode: 'existing',
    productId: String(item.productId),
    productName: item.product.name,
    quantity: String(item.quantity),
    salePrice: String(normalizeNumber(item.salePrice)),
    unit: item.product.unit || 'pcs',
    unitCost: String(normalizeNumber(item.unitCost)),
    weight: item.product.weight === null || item.product.weight === undefined ? '' : String(item.product.weight),
  };
}

function buildFormFromPurchase(purchase: SupplierPurchase): PurchaseForm {
  return {
    chequeCreditDate: formatDateInput(new Date(purchase.chequeCreditDate)),
    items: purchase.items.map(buildLineFromPurchaseItem),
    notes: purchase.notes || '',
    purchaseDate: formatDateInput(new Date(purchase.purchaseDate)),
    referenceNumber: purchase.referenceNumber || '',
    supplierId: String(purchase.supplierId),
    supplierMode: 'existing',
    supplierName: '',
    supplierNotes: '',
    supplierPhone: '',
  };
}

function getProductLabel(product: Product) {
  return `${product.name} #${product.id}`;
}

function getCategoryLabel(category: Category) {
  return `${category.name} #${category.id}`;
}

function parseLabelId(value: string) {
  const match = value.match(/#(\d+)$/);
  return match ? match[1] : '';
}

function sanitizeNumber(value: string) {
  return value.replace(/[^\d.]/g, '');
}

function calculatePurchaseTotal(items: PurchaseLineForm[]) {
  return items.reduce(
    (sum, item) => sum + normalizeNumber(item.quantity) * normalizeNumber(item.unitCost),
    0
  );
}

function getPurchaseItemSummary(purchase: SupplierPurchase) {
  return purchase.items
    .map((item) => `${item.product?.name || 'Item'} x ${item.quantity}`)
    .join(', ');
}

function validatePurchaseForm(form: PurchaseForm) {
  if (form.supplierMode === 'existing' && !form.supplierId) {
    return 'Choose a supplier.';
  }

  if (form.supplierMode === 'new' && !form.supplierName.trim()) {
    return 'Supplier name is required.';
  }

  if (!form.purchaseDate || !form.chequeCreditDate) {
    return 'Purchase date and cheque credit date are required.';
  }

  if (form.items.length === 0) {
    return 'Add at least one purchased product.';
  }

  for (const [index, item] of form.items.entries()) {
    if (normalizeNumber(item.quantity) <= 0) {
      return `Quantity is required for item ${index + 1}.`;
    }

    if (normalizeNumber(item.unitCost) < 0 || normalizeNumber(item.salePrice) < 0) {
      return `Prices must be valid for item ${index + 1}.`;
    }

    if (item.mode === 'existing' && !item.productId) {
      return `Choose a product for item ${index + 1}.`;
    }

    if (item.mode === 'new' && (!item.productName.trim() || !item.categoryId)) {
      return `New product name and category are required for item ${index + 1}.`;
    }
  }

  return '';
}

export default function AdminSuppliersScreen() {
  const { compactPhone, isTablet } = useResponsiveLayout();
  const queryClient = useQueryClient();
  const [supplierForm, setSupplierForm] = useState<SupplierForm>({ name: '', notes: '', phone: '' });
  const [supplierModalVisible, setSupplierModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<SupplierPurchase | null>(null);
  const [purchaseForm, setPurchaseForm] = useState<PurchaseForm>(() => createEmptyPurchaseForm());
  const [formMessage, setFormMessage] = useState('');

  const suppliersQuery = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await apiClient.get<Supplier[]>('/suppliers');
      return response.data;
    },
  });
  const purchasesQuery = useQuery({
    queryKey: ['supplier-purchases'],
    queryFn: async () => {
      const response = await apiClient.get<SupplierPurchase[]>('/suppliers/purchases');
      return response.data;
    },
  });
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await apiClient.get<Product[]>('/products');
      return response.data;
    },
  });
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.get<Category[]>('/categories');
      return response.data;
    },
  });

  const suppliers = suppliersQuery.data ?? emptySuppliers;
  const purchases = purchasesQuery.data ?? emptyPurchases;
  const products = productsQuery.data ?? emptyProducts;
  const categories = categoriesQuery.data ?? emptyCategories;
  const displayError =
    suppliersQuery.error?.message ||
    purchasesQuery.error?.message ||
    productsQuery.error?.message ||
    categoriesQuery.error?.message ||
    '';
  const refreshSuppliersPage = useCallback(
    () => Promise.all([
      suppliersQuery.refetch(),
      purchasesQuery.refetch(),
      productsQuery.refetch(),
      categoriesQuery.refetch(),
    ]),
    [categoriesQuery, productsQuery, purchasesQuery, suppliersQuery]
  );
  const { isRefreshing, onRefresh } = useRefreshHandler(refreshSuppliersPage);

  const tabs = useMemo(
    () =>
      baseTabs.map((tab) =>
        tab.label === 'Suppliers'
          ? { ...tab, active: true, route: '/admin-suppliers' as const }
          : { ...tab, active: false }
      ),
    []
  );
  const supplierOptions = useMemo(
    () => [newSupplierOption, ...suppliers.map((supplier) => `${supplier.name} #${supplier.id}`)],
    [suppliers]
  );
  const productOptions = useMemo(
    () => [newProductOption, ...products.map(getProductLabel)],
    [products]
  );
  const categoryOptions = useMemo(() => categories.map(getCategoryLabel), [categories]);
  const purchaseTotal = useMemo(() => calculatePurchaseTotal(purchaseForm.items), [purchaseForm.items]);

  const saveSupplierMutation = useMutation({
    mutationFn: async (values: SupplierForm) => {
      const payload = {
        name: values.name.trim(),
        notes: values.notes.trim() || null,
        phone: values.phone.trim() || null,
      };

      if (editingSupplier) {
        const response = await apiClient.put<Supplier>(`/suppliers/${editingSupplier.id}`, payload);
        return response.data;
      }

      const response = await apiClient.post<Supplier>('/suppliers', payload);
      return response.data;
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, 'Could not save supplier right now.');
      setFormMessage(message);
      useToastStore.getState().showToast(message, 'error');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      closeSupplierModal();
      useToastStore.getState().showToast('Supplier saved successfully.', 'success');
    },
  });

  const savePurchaseMutation = useMutation({
    mutationFn: async (form: PurchaseForm) => {
      const supplierId = await resolveSupplierId(form);
      const payload = {
        chequeCreditDate: form.chequeCreditDate,
        items: form.items.map((item) => ({
          ...(item.existingItemId ? { id: item.existingItemId } : {}),
          quantity: normalizeNumber(item.quantity),
          salePrice: normalizeNumber(item.salePrice),
          unitCost: normalizeNumber(item.unitCost),
          ...(item.mode === 'existing'
            ? { productId: Number(item.productId) }
            : {
                newProduct: {
                  barcode: item.barcode.trim() || null,
                  categoryId: Number(item.categoryId),
                  description: item.description.trim() || null,
                  name: item.productName.trim(),
                  salePrice: normalizeNumber(item.salePrice),
                  unit: item.unit.trim() || 'pcs',
                  weight: item.weight.trim() ? normalizeNumber(item.weight) : null,
                },
              }),
        })),
        notes: form.notes.trim() || null,
        purchaseDate: form.purchaseDate,
        referenceNumber: form.referenceNumber.trim() || null,
        supplierId,
      };

      if (editingPurchase) {
        const response = await apiClient.put<SupplierPurchase>(`/suppliers/purchases/${editingPurchase.id}`, payload);
        return response.data;
      }

      const response = await apiClient.post<SupplierPurchase>('/suppliers/purchases', payload);
      return response.data;
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, 'Could not save supplier purchase right now.');
      setFormMessage(message);
      Alert.alert('Purchase failed', message);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['supplier-purchases'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
      ]);
      closePurchaseModal();
      useToastStore.getState().showToast('Supplier purchase saved and inventory updated.', 'success');
    },
  });

  async function resolveSupplierId(form: PurchaseForm) {
    if (form.supplierMode === 'existing') {
      return Number(form.supplierId);
    }

    const response = await apiClient.post<Supplier>('/suppliers', {
      name: form.supplierName.trim(),
      notes: form.supplierNotes.trim() || null,
      phone: form.supplierPhone.trim() || null,
    });

    return response.data.id;
  }

  function openSupplierModal(supplier?: Supplier) {
    setEditingSupplier(supplier ?? null);
    setSupplierForm({
      name: supplier?.name ?? '',
      notes: supplier?.notes ?? '',
      phone: supplier?.phone ?? '',
    });
    setFormMessage('');
    setSupplierModalVisible(true);
  }

  function closeSupplierModal() {
    setSupplierModalVisible(false);
    setEditingSupplier(null);
    setSupplierForm({ name: '', notes: '', phone: '' });
    setFormMessage('');
  }

  function openPurchaseModal(purchase?: SupplierPurchase) {
    setEditingPurchase(purchase ?? null);
    setPurchaseForm(purchase ? buildFormFromPurchase(purchase) : createEmptyPurchaseForm());
    setFormMessage('');
    setPurchaseModalVisible(true);
  }

  function closePurchaseModal() {
    setPurchaseModalVisible(false);
    setEditingPurchase(null);
    setPurchaseForm(createEmptyPurchaseForm());
    setFormMessage('');
  }

  function updatePurchaseField(field: keyof PurchaseForm, value: string) {
    setPurchaseForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updatePurchaseLine(index: number, nextLine: Partial<PurchaseLineForm>) {
    setPurchaseForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...nextLine,
            }
          : item
      ),
    }));
  }

  function addPurchaseLine() {
    setPurchaseForm((current) => ({
      ...current,
      items: [...current.items, createEmptyPurchaseLine()],
    }));
  }

  function removePurchaseLine(index: number) {
    setPurchaseForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function handleSupplierSelect(value: string) {
    if (value === newSupplierOption) {
      setPurchaseForm((current) => ({
        ...current,
        supplierId: '',
        supplierMode: 'new',
      }));
      return;
    }

    setPurchaseForm((current) => ({
      ...current,
      supplierId: parseLabelId(value),
      supplierMode: 'existing',
    }));
  }

  function handleProductSelect(index: number, value: string) {
    if (value === newProductOption) {
      updatePurchaseLine(index, {
        mode: 'new',
        productId: '',
        productName: '',
        salePrice: '',
        unit: 'pcs',
        unitCost: '',
      });
      return;
    }

    const productId = parseLabelId(value);
    const product = products.find((entry) => entry.id === Number(productId));

    updatePurchaseLine(index, {
      barcode: product?.barcode || '',
      categoryId: product ? String(product.categoryId) : '',
      mode: 'existing',
      productId,
      productName: product?.name || '',
      salePrice: product ? String(normalizeNumber(product.price)) : '',
      unit: product?.unit || 'pcs',
      unitCost: product ? String(normalizeNumber(product.costPrice)) : '',
      weight: product?.weight === null || product?.weight === undefined ? '' : String(product.weight),
    });
  }

  function handleCategorySelect(index: number, value: string) {
    updatePurchaseLine(index, {
      categoryId: parseLabelId(value),
    });
  }

  function handleSaveSupplier() {
    if (!supplierForm.name.trim()) {
      setFormMessage('Supplier name is required.');
      return;
    }

    saveSupplierMutation.mutate(supplierForm);
  }

  function handleSavePurchase() {
    const validationMessage = validatePurchaseForm(purchaseForm);

    if (validationMessage) {
      setFormMessage(validationMessage);
      return;
    }

    savePurchaseMutation.mutate(purchaseForm);
  }

  return (
    <AdminPageScreen
      bottomNavItems={tabs}
      introDescription="Receive supplier purchases, track cheque credit dates, and update inventory as stock arrives."
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      title="Suppliers"
    >
      <View style={[styles.actionRow, compactPhone && styles.actionRowCompact]}>
        <AppButton
          fullWidth={compactPhone}
          icon={Truck}
          label="Add Supplier"
          onPress={() => openSupplierModal()}
          variant="secondary"
        />
        <AppButton
          fullWidth={compactPhone}
          icon={Plus}
          label="Receive Purchase"
          onPress={() => openPurchaseModal()}
          variant="primary"
        />
      </View>

      <SurfaceCard style={styles.summaryCard}>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Suppliers</Text>
            <Text style={styles.summaryValue}>{suppliers.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Purchases</Text>
            <Text style={styles.summaryValue}>{purchases.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Purchased Amount</Text>
            <Text style={styles.summaryValue}>
              {formatPeso(purchases.reduce((sum, purchase) => sum + normalizeNumber(purchase.totalAmount), 0))}
            </Text>
          </View>
        </View>
      </SurfaceCard>

      <Text style={styles.sectionTitle}>Supplier List</Text>
      <SurfaceCard style={styles.tableCard}>
        <AppDataTable>
          <AppDataTableHeader>
            <AppDataTableCell flex={1.6} isHeader text="Supplier" />
            <AppDataTableCell flex={1} isHeader text="Phone" />
            <AppDataTableCell flex={2} isHeader text="Notes" />
            <AppDataTableCell flex={0.7} isHeader numeric text="Actions" />
          </AppDataTableHeader>
          {suppliers.length > 0 ? (
            suppliers.map((supplier) => (
              <AppDataTableRow key={supplier.id}>
                <AppDataTableCell flex={1.6} text={supplier.name} />
                <AppDataTableCell flex={1} text={supplier.phone || '-'} />
                <AppDataTableCell flex={2} text={supplier.notes || '-'} />
                <AppDataTableCell flex={0.7} numeric>
                  <Pressable
                    accessibilityLabel={`Edit supplier ${supplier.name}`}
                    onPress={() => openSupplierModal(supplier)}
                    style={styles.iconButton}
                  >
                    <PencilLine color={colors.secondary} size={15} strokeWidth={2.1} />
                  </Pressable>
                </AppDataTableCell>
              </AppDataTableRow>
            ))
          ) : (
            <Text style={styles.emptyText}>No suppliers yet.</Text>
          )}
        </AppDataTable>
      </SurfaceCard>

      <Text style={styles.sectionTitle}>Recent Purchases</Text>
      <SurfaceCard style={styles.tableCard}>
        <AppDataTable>
          <AppDataTableHeader>
            <AppDataTableCell flex={1.5} isHeader text="Supplier" />
            <AppDataTableCell flex={1} isHeader text="Purchase" />
            <AppDataTableCell flex={1} isHeader text="Cheque Credit" />
            <AppDataTableCell flex={2.2} isHeader text="Items" />
            <AppDataTableCell flex={1} isHeader numeric text="Total" />
            <AppDataTableCell flex={0.7} isHeader numeric text="Edit" />
          </AppDataTableHeader>
          {purchases.length > 0 ? (
            purchases.map((purchase) => (
              <AppDataTableRow key={purchase.id}>
                <AppDataTableCell flex={1.5} text={purchase.supplier.name} />
                <AppDataTableCell flex={1} text={formatDisplayDate(purchase.purchaseDate)} />
                <AppDataTableCell flex={1} text={formatDisplayDate(purchase.chequeCreditDate)} />
                <AppDataTableCell flex={2.2} text={getPurchaseItemSummary(purchase)} />
                <AppDataTableCell flex={1} numeric text={formatPeso(normalizeNumber(purchase.totalAmount))} />
                <AppDataTableCell flex={0.7} numeric>
                  <Pressable
                    accessibilityLabel={`Edit supplier purchase ${purchase.id}`}
                    onPress={() => openPurchaseModal(purchase)}
                    style={styles.iconButton}
                  >
                    <PencilLine color={colors.secondary} size={15} strokeWidth={2.1} />
                  </Pressable>
                </AppDataTableCell>
              </AppDataTableRow>
            ))
          ) : (
            <Text style={styles.emptyText}>No supplier purchases recorded yet.</Text>
          )}
        </AppDataTable>
      </SurfaceCard>

      {displayError ? <Text style={styles.errorText}>{displayError}</Text> : null}

      <AdminModalShell
        footer={
          <ModalActions stacked>
            <AppButton
              label={editingSupplier ? 'Save Supplier' : 'Create Supplier'}
              loading={saveSupplierMutation.isPending}
              onPress={handleSaveSupplier}
              variant="primary"
            />
            <AppButton
              disabled={saveSupplierMutation.isPending}
              label="Cancel"
              onPress={closeSupplierModal}
              variant="secondary"
            />
          </ModalActions>
        }
        height={isTablet ? 520 : 500}
        maxHeight={isTablet ? '76%' : '82%'}
        onClose={closeSupplierModal}
        title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
        visible={supplierModalVisible}
      >
        <ScrollView
          contentContainerStyle={styles.modalScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.modalScroll}
        >
          <ProductFormInput
            compact
            label="SUPPLIER NAME"
            onChangeText={(name) => setSupplierForm((current) => ({ ...current, name }))}
            placeholder="Supplier name"
            value={supplierForm.name}
          />
          <ProductFormInput
            compact
            label="PHONE"
            onChangeText={(phone) => setSupplierForm((current) => ({ ...current, phone }))}
            placeholder="Optional phone number"
            value={supplierForm.phone}
          />
          <ProductFormInput
            compact
            label="NOTES"
            multiline
            numberOfLines={3}
            onChangeText={(notes) => setSupplierForm((current) => ({ ...current, notes }))}
            placeholder="Optional notes"
            value={supplierForm.notes}
          />
          {formMessage ? <Text style={styles.errorText}>{formMessage}</Text> : null}
        </ScrollView>
      </AdminModalShell>

      <AdminModalShell
        footer={
          <ModalActions stacked>
            <AppButton
              label={editingPurchase ? 'Save Purchase Changes' : 'Receive Purchase'}
              loading={savePurchaseMutation.isPending}
              onPress={handleSavePurchase}
              variant="primary"
            />
            <AppButton
              disabled={savePurchaseMutation.isPending}
              label="Cancel"
              onPress={closePurchaseModal}
              variant="secondary"
            />
          </ModalActions>
        }
        height="88%"
        maxHeight="92%"
        onClose={closePurchaseModal}
        title={editingPurchase ? 'Edit Supplier Purchase' : 'Receive Supplier Purchase'}
        visible={purchaseModalVisible}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.fieldLabel}>SUPPLIER</Text>
          <AppSelect
            onValueChange={handleSupplierSelect}
            options={supplierOptions}
            searchable
            searchPlaceholder="Search suppliers"
            value={
              purchaseForm.supplierMode === 'new'
                ? newSupplierOption
                : suppliers.find((supplier) => supplier.id === Number(purchaseForm.supplierId))
                  ? `${suppliers.find((supplier) => supplier.id === Number(purchaseForm.supplierId))!.name} #${purchaseForm.supplierId}`
                  : supplierOptions[0]
            }
          />

          {purchaseForm.supplierMode === 'new' ? (
            <View style={styles.inlinePanel}>
              <ProductFormInput
                compact
                dense
                label="NEW SUPPLIER"
                onChangeText={(value) => updatePurchaseField('supplierName', value)}
                placeholder="Supplier name"
                value={purchaseForm.supplierName}
              />
              <ProductFormInput
                compact
                dense
                label="PHONE"
                onChangeText={(value) => updatePurchaseField('supplierPhone', value)}
                placeholder="Optional phone"
                value={purchaseForm.supplierPhone}
              />
              <ProductFormInput
                compact
                dense
                label="NOTES"
                onChangeText={(value) => updatePurchaseField('supplierNotes', value)}
                placeholder="Optional notes"
                value={purchaseForm.supplierNotes}
              />
            </View>
          ) : null}

          <View style={[styles.dateGrid, compactPhone && styles.dateGridCompact]}>
            <ProductFormInput
              compact
              label="PURCHASE DATE"
              onChangeText={(value) => updatePurchaseField('purchaseDate', value)}
              placeholder="YYYY-MM-DD"
              value={purchaseForm.purchaseDate}
            />
            <ProductFormInput
              compact
              label="CHEQUE CREDIT DATE"
              onChangeText={(value) => updatePurchaseField('chequeCreditDate', value)}
              placeholder="YYYY-MM-DD"
              value={purchaseForm.chequeCreditDate}
            />
          </View>

          <ProductFormInput
            compact
            label="REFERENCE / CHECK NO."
            onChangeText={(value) => updatePurchaseField('referenceNumber', value)}
            placeholder="Optional reference"
            value={purchaseForm.referenceNumber}
          />

          <View style={styles.linesHeader}>
            <Text style={styles.sectionTitleCompact}>Purchased Products</Text>
            <AppButton
              fullWidth={false}
              icon={Plus}
              label="Add Line"
              onPress={addPurchaseLine}
              size="sm"
              variant="secondary"
            />
          </View>

          {purchaseForm.items.map((item, index) => {
            const selectedProduct = products.find((product) => product.id === Number(item.productId));
            const selectedCategory = categories.find((category) => category.id === Number(item.categoryId));

            return (
              <View key={`${item.existingItemId ?? 'new'}-${index}`} style={styles.lineCard}>
                <View style={styles.lineHeader}>
                  <Text style={styles.lineTitle}>Item {index + 1}</Text>
                  {purchaseForm.items.length > 1 ? (
                    <Pressable onPress={() => removePurchaseLine(index)} style={styles.removeLineButton}>
                      <Trash2 color={colors.dangerStrong} size={15} strokeWidth={2.1} />
                    </Pressable>
                  ) : null}
                </View>

                <Text style={styles.fieldLabel}>PRODUCT</Text>
                <AppSelect
                  onValueChange={(value) => handleProductSelect(index, value)}
                  options={productOptions}
                  searchable
                  searchPlaceholder="Search products by name or ID"
                  value={item.mode === 'new' ? newProductOption : selectedProduct ? getProductLabel(selectedProduct) : productOptions[0]}
                />

                {item.mode === 'new' ? (
                  <View style={styles.inlinePanel}>
                    <ProductFormInput
                      compact
                      dense
                      label="PRODUCT NAME"
                      onChangeText={(value) => updatePurchaseLine(index, { productName: value })}
                      placeholder="New product name"
                      value={item.productName}
                    />
                    <Text style={styles.fieldLabel}>CATEGORY</Text>
                    <AppSelect
                      onValueChange={(value) => handleCategorySelect(index, value)}
                      options={categoryOptions}
                      searchable
                      searchPlaceholder="Search categories"
                      value={selectedCategory ? getCategoryLabel(selectedCategory) : categoryOptions[0]}
                    />
                    <ProductFormInput
                      compact
                      dense
                      label="BARCODE"
                      onChangeText={(value) => updatePurchaseLine(index, { barcode: value })}
                      placeholder="Optional barcode"
                      value={item.barcode}
                    />
                    <ProductFormInput
                      compact
                      dense
                      label="UNIT"
                      onChangeText={(value) => updatePurchaseLine(index, { unit: value })}
                      placeholder="pcs"
                      value={item.unit}
                    />
                  </View>
                ) : null}

                <View style={[styles.lineGrid, compactPhone && styles.lineGridCompact]}>
                  <ProductFormInput
                    compact
                    dense
                    keyboardType="numeric"
                    label="QTY"
                    onChangeText={(value) => updatePurchaseLine(index, { quantity: sanitizeNumber(value) })}
                    placeholder="0"
                    value={item.quantity}
                  />
                  <ProductFormInput
                    compact
                    dense
                    keyboardType="numeric"
                    label="UNIT COST"
                    onChangeText={(value) => updatePurchaseLine(index, { unitCost: sanitizeNumber(value) })}
                    placeholder="0.00"
                    value={item.unitCost}
                  />
                  <ProductFormInput
                    compact
                    dense
                    keyboardType="numeric"
                    label="SALE PRICE"
                    onChangeText={(value) => updatePurchaseLine(index, { salePrice: sanitizeNumber(value) })}
                    placeholder="0.00"
                    value={item.salePrice}
                  />
                </View>
                <Text style={styles.lineTotal}>
                  Line total: {formatPeso(normalizeNumber(item.quantity) * normalizeNumber(item.unitCost))}
                </Text>
              </View>
            );
          })}

          <ProductFormInput
            compact
            label="NOTES"
            multiline
            numberOfLines={3}
            onChangeText={(value) => updatePurchaseField('notes', value)}
            placeholder="Optional purchase notes"
            value={purchaseForm.notes}
          />
          <View style={styles.totalPanel}>
            <Text style={styles.summaryLabel}>Purchase Total</Text>
            <Text style={styles.totalValue}>{formatPeso(purchaseTotal)}</Text>
          </View>
          {formMessage ? <Text style={styles.errorText}>{formMessage}</Text> : null}
        </ScrollView>
      </AdminModalShell>
    </AdminPageScreen>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
    marginBottom: spacing.lg,
  },
  actionRowCompact: {
    alignItems: 'stretch',
    flexDirection: 'column',
  },
  summaryCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  summaryItem: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.borderMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    minWidth: 160,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  summaryLabel: {
    color: colors.textSecondary,
    ...textRoles.label,
    fontSize: textSizes.small,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: textSizes.title,
  },
  sectionTitle: {
    color: colors.textStrong,
    ...textRoles.value,
    fontSize: textSizes.large,
    marginBottom: spacing.md,
    marginTop: spacing.section,
  },
  sectionTitleCompact: {
    color: colors.textStrong,
    ...textRoles.value,
    fontSize: textSizes.title,
  },
  tableCard: {
    overflow: 'hidden',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceInfoMuted,
    borderColor: colors.borderInfoStrong,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  errorText: {
    color: colors.dangerStrong,
    ...textRoles.label,
    fontSize: textSizes.body,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: spacing.md,
  },
  fieldLabel: {
    color: colors.textSecondary,
    ...textRoles.label,
    fontSize: textSizes.small,
    letterSpacing: 1.1,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  inlinePanel: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.borderMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  dateGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  dateGridCompact: {
    flexDirection: 'column',
    gap: 0,
  },
  linesHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.section,
  },
  lineCard: {
    borderColor: colors.borderPanel,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  lineHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  lineTitle: {
    color: colors.textStrong,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.bodyLarge,
  },
  removeLineButton: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  lineGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  lineGridCompact: {
    flexDirection: 'column',
    gap: 0,
  },
  lineTotal: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: textSizes.body,
    textAlign: 'right',
  },
  totalPanel: {
    alignItems: 'center',
    backgroundColor: colors.surfaceBrandSoft,
    borderColor: colors.borderInfoStrong,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  totalValue: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: textSizes.xlarge,
  },
});
