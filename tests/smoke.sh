#!/usr/bin/env bash
# SnackScout API smoke test.
# Usage: BASE_URL=http://localhost:3001 ./tests/smoke.sh
# Exits nonzero if any check fails.

BASE_URL="${BASE_URL:-http://localhost:3001}"
UUID_RE='[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'
FAILURES=0

check() {
  local name="$1" expected_status="$2" actual_status="$3" body="$4" grep_for="${5:-}"
  if [ "$actual_status" != "$expected_status" ]; then
    echo "FAIL: $name -> HTTP $actual_status (expected $expected_status)"
    FAILURES=$((FAILURES + 1))
    return
  fi
  if [ -n "$grep_for" ] && ! printf '%s' "$body" | grep -q "$grep_for"; then
    echo "FAIL: $name -> response did not contain '$grep_for'"
    FAILURES=$((FAILURES + 1))
    return
  fi
  echo "PASS: $name -> HTTP $actual_status"
}

get() {
  curl -s -w '\n%{http_code}' "$BASE_URL$1"
}

echo "Smoke testing SnackScout API at $BASE_URL"

# 1. Health
OUT=$(get /api/health); STATUS=$(printf '%s' "$OUT" | tail -1); BODY=$(printf '%s' "$OUT" | sed '$d')
check "GET /api/health" 200 "$STATUS" "$BODY" '"status":"ok"'

# 2. Product list
OUT=$(get /api/products); STATUS=$(printf '%s' "$OUT" | tail -1); BODY=$(printf '%s' "$OUT" | sed '$d')
check "GET /api/products" 200 "$STATUS" "$BODY" '"product_id"'
PRODUCT_ID=$(printf '%s' "$BODY" | grep -oE "$UUID_RE" | head -1)

# 3. Product search
OUT=$(get '/api/products?search=red'); STATUS=$(printf '%s' "$OUT" | tail -1); BODY=$(printf '%s' "$OUT" | sed '$d')
check "GET /api/products?search=red" 200 "$STATUS" "$BODY" 'Red Bull'

# 4. Product details
OUT=$(get "/api/products/$PRODUCT_ID"); STATUS=$(printf '%s' "$OUT" | tail -1); BODY=$(printf '%s' "$OUT" | sed '$d')
check "GET /api/products/{id}" 200 "$STATUS" "$BODY" "\"product_id\":\"$PRODUCT_ID\""

# 5. Stores and users (needed to build a valid report)
OUT=$(get /api/stores); STATUS=$(printf '%s' "$OUT" | tail -1); BODY=$(printf '%s' "$OUT" | sed '$d')
check "GET /api/stores" 200 "$STATUS" "$BODY" '"store_id"'
STORE_ID=$(printf '%s' "$BODY" | grep -oE "$UUID_RE" | head -1)

OUT=$(get /api/users); STATUS=$(printf '%s' "$OUT" | tail -1); BODY=$(printf '%s' "$OUT" | sed '$d')
check "GET /api/users" 200 "$STATUS" "$BODY" '"user_id"'
USER_ID=$(printf '%s' "$BODY" | grep -oE "$UUID_RE" | head -1)

# 6. Reports list
OUT=$(get /api/reports); STATUS=$(printf '%s' "$OUT" | tail -1); BODY=$(printf '%s' "$OUT" | sed '$d')
check "GET /api/reports" 200 "$STATUS" "$BODY" '"report_id"'

# 7. Submit a valid report (write test)
RESP=$(curl -s -w '\n%{http_code}' -X POST "$BASE_URL/api/reports" \
  -H 'Content-Type: application/json' \
  -d "{\"product_id\":\"$PRODUCT_ID\",\"store_id\":\"$STORE_ID\",\"user_id\":\"$USER_ID\",\"price\":1.99,\"availability_status\":\"in_stock\",\"description\":\"smoke.sh automated test\"}")
STATUS=$(printf '%s' "$RESP" | tail -1); BODY=$(printf '%s' "$RESP" | sed '$d')
check "POST /api/reports (valid)" 201 "$STATUS" "$BODY" '"report_id"'

# 8. Invalid report should be rejected with 400
RESP=$(curl -s -w '\n%{http_code}' -X POST "$BASE_URL/api/reports" \
  -H 'Content-Type: application/json' \
  -d '{"product_id":"not-a-uuid","price":-5}')
STATUS=$(printf '%s' "$RESP" | tail -1); BODY=$(printf '%s' "$RESP" | sed '$d')
check "POST /api/reports (invalid)" 400 "$STATUS" "$BODY" '"error"'

echo
if [ "$FAILURES" -gt 0 ]; then
  echo "$FAILURES smoke test(s) FAILED"
  exit 1
fi
echo "All smoke tests passed"
