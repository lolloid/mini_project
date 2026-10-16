import React from 'react';
import { Search, X, Sparkles, SlidersHorizontal } from 'lucide-react';

export default function HeroSearch({
  query,
  setQuery,
  count,
  setCount,
  onSearch,
  loading
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  const suggestions = [
    { label: 'Cybersecurity Indonesia PDF', query: 'filetype:pdf cybersecurity indonesia' },
    { label: 'Pemrograman Web Lanjut Express', query: 'express js rest api architecture best practices' },
    { label: 'Open Data CSV', query: 'filetype:csv open data indonesia' },
    { label: 'AI LLM Research Paper', query: 'filetype:pdf transformer large language models 2025' }
  ];

  return (
    <section className="hero-section">
      <div className="hero-pill">
        <Sparkles size={14} />
        <span>Didukung Tavily Search API & Aman dari SSRF</span>
      </div>

      <h1 className="hero-title">
        Temukan Informasi Web Lebih <span className="gradient-text">Cepat, Bersih & Terstruktur</span>
      </h1>

      <p className="hero-desc">
        Aplikasi pencarian modern yang mengagregasi data dari Tavily Search API, menyediakan ekspor instan ke PDF/CSV/JSON, serta pengunduhan file berkas tervalidasi.
      </p>

      <div className="search-container">
        <form className="search-form" onSubmit={handleSubmit}>
          <div className="search-icon-leading">
            <Search size={20} />
          </div>

          <input
            id="findly-search-input"
            type="text"
            className="search-input"
            placeholder="Ketik kata kunci pencarian (misal: 'Panduan REST API Node.js PDF')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            autoFocus
          />

          <div className="search-actions-group">
            {query && (
              <button
                type="button"
                className="btn-clear"
                onClick={() => setQuery('')}
                title="Hapus teks"
              >
                <X size={16} />
              </button>
            )}

            <select
              className="select-count"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              title="Jumlah hasil per pencarian"
              disabled={loading}
            >
              <option value={10}>10 Hasil</option>
              <option value={15}>15 Hasil</option>
              <option value={20}>20 Hasil</option>
            </select>

            <button
              id="findly-search-btn"
              type="submit"
              className="btn-search"
              disabled={loading || !query.trim()}
            >
              {loading ? (
                <>Mencari...</>
              ) : (
                <>
                  <Search size={16} strokeWidth={2.4} />
                  <span>Cari</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="suggestions-wrapper">
          <span className="suggestions-label">Coba pencarian:</span>
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className="suggestion-chip"
              onClick={() => {
                setQuery(item.query);
                onSearch(item.query);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
