#!/bin/bash

echo "🧪 Testing deduplication - one game, multiple submissions..."

# Same game ID for all submissions
gameId="test_game_$(date +%s)_dedup"
username="DedupeTest$(shuf -i 100-999 -n 1)"

echo "Game ID: $gameId"
echo "Username: $username"
echo ""

# Submit multiple scores from same game
echo "1. Submitting initial score: 1500 (wave 2)"
curl -s -X POST https://floktoid.franzai.com/api/leaderboard/submit \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$username\",\"score\":1500,\"wave\":2,\"gameId\":\"$gameId\"}" | jq

sleep 1

echo -e "\n2. Submitting higher score: 2500 (wave 3)"
curl -s -X POST https://floktoid.franzai.com/api/leaderboard/submit \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$username\",\"score\":2500,\"wave\":3,\"gameId\":\"$gameId\"}" | jq

sleep 1

echo -e "\n3. Submitting even higher score: 3500 (wave 4)"
curl -s -X POST https://floktoid.franzai.com/api/leaderboard/submit \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$username\",\"score\":3500,\"wave\":4,\"gameId\":\"$gameId\"}" | jq

sleep 2

echo -e "\n📊 Checking leaderboard for duplicates..."
entries=$(curl -s "https://floktoid.franzai.com/api/leaderboard" | jq -r ".last24h[] | select(.username == \"$username\") | \"Score: \\(.score), Wave: \\(.wave), GameId: \\(.gameId)\"")

count=$(echo "$entries" | grep -c "$gameId" || echo "0")

echo "$entries"
echo ""

if [ "$count" -eq "1" ]; then
  echo "✅ SUCCESS: Only 1 entry for game $gameId"
else
  echo "❌ FAILED: Found $count entries for game $gameId (should be 1)"
fi