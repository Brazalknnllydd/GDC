import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

type ExportFileOptions = {
  dialogTitle: string;
  fileName: string;
  mimeType: string;
  uti?: string;
};

export async function shareExportFile(uri: string, options: ExportFileOptions) {
  if (Platform.OS === 'web') {
    throw new Error('Native file sharing is not available on the web.');
  }

  if (Platform.OS === 'android') {
    const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

    if (!permission.granted) {
      throw new Error('Choose a folder to save the report.');
    }

    const fileContent = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const destinationUri = await FileSystem.StorageAccessFramework.createFileAsync(
      permission.directoryUri,
      options.fileName,
      options.mimeType
    );

    await FileSystem.writeAsStringAsync(destinationUri, fileContent, {
      encoding: FileSystem.EncodingType.Base64,
    });
    Alert.alert('Export saved', `${options.fileName} was saved successfully.`);
    return;
  }

  const available = await Sharing.isAvailableAsync();

  if (!available) {
    throw new Error('File sharing is not available on this device.');
  }

  await Sharing.shareAsync(uri, {
    UTI: options.uti,
    dialogTitle: options.dialogTitle,
    mimeType: options.mimeType,
  });
}