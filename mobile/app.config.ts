import { ExpoConfig } from 'expo/config';

export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  const isEasBuild = process.env.EAS_BUILD === 'true';
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || undefined;
  const existingApiBaseUrl = typeof config.extra?.apiBaseUrl === 'string'
    ? config.extra.apiBaseUrl.trim()
    : undefined;
  const resolvedApiBaseUrl = apiBaseUrl ?? (isEasBuild ? existingApiBaseUrl : undefined);

  return {
    ...config,
    extra: {
      ...config.extra,
      ...(resolvedApiBaseUrl ? { apiBaseUrl: resolvedApiBaseUrl } : {}),
    },
  };
};
