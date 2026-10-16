import React from 'react';
import { Search, Compass, FileSearch } from 'lucide-react';

export default function EmptyState({ type = 'initial', query = '' }) {
  if (type === 'no-results') {
    return (
      <div className="state-container">
        <div className="state-icon-wrapper empty">
          <FileSearch size={32} />
        </div>
        <h3 className="state-title">Tidak Ada Hasil Ditemukan</h3>
        <p className="state-desc">
          Tidak ditemukan dokumen atau situs web untuk kata kunci <strong>"{query}"</strong>. Coba gunakan istilah umum atau periksa ejaan Anda.
        </p>
      </div>
    );
  }

  return (
    <div className="state-container">
      <div className="state-icon-wrapper empty">
        <Compass size={32} />
      </div>
      <h3 className="state-title">Mulai Pencarian Anda</h3>
      <p className="state-desc">
        Ketik kata kunci di atas atau pilih salah satu saran cepat untuk mencari dokumen, laporan, dan informasi dari seluruh web melalui Tavily Search API.
      </p>
    </div>
  );
}
