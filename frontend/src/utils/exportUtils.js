import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Clean string for safe file naming
 */
function sanitizeFilename(text) {
  return (text || 'search')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 30);
}

/**
 * Export results to PDF using jsPDF + autoTable
 * @param {Array} results 
 * @param {string} query 
 */
export function exportToPDF(results, query) {
  if (!results || results.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const timestamp = new Date().toLocaleString('id-ID');

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, doc.internal.pageSize.width, 70, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Findly Search - Laporan Hasil Pencarian', 40, 42);

  // Metadata Subtitle
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Kata Kunci: "${query}"  |  Total Hasil: ${results.length}  |  Dibuat: ${timestamp}`, 40, 58);

  // Table Data Preparation
  const tableRows = results.map((item, idx) => [
    idx + 1,
    item.title || 'Untitled',
    item.domain || '-',
    item.url || '-',
    item.description || '-'
  ]);

  autoTable(doc, {
    startY: 85,
    head: [['No', 'Judul Halaman', 'Domain', 'URL Sumber', 'Deskripsi Ringkas']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [99, 102, 241], // Indigo primary
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 6,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      1: { cellWidth: 120, fontStyle: 'bold' },
      2: { cellWidth: 80 },
      3: { cellWidth: 130 },
      4: { cellWidth: 'auto' },
    },
    styles: {
      overflow: 'linebreak',
    },
    margin: { top: 85, left: 35, right: 35, bottom: 40 },
    didDrawPage: (data) => {
      // Footer page numbering
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Halaman ${data.pageNumber} dari ${pageCount} - Findly Search (Tavily Search API)`,
        data.settings.margin.left,
        doc.internal.pageSize.height - 20
      );
    }
  });

  const filename = `findly_search_${sanitizeFilename(query)}_${Date.now()}.pdf`;
  doc.save(filename);
}

/**
 * Export results to CSV (RFC4180 compliant)
 * @param {Array} results 
 * @param {string} query 
 */
export function exportToCSV(results, query) {
  if (!results || results.length === 0) return;

  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const headers = ['No', 'Judul', 'Domain', 'URL', 'Deskripsi', 'Tipe Berkas'];
  const rows = results.map((item, idx) => [
    idx + 1,
    escapeCsv(item.title),
    escapeCsv(item.domain),
    escapeCsv(item.url),
    escapeCsv(item.description),
    escapeCsv(item.fileExtension || 'Web Page')
  ]);

  const csvContent = '\uFEFF' + [ // UTF-8 BOM for Excel compatibility
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `findly_search_${sanitizeFilename(query)}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Export results to JSON format
 * @param {Array} results 
 * @param {string} query 
 */
export function exportToJSON(results, query) {
  if (!results || results.length === 0) return;

  const exportPayload = {
    app: 'Findly Search',
    exportedAt: new Date().toISOString(),
    query,
    totalResults: results.length,
    results: results.map((item, idx) => ({
      index: idx + 1,
      title: item.title,
      url: item.url,
      domain: item.domain,
      description: item.description,
      published: item.published,
      isDownloadable: item.isDownloadable,
      fileExtension: item.fileExtension
    }))
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `findly_search_${sanitizeFilename(query)}_${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
