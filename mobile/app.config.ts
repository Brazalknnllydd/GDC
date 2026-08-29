import { ExpoConfig } from 'expo/config';

export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || undefined;

  return {
    ...config,
    extra: {
      ...config.extra,
      apiBaseUrl: apiBaseUrl ?? null,
    },
  };
};
