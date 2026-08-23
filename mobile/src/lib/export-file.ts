import { Alert, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';

type ExportFileOptions = {
  dialogTitle: string;
  mimeType: string;
  uti?: string;
};

export async function shareExportFile(uri: string, options: ExportFileOptions) {
  if (Platform.OS === 'web') {
    throw new Error('Native file sharing is not available on the web.');
  }

  const available = await Sharing.isAvailableAsync();

  if (!available) {
    Alert.alert('Sharing unavailable', 'File sharing is not available on this device.');
    return;
  }

  await Sharing.shareAsync(uri, {
    UTI: options.uti,
    dialogTitle: options.dialogTitle,
    mimeType: options.mimeType,
  });
}