#!/bin/bash

echo "🧹 Cleaning up wrong 1000 score entries..."

# Find all score entries with exactly 1000 points
keys=$(wrangler kv key list --namespace-id=7c325dba740147a48c9cd836075a2614 --remote | jq -r '.[].name' | grep "^score:")

echo "Checking for 1000 score entries..."

# Delete entries with score 1000 at wave 1
for key in $keys; do
  # Get the value to check
  value=$(wrangler kv get "$key" --namespace-id=7c325dba740147a48c9cd836075a2614 --remote 2>/dev/null)
  
  # Check if score is 1000 and wave is 1
  if echo "$value" | jq -e '.score == 1000 and .wave == 1' >/dev/null 2>&1; then
    echo "Deleting: $key (score: 1000, wave: 1)"
    wrangler kv key delete "$key" --namespace-id=7c325dba740147a48c9cd836075a2614 --remote
  fi
done

echo "✅ Cleanup complete!"