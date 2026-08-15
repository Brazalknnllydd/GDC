import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Plus, Search, Users } from 'lucide-react-native';
import { TextInput as PaperTextInput } from 'react-native-paper';

import { CashierCustomerListItem } from './cashier-customer-list-item';
import { AdminModalShell } from '../ui/admin-modal-shell';
import { AppButton } from '../ui/app-button';
import { ModalActions } from '../ui/modal-actions';
import { PaginationControls } from '../ui/pagination-controls';
import { ProductFormInput } from '../ui/product-form-input';
import { SectionHeading } from '../ui/section-heading';
import { SurfaceCard } from '../ui/surface-card';
import { spacing } from '../../constants/design-system';
import { colors, fonts, textSizes } from '../../constants/theme';
import { apiClient } from '../../lib/api';
import { getApiErrorMessage } from '../../lib/api-errors';
import { useToastStore } from '../../store/toast-store';

type Customer = {
  id: number;
  name: string;
  phoneNumber?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt?: string;
};

type FormState = {
  name: string;
  phoneNumber: string;
  address: string;
  notes: string;
};

const EMPTY_FORM: FormState = { name: '', phoneNumber: '', address: '', notes: '' };

export function CashierCustomersSection() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Reset page to 1 when search query changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // Create / Edit modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  // Delete confirm modal
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const query = searchQuery.trim() ? `&search=${encodeURIComponent(searchQuery.trim())}` : '';
      const res = await apiClient.get<{ data: Customer[]; totalPages: number }>(
        `/customers?page=${page}&limit=15${query}`
      );
      setCustomers(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch {
      setCustomers([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, page]);

  useEffect(() => {
    const timer = setTimeout(() => { void loadCustomers(); }, searchQuery ? 350 : 0);
    return () => clearTimeout(timer);
  }, [loadCustomers, searchQuery]);

  function openCreate() {
    setEditingCustomer(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowFormModal(true);
  }

  function openEdit(customer: Customer) {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      phoneNumber: customer.phoneNumber ?? '',
      address: customer.address ?? '',
      notes: customer.notes ?? '',
    });
    setFormError('');
    setShowFormModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setFormError('Customer name is required.');
      return;
    }
    try {
      setIsSaving(true);
      setFormError('');
      const payload = {
        name: form.name.trim(),
        phoneNumber: form.phoneNumber.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
      };
      if (editingCustomer) {
        await apiClient.put(`/customers/${editingCustomer.id}`, payload);
        useToastStore.getState().showToast('Customer updated successfully', 'success');
      } else {
        await apiClient.post('/customers', payload);
        useToastStore.getState().showToast('Customer added successfully', 'success');
      }
      setShowFormModal(false);
      void loadCustomers();
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Could not save customer.');
      setFormError(msg);
      useToastStore.getState().showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingCustomer) return;
    try {
      setIsDeleting(true);
      await apiClient.delete(`/customers/${deletingCustomer.id}`);
      setDeletingCustomer(null);
      useToastStore.getState().showToast('Customer deleted successfully', 'success');
      void loadCustomers();
    } catch (err) {
      useToastStore.getState().showToast('Failed to delete customer', 'error');
      console.error('Failed to delete customer:', err);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      {/* Header */}
      <SectionHeading style={styles.sectionLabel}>CUSTOMERS</SectionHeading>
      <View style={styles.topRow}>
        <View style={styles.searchBox}>
          <Search color={colors.textTertiary} size={16} strokeWidth={2} />
          <PaperTextInput
            mode="flat"
            onChangeText={setSearchQuery}
            placeholder="Search name or phone..."
            style={styles.searchInput}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            value={searchQuery}
          />
        </View>
        <AppButton
          fullWidth={false}
          icon={({ color, size }) => <Plus color={color} size={size} strokeWidth={2.2} />}
          label="Add Customer"
          onPress={openCreate}
          size="sm"
          variant="primary"
        />
      </View>

      {/* Table */}
      <SurfaceCard style={styles.tableCard}>
        {/* Table header */}
        <View style={styles.tableHeader}>
          <View style={styles.headerDataArea}>
            <Text style={[styles.headerCell, { flex: 2.5 }]}>CUSTOMER</Text>
            <Text style={[styles.headerCell, { flex: 1.5 }]}>PHONE</Text>
            <Text style={[styles.headerCell, { flex: 1.5 }]}>ADDRESS</Text>
            <Text style={[styles.headerCell, { flex: 2 }]}>NOTES</Text>
          </View>
          <View style={styles.headerCellActions} />
        </View>

        {isLoading ? (
          <View style={styles.centeredState}>
            <ActivityIndicator color={colors.secondary} size="small" />
          </View>
        ) : customers.length === 0 ? (
          <View style={styles.centeredState}>
            <Users color={colors.textSubtle} size={32} strokeWidth={1.5} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No customers match your search.' : 'No customers yet. Add one to get started.'}
            </Text>
          </View>
        ) : (
          <View>
            <View>
              {customers.map((c) => (
                <CashierCustomerListItem
                  key={c.id}
                  name={c.name}
                  phoneNumber={c.phoneNumber}
                  address={c.address}
                  description={c.notes}
                  onPress={() => setViewingCustomer(c)}
                  onEdit={() => openEdit(c)}
                  onDelete={() => setDeletingCustomer(c)}
                />
              ))}
            </View>
            <View style={{ paddingVertical: 16, paddingHorizontal: 24, borderTopWidth: 1, borderTopColor: colors.borderPanel, backgroundColor: colors.surfaceSoft }}>
              <PaginationControls
                borderless
                currentPage={page - 1}
                onPageChange={(p) => setPage(p + 1)}
                totalPages={totalPages}
              />
            </View>
          </View>
        )}
      </SurfaceCard>

      {/* Create / Edit Modal */}
      <AdminModalShell
        footer={
          <ModalActions>
            <AppButton label="Cancel" onPress={() => setShowFormModal(false)} variant="secondary" />
            <AppButton
              disabled={isSaving}
              label={isSaving ? 'Saving...' : editingCustomer ? 'Save Changes' : 'Add Customer'}
              loading={isSaving}
              onPress={handleSave}
              variant="primary"
            />
          </ModalActions>
        }
        height={520}
        onClose={() => setShowFormModal(false)}
        title={editingCustomer ? 'Edit Customer' : 'New Customer'}
        visible={showFormModal}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <ProductFormInput
            dense
            label="NAME"
            onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder="Full name"
            value={form.name}
          />
          <ProductFormInput
            dense
            keyboardType="phone-pad"
            label="PHONE NUMBER (OPTIONAL)"
            onChangeText={(v) => setForm((f) => ({ ...f, phoneNumber: v }))}
            placeholder="e.g. 09123456789"
            value={form.phoneNumber}
          />
          <ProductFormInput
            dense
            label="LOCATION / ADDRESS (OPTIONAL)"
            onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
            placeholder="City, barangay, etc."
            value={form.address}
          />
          <ProductFormInput
            dense
            label="DESCRIPTION (OPTIONAL)"
            multiline
            numberOfLines={3}
            onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
            placeholder="Any notes about this customer..."
            value={form.notes}
          />
          {formError ? <Text style={styles.formError}>{formError}</Text> : null}
        </ScrollView>
      </AdminModalShell>

      <AdminModalShell
        footer={
          <ModalActions>
            <AppButton
              label="Close"
              onPress={() => setViewingCustomer(null)}
              variant="secondary"
            />
          </ModalActions>
        }
        height={420}
        onClose={() => setViewingCustomer(null)}
        title="Customer Details"
        visible={viewingCustomer !== null}
      >
        {viewingCustomer ? (
          <ScrollView
            contentContainerStyle={styles.detailsContent}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            style={styles.detailsScroll}
          >
            <SurfaceCard style={styles.detailsCard}>
              <Text style={styles.detailsName}>{viewingCustomer.name}</Text>
              <Text style={styles.detailsMeta}>
                {viewingCustomer.phoneNumber || 'No phone number'}
              </Text>
            </SurfaceCard>

            <SurfaceCard style={styles.detailsCard}>
              <Text style={styles.detailsLabel}>PHONE</Text>
              <Text style={styles.detailsValue}>
                {viewingCustomer.phoneNumber || 'Not provided'}
              </Text>
            </SurfaceCard>

            <SurfaceCard style={styles.detailsCard}>
              <Text style={styles.detailsLabel}>ADDRESS</Text>
              <Text style={styles.detailsValue}>
                {viewingCustomer.address?.trim() || 'Not provided'}
              </Text>
            </SurfaceCard>

            <SurfaceCard style={styles.detailsCard}>
              <Text style={styles.detailsLabel}>NOTES</Text>
              <Text style={styles.detailsValue}>
                {viewingCustomer.notes?.trim() || 'No notes added.'}
              </Text>
            </SurfaceCard>

            <SurfaceCard style={styles.detailsCard}>
              <Text style={styles.detailsLabel}>ADDED</Text>
              <Text style={styles.detailsValue}>
                {viewingCustomer.createdAt
                  ? new Date(viewingCustomer.createdAt).toLocaleString('en-PH', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : 'Unknown'}
              </Text>
            </SurfaceCard>
          </ScrollView>
        ) : null}
      </AdminModalShell>

      {/* Delete Confirm Modal */}
      <AdminModalShell
        footer={
          <ModalActions>
            <AppButton label="Cancel" onPress={() => setDeletingCustomer(null)} variant="secondary" />
            <AppButton
              disabled={isDeleting}
              label={isDeleting ? 'Deleting...' : 'Delete'}
              loading={isDeleting}
              onPress={handleDelete}
              variant="danger"
            />
          </ModalActions>
        }
        height={220}
        onClose={() => setDeletingCustomer(null)}
        title="Delete Customer"
        visible={deletingCustomer !== null}
      >
        <Text style={styles.deleteConfirmText}>
          Are you sure you want to delete{' '}
          <Text style={styles.deleteConfirmName}>{deletingCustomer?.name}</Text>?
          This action cannot be undone.
        </Text>
      </AdminModalShell>
    </>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    marginBottom: spacing.md,
    marginTop: spacing.section,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.borderMuted,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  searchInput: {
    backgroundColor: 'transparent',
    flex: 1,
    fontSize: textSizes.body,
    height: 40,
  },
  tableCard: {
    marginBottom: spacing.xl,
    overflow: 'hidden',
    padding: 0,
  },
  tableHeader: {
    backgroundColor: colors.surfaceNeutral,
    borderBottomColor: '#EAECF0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerDataArea: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
  },
  headerCell: {
    color: colors.textSecondary,
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  headerCellActions: {
    flex: 0,
    width: 72,
  },
  centeredState: {
    alignItems: 'center',
    gap: spacing.md,
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    color: colors.textSubtle,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    textAlign: 'center',
  },
  formError: {
    backgroundColor: colors.surfaceDanger,
    borderColor: colors.borderDanger,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.danger,
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    textAlign: 'center',
  },
  deleteConfirmText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    lineHeight: 22,
  },
  deleteConfirmName: {
    color: colors.textStrong,
    fontFamily: fonts.semiBold,
  },
  detailsContent: {
    flexGrow: 1,
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  detailsScroll: {
    flex: 1,
  },
  detailsCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  detailsName: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: 22,
    marginBottom: spacing.xs,
  },
  detailsMeta: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: textSizes.body,
  },
  detailsLabel: {
    color: colors.textSubtle,
    fontFamily: fonts.bold,
    fontSize: textSizes.smallCaps,
    letterSpacing: 1.1,
    marginBottom: spacing.xs,
  },
  detailsValue: {
    color: colors.textStrong,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    lineHeight: 22,
  },
});
