import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

function isReadableAssetUri(uri: string) {
  return /^(file|content|asset):\/\//i.test(uri);
}

async function readAssetBase64(uri: string) {
  if (isReadableAssetUri(uri)) {
    return FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  const tempFileName = `asset-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`;
  const tempUri = `${FileSystem.cacheDirectory ?? ''}${tempFileName}`;

  await FileSystem.copyAsync({
    from: uri,
    to: tempUri,
  });

  return FileSystem.readAsStringAsync(tempUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

export async function getAssetDataUri(
  assetModule: number,
  mimeType = 'image/jpeg'
) {
  const asset = Asset.fromModule(assetModule);

  if (!asset.localUri) {
    await asset.downloadAsync();
  }

  const sourceUri = asset.localUri || asset.uri;
  const base64 = await readAssetBase64(sourceUri);

  return `data:${mimeType};base64,${base64}`;
}
