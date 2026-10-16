import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

/**
 * Fetch health status of backend and Brave API configuration
 */
export async function getHealthStatus() {
  try {
    const res = await apiClient.get('/health');
    return res.data;
  } catch (err) {
    return {
      status: 'offline',
      service: 'Findly Search API',
      braveConfigured: false,
      error: err.message
    };
  }
}

/**
 * Execute web search via backend
 * @param {string} query 
 * @param {number} count 
 */
export async function searchWeb(query, count = 10) {
  try {
    const res = await apiClient.get('/search', {
      params: { q: query, count }
    });
    return res.data;
  } catch (err) {
    if (err.response && err.response.data) {
      throw err.response.data;
    }
    throw {
      success: false,
      error: err.message || 'Gagal terhubung ke backend server.',
      code: 'NETWORK_ERROR'
    };
  }
}

/**
 * Downloads a file securely through backend SSRF-protected endpoint
 * @param {string} targetUrl 
 */
export async function downloadFile(targetUrl) {
  try {
    const response = await apiClient.get('/download', {
      params: { url: targetUrl },
      responseType: 'blob' // Essential for receiving binary files
    });

    // Extract filename from Content-Disposition header if available
    let filename = 'downloaded_file';
    const disposition = response.headers['content-disposition'];
    if (disposition) {
      const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)["']?/i);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }
    } else {
      // Derive from url
      try {
        const u = new URL(targetUrl);
        const base = u.pathname.split('/').pop();
        if (base && base.includes('.')) {
          filename = base;
        }
      } catch {
        // ignore
      }
    }

    // Create a temporary link element to trigger browser download
    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);

    return { success: true, filename };
  } catch (err) {
    // If response is a blob containing error JSON, parse it
    if (err.response && err.response.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const jsonError = JSON.parse(text);
        throw jsonError;
      } catch (parseErr) {
        if (parseErr.error) throw parseErr;
      }
    }

    if (err.response && err.response.data) {
      throw err.response.data;
    }

    throw {
      success: false,
      error: err.message || 'Gagal mengunduh file dari server.',
      code: 'DOWNLOAD_FAILED'
    };
  }
}
