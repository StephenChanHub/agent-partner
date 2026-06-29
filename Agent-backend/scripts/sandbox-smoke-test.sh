#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000/api}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@jarvis.local}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123456}"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "Missing command: $1" >&2; exit 1; }
}

require_cmd curl

request() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  if [[ -n "$body" ]]; then
    curl -fsS -X "$method" "$BASE_URL$path" -H 'Content-Type: application/json' -d "$body"
  else
    curl -fsS -X "$method" "$BASE_URL$path"
  fi
  echo
}

printf '\n[1/12] health\n'
request GET /health

printf '\n[2/12] admin login\n'
LOGIN_RESPONSE=$(curl -fsS -X POST "$BASE_URL/auth/login" -H 'Content-Type: application/json' -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
echo "$LOGIN_RESPONSE"
TOKEN=$(node -e "const r=JSON.parse(process.argv[1]); console.log(r.data.accessToken)" "$LOGIN_RESPONSE")

printf '\n[3/12] me\n'
curl -fsS "$BASE_URL/me" -H "Authorization: Bearer $TOKEN"; echo

printf '\n[4/12] dashboard\n'
curl -fsS "$BASE_URL/studio/dashboard" -H "Authorization: Bearer $TOKEN"; echo

printf '\n[5/12] studio users\n'
curl -fsS "$BASE_URL/studio/users" -H "Authorization: Bearer $TOKEN"; echo

printf '\n[6/12] studio agents\n'
curl -fsS "$BASE_URL/studio/agents" -H "Authorization: Bearer $TOKEN"; echo

printf '\n[7/12] model profiles\n'
curl -fsS "$BASE_URL/studio/model-profiles" -H "Authorization: Bearer $TOKEN"; echo

printf '\n[8/12] voice profiles\n'
curl -fsS "$BASE_URL/studio/voice-profiles" -H "Authorization: Bearer $TOKEN"; echo

printf '\n[9/12] billing pricing\n'
curl -fsS "$BASE_URL/billing/pricing" -H "Authorization: Bearer $TOKEN"; echo

printf '\n[10/12] recharge orders\n'
curl -fsS "$BASE_URL/studio/recharge-orders" -H "Authorization: Bearer $TOKEN"; echo

printf '\n[11/12] token transactions\n'
curl -fsS "$BASE_URL/studio/token-transactions" -H "Authorization: Bearer $TOKEN"; echo

printf '\n[12/12] admin token adjustment\n'
curl -fsS -X POST "$BASE_URL/studio/users/user_mock_001/tokens/adjust" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"amountAgentTokens":1000,"reason":"sandbox smoke test manual recharge"}'
echo

printf '\nSandbox smoke test completed.\n'
