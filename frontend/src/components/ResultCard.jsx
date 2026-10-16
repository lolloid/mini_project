import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Download, FileText, Globe } from 'lucide-react';
import { downloadFile } from '../services/api';

export default function ResultCard({ item, onToast }) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(true);
      onToast('Tautan berhasil disalin ke papan klip!', 'info');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onToast('Gagal menyalin tautan.', 'error');
    }
  };

  const handleDownloadFile = async () => {
    setIsDownloading(true);
    onToast(`Memulai verifikasi dan unduhan file dari: ${item.domain}...`, 'info');
    try {
      const res = await downloadFile(item.url);
      onToast(`File "${res.filename}" berhasil diunduh secara aman!`, 'success');
    } catch (err) {
      const msg = err.error || err.message || 'Gagal mengunduh file.';
      onToast(`Gagal mengunduh: ${msg}`, 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <article className="result-card">
      <div className="result-meta-top">
        <div className="result-source">
          {item.favicon ? (
            <img
              src={item.favicon}
              alt=""
              className="result-favicon"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <Globe size={16} color="#94a3b8" />
          )}
          <span className="result-domain-text">{item.domain}</span>
        </div>

        <div className="result-badges">
          {item.isDownloadable && (
            <span className="badge-filetype">
              <FileText size={12} />
              {item.fileExtension || 'FILE'}
            </span>
          )}
          {item.published && (
            <span className="badge-published">
              {item.published}
            </span>
          )}
        </div>
      </div>

      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="result-title-link"
        title="Buka halaman sumber asli"
      >
        <span>{item.title}</span>
        <ExternalLink size={15} className="icon-external" />
      </a>

      <p className="result-description">
        {item.description}
      </p>

      <div className="result-footer-actions">
        <span className="result-raw-url" title={item.url}>
          {item.url}
        </span>

        <div className="result-card-buttons">
          <button
            type="button"
            className="btn-card-action"
            onClick={handleCopyLink}
            title="Salin tautan ke clipboard"
          >
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copied ? 'Tersalin' : 'Salin URL'}</span>
          </button>

          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-card-action"
            title="Kunjungi website asli"
          >
            <ExternalLink size={14} />
            <span>Kunjungi</span>
          </a>

          {item.isDownloadable ? (
            <button
              type="button"
              className="btn-card-download"
              onClick={handleDownloadFile}
              disabled={isDownloading}
              title="Unduh file dokumen secara aman melalui backend (SSRF Check)"
            >
              <Download size={14} />
              <span>{isDownloading ? 'Mengunduh...' : `Unduh ${item.fileExtension || 'File'}`}</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn-card-action"
              onClick={handleDownloadFile}
              disabled={isDownloading}
              title="Coba unduh berkas dari URL ini via backend"
            >
              <Download size={14} />
              <span>{isDownloading ? 'Mengunduh...' : 'Unduh'}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
