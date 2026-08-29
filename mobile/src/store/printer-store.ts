import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform, PermissionsAndroid } from 'react-native';
import { useToastStore } from './toast-store';

export interface BluetoothDevice {
  name: string;
  macAddress: string;
}

interface PrinterState {
  printerUrl: string | null;
  printerMacAddress: string | null;
  printerName: string | null;
  isPrinterConnected: boolean;
  discoveredDevices: BluetoothDevice[];
  isScanning: boolean;
  isConnecting: boolean;
  loadPrinter: () => Promise<void>;
  scanForPrinters: () => Promise<void>;
  connectPrinter: (device: BluetoothDevice) => Promise<boolean>;
  disconnectPrinter: () => Promise<void>;
}

async function requestBluetoothPermissions() {
  if (Platform.OS !== 'android') return true;
  if (Platform.Version >= 31) {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return (
      granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
      granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
    );
  } else {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
    return granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED;
  }
}

function getBLEPrinter() {
  if (Platform.OS !== 'android') {
    return null;
  }

  try {
    return require('react-native-thermal-receipt-printer').BLEPrinter ?? null;
  } catch {
    return null;
  }
}

export const usePrinterStore = create<PrinterState>((set) => ({
  printerUrl: null,
  printerMacAddress: null,
  printerName: null,
  isPrinterConnected: false,
  discoveredDevices: [],
  isScanning: false,
  isConnecting: false,

  loadPrinter: async () => {
    if (Platform.OS === 'web') return;
    try {
      const BLEPrinter = getBLEPrinter();
      const mac = await SecureStore.getItemAsync('printer_mac');
      const name = await SecureStore.getItemAsync('printer_name');
      const url = await SecureStore.getItemAsync('printer_url');
      set({ printerMacAddress: mac, printerName: name, printerUrl: url });

      if (mac && BLEPrinter?.init) {
        const hasPermission = await requestBluetoothPermissions();
        if (hasPermission) {
          try {
            await BLEPrinter.init();
            await BLEPrinter.connectPrinter(mac.trim());
            set({ isPrinterConnected: true });
          } catch {
            set({ isPrinterConnected: false });
            useToastStore.getState().showToast(
              'Saved printer is unavailable. Turn it on or reconnect it from Printer Settings.',
              'info'
            );
          }
        }
      }
    } catch (e) {
      console.error('Failed to load printer settings', e);
    }
  },

  scanForPrinters: async () => {
    if (Platform.OS !== 'android') return;

    const BLEPrinter = getBLEPrinter();

    // Check if the native module actually loaded (fails in Expo Go)
    if (!BLEPrinter || !BLEPrinter.init) {
      useToastStore.getState().showToast('Bluetooth printing needs the installed development build.', 'error');
      return;
    }

    set({ isScanning: true, discoveredDevices: [] });
    useToastStore.getState().showToast('Checking for nearby Bluetooth printers...', 'info');
    try {
      const hasPermission = await requestBluetoothPermissions();
      if (!hasPermission) {
        useToastStore.getState().showToast('Allow Nearby devices permission to scan for printers.', 'error');
        set({ isScanning: false });
        return;
      }
      
      await BLEPrinter.init();
      const devices = await BLEPrinter.getDeviceList();
      
      const mappedDevices = devices.map((d: any) => ({
        name: d.device_name || 'Unknown Device',
        macAddress: d.inner_mac_address || d.mac_address,
      }));
      
      set({ discoveredDevices: mappedDevices, isScanning: false });
      useToastStore.getState().showToast(
        mappedDevices.length > 0
          ? `${mappedDevices.length} printer${mappedDevices.length === 1 ? '' : 's'} found. Select one to connect.`
          : 'No printers found. Turn the printer on and make sure it is nearby.',
        mappedDevices.length > 0 ? 'success' : 'info'
      );
    } catch (e) {
      console.error('Scan failed', e);
      const message = e instanceof Error ? e.message.toLowerCase() : String(e).toLowerCase();
      useToastStore.getState().showToast(
        message.includes('adapter') || message.includes('enabled')
          ? 'Bluetooth is turned off. Turn it on and try scanning again.'
          : 'Could not scan for printers. Check Bluetooth and try again.',
        'error'
      );
      set({ isScanning: false });
    }
  },

  connectPrinter: async (device: BluetoothDevice) => {
    if (Platform.OS !== 'android') return false;
    const BLEPrinter = getBLEPrinter();
    if (!BLEPrinter || !BLEPrinter.init) {
      useToastStore.getState().showToast('Bluetooth printing needs the installed development build.', 'error');
      return false;
    }

    set({ isConnecting: true });
    useToastStore.getState().showToast(`Connecting to ${device.name || 'printer'}...`, 'info');
    try {
      const hasPermission = await requestBluetoothPermissions();
      if (!hasPermission) {
        useToastStore.getState().showToast('Allow Nearby devices permission to connect to the printer.', 'error');
        set({ isConnecting: false });
        return false;
      }

      await BLEPrinter.init();
      try {
        await BLEPrinter.closeConn();
      } catch {
        // No active connection is expected on the first attempt.
      }

      try {
        await BLEPrinter.connectPrinter(device.macAddress.trim());
      } catch {
        // Some printers leave a stale socket behind after a failed attempt.
        try {
          await BLEPrinter.closeConn();
        } catch {
          // Continue with the retry.
        }
        await BLEPrinter.connectPrinter(device.macAddress.trim());
      }
      set({ printerMacAddress: device.macAddress, printerName: device.name, isConnecting: false });
      set({ isPrinterConnected: true });
      await SecureStore.setItemAsync('printer_mac', device.macAddress);
      await SecureStore.setItemAsync('printer_name', device.name);
      return true;
    } catch (e) {
      console.error('Connect failed', e);
      const message = e instanceof Error ? e.message.toLowerCase() : String(e).toLowerCase();
      useToastStore.getState().showToast(
        message.includes('timeout') || message.includes('socket') || message.includes('read failed')
          ? 'Printer connection timed out. Keep the printer nearby and try again.'
          : 'Could not connect to the printer. Check that it is on and try again.',
        'error'
      );
      set({ isConnecting: false });
      set({ isPrinterConnected: false });
      return false;
    }
  },

  disconnectPrinter: async () => {
    if (Platform.OS === 'web') return;
    try {
      const BLEPrinter = getBLEPrinter();
      try {
        await BLEPrinter?.closeConn?.();
      } catch {
        // Continue clearing local state if the native socket is already closed.
      }
      await SecureStore.deleteItemAsync('printer_mac');
      await SecureStore.deleteItemAsync('printer_name');
      await SecureStore.deleteItemAsync('printer_url');
      set({ printerMacAddress: null, printerName: null, printerUrl: null, isPrinterConnected: false });
    } catch (e) {
      console.error('Failed to save printer settings', e);
    }
  },
}));
