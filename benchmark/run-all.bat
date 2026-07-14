@echo off
REM Run all k6 benchmarks for SocialBook Books API
REM Usage: run-all.bat [api_url]
REM Example: run-all.bat http://localhost:5000/api

set API_URL=%1
if "%API_URL%"=="" set API_URL=http://localhost:5000/api

echo ========================================
echo  SocialBook API Benchmark Suite
echo  Target: %API_URL%
echo ========================================

echo.
echo [1/3] Books List API (listing, search, filter)
k6 run --out json=benchmark-results.json k6-books-api.js -e API_URL=%API_URL%

echo.
echo ========================================
echo  Done! Results saved to benchmark-results.json
echo  Generate HTML report with:
echo    k6 report benchmark-results.json
echo ========================================
