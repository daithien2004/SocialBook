import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const failureRate = new Rate('failed_requests');
const bookListDuration = new Trend('book_list_duration');
const bookSearchDuration = new Trend('book_search_duration');
const bookDetailDuration = new Trend('book_detail_duration');

export const options = {
  stages: [
    { duration: '10s', target: 5 },    // Warm up
    { duration: '10s', target: 10 },   // Ramp up
    { duration: '10s', target: 10 },   // Baseline
    { duration: '5s', target: 0 },     // Cool down
  ],
  thresholds: {
    failed_requests: ['rate<0.10'],        // <10% failure rate (baseline)
    http_req_duration: ['p(95)<2000'],
    book_list_duration: ['p(95)<500'],
    book_detail_duration: ['p(95)<300'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5000/api';

export default function () {
  // ─── Test 1: Book List ───────────────────────────────────
  group('GET /books', () => {
    const params = {
      headers: { 'Content-Type': 'application/json' },
    };

    // Default listing
    const resp1 = http.get(`${BASE_URL}/books?page=1&limit=20`, params);
    bookListDuration.add(resp1.timings.duration);
    check(resp1, {
      'list: status 200': (r) => r.status === 200,
      'list: has data array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.data?.data || body.data);
        } catch { return false; }
      },
    });
    failureRate.add(resp1.status !== 200);

    // Search query
    const resp2 = http.get(`${BASE_URL}/books?search=${encodeURIComponent('La Fontaine')}&page=1&limit=10`, params);
    bookSearchDuration.add(resp2.timings.duration);
    check(resp2, {
      'search: status 200': (r) => r.status === 200,
    });

    // Filter by genre
    const resp3 = http.get(`${BASE_URL}/books?genres=self-help&page=1&limit=10`, params);
    check(resp3, {
      'filter: status 200': (r) => r.status === 200,
    });

    // Filters endpoint
    const resp4 = http.get(`${BASE_URL}/books/filters/all`, params);
    check(resp4, {
      'filters: status 200': (r) => r.status === 200,
    });
  });

  // ─── Test 2: Book Detail ─────────────────────────────────
  group('GET /books/:slug', () => {
    const params = {
      headers: { 'Content-Type': 'application/json' },
    };

    // Existing book
    const resp1 = http.get(`${BASE_URL}/books/tho-ngu-ngon-la-fontaine`, params);
    bookDetailDuration.add(resp1.timings.duration);
    check(resp1, {
      'detail: status 200': (r) => r.status === 200,
      'detail: has book data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data?.slug === 'tho-ngu-ngon-la-fontaine';
        } catch { return false; }
      },
    });

    // Non-existent slug (404 is expected, not a failure)
    const resp2 = http.get(`${BASE_URL}/books/nonexistent-slug-12345`, params);
    check(resp2, {
      'detail: 404 for missing slug': (r) => r.status === 404,
    });
  });

  // ─── Test 3: Record View ─────────────────────────────────
  group('POST /books/:slug/views', () => {
    const payload = JSON.stringify({});
    const params = {
      headers: { 'Content-Type': 'application/json' },
    };

    const resp = http.post(`${BASE_URL}/books/tho-ngu-ngon-la-fontaine/views`, payload, params);
    check(resp, {
      'view: status 201': (r) => r.status === 201,
    });
  });

  sleep(1);
}
