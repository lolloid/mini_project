import dns from 'dns/promises';
import axios from 'axios';
import ipaddr from 'ipaddr.js';
import path from 'path';
import { config } from '../config.js';

// Supported file extensions for safe download
export const SUPPORTED_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.csv', '.json', '.xml', '.zip', '.tar', '.gz',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'
]);

// Allowed content types (MIME types)
export const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/json',
  'application/xml',
  'text/xml',
  'application/zip',
  'application/x-zip-compressed',
  'application/gzip',
  'application/x-tar',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/octet-stream',
  'binary/octet-stream'
];

/**
 * Validates whether an IP address is private, loopback, link-local, or restricted
 * @param {string} ipString 
 * @returns {boolean} True if IP is private/restricted and must be blocked
 */
export function isPrivateOrRestrictedIp(ipString) {
  try {
    const addr = ipaddr.parse(ipString);
    const range = addr.range();

    // Check forbidden ranges for IPv4 & IPv6
    const forbiddenRanges = [
      'unspecified',
      'broadcast',
      'linkLocal',
      'loopback',
      'private',
      'carrierGradeNat',
      'uniqueLocal',
      'reserved'
    ];

    if (forbiddenRanges.includes(range)) {
      return true;
    }

    // Check IPv4-mapped IPv6 addresses (e.g., ::ffff:127.0.0.1)
    if (addr.kind() === 'ipv6' && addr.isIPv4MappedAddress()) {
      const ipv4Addr = addr.toIPv4Address();
      return forbiddenRanges.includes(ipv4Addr.range());
    }

    return false;
  } catch (err) {
    // If not a valid parseable IP, consider unsafe
    return true;
  }
}

/**
 * Validates target URL against SSRF rules:
 * - Protocols must be http or https
 * - Disallow localhost and internal domain patterns
 * - Resolves all DNS records and checks if any points to private/internal IPs
 * @param {string} targetUrl 
 * @returns {Promise<{ isValid: boolean, error?: string, urlObj?: URL, resolvedIps?: string[] }>}
 */
export async function validateUrlSecurity(targetUrl) {
  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (e) {
    return { isValid: false, error: 'Format URL tidak valid.' };
  }

  // 1. Protocol validation: Only HTTP & HTTPS
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return { isValid: false, error: 'Protokol tidak diizinkan. Hanya HTTP dan HTTPS yang didukung.' };
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // 2. Reject credentials in URL (e.g. http://user:pass@example.com)
  if (parsedUrl.username || parsedUrl.password) {
    return { isValid: false, error: 'URL dengan kredensial otentikasi tidak diizinkan.' };
  }

  // 3. Block localhost and common local/internal domains
  const blockedHostnames = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];
  if (blockedHostnames.includes(hostname)) {
    return { isValid: false, error: 'Akses ke alamat localhost dan loopback diblokir demi keamanan.' };
  }

  const blockedSuffixes = ['.local', '.internal', '.localhost', '.corp', '.arpa', '.onion'];
  if (blockedSuffixes.some(suffix => hostname.endsWith(suffix))) {
    return { isValid: false, error: 'Akses ke domain internal/lokal diblokir demi keamanan.' };
  }

  // 4. If hostname is already an IP, test it directly
  if (ipaddr.isValid(hostname)) {
    if (isPrivateOrRestrictedIp(hostname)) {
      return { isValid: false, error: 'Akses ke alamat IP privat/internal diblokir (SSRF Protection).' };
    }
  }

  // 5. DNS Resolution check: resolve all IPv4 & IPv6 records
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return { isValid: false, error: `Gagal menyelesaikan DNS untuk domain ${hostname}.` };
    }

    for (const record of addresses) {
      if (isPrivateOrRestrictedIp(record.address)) {
        return {
          isValid: false,
          error: `Domain ${hostname} mengarah ke alamat IP privat/terlarang (${record.address}). Akses ditolak demi keamanan.`
        };
      }
    }

    return {
      isValid: true,
      urlObj: parsedUrl,
      resolvedIps: addresses.map(a => a.address)
    };
  } catch (err) {
    return { isValid: false, error: `Domain tidak dapat ditemukan atau gagal di-resolve: ${err.message}` };
  }
}

/**
 * Extracts a safe filename from headers or URL path
 * @param {string} urlString 
 * @param {object} headers 
 * @returns {string}
 */
export function getSafeFilename(urlString, headers = {}) {
  let filename = '';

  // 1. Try Content-Disposition header
  const contentDisposition = headers['content-disposition'] || '';
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)["']?/i);
    if (filenameMatch && filenameMatch[1]) {
      filename = decodeURIComponent(filenameMatch[1].trim());
    }
  }

  // 2. Fallback to URL path basename
  if (!filename) {
    try {
      const parsedUrl = new URL(urlString);
      const pathname = parsedUrl.pathname;
      const base = path.basename(pathname);
      if (base && base !== '/' && base.includes('.')) {
        filename = decodeURIComponent(base);
      }
    } catch {
      // ignore
    }
  }

  // 3. Fallback default
  if (!filename) {
    filename = 'downloaded-file';
  }

  // Sanitize: strip path traversal (..), slashes, and hazardous control chars
  filename = filename
    .replace(/\.\.+/g, '_')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/^_+/, '')
    .trim();

  if (!filename) filename = 'downloaded-file.bin';

  return filename;
}

/**
 * Performs a secure file download with redirect tracking, SSRF validation, size limiting, and streaming
 * @param {string} initialUrl 
 * @param {import('express').Response} res 
 */
export async function downloadFileSecurely(initialUrl, res) {
  let currentUrl = initialUrl;
  let redirectsCount = 0;

  while (redirectsCount <= config.maxRedirects) {
    // Validate target URL security
    const validation = await validateUrlSecurity(currentUrl);
    if (!validation.isValid) {
      return res.status(403).json({
        success: false,
        error: validation.error,
        code: 'SSRF_SECURITY_VIOLATION'
      });
    }

    try {
      // Send GET request without automatic redirect following
      const response = await axios({
        method: 'get',
        url: currentUrl,
        responseType: 'stream',
        maxRedirects: 0,
        validateStatus: (status) => (status >= 200 && status < 400),
        timeout: config.requestTimeoutMs,
        headers: {
          'User-Agent': 'FindlySearchBot/1.0 (+https://findlysearch.local)'
        }
      });

      // Handle Redirects (301, 302, 303, 307, 308)
      if (response.status >= 300 && response.status < 400) {
        const redirectLocation = response.headers.location;
        if (!redirectLocation) {
          return res.status(502).json({
            success: false,
            error: 'Server sumber merespons redirect tanpa header Location.',
            code: 'INVALID_REDIRECT'
          });
        }

        // Resolve relative redirects
        const nextUrl = new URL(redirectLocation, currentUrl).href;
        currentUrl = nextUrl;
        redirectsCount++;
        continue;
      }

      // Check Content-Type
      const rawContentType = (response.headers['content-type'] || '').toLowerCase().split(';')[0].trim();

      // Check if it's an HTML page (not a downloadable file)
      if (rawContentType === 'text/html' || rawContentType === 'application/xhtml+xml') {
        return res.status(400).json({
          success: false,
          error: 'URL mengarah ke halaman web (HTML), bukan file dokumen yang dapat diunduh. Silakan buka halaman tersebut melalui tautan asli.',
          code: 'UNSUPPORTED_HTML_CONTENT'
        });
      }

      // Check Content-Length if provided by header
      const contentLengthHeader = response.headers['content-length'];
      if (contentLengthHeader) {
        const contentLength = parseInt(contentLengthHeader, 10);
        if (contentLength > config.maxDownloadSizeBytes) {
          const maxMb = Math.round(config.maxDownloadSizeBytes / (1024 * 1024));
          return res.status(413).json({
            success: false,
            error: `Ukuran file melebihi batas maksimum (${maxMb} MB). File berukuran ${(contentLength / (1024 * 1024)).toFixed(2)} MB.`,
            code: 'FILE_TOO_LARGE'
          });
        }
      }

      // Safe filename extraction
      const filename = getSafeFilename(currentUrl, response.headers);

      // Verify file extension compatibility
      const ext = path.extname(filename).toLowerCase();
      const isAllowedExt = ext && SUPPORTED_EXTENSIONS.has(ext);
      const isAllowedType = ALLOWED_CONTENT_TYPES.some(type => rawContentType.startsWith(type));

      if (!isAllowedExt && !isAllowedType) {
        return res.status(415).json({
          success: false,
          error: `Tipe file atau ekstensi '${ext || rawContentType}' tidak didukung untuk pengunduhan langsung demi keamanan.`,
          code: 'UNSUPPORTED_MEDIA_TYPE'
        });
      }

      // Forward response headers
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      if (rawContentType) {
        res.setHeader('Content-Type', rawContentType);
      }
      if (contentLengthHeader) {
        res.setHeader('Content-Length', contentLengthHeader);
      }

      // Stream with real-time byte count enforcement (prevents zip bombs & deceptive content-length)
      let downloadedBytes = 0;
      const stream = response.data;

      stream.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (downloadedBytes > config.maxDownloadSizeBytes) {
          stream.destroy();
          if (!res.headersSent) {
            res.status(413).json({
              success: false,
              error: `Pengunduhan dibatalkan: ukuran data melebihi batas maksimum (${Math.round(config.maxDownloadSizeBytes / (1024 * 1024))} MB).`,
              code: 'FILE_TOO_LARGE'
            });
          } else {
            res.destroy();
          }
        }
      });

      stream.on('error', (err) => {
        if (!res.headersSent) {
          res.status(502).json({
            success: false,
            error: `Gagal membaca stream data dari sumber: ${err.message}`,
            code: 'STREAM_ERROR'
          });
        }
      });

      return stream.pipe(res);

    } catch (err) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        return res.status(504).json({
          success: false,
          error: 'Koneksi ke server sumber waktu habis (timeout).',
          code: 'GATEWAY_TIMEOUT'
        });
      }

      return res.status(502).json({
        success: false,
        error: `Gagal mengunduh file dari server sumber: ${err.message}`,
        code: 'DOWNLOAD_FAILED'
      });
    }
  }

  return res.status(400).json({
    success: false,
    error: 'Terlalu banyak redirect (redirect limit exceeded).',
    code: 'TOO_MANY_REDIRECTS'
  });
}
