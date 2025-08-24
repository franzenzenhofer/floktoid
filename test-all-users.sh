#!/bin/bash

echo "Testing leaderboard submissions..."
echo "=================================="

# Test different usernames
for name in "TauPi776" "AlphaBeta123" "TestUser999" "Player123" "ΓαμμαΔέλτα" "🎮Player"; do
  echo ""
  echo "Testing: $name"
  
  score=$((RANDOM % 10000))
  wave=$((RANDOM % 30 + 1))
  gameId="test-$(date +%s)-$RANDOM"
  
  response=$(curl -s -o /tmp/response.txt -w "%{http_code}" \
    -X POST https://floktoid.franzai.com/api/leaderboard/submit \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$name\",\"score\":$score,\"wave\":$wave,\"gameId\":\"$gameId\"}")
  
  body=$(cat /tmp/response.txt)
  
  if [ "$response" = "200" ]; then
    echo "  ✅ Success (HTTP $response)"
    echo "     Score: $score, Wave: $wave"
  else
    echo "  ❌ Failed (HTTP $response)"
    echo "     Response: $body"
  fi
done

echo ""
echo "=================================="
echo "Checking 24h leaderboard..."

curl -s "https://floktoid.franzai.com/api/leaderboard?period=24h" | \
  jq -r '.last24h[] | "\(.username): \(.score) (wave \(.wave))"' | head -5

echo ""
echo "Test complete!"