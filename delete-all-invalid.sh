#!/bin/bash

echo "🗑️  Deleting all invalid usernames and test data..."

# Delete all keys containing these patterns
patterns=(
  "Player"
  "SimPlayer"
  "TauPi"
  "_fixed"
  "τπ"
  "🎮"
  "ΓαμμαΔέλτα"
  "__________"
  "_Player"
)

total_deleted=0

for pattern in "${patterns[@]}"; do
  echo -e "\nDeleting keys with pattern: $pattern"
  
  # Get matching keys
  keys=$(wrangler kv key list --namespace-id=7c325dba740147a48c9cd836075a2614 --remote | jq -r '.[].name' | grep "$pattern")
  
  if [ -z "$keys" ]; then
    echo "  No keys found"
    continue
  fi
  
  count=$(echo "$keys" | wc -l)
  echo "  Found $count keys to delete"
  
  # Delete them
  echo "$keys" | while read key; do
    wrangler kv key delete "$key" --namespace-id=7c325dba740147a48c9cd836075a2614 --remote >/dev/null 2>&1
    echo -n "."
    ((total_deleted++))
  done
  echo " Done!"
done

echo -e "\n✅ Cleanup complete! Deleted approximately $total_deleted keys"

# Verify
echo -e "\n📊 Verification:"
remaining=$(wrangler kv key list --namespace-id=7c325dba740147a48c9cd836075a2614 --remote | jq '. | length')
echo "Total remaining keys: $remaining"

# Check for any remaining invalid patterns
echo -e "\nChecking for remaining invalid patterns..."
wrangler kv key list --namespace-id=7c325dba740147a48c9cd836075a2614 --remote | \
  jq -r '.[].name' | \
  grep -E 'Player|fixed|TauPi|τπ|🎮|ΓαμμαΔέλτα' | \
  head -5

if [ $? -ne 0 ]; then
  echo "✅ No invalid patterns found!"
fi