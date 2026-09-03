export function normalizeBarcode(value: string | null | undefined) {
  return String(value ?? '').trim().replace(/[\s-]/g, '').toUpperCase();
}

function removeLeadingZeroes(value: string) {
  return value.replace(/^0+/, '') || '0';
}

export function barcodeSearchMatches(
  barcode: string | null | undefined,
  query: string | null | undefined
) {
  const normalizedBarcode = normalizeBarcode(barcode);
  const normalizedQuery = normalizeBarcode(query);

  if (!normalizedBarcode || !normalizedQuery) {
    return false;
  }

  const compactBarcode = removeLeadingZeroes(normalizedBarcode);
  const compactQuery = removeLeadingZeroes(normalizedQuery);

  return (
    normalizedBarcode.includes(normalizedQuery) ||
    compactBarcode.includes(compactQuery) ||
    normalizedBarcode.endsWith(compactQuery) ||
    compactBarcode.endsWith(compactQuery)
  );
}

export function barcodeExactMatches(
  barcode: string | null | undefined,
  scannedBarcode: string | null | undefined
) {
  const normalizedBarcode = normalizeBarcode(barcode);
  const normalizedScannedBarcode = normalizeBarcode(scannedBarcode);

  if (!normalizedBarcode || !normalizedScannedBarcode) {
    return false;
  }

  return (
    normalizedBarcode === normalizedScannedBarcode ||
    removeLeadingZeroes(normalizedBarcode) === removeLeadingZeroes(normalizedScannedBarcode)
  );
}
