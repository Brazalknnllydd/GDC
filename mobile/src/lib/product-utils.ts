export function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

export function formatPeso(value: number) {
  return `₱${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatExportAmount(value: number | string | null | undefined) {
  const normalized = typeof value === 'number'
    ? value
    : Number(String(value ?? '').replace(/[^\d.-]/g, '')) || 0;

  return normalized.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

export type ParsedWeightValue = {
  unit: string;
  weight: number;
} | null;

function normalizeWeightUnit(value: string) {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return 'pcs';
  }

  if (normalized === 'l' || normalized === 'liter' || normalized === 'litre') {
    return 'l';
  }

  if (normalized === 'kg' || normalized === 'g' || normalized === 'ml' || normalized === 'pcs') {
    return normalized;
  }

  return normalized;
}

export function parseWeight(value: string): ParsedWeightValue {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?$/);

  if (!match) {
    return null;
  }

  const weight = Number.parseFloat(match[1]);

  if (Number.isNaN(weight)) {
    return null;
  }

  return {
    weight,
    unit: normalizeWeightUnit(match[2] ?? ''),
  };
}

export function formatWeightValue(weight: number | string | null | undefined, unit: string) {
  if (weight === null || weight === undefined) {
    return '';
  }

  const normalizedUnit = unit.trim().toLowerCase();
  const numericWeight = typeof weight === 'number' ? weight : Number(weight);

  if (Number.isNaN(numericWeight)) {
    return '';
  }

  const weightText = Number.isInteger(numericWeight)
    ? numericWeight.toString()
    : numericWeight.toString();

  if (!normalizedUnit || normalizedUnit === 'pcs') {
    return weightText;
  }

  return `${weightText} ${normalizedUnit}`;
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
