import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform, PermissionsAndroid } from 'react-native';
import { BLEPrinter } from 'react-native-thermal-receipt-printer';

export interface BluetoothDevice {
  name: string;
  macAddress: string;
}

interface PrinterState {
  printerUrl: string | null;
  printerMacAddress: string | null;
  printerName: string | null;
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

export const usePrinterStore = create<PrinterState>((set, get) => ({
  printerUrl: null,
  printerMacAddress: null,
  printerName: null,
  discoveredDevices: [],
  isScanning: false,
  isConnecting: false,

  loadPrinter: async () => {
    if (Platform.OS === 'web') return;
    try {
      const mac = await SecureStore.getItemAsync('printer_mac');
      const name = await SecureStore.getItemAsync('printer_name');
      const url = await SecureStore.getItemAsync('printer_url');
      set({ printerMacAddress: mac, printerName: name, printerUrl: url });

      if (mac && Platform.OS === 'android') {
        const hasPermission = await requestBluetoothPermissions();
        if (hasPermission) {
          try {
            await BLEPrinter.init();
            await BLEPrinter.connectPrinter(mac);
          } catch (e) {
            console.error('Failed to auto-connect to printer', e);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load printer settings', e);
    }
  },

  scanForPrinters: async () => {
    if (Platform.OS !== 'android') return;
    
    // Check if the native module actually loaded (fails in Expo Go)
    if (!BLEPrinter || !BLEPrinter.init) {
      alert("Native Bluetooth module not found!\n\nYou are likely running in Expo Go. Direct Bluetooth printing requires a Custom Development Build. Please run 'npx expo run:android' to build the app.");
      return;
    }

    set({ isScanning: true, discoveredDevices: [] });
    try {
      const hasPermission = await requestBluetoothPermissions();
      if (!hasPermission) {
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
    } catch (e) {
      console.error('Scan failed', e);
      set({ isScanning: false });
    }
  },

  connectPrinter: async (device: BluetoothDevice) => {
    if (Platform.OS !== 'android') return false;
    set({ isConnecting: true });
    try {
      await BLEPrinter.init();
      await BLEPrinter.connectPrinter(device.macAddress);
      set({ printerMacAddress: device.macAddress, printerName: device.name, isConnecting: false });
      await SecureStore.setItemAsync('printer_mac', device.macAddress);
      await SecureStore.setItemAsync('printer_name', device.name);
      return true;
    } catch (e) {
      console.error('Connect failed', e);
      set({ isConnecting: false });
      return false;
    }
  },

  disconnectPrinter: async () => {
    if (Platform.OS === 'web') return;
    try {
      // Disconnect might not be explicitly supported by the lib, or it's implicitly handled
      // Just clear local state
      await SecureStore.deleteItemAsync('printer_mac');
      await SecureStore.deleteItemAsync('printer_name');
      await SecureStore.deleteItemAsync('printer_url');
      set({ printerMacAddress: null, printerName: null, printerUrl: null });
    } catch (e) {
      console.error('Failed to save printer settings', e);
    }
  },
}));
