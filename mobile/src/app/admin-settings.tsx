import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Platform, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LogOut, Printer, Bluetooth } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { AddCashierModal } from '../components/admin-settings/add-cashier-modal';
import { CashierAccessCard } from '../components/admin-settings/cashier-access-card';
import { CashierAccessHero } from '../components/admin-settings/cashier-access-hero';
import { tabs as productTabs } from '../components/admin-products/products-screen-data';
import { AdminPageScreen } from '../components/ui/admin-page-screen';
import { AppButton } from '../components/ui/app-button';
import { SurfaceCard } from '../components/ui/surface-card';
import { useToastStore } from '../store/toast-store';
import { spacing } from '../constants/design-system';
import { colors, textRoles, textSizes } from '../constants/theme';
import { useAdminSettingsData, type StaffCashier } from '../hooks/use-admin-settings-data';
import { useResponsiveLayout } from '../hooks/use-responsive-layout';
import { apiClient } from '../lib/api';
import { clearAuthSession } from '../lib/auth-session';
import type { AddCashierFormValues } from '../lib/form-schemas';
import { usePrinterStore } from '../store/printer-store';

export default function AdminSettingsScreen() {
  const { compactPhone } = useResponsiveLayout();
  const router = useRouter();
  const settingsTabs = productTabs.map((tab) =>
    tab.label === 'Settings'
      ? { ...tab, active: true, route: '/admin-settings' as const }
      : { ...tab, active: false }
  );

  const [showAddCashierModal, setShowAddCashierModal] = useState(false);
  const [isSavingCashier, setIsSavingCashier] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const {
    assignedCategoryCount,
    cashiers,
    categories,
    isLoading,
    prependCashier,
    screenError,
  } = useAdminSettingsData();

  const {
    printerName,
    printerMacAddress,
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
    } else {
      useToastStore.getState().showToast('Failed to connect', 'error');
    }
  };

  const handleDisconnect = async () => {
    await disconnectPrinter();
    useToastStore.getState().showToast('Printer disconnected', 'success');
  };


  function openAddCashierModal() {
    setFormMessage('');
    setShowAddCashierModal(true);
  }

  function closeAddCashierModal() {
    if (isSavingCashier) {
      return;
    }

    setShowAddCashierModal(false);
    setFormMessage('');
  }

  async function handleSaveCashier(values: AddCashierFormValues) {
    try {
      setIsSavingCashier(true);
      setFormMessage('');

      const response = await apiClient.post<StaffCashier>('/staff/cashiers', {
        allowedCategoryIds: values.allowedCategoryIds,
        name: values.name.trim(),
        password: values.password.trim(),
        username: values.username.trim(),
      });

      prependCashier(response.data);
      setShowAddCashierModal(false);
      setFormMessage('');
      useToastStore.getState().showToast('Cashier added successfully', 'success');
    } catch {
      const msg = 'Could not create cashier right now.';
      setFormMessage(msg);
      useToastStore.getState().showToast(msg, 'error');
    } finally {
      setIsSavingCashier(false);
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
        <View style={styles.cashierList}>
          {cashiers.map((cashier) => (
            <CashierAccessCard
              key={cashier.id}
              allowedCategories={cashier.allowedCategories}
              createdAt={cashier.createdAt}
              name={cashier.name}
              role={cashier.role}
              username={cashier.username}
            />
          ))}
        </View>
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
            {Platform.OS === 'android' ? (
              <Text style={styles.printerStatus}>
                {printerMacAddress ? `Connected: ${printerName || printerMacAddress}` : 'No printer connected'}
              </Text>
            ) : (
              <Text style={styles.printerStatus}>
                Bluetooth printing is only supported on Android custom builds
              </Text>
            )}
          </View>
        </View>

        {Platform.OS === 'android' && (
          <View style={styles.printerActions}>
            <AppButton
              label={printerMacAddress ? "Change Printer" : (isScanning ? "Scanning..." : "Scan for Printers")}
              onPress={() => { void handleScan(); }}
              disabled={isScanning || isConnecting}
              style={{ flex: 1 }}
              variant="secondary"
              icon={({ color, size }) => <Bluetooth color={color} size={size} />}
            />
            {printerMacAddress && (
              <AppButton
                label="Disconnect"
                onPress={() => { void handleDisconnect(); }}
                disabled={isConnecting}
                variant="danger"
              />
            )}
          </View>
        )}
        
        {discoveredDevices.length > 0 && !printerMacAddress && (
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
        cashiersSaving={isSavingCashier}
        categories={categories}
        formMessage={formMessage}
        onClose={closeAddCashierModal}
        onSave={handleSaveCashier}
        visible={showAddCashierModal}
      />
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
  cashierList: {
    gap: spacing.md,
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
    backgroundColor: colors.surfaceStrong,
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
