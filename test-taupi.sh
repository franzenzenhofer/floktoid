#!/bin/bash

echo "Testing TauPi776 submissions..."

for i in {1..3}; do
  score=$((RANDOM % 10000))
  wave=$((RANDOM % 30 + 1))
  gameId="test-$(date +%s)-$RANDOM"
  
  echo "Submitting TauPi776 score: $score, wave: $wave"
  curl -s -X POST https://floktoid.franzai.com/api/leaderboard/submit \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"TauPi776\",\"score\":$score,\"wave\":$wave,\"gameId\":\"$gameId\"}" | jq
  
  sleep 1
done

echo -e "\nChecking TauPi776 in leaderboard:"
curl -s "https://floktoid.franzai.com/api/leaderboard" | jq -r '.last24h[] | select(.username == "TauPi776") | "\(.username): \(.score) (wave \(.wave))"' | head -5