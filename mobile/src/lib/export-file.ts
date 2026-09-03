import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

type ExportFileOptions = {
  dialogTitle: string;
  fileName: string;
  mimeType: string;
  uti?: string;
};

async function shareWithSystemSheet(uri: string, options: ExportFileOptions) {
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

async function saveWithAndroidFolderPicker(uri: string, options: ExportFileOptions) {
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
}

export async function shareExportFile(uri: string, options: ExportFileOptions) {
  if (Platform.OS === 'web') {
    throw new Error('Native file sharing is not available on the web.');
  }

  if (Platform.OS === 'android') {
    try {
      await saveWithAndroidFolderPicker(uri, options);
    } catch (error) {
      await shareWithSystemSheet(uri, options);
      const message =
        error instanceof Error && error.message.includes("isn't writable")
          ? 'Android blocked writing to that folder. Choose a different folder next time, or use the share sheet save option.'
          : 'The direct folder save was not completed, so the report was opened in the Android share sheet instead.';
      Alert.alert('Choose save location', message);
    }
    return;
  }

  await shareWithSystemSheet(uri, options);
}
