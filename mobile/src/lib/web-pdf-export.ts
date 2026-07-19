type PdfMetadata = {
  label: string;
  value: string;
};

type PdfSummaryItem = {
  label: string;
  value: string;
};

type PdfTable = {
  title: string;
  headers: string[];
  rows: string[][];
  emptyText?: string;
};

type WebPdfReportOptions = {
  fileName: string;
  title: string;
  subtitle: string;
  metadata: PdfMetadata[];
  summary: PdfSummaryItem[];
  tables: PdfTable[];
  footer?: string;
};

const pageWidth = 595.28;
const pageHeight = 841.89;
const marginX = 42;
const marginTop = 44;
const pageBottom = 790;
const lineHeight = 14;

function normalizePdfText(value: string | number) {
  return String(value ?? '')
    .replace(/₱/g, 'PHP ')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\x7E]/g, '');
}

function escapePdfText(value: string | number) {
  return normalizePdfText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapText(value: string | number, maxWidth: number, fontSize: number) {
  const text = normalizePdfText(value);
  const maxChars = Math.max(12, Math.floor(maxWidth / (fontSize * 0.54)));
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length <= maxChars) {
      currentLine = nextLine;
      return;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [''];
}

function buildPdf(pages: string[][]) {
  const objects: string[] = [];
  const pageObjectIds = pages.map((_, index) => 6 + index * 2);
  const contentObjectIds = pages.map((_, index) => 5 + index * 2);

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

  pages.forEach((commands, index) => {
    const stream = commands.join('\n');
    const contentObjectId = contentObjectIds[index];
    const pageObjectId = pageObjectIds[index];

    objects[contentObjectId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    objects[pageObjectId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectId} 0 R >>`;
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  for (let objectId = 1; objectId < objects.length; objectId += 1) {
    offsets[objectId] = pdf.length;
    pdf += `${objectId} 0 obj\n${objects[objectId]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;

  for (let objectId = 1; objectId < objects.length; objectId += 1) {
    pdf += `${String(offsets[objectId]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

export async function downloadWebPdfReport({
  fileName,
  title,
  subtitle,
  metadata,
  summary,
  tables,
  footer,
}: WebPdfReportOptions) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Web download is not available in this environment.');
  }

  const pages: string[][] = [[]];
  let currentPage = pages[0];
  let y = marginTop;

  function addCommand(command: string) {
    currentPage.push(command);
  }

  function addPage() {
    currentPage = [];
    pages.push(currentPage);
    y = marginTop;
  }

  function ensureSpace(requiredHeight: number) {
    if (y + requiredHeight <= pageBottom) {
      return;
    }

    addPage();
  }

  function drawText(value: string | number, x: number, fontSize = 10, bold = false, maxWidth = 500) {
    const lines = wrapText(value, maxWidth, fontSize);
    ensureSpace(lines.length * lineHeight);

    lines.forEach((line) => {
      const pdfY = pageHeight - y;
      addCommand(`BT /F${bold ? 2 : 1} ${fontSize} Tf ${x} ${pdfY.toFixed(2)} Td (${escapePdfText(line)}) Tj ET`);
      y += lineHeight;
    });
  }

  function drawRule() {
    const pdfY = pageHeight - y;
    addCommand(`${marginX} ${pdfY.toFixed(2)} m ${pageWidth - marginX} ${pdfY.toFixed(2)} l S`);
    y += 16;
  }

  drawText(title, marginX, 22, true);
  drawText(subtitle.toUpperCase(), marginX, 9, false);
  y += 6;
  drawRule();

  metadata.forEach((item) => {
    drawText(`${item.label}: ${item.value}`, marginX, 10);
  });
  y += 10;

  drawText('Summary', marginX, 15, true);
  summary.forEach((item) => {
    drawText(`${item.label}: ${item.value}`, marginX + 10, 11, false);
  });

  tables.forEach((table) => {
    y += 14;
    drawText(table.title, marginX, 15, true);
    drawText(table.headers.join(' | '), marginX, 9, true);
    drawRule();

    const rows = table.rows.length > 0 ? table.rows : [[table.emptyText || 'No data available.']];
    rows.forEach((row) => {
      drawText(row.join(' | '), marginX, 9, false, pageWidth - marginX * 2);
      y += 3;
    });
  });

  if (footer) {
    y += 14;
    drawRule();
    drawText(footer, marginX, 9);
  }

  const pdfContent = buildPdf(pages);
  const blob = new Blob([pdfContent], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
