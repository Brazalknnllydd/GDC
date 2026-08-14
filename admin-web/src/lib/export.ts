import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Excel ────────────────────────────────────────────────────────────────────

export function exportToExcel(
  rows: Record<string, any>[],
  filename: string,
  sheetName = 'Sheet1'
) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ─── PDF ─────────────────────────────────────────────────────────────────────

export function exportToPdf(options: {
  title: string;
  subtitle?: string;
  head: string[];
  body: (string | number)[][];
  filename: string;
  orientation?: 'portrait' | 'landscape';
}) {
  const { title, subtitle, head, body, filename, orientation = 'landscape' } = options;
  const doc = new jsPDF({ orientation });

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 18);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(subtitle, 14, 26);
    doc.setTextColor(0, 0, 0);
  }

  // Generated timestamp
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, subtitle ? 32 : 26);
  doc.setTextColor(0, 0, 0);

  autoTable(doc, {
    startY: subtitle ? 38 : 32,
    head: [head],
    body,
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 248, 252] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${filename}.pdf`);
}
