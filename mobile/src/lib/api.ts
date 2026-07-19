import Constants from 'expo-constants';
import axios from 'axios';
import { Platform } from 'react-native';
import { getAuthToken } from './auth-session';

const DEV_API_PORT = '5000';

function extractHost(value?: string | null) {
  if (!value) {
    return null;
  }

  const withoutProtocol = value.replace(/^[a-z]+:\/\//i, '');
  const host = withoutProtocol.split('/')[0]?.split(':')[0];

  return host || null;
}

function getDevHost() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.hostname;
  }

  const constants = Constants as typeof Constants & {
    expoGoConfig?: { debuggerHost?: string };
    manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
  };

  const hostCandidates = [
    constants.expoGoConfig?.debuggerHost,
    constants.manifest2?.extra?.expoClient?.hostUri,
    Constants.linkingUri,
  ];

  for (const candidate of hostCandidates) {
    const host = extractHost(candidate);
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
  }

  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  return 'localhost';
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || `http://${getDevHost()}:${DEV_API_PORT}`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization;
  }

  return config;
});

export function resolveApiAssetUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  if (/^(https?:\/\/|file:|content:|ph:|asset:|blob:|data:)/i.test(value)) {
    return value;
  }

  return `${API_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`;
}
