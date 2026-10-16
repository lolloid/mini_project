import React from 'react';
import { AlertCircle, Key, RefreshCw, ExternalLink } from 'lucide-react';

export default function ErrorAlert({ error, onRetry }) {
  if (!error) return null;

  const isKeyMissing = error.code === 'API_KEY_MISSING' || (typeof error.error === 'string' && error.error.includes('API Key'));
  const isRateLimit = error.code === 'RATE_LIMIT_EXCEEDED';

  return (
    <div className="state-container">
      <div className="state-icon-wrapper error">
        <AlertCircle size={32} />
      </div>

      <h3 className="state-title">
        {isKeyMissing
          ? 'Tavily Search API Key Belum Dikonfigurasi'
          : isRateLimit
          ? 'Batas Kuota Permintaan (Rate Limit)'
          : 'Gagal Memuat Hasil Pencarian'}
      </h3>

      <p className="state-desc">
        {error.error || error.message || 'Terjadi gangguan saat menghubungi server pencarian.'}
      </p>

      {isKeyMissing && (
        <div className="guide-card">
          <div className="guide-card-title">
            <Key size={16} />
            <span>Langkah Konfigurasi Tavily API Key (Gratis):</span>
          </div>
          <ol>
            <li>
              Buka situs resmi{' '}
              <a
                href="https://tavily.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#38bdf8', textDecoration: 'underline' }}
              >
                Tavily Search API <ExternalLink size={11} style={{ display: 'inline' }} />
              </a>{' '}
              lalu daftar akun gratis (Free tier 1.000 search/bulan).
            </li>
            <li>Salin API Key (berawalan <code>tvly-...</code>) dari dashboard Tavily Anda.</li>
            <li>
              Buka file <code>backend/.env</code> di proyek Anda.
            </li>
            <li>
              Pastikan terdapat baris <code>TAVILY_API_KEY=tvly-dev-...</code> dengan API Key Anda.
            </li>
            <li>Simpan file <code>.env</code>, lalu ulangi pencarian.</li>
          </ol>
        </div>
      )}

      {onRetry && (
        <button
          type="button"
          className="btn-export"
          onClick={onRetry}
          style={{ marginTop: '0.75rem' }}
        >
          <RefreshCw size={14} />
          <span>Coba Lagi</span>
        </button>
      )}
    </div>
  );
}
