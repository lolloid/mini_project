import assert from 'assert';
import http from 'http';
import { app } from './server.js';
import { isPrivateOrRestrictedIp, validateUrlSecurity, getSafeFilename } from './services/safeDownloader.js';

console.log('====================================================');
console.log('🧪 Findly Search - Automated Test Suite');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}`);
    failed++;
  }
}

async function main() {
  // Test 1: SSRF - Block IPv4 Loopback
  await runTest('SSRF Check: Block 127.0.0.1 (Loopback)', () => {
    assert.strictEqual(isPrivateOrRestrictedIp('127.0.0.1'), true);
  });

  // Test 2: SSRF - Block Private Class A (10.0.0.0/8)
  await runTest('SSRF Check: Block 10.254.1.1 (Private Class A)', () => {
    assert.strictEqual(isPrivateOrRestrictedIp('10.254.1.1'), true);
  });

  // Test 3: SSRF - Block Private Class B (172.16.0.0/12)
  await runTest('SSRF Check: Block 172.20.10.5 (Private Class B)', () => {
    assert.strictEqual(isPrivateOrRestrictedIp('172.20.10.5'), true);
  });

  // Test 4: SSRF - Block Private Class C (192.168.0.0/16)
  await runTest('SSRF Check: Block 192.168.1.100 (Private Class C)', () => {
    assert.strictEqual(isPrivateOrRestrictedIp('192.168.1.100'), true);
  });

  // Test 5: SSRF - Block Cloud Metadata (169.254.169.254)
  await runTest('SSRF Check: Block 169.254.169.254 (Cloud Metadata / Link-Local)', () => {
    assert.strictEqual(isPrivateOrRestrictedIp('169.254.169.254'), true);
  });

  // Test 6: SSRF - Block IPv6 Loopback (::1)
  await runTest('SSRF Check: Block ::1 (IPv6 Loopback)', () => {
    assert.strictEqual(isPrivateOrRestrictedIp('::1'), true);
  });

  // Test 7: SSRF - Block IPv4-mapped IPv6 Loopback (::ffff:127.0.0.1)
  await runTest('SSRF Check: Block ::ffff:127.0.0.1 (IPv4-mapped IPv6)', () => {
    assert.strictEqual(isPrivateOrRestrictedIp('::ffff:127.0.0.1'), true);
  });

  // Test 8: Allow Public IP (8.8.8.8)
  await runTest('SSRF Check: Allow Public IP (8.8.8.8)', () => {
    assert.strictEqual(isPrivateOrRestrictedIp('8.8.8.8'), false);
  });

  // Test 9: Validate URL Protocol - Reject file://
  await runTest('URL Validation: Reject file:// protocol', async () => {
    const res = await validateUrlSecurity('file:///etc/passwd');
    assert.strictEqual(res.isValid, false);
    assert.match(res.error, /Protokol tidak diizinkan/);
  });

  // Test 10: Validate URL Protocol - Reject gopher://
  await runTest('URL Validation: Reject gopher:// protocol', async () => {
    const res = await validateUrlSecurity('gopher://127.0.0.1:70');
    assert.strictEqual(res.isValid, false);
  });

  // Test 11: Validate URL Hostname - Reject localhost
  await runTest('URL Validation: Reject localhost hostname', async () => {
    const res = await validateUrlSecurity('http://localhost:5000/api/health');
    assert.strictEqual(res.isValid, false);
    assert.match(res.error, /localhost/);
  });

  // Test 12: Validate URL Hostname - Reject .internal and .local
  await runTest('URL Validation: Reject domain suffix .local', async () => {
    const res = await validateUrlSecurity('http://myserver.local/file.pdf');
    assert.strictEqual(res.isValid, false);
  });

  // Test 13: Safe Filename Extraction
  await runTest('Filename Sanitization: Remove path traversal and risky characters', () => {
    const name1 = getSafeFilename('http://example.com/../../secret/document.pdf');
    assert.strictEqual(name1, 'document.pdf');

    const name2 = getSafeFilename('http://example.com/test', {
      'content-disposition': 'attachment; filename="../evil<>name.pdf"'
    });
    assert.strictEqual(name2.includes('..'), false);
    assert.strictEqual(name2.includes('<'), false);
  });

  // Ensure server is running for API integration tests
  let serverInstance = null;
  let testBaseUrl = 'http://localhost:5000';

  try {
    const probe = await fetch('http://localhost:5000/api/health', { signal: AbortSignal.timeout(1000) });
    if (probe.ok) {
      testBaseUrl = 'http://localhost:5000';
    }
  } catch {
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    testBaseUrl = `http://localhost:${port}`;
    serverInstance = server;
  }

  // Test 14: REST API - GET /api/health
  await runTest('API Integration: GET /api/health', async () => {
    const res = await fetch(`${testBaseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.strictEqual(data.service, 'Findly Search API');
  });

  // Test 15: REST API - Empty Query Validation
  await runTest('API Integration: Reject empty search query (400)', async () => {
    const res = await fetch(`${testBaseUrl}/api/search?q=   `);
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.code, 'EMPTY_QUERY');
  });

  // Test 16: REST API - Search Functionality or API Key Handling
  await runTest('API Integration: Search endpoint query execution', async () => {
    const res = await fetch(`${testBaseUrl}/api/search?q=cybersecurity`);
    const data = await res.json();
    // Either succeeds with 200 (if key configured) or gives 500 (API_KEY_MISSING)
    if (res.status === 200) {
      assert.strictEqual(data.success, true);
      assert.strictEqual(Array.isArray(data.data.results), true);
    } else {
      assert.strictEqual(res.status, 500);
      assert.strictEqual(data.code, 'API_KEY_MISSING');
    }
  });

  // Test 17: REST API - Download Endpoint SSRF Protection
  await runTest('API Integration: Download endpoint blocks internal loopback (403)', async () => {
    const res = await fetch(`${testBaseUrl}/api/download?url=http://127.0.0.1:5000/api/health`);
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.code, 'SSRF_SECURITY_VIOLATION');
  });

  // Test 18: REST API - 404 for unknown endpoint
  await runTest('API Integration: 404 for nonexistent route', async () => {
    const res = await fetch(`${testBaseUrl}/api/nonexistent`);
    assert.strictEqual(res.status, 404);
  });

  // Clean up server instance if started
  if (serverInstance) {
    serverInstance.close();
  }

  console.log('\n====================================================');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
