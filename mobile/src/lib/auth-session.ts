import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const authTokenKey = 'gdc_auth_token';
const authUserKey = 'gdc_auth_user';

export type AuthenticatedAppUser = {
  id: number;
  name: string;
  role: string;
  username: string;
};

let authToken = '';
let authUser: AuthenticatedAppUser | null = null;
let restorePromise: Promise<void> | null = null;

function isWeb() {
  return Platform.OS === 'web';
}

async function readValue(key: string) {
  if (isWeb()) {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function writeValue(key: string, value: string) {
  if (isWeb()) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }

    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function deleteValue(key: string) {
  if (isWeb()) {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }

    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export function getAuthToken() {
  return authToken;
}

export function getAuthUser() {
  return authUser;
}

export async function restoreAuthSession() {
  if (restorePromise) {
    return restorePromise;
  }

  restorePromise = (async () => {
    const [storedToken, storedUserJson] = await Promise.all([
      readValue(authTokenKey),
      readValue(authUserKey),
    ]);

    authToken = storedToken?.trim() ?? '';

    if (!storedUserJson) {
      authUser = null;
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUserJson) as AuthenticatedAppUser;

      authUser = parsedUser;
    } catch {
      authUser = null;
      authToken = '';
      await Promise.all([deleteValue(authTokenKey), deleteValue(authUserKey)]);
    }
  })();

  try {
    await restorePromise;
  } finally {
    restorePromise = null;
  }
}

export async function saveAuthSession(token: string, user: AuthenticatedAppUser) {
  authToken = token.trim();
  authUser = user;

  await Promise.all([
    writeValue(authTokenKey, authToken),
    writeValue(authUserKey, JSON.stringify(user)),
  ]);
}

export async function clearAuthSession() {
  authToken = '';
  authUser = null;

  await Promise.all([deleteValue(authTokenKey), deleteValue(authUserKey)]);
}
