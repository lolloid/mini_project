import axios from 'axios';
import path from 'path';
import { config } from '../config.js';
import { SUPPORTED_EXTENSIONS } from './safeDownloader.js';

/**
 * Checks if a URL points to a downloadable file extension
 * @param {string} urlString 
 * @returns {{ isDownloadable: boolean, extension: string | null }}
 */
function checkDownloadableUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    const ext = path.extname(parsed.pathname).toLowerCase();
    if (ext && SUPPORTED_EXTENSIONS.has(ext)) {
      return { isDownloadable: true, extension: ext.replace('.', '').toUpperCase() };
    }
  } catch {
    // ignore
  }
  return { isDownloadable: false, extension: null };
}

/**
 * Returns which search provider is currently active
 * @returns {'brave' | 'tavily' | 'none'}
 */
export function getActiveSearchProvider() {
  if (config.braveApiKey && config.braveApiKey.trim() !== '' && !config.braveApiKey.includes('your_brave_search_api_key')) {
    return 'brave';
  }
  if (config.tavilyApiKey && config.tavilyApiKey.trim() !== '' && !config.tavilyApiKey.includes('your_tavily_api_key')) {
    return 'tavily';
  }
  return 'none';
}

/**
 * Queries external search engine (Brave Search or Tavily Search) and returns normalized results
 * @param {string} query 
 * @param {number} count 
 * @returns {Promise<{ query: string, total: number, results: Array, queryTimeMs: number, provider: string }>}
 */
export async function executeWebSearch(query, count = 10) {
  const provider = getActiveSearchProvider();

  if (provider === 'none') {
    const error = new Error('API Key pencarian belum dikonfigurasi. Harap isi BRAVE_SEARCH_API_KEY atau TAVILY_API_KEY pada file backend/.env.');
    error.code = 'API_KEY_MISSING';
    error.status = 500;
    throw error;
  }

  const startTime = Date.now();
  const safeCount = Math.min(Math.max(parseInt(count, 10) || 10, 1), 20);

  // 1. BRAVE SEARCH API
  if (provider === 'brave') {
    try {
      const response = await axios.get(config.braveSearchUrl, {
        params: {
          q: query,
          count: safeCount,
          result_filter: 'web'
        },
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': config.braveApiKey.trim()
        },
        timeout: config.requestTimeoutMs
      });

      const queryTimeMs = Date.now() - startTime;
      const rawResults = response.data?.web?.results || [];

      const results = rawResults.map((item, index) => {
        let hostname = '';
        try {
          hostname = new URL(item.url).hostname;
        } catch {
          hostname = 'unknown';
        }

        const { isDownloadable, extension } = checkDownloadableUrl(item.url);

        return {
          id: `res-${index + 1}`,
          title: item.title || 'Untitled Result',
          url: item.url,
          description: item.description || 'Tidak ada deskripsi tersedia.',
          domain: hostname,
          published: item.page_age || item.age || null,
          isDownloadable,
          fileExtension: extension,
          favicon: item.profile?.img || (hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=32` : null)
        };
      });

      return {
        query,
        total: results.length,
        results,
        queryTimeMs,
        provider: 'Brave Search'
      };
    } catch (err) {
      if (err.response) {
        const status = err.response.status;
        if (status === 401 || status === 403) {
          const error = new Error('API Key Brave Search tidak valid atau tidak memiliki izin akses. Harap periksa BRAVE_SEARCH_API_KEY di file backend/.env.');
          error.code = 'INVALID_API_KEY';
          error.status = 401;
          throw error;
        }
        if (status === 429) {
          const error = new Error('Batas kuota permintaan (rate limit) Brave Search API telah terlampaui. Silakan tunggu beberapa saat.');
          error.code = 'RATE_LIMIT_EXCEEDED';
          error.status = 429;
          throw error;
        }
      }

      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        const error = new Error('Permintaan ke Brave Search API mengalami batas waktu (timeout).');
        error.code = 'UPSTREAM_TIMEOUT';
        error.status = 504;
        throw error;
      }

      const error = new Error(`Gagal memproses pencarian Brave: ${err.message}`);
      error.code = 'SEARCH_PROVIDER_ERROR';
      error.status = 502;
      throw error;
    }
  }

  // 2. TAVILY SEARCH API
  if (provider === 'tavily') {
    try {
      const response = await axios.post(
        config.tavilySearchUrl,
        {
          api_key: config.tavilyApiKey.trim(),
          query: query,
          max_results: safeCount,
          search_depth: 'basic'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: config.requestTimeoutMs
        }
      );

      const queryTimeMs = Date.now() - startTime;
      const rawResults = response.data?.results || [];

      const results = rawResults.map((item, index) => {
        let hostname = '';
        try {
          hostname = new URL(item.url).hostname;
        } catch {
          hostname = 'unknown';
        }

        const { isDownloadable, extension } = checkDownloadableUrl(item.url);

        return {
          id: `res-${index + 1}`,
          title: item.title || 'Untitled Result',
          url: item.url,
          description: item.content || item.description || 'Tidak ada deskripsi tersedia.',
          domain: hostname,
          published: item.published_date || null,
          isDownloadable,
          fileExtension: extension,
          favicon: hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=32` : null
        };
      });

      return {
        query,
        total: results.length,
        results,
        queryTimeMs,
        provider: 'Tavily Search'
      };
    } catch (err) {
      if (err.response) {
        const status = err.response.status;
        if (status === 401 || status === 403) {
          const error = new Error('API Key Tavily Search tidak valid atau tidak memiliki izin akses. Harap periksa TAVILY_API_KEY di file backend/.env.');
          error.code = 'INVALID_API_KEY';
          error.status = 401;
          throw error;
        }
        if (status === 429) {
          const error = new Error('Batas kuota permintaan (rate limit) Tavily Search API telah terlampaui. Silakan tunggu beberapa saat.');
          error.code = 'RATE_LIMIT_EXCEEDED';
          error.status = 429;
          throw error;
        }
      }

      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        const error = new Error('Permintaan ke Tavily Search API mengalami batas waktu (timeout).');
        error.code = 'UPSTREAM_TIMEOUT';
        error.status = 504;
        throw error;
      }

      const error = new Error(`Gagal memproses pencarian Tavily: ${err.message}`);
      error.code = 'SEARCH_PROVIDER_ERROR';
      error.status = 502;
      throw error;
    }
  }
}

// Backward compatibility alias
export const executeBraveSearch = executeWebSearch;
