import React from 'react';
import { Search, ShieldCheck, AlertTriangle, WifiOff, Sparkles } from 'lucide-react';

export default function Navbar({ health }) {
  let statusBadge = (
    <div className="badge-status offline" title="Backend tidak dapat dihubungi">
      <span className="status-dot"></span>
      <WifiOff size={13} />
      <span>Backend Offline</span>
    </div>
  );

  if (health?.status === 'ok') {
    if (health.braveConfigured) {
      const providerName = health.provider === 'tavily' ? 'Tavily API Aktif' : 'Brave API Aktif';
      statusBadge = (
        <div className="badge-status online" title={`Backend berjalan & ${providerName}`}>
          <span className="status-dot"></span>
          <ShieldCheck size={13} />
          <span>{providerName}</span>
        </div>
      );
    } else {
      statusBadge = (
        <div className="badge-status warning" title="Backend aktif, namun Brave API Key belum diisi pada backend/.env">
          <span className="status-dot"></span>
          <AlertTriangle size={13} />
          <span>API Key Belum Diset</span>
        </div>
      );
    }
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <a href="/" className="brand-link">
          <div className="brand-icon-wrapper">
            <Search size={22} strokeWidth={2.6} />
          </div>
          <div className="brand-text-group">
            <span className="brand-title">Findly Search</span>
            <span className="brand-subtitle">Smart Web Search & File Portal</span>
          </div>
        </a>

        <div className="nav-actions">
          {statusBadge}
        </div>
      </div>
    </header>
  );
}
