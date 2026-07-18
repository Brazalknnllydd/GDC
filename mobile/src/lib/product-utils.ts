export function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

export function formatPeso(value: number) {
  return `₱${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCompactPeso(value: number) {
  if (value >= 1_000_000) {
    return `₱${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  }

  if (value >= 1_000) {
    return `₱${(value / 1_000).toFixed(value >= 100_000 ? 0 : 1)}K`;
  }

  return formatPeso(value);
}

export function normalizeNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }
  return typeof value === 'number' ? value : Number(value) || 0;
}

export function parseWeight(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function inferUnit(value: string) {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return 'pcs';
  }

  if (normalized.includes('kg')) return 'kg';
  if (normalized.includes('g')) return 'g';
  if (normalized.includes('ml')) return 'ml';
  if (normalized.includes('l')) return 'L';

  return 'pcs';
}
