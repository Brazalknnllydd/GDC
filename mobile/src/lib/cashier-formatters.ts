import { formatPeso } from './product-utils';

export function formatCashierDate(value: Date) {
  return value.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatCashierTime(value: Date) {
  return value.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatShiftDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}m`;
}

export function formatPaymentMethod(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return 'Cash';
  }

  return normalized;
}

export function formatDrawerStatus(drawerVariance: number) {
  if (drawerVariance === 0) {
    return 'Balanced (+P0.00)';
  }

  const sign = drawerVariance > 0 ? '+' : '-';
  return `Variance (${sign}${formatPeso(Math.abs(drawerVariance)).replace('P', 'P')})`;
}
