#!/bin/bash

echo "🧹 Final cleanup of remaining test data..."

# Test usernames to delete
test_users=(
  "ΓαμμαΔέλτα"
  "🎮Player"
  "TauPi776"
  "TauPi777"
  "TauPi"
  "TauPi776_fixed"
  "_____Player"
)

# Convert to sanitized keys
for user in "${test_users[@]}"; do
  # Sanitize for KV key format
  safe_key=$(echo "$user" | sed 's/[^a-zA-Z0-9_-]/_/g')
  
  echo "Cleaning up: $user (key: $safe_key)"
  
  # Delete alltime key
  wrangler kv key delete "alltime:$safe_key" --namespace-id=7c325dba740147a48c9cd836075a2614 --remote 2>/dev/null || true
  
  # Delete score keys (find and delete all)
  wrangler kv key list --namespace-id=7c325dba740147a48c9cd836075a2614 --remote --prefix "score:$safe_key:" | \
    jq -r '.[].name' | \
    while read key; do
      if [ ! -z "$key" ]; then
        wrangler kv key delete "$key" --namespace-id=7c325dba740147a48c9cd836075a2614 --remote 2>/dev/null || true
        echo -n "."
      fi
    done
  echo ""
done

echo "✅ Cleanup complete!"