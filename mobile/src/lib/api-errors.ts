import { isAxiosError } from 'axios';

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? fallbackMessage;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}
