import { ExpoConfig } from 'expo/config';

export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || undefined;
  const existingApiBaseUrl = typeof config.extra?.apiBaseUrl === 'string'
    ? config.extra.apiBaseUrl.trim()
    : undefined;

  return {
    ...config,
    extra: {
      ...config.extra,
      apiBaseUrl: apiBaseUrl ?? existingApiBaseUrl ?? null,
    },
  };
};
