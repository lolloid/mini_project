import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  braveApiKey: process.env.BRAVE_SEARCH_API_KEY || '',
  tavilyApiKey: process.env.TAVILY_API_KEY || '',
  braveSearchUrl: 'https://api.search.brave.com/res/v1/web/search',
  tavilySearchUrl: 'https://api.tavily.com/search',
  maxDownloadSizeBytes: (parseInt(process.env.MAX_DOWNLOAD_SIZE_MB, 10) || 20) * 1024 * 1024, // default 20MB
  maxRedirects: 5,
  requestTimeoutMs: 15000, // 15 seconds timeout
};
