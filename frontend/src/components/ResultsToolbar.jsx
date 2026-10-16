import React from 'react';
import { FileText, Table, Code, Download } from 'lucide-react';
import { exportToPDF, exportToCSV, exportToJSON } from '../utils/exportUtils';

export default function ResultsToolbar({ results, query, queryTimeMs, onToast }) {
  if (!results || results.length === 0) return null;

  const handleExportPDF = () => {
    try {
      exportToPDF(results, query);
      onToast('Hasil pencarian berhasil diekspor ke PDF!', 'success');
    } catch (e) {
      onToast(`Gagal mengekspor PDF: ${e.message}`, 'error');
    }
  };

  const handleExportCSV = () => {
    try {
      exportToCSV(results, query);
      onToast('Hasil pencarian berhasil diekspor ke CSV!', 'success');
    } catch (e) {
      onToast(`Gagal mengekspor CSV: ${e.message}`, 'error');
    }
  };

  const handleExportJSON = () => {
    try {
      exportToJSON(results, query);
      onToast('Hasil pencarian berhasil diekspor ke JSON!', 'success');
    } catch (e) {
      onToast(`Gagal mengekspor JSON: ${e.message}`, 'error');
    }
  };

  return (
    <div className="results-toolbar">
      <div className="results-stats">
        <span className="results-count-badge">
          {results.length} Hasil
        </span>
        <span className="results-query-label">
          untuk <strong>"{query}"</strong>
        </span>
        {queryTimeMs && (
          <span className="results-timing">
            ({queryTimeMs} ms)
          </span>
        )}
      </div>

      <div className="export-actions">
        <span className="export-label">Ekspor:</span>

        <button
          type="button"
          className="btn-export pdf"
          onClick={handleExportPDF}
          title="Ekspor daftar hasil ke dokumen PDF"
        >
          <FileText size={15} color="#ef4444" />
          <span>PDF</span>
        </button>

        <button
          type="button"
          className="btn-export csv"
          onClick={handleExportCSV}
          title="Ekspor daftar hasil ke lembar kerja CSV"
        >
          <Table size={15} color="#10b981" />
          <span>CSV</span>
        </button>

        <button
          type="button"
          className="btn-export json"
          onClick={handleExportJSON}
          title="Ekspor data hasil ke file JSON mentah"
        >
          <Code size={15} color="#06b6d4" />
          <span>JSON</span>
        </button>
      </div>
    </div>
  );
}
