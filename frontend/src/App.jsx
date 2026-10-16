import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSearch from './components/HeroSearch';
import ResultsToolbar from './components/ResultsToolbar';
import ResultCard from './components/ResultCard';
import LoadingSkeleton from './components/LoadingSkeleton';
import EmptyState from './components/EmptyState';
import ErrorAlert from './components/ErrorAlert';
import Toast from './components/Toast';
import Footer from './components/Footer';
import { getHealthStatus, searchWeb } from './services/api';

export default function App() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [count, setCount] = useState(10);
  const [results, setResults] = useState([]);
  const [queryTimeMs, setQueryTimeMs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [health, setHealth] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Check health on mount
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    const data = await getHealthStatus();
    setHealth(data);
  };

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSearch = async (overrideQuery) => {
    const queryToSearch = (overrideQuery !== undefined ? overrideQuery : query).trim();

    if (!queryToSearch) {
      addToast('Silakan masukkan kata kunci pencarian.', 'error');
      return;
    }

    setLoading(true);
    setError(null);
    setSubmittedQuery(queryToSearch);

    try {
      const response = await searchWeb(queryToSearch, count);
      if (response.success && response.data) {
        setResults(response.data.results || []);
        setQueryTimeMs(response.data.queryTimeMs || null);

        // Refresh health status to keep in sync
        checkHealth();
      } else {
        setResults([]);
        setError({ message: response.error || 'Gagal memuat hasil pencarian.' });
      }
    } catch (err) {
      setResults([]);
      setError(err);
      checkHealth();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar health={health} />

      <main className="main-content">
        <HeroSearch
          query={query}
          setQuery={setQuery}
          count={count}
          setCount={setCount}
          onSearch={handleSearch}
          loading={loading}
        />

        {error && (
          <ErrorAlert
            error={error}
            onRetry={() => handleSearch(submittedQuery)}
          />
        )}

        {loading && <LoadingSkeleton />}

        {!loading && !error && results.length > 0 && (
          <>
            <ResultsToolbar
              results={results}
              query={submittedQuery}
              queryTimeMs={queryTimeMs}
              onToast={addToast}
            />

            <section className="results-list" aria-label="Hasil Pencarian Web">
              {results.map((item) => (
                <ResultCard
                  key={item.id}
                  item={item}
                  onToast={addToast}
                />
              ))}
            </section>
          </>
        )}

        {!loading && !error && submittedQuery && results.length === 0 && (
          <EmptyState type="no-results" query={submittedQuery} />
        )}

        {!loading && !error && !submittedQuery && (
          <EmptyState type="initial" />
        )}
      </main>

      <Footer />

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
