import React from 'react';

export default function LoadingSkeleton() {
  return (
    <div className="results-list" aria-label="Memuat hasil pencarian...">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-line skeleton-meta"></div>
          <div className="skeleton-line skeleton-title"></div>
          <div className="skeleton-line skeleton-desc-1"></div>
          <div className="skeleton-line skeleton-desc-2"></div>
        </div>
      ))}
    </div>
  );
}
