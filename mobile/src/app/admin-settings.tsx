import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, Platform, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LogOut, Printer, Bluetooth, UserRound, PencilLine, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { AddCashierModal } from '../components/admin-settings/add-cashier-modal';
import { CashierAccessHero } from '../components/admin-settings/cashier-access-hero';
import { tabs as productTabs } from '../components/admin-products/products-screen-data';
import { AdminModalShell } from '../components/ui/admin-modal-shell';
import { AdminPageScreen } from '../components/ui/admin-page-screen';
import { AppButton } from '../components/ui/app-button';
import { SurfaceCard } from '../components/ui/surface-card';
import { ModalActions } from '../components/ui/modal-actions';
import { AppDataTable, AppDataTableHeader, AppDataTableRow, AppDataTableCell } from '../components/ui/app-data-table';
import { PaginationControls } from '../components/ui/pagination-controls';
import { useToastStore } from '../store/toast-store';
import { spacing, radius } from '../constants/design-system';
import { colors, fonts, textRoles, textSizes } from '../constants/theme';
import { useAdminSettingsData, type StaffCashier } from '../hooks/use-admin-settings-data';
import { useResponsiveLayout } from '../hooks/use-responsive-layout';
import { usePagination } from '../hooks/use-pagination';
import { apiClient } from '../lib/api';
import { getApiErrorMessage } from '../lib/api-errors';
import { clearAuthSession } from '../lib/auth-session';
import type { AddCashierFormValues } from '../lib/form-schemas';
import { usePrinterStore } from '../store/printer-store';

export default function AdminSettingsScreen() {
  const { compactPhone, isTablet } = useResponsiveLayout();
  const router = useRouter();
  const queryClient = useQueryClient();
  const settingsTabs = useMemo(
    () =>
      productTabs.map((tab) =>
        tab.label === 'Settings'
          ? { ...tab, active: true, route: '/admin-settings' as const }
          : { ...tab, active: false }
      ),
    []
  );

  const [showAddCashierModal, setShowAddCashierModal] = useState(false);
  const [editingCashier, setEditingCashier] = useState<StaffCashier | null>(null);
  const [cashierModalRevision, setCashierModalRevision] = useState(0);
  const [cashierPendingDelete, setCashierPendingDelete] = useState<StaffCashier | null>(null);
  const [isSavingCashier, setIsSavingCashier] = useState(false);
  const [isDeletingCashier, setIsDeletingCashier] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');
  const {
    assignedCategoryCount,
    cashiers,
    categories,
    isLoading,
    prependCashier,
    screenError,
  } = useAdminSettingsData();

  // Cashiers list pagination
  const {
    endItem: cashierPageEnd,
    page: cashierPage,
    paginatedItems: paginatedCashiers,
    setPage: setCashierPage,
    startItem: cashierPageStart,
    totalPages: totalCashierPages,
    visiblePageNumbers: visibleCashierPageNumbers,
  } = usePagination({
    items: cashiers,
    itemsPerPage: 10,
    resetDependencies: [cashiers],
  });

  const cashierFormInitialValues = useMemo(
    () =>
      editingCashier
        ? {
            allowedCategoryIds: editingCashier.allowedCategories.map((category) => category.id),
            name: editingCashier.name,
            password: '',
            username: editingCashier.username,
          }
        : undefined,
    [editingCashier]
  );
  const cashierFormMode = editingCashier ? 'edit' : 'create';

  const {
    printerName,
    printerMacAddress,
    isPrinterConnected,
    discoveredDevices,
    isScanning,
    isConnecting,
    loadPrinter,
    scanForPrinters,
    connectPrinter,
    disconnectPrinter,
  } = usePrinterStore();

  useEffect(() => {
    void loadPrinter();
  }, [loadPrinter]);

  const handleScan = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Supported', 'Direct Bluetooth printing is only supported on Android.');
      return;
    }
    await scanForPrinters();
  };

  const handleConnect = async (device: { name: string; macAddress: string }) => {
    const success = await connectPrinter(device);
    if (success) {
      useToastStore.getState().showToast('Printer connected', 'success');
    }
  };

  const handleDisconnect = async () => {
    await disconnectPrinter();
    useToastStore.getState().showToast('Printer disconnected', 'success');
  };


  function openAddCashierModal() {
    setEditingCashier(null);
    setCashierPendingDelete(null);
    setFormMessage('');
    setDeleteMessage('');
    setCashierModalRevision((value) => value + 1);
    setShowAddCashierModal(true);
  }

  function openEditCashierModal(cashier: StaffCashier) {
    setCashierPendingDelete(null);
    setEditingCashier(cashier);
    setFormMessage('');
    setDeleteMessage('');
    setCashierModalRevision((value) => value + 1);
    setShowAddCashierModal(true);
  }

  function closeAddCashierModal() {
    if (isSavingCashier) {
      return;
    }

    setShowAddCashierModal(false);
    setEditingCashier(null);
    setDeleteMessage('');
    setFormMessage('');
  }

  function openDeleteCashierModal(cashier: StaffCashier) {
    setEditingCashier(null);
    setDeleteMessage('');
    setCashierPendingDelete(cashier);
  }

  function closeDeleteCashierModal() {
    if (isDeletingCashier) {
      return;
    }

    setCashierPendingDelete(null);
    setDeleteMessage('');
  }

  async function handleSaveCashier(values: AddCashierFormValues) {
    try {
      setIsSavingCashier(true);
      setFormMessage('');

      const payload = {
        allowedCategoryIds: values.allowedCategoryIds,
        name: values.name.trim(),
        password: values.password.trim(),
        username: values.username.trim(),
      };

      if (editingCashier) {
        await apiClient.put(`/staff/cashiers/${editingCashier.id}`, payload);
        useToastStore.getState().showToast('Cashier updated successfully', 'success');
      } else {
        const response = await apiClient.post<StaffCashier>('/staff/cashiers', payload);
        prependCashier(response.data);
        useToastStore.getState().showToast('Cashier added successfully', 'success');
      }

      await queryClient.invalidateQueries({ queryKey: ['staff', 'cashiers'] });
      setShowAddCashierModal(false);
      setEditingCashier(null);
      setFormMessage('');
    } catch (error) {
      const msg = getApiErrorMessage(
        error,
        editingCashier ? 'Could not update cashier right now.' : 'Could not create cashier right now.'
      );
      setFormMessage(msg);
      useToastStore.getState().showToast(msg, 'error');
    } finally {
      setIsSavingCashier(false);
    }
  }

  async function handleDeleteCashier() {
    if (!cashierPendingDelete) {
      return;
    }

    try {
      setIsDeletingCashier(true);
      setDeleteMessage('');
      await apiClient.delete(`/staff/cashiers/${cashierPendingDelete.id}`);
      await queryClient.invalidateQueries({ queryKey: ['staff', 'cashiers'] });
      setCashierPendingDelete(null);
      useToastStore.getState().showToast('Cashier removed successfully', 'success');
    } catch (error) {
      const msg = getApiErrorMessage(error, 'Could not delete cashier right now.');
      setDeleteMessage(msg);
      useToastStore.getState().showToast(msg, 'error');
    } finally {
      setIsDeletingCashier(false);
    }
  }

  return (
    <AdminPageScreen
      title="Settings"
      introDescription="Control cashier access and decide which product categories each cashier is allowed to sell."
      bottomNavItems={settingsTabs}>
      <CashierAccessHero
        assignedCategoryCount={assignedCategoryCount}
        cashierCount={cashiers.length}
        categoriesAvailable={categories.length > 0}
        onAddCashier={openAddCashierModal}
      />

      <Text style={styles.sectionTitle}>Cashier Access List</Text>
      {isLoading ? (
        <SurfaceCard style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Loading cashier access...</Text>
        </SurfaceCard>
      ) : cashiers.length > 0 ? (
        <SurfaceCard style={styles.tableCard}>
          <AppDataTable>
            <AppDataTableHeader>
              <AppDataTableCell flex={isTablet ? 1.5 : undefined} width={isTablet ? undefined : 150} isHeader text="Name" />
              <AppDataTableCell flex={isTablet ? 1 : undefined} width={isTablet ? undefined : 110} isHeader text="Cashier" />
              <AppDataTableCell flex={isTablet ? 2.5 : undefined} width={isTablet ? undefined : 200} isHeader text="Categories" />
              <AppDataTableCell flex={isTablet ? 0.9 : undefined} width={isTablet ? undefined : 116} isHeader numeric text="Actions" />
            </AppDataTableHeader>
            {paginatedCashiers.map((cashier) => (
              <AppDataTableRow key={cashier.id}>
                <AppDataTableCell flex={isTablet ? 1.5 : undefined} width={isTablet ? undefined : 150}>
                  <View style={styles.nameCell}>
                    <View style={styles.tableAvatar}>
                      <UserRound color={colors.secondary} size={14} strokeWidth={2.1} />
                    </View>
                    <Text style={styles.tableNameText}>{cashier.name}</Text>
                  </View>
                </AppDataTableCell>
                <AppDataTableCell flex={isTablet ? 1 : undefined} width={isTablet ? undefined : 110}>
                  <View>
                    <Text style={styles.tableUsernameText}>@{cashier.username}</Text>
                    <Text style={styles.tableRoleText}>{cashier.role}</Text>
                  </View>
                </AppDataTableCell>
                <AppDataTableCell flex={isTablet ? 2.5 : undefined} width={isTablet ? undefined : 200}>
                  <View style={styles.tableCategoryWrap}>
                    {cashier.allowedCategories.length > 0 ? (
                      cashier.allowedCategories.map((category) => (
                        <View key={category.id} style={styles.tableCategoryPill}>
                          <Text style={styles.tableCategoryPillText}>{category.name}</Text>
                        </View>
                      ))
                    ) : (
                      <View style={styles.tableCategoryPillMuted}>
                        <Text style={styles.tableCategoryPillMutedText}>All categories</Text>
                      </View>
                    )}
                  </View>
                </AppDataTableCell>
                <AppDataTableCell flex={isTablet ? 0.9 : undefined} width={isTablet ? undefined : 116} numeric>
                  <View style={styles.rowActions}>
                    <TouchableOpacity
                      accessibilityLabel={`Edit cashier ${cashier.name}`}
                      onPress={() => openEditCashierModal(cashier)}
                      style={[styles.actionButton, styles.editActionButton]}
                    >
                      <PencilLine color={colors.secondary} size={14} strokeWidth={2.1} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityLabel={`Delete cashier ${cashier.name}`}
                      onPress={() => openDeleteCashierModal(cashier)}
                      style={[styles.actionButton, styles.deleteActionButton]}
                    >
                      <Trash2 color={colors.dangerStrong} size={14} strokeWidth={2.1} />
                    </TouchableOpacity>
                  </View>
                </AppDataTableCell>
              </AppDataTableRow>
            ))}
          </AppDataTable>

          <View style={styles.paginationRow}>
            <PaginationControls
              borderless
              currentPage={cashierPage}
              onPageChange={setCashierPage}
              totalPages={totalCashierPages}
              visiblePageNumbers={visibleCashierPageNumbers}
            />
          </View>
        </SurfaceCard>
      ) : (
        <SurfaceCard style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No cashier accounts added yet</Text>
          <Text style={styles.emptyText}>
            Add your first cashier, assign the categories they can sell, and their product list
            will follow those category rules automatically.
          </Text>
        </SurfaceCard>
      )}

      <Text style={styles.sectionTitle}>Receipt Printer</Text>
      <SurfaceCard style={styles.printerCard}>
        <View style={styles.printerCardHeader}>
          <View style={styles.printerIconContainer}>
            <Printer color={colors.primary} size={24} strokeWidth={2} />
          </View>
          <View style={styles.printerInfo}>
            <Text style={styles.printerTitle}>Bluetooth Thermal Printer</Text>
            <Text style={styles.printerStatus}>
              {isPrinterConnected && printerMacAddress
                ? `Connected: ${printerName || printerMacAddress}`
                : 'No printer connected'}
            </Text>
          </View>
        </View>

        {Platform.OS === 'android' ? (
          <View style={styles.printerActions}>
            <AppButton
              label={isPrinterConnected ? 'Change Printer' : isScanning ? 'Scanning...' : 'Scan for Printers'}
              onPress={() => { void handleScan(); }}
              disabled={isScanning || isConnecting}
              style={{ flex: 1 }}
              variant="secondary"
              icon={({ color, size }) => <Bluetooth color={color} size={size} />}
            />
            {isPrinterConnected && printerMacAddress && (
              <AppButton
                label="Disconnect"
                onPress={() => { void handleDisconnect(); }}
                disabled={isConnecting}
                variant="danger"
              />
            )}
          </View>
        ) : (
          <Text style={styles.printerStatus}>
            Bluetooth printing is supported on Android only.
          </Text>
        )}

        {discoveredDevices.length > 0 && (
          <View style={styles.deviceList}>
            <Text style={styles.deviceListTitle}>Discovered Devices:</Text>
            {discoveredDevices.map((device) => (
              <TouchableOpacity
                key={device.macAddress}
                style={styles.deviceCard}
                onPress={() => { void handleConnect(device); }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <Text style={styles.deviceMac}>{device.macAddress}</Text>
                </View>
                {isConnecting ? <ActivityIndicator color={colors.primary} /> : null}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </SurfaceCard>


      {screenError ? <Text style={styles.errorText}>{screenError}</Text> : null}

      <AppButton
        fullWidth={compactPhone}
        icon={({ color, size }) => <LogOut color={color} size={size} strokeWidth={2.2} />}
        label="Logout"
        onPress={() => {
          void clearAuthSession().finally(() => {
            router.replace('/');
          });
        }}
        style={styles.logoutButton}
        variant="danger"
      />

      <AddCashierModal
        key={`${cashierModalRevision}-${cashierFormMode}-${editingCashier?.id ?? 'new'}`}
        cashiersSaving={isSavingCashier}
        categories={categories}
        formMessage={formMessage}
        initialValues={cashierFormInitialValues}
        mode={cashierFormMode}
        onClose={closeAddCashierModal}
        onSave={handleSaveCashier}
        visible={showAddCashierModal}
      />

      <AdminModalShell
        height={240}
        onClose={closeDeleteCashierModal}
        title="Delete Cashier"
        visible={cashierPendingDelete !== null}
        footer={
          <ModalActions>
            <AppButton
              disabled={isDeletingCashier}
              label="Cancel"
              onPress={closeDeleteCashierModal}
              variant="secondary"
            />
            <AppButton
              disabled={isDeletingCashier}
              label={isDeletingCashier ? 'Deleting...' : 'Delete'}
              loading={isDeletingCashier}
              onPress={() => { void handleDeleteCashier(); }}
              variant="danger"
            />
          </ModalActions>
        }
      >
        <Text style={styles.deleteConfirmText}>
          Delete{' '}
          <Text style={styles.deleteConfirmName}>{cashierPendingDelete?.name}</Text>
          ? This will remove the cashier account. If they have sales or shifts on record, the server will archive the account instead of hard-deleting it.
        </Text>
        {deleteMessage ? <Text style={styles.deleteErrorText}>{deleteMessage}</Text> : null}
      </AdminModalShell>
    </AdminPageScreen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.textStrong,
    ...textRoles.value,
    fontSize: textSizes.large,
    marginBottom: spacing.md,
    marginTop: spacing.section,
  },
  tableCard: {
    padding: 0,
    overflow: 'hidden',
  },
  nameCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableAvatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.round,
    height: 28,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 28,
  },
  tableNameText: {
    color: colors.textStrong,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.body,
  },
  tableUsernameText: {
    color: colors.textStrong,
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
  },
  tableRoleText: {
    color: colors.textTertiary,
    fontFamily: fonts.regular,
    fontSize: textSizes.xsmall,
  },
  tableCategoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tableCategoryPill: {
    backgroundColor: colors.surfaceBrandSoft,
    borderColor: colors.borderInfoStrong,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.sm + 1,
    paddingVertical: 3,
  },
  tableCategoryPillText: {
    color: colors.secondary,
    fontFamily: fonts.medium,
    fontSize: textSizes.xsmall,
  },
  tableCategoryPillMuted: {
    backgroundColor: colors.surfaceNeutral,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.sm + 1,
    paddingVertical: 3,
  },
  tableCategoryPillMutedText: {
    color: colors.textTertiary,
    fontFamily: fonts.medium,
    fontSize: textSizes.xsmall,
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'flex-end',
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  editActionButton: {
    backgroundColor: colors.surfaceInfoMuted,
    borderColor: colors.borderInfoStrong,
  },
  deleteActionButton: {
    backgroundColor: colors.surfaceDangerMuted,
    borderColor: colors.borderDangerSoft,
  },
  paginationRow: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: 17,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    ...textRoles.body,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  errorText: {
    color: colors.dangerStrong,
    ...textRoles.label,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  deleteConfirmText: {
    color: colors.textSecondary,
    ...textRoles.body,
    fontSize: 14,
    lineHeight: 22,
  },
  deleteConfirmName: {
    color: colors.textStrong,
    ...textRoles.value,
  },
  deleteErrorText: {
    color: colors.dangerStrong,
    ...textRoles.label,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.md,
  },
  logoutButton: {
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  printerCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  printerCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  printerIconContainer: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 48,
  },
  printerInfo: {
    flex: 1,
  },
  printerTitle: {
    ...textRoles.value,
    color: colors.textStrong,
    fontSize: 16,
    marginBottom: 2,
  },
  printerStatus: {
    ...textRoles.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  printerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  deviceList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  deviceListTitle: {
    ...textRoles.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  deviceName: {
    ...textRoles.value,
    color: colors.textStrong,
  },
  deviceMac: {
    ...textRoles.body,
    color: colors.textSecondary,
    fontSize: 12,
  },
});
