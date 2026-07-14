#!/bin/bash
# Run all k6 benchmarks for SocialBook Books API
# Usage: ./run-all.sh [api_url]
# Example: ./run-all.sh http://localhost:5000/api

API_URL="${1:-http://localhost:5000/api}"

echo "========================================"
echo " SocialBook API Benchmark Suite"
echo " Target: $API_URL"
echo "========================================"

echo ""
echo "[1/3] Books API (listing, detail, search, views)"
k6 run --out json=benchmark-results.json k6-books-api.js -e API_URL=$API_URL

echo ""
echo "========================================"
echo " Done! Results saved to benchmark-results.json"
echo " Generate HTML report with:"
echo "   k6 report benchmark-results.json"
echo "========================================"
