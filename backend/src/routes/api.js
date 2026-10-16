import express from 'express';
import { executeBraveSearch, getActiveSearchProvider } from '../services/braveSearch.js';
import { downloadFileSecurely, validateUrlSecurity } from '../services/safeDownloader.js';
import { config } from '../config.js';

export const apiRouter = express.Router();

/**
 * GET /api/health
 * Health check endpoint
 */
apiRouter.get('/health', (req, res) => {
  const provider = getActiveSearchProvider();

  res.status(200).json({
    status: 'ok',
    service: 'Findly Search API',
    timestamp: new Date().toISOString(),
    provider: provider,
    braveConfigured: provider !== 'none',
    maxDownloadSizeMb: Math.round(config.maxDownloadSizeBytes / (1024 * 1024))
  });
});

/**
 * GET /api/search?q={query}&count={count}
 * Search web using Brave Search API
 */
apiRouter.get('/search', async (req, res) => {
  const query = req.query.q;
  const count = req.query.count || 10;

  // Validation: non-empty query
  if (!query || typeof query !== 'string' || query.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Kata kunci pencarian (parameter q) wajib diisi dan tidak boleh kosong.',
      code: 'EMPTY_QUERY'
    });
  }

  const trimmedQuery = query.trim();
  if (trimmedQuery.length > 256) {
    return res.status(400).json({
      success: false,
      error: 'Kata kunci pencarian terlalu panjang (maksimal 256 karakter).',
      code: 'QUERY_TOO_LONG'
    });
  }

  try {
    const data = await executeBraveSearch(trimmedQuery, count);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'Terjadi kesalahan internal pada server saat mencari.',
      code: err.code || 'SEARCH_ERROR'
    });
  }
});

/**
 * GET /api/download?url={encoded_url}
 * Download file securely from source URL with SSRF checks
 */
apiRouter.get('/download', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl || typeof targetUrl !== 'string' || targetUrl.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Parameter URL file (parameter url) wajib disertakan.',
      code: 'MISSING_URL'
    });
  }

  const decodedUrl = targetUrl.trim();

  // Validate format early
  try {
    new URL(decodedUrl);
  } catch {
    return res.status(400).json({
      success: false,
      error: 'Format URL yang diberikan tidak valid.',
      code: 'INVALID_URL'
    });
  }

  return downloadFileSecurely(decodedUrl, res);
});
