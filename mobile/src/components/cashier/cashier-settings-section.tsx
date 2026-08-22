import { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bluetooth, LogOut, Printer, Store } from 'lucide-react-native';

import { AppButton } from '../ui/app-button';
import { SectionHeading } from '../ui/section-heading';
import { SurfaceCard } from '../ui/surface-card';
import { colors, fonts, textSizes } from '../../constants/theme';
import { spacing } from '../../constants/design-system';
import { useResponsiveLayout } from '../../hooks/use-responsive-layout';
import { usePrinterStore, type BluetoothDevice } from '../../store/printer-store';
import { useToastStore } from '../../store/toast-store';

type CashierSettingsSectionProps = {
  cashierName: string;
  role: string;
  username: string;
  onLogout: () => void;
  onCloseShift?: () => void;
};

export function CashierSettingsSection({
  cashierName,
  role,
  username,
  onLogout,
  onCloseShift,
}: CashierSettingsSectionProps) {
  const { compactPhone } = useResponsiveLayout();
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

  async function handleScan() {
    if (Platform.OS !== 'android') {
      useToastStore.getState().showToast('Bluetooth printing is supported on Android only.', 'error');
      return;
    }

    await scanForPrinters();
  }

  async function handleConnect(device: BluetoothDevice) {
    const connected = await connectPrinter(device);
    if (connected) {
      useToastStore.getState().showToast('Printer connected', 'success');
    }
  }

  async function handleDisconnect() {
    await disconnectPrinter();
    useToastStore.getState().showToast('Printer disconnected', 'success');
  }

  return (
    <>
      <SectionHeading style={styles.sectionLabel}>CASHIER SETTINGS</SectionHeading>
      <SurfaceCard style={[styles.settingsCard, compactPhone && styles.settingsCardCompact]}>
        <Text style={styles.settingsTitle}>{cashierName}</Text>
        <Text style={styles.settingsMeta}>@{username}</Text>
        <Text style={styles.settingsMeta}>{role}</Text>
        <View style={styles.settingsDivider} />
        <View style={styles.printerHeader}>
          <Printer color={colors.primary} size={21} strokeWidth={2} />
          <View style={styles.printerInfo}>
            <Text style={styles.printerTitle}>Receipt Printer</Text>
            <Text style={styles.settingsMeta}>
              {isPrinterConnected && printerMacAddress ? `Connected: ${printerName || printerMacAddress}` : 'No printer connected'}
            </Text>
          </View>
        </View>

        {Platform.OS === 'android' ? (
          <View style={styles.printerActions}>
            <AppButton
              fullWidth={!compactPhone}
              icon={({ color, size }) => <Bluetooth color={color} size={size} />}
              label={isScanning ? 'Scanning...' : isPrinterConnected ? 'Change Printer' : 'Scan for Printers'}
              onPress={() => { void handleScan(); }}
              disabled={isScanning || isConnecting}
              variant="secondary"
            />
            {isPrinterConnected && printerMacAddress ? (
              <AppButton
                fullWidth={!compactPhone}
                label="Disconnect"
                onPress={() => { void handleDisconnect(); }}
                disabled={isConnecting}
                variant="danger"
              />
            ) : null}
          </View>
        ) : (
          <Text style={styles.settingsCopy}>Bluetooth printing is supported on Android only.</Text>
        )}

        {discoveredDevices.length > 0 ? (
          <View style={styles.deviceList}>
            <Text style={styles.deviceListTitle}>Select a printer</Text>
            {discoveredDevices.map((device) => (
              <TouchableOpacity
                key={device.macAddress}
                style={styles.deviceCard}
                onPress={() => { void handleConnect(device); }}
                disabled={isConnecting}>
                <View style={styles.deviceCopy}>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <Text style={styles.deviceMac}>{device.macAddress}</Text>
                </View>
                {isConnecting ? <ActivityIndicator color={colors.primary} /> : null}
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
        
        {onCloseShift && (
          <AppButton
            fullWidth={compactPhone}
            icon={({ color, size }) => <Store color={color} size={size} strokeWidth={2.1} />}
            label="End Shift"
            onPress={onCloseShift}
            style={styles.logoutButton}
            variant="secondary"
          />
        )}

        <AppButton
          fullWidth={compactPhone}
          icon={({ color, size }) => <LogOut color={color} size={size} strokeWidth={2.1} />}
          label="Logout"
          onPress={onLogout}
          style={styles.logoutButton}
          variant="danger"
        />
      </SurfaceCard>
    </>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    marginBottom: spacing.lg,
    marginTop: spacing.section,
  },
  settingsCard: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  settingsCardCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  settingsTitle: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: 22,
    marginBottom: spacing.xs,
  },
  settingsMeta: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: textSizes.small + 1,
    marginBottom: spacing.xs,
  },
  settingsDivider: {
    backgroundColor: colors.dividerStrong,
    height: 1,
    marginVertical: spacing.lg,
  },
  settingsCopy: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    lineHeight: 22,
  },
  logoutButton: {
    marginTop: spacing.xl,
    minWidth: 160,
  },
  printerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  printerInfo: {
    flex: 1,
  },
  printerTitle: {
    color: colors.textStrong,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.medium,
  },
  printerActions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  deviceList: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  deviceListTitle: {
    color: colors.textStrong,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.small,
  },
  deviceCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.borderMuted,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    padding: spacing.md,
  },
  deviceCopy: {
    flex: 1,
  },
  deviceName: {
    color: colors.textStrong,
    fontFamily: fonts.medium,
    fontSize: textSizes.body,
  },
  deviceMac: {
    color: colors.textSubtle,
    fontFamily: fonts.regular,
    fontSize: textSizes.small,
    marginTop: 2,
  },
});
