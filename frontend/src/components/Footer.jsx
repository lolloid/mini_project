import React from 'react';
import { Shield, Sparkles, Database } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-badges">
          <span className="footer-badge">
            <Sparkles size={11} style={{ display: 'inline', marginRight: '4px' }} />
            Tavily Search API
          </span>
          <span className="footer-badge">
            <Shield size={11} style={{ display: 'inline', marginRight: '4px' }} />
            SSRF & DNS Protected
          </span>
          <span className="footer-badge">
            <Database size={11} style={{ display: 'inline', marginRight: '4px' }} />
            Node.js & Express REST API
          </span>
          <span className="footer-badge">
            React.js + Vite
          </span>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <strong>Findly Search</strong> — Proyek Aplikasi Pencarian Web & Pengunduhan Berkas Terproteksi.
        </p>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '680px' }}>
          Aplikasi ini memanfaatkan Tavily Search API untuk agregasi pencarian web publik. Fitur unduh berkas dilengkapi validasi protokol, resolusi DNS, pemblokiran alamat IP internal/privat (SSRF Prevention), dan pembatasan ukuran berkas maksimum 20 MB.
        </p>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          &copy; {new Date().getFullYear()} Findly Search. Dikembangkan untuk keperluan akademik mata kuliah Pemrograman Web Lanjut.
        </p>
      </div>
    </footer>
  );
}
