#!/bin/bash

echo "Deleting wrong 1000 score entries..."

# Get all TauPi776 score keys
keys=$(wrangler kv key list --namespace-id=7c325dba740147a48c9cd836075a2614 --remote --prefix "score:TauPi776:" | jq -r '.[].name')

for key in $keys; do
  value=$(wrangler kv get "$key" --namespace-id=7c325dba740147a48c9cd836075a2614 --remote 2>/dev/null)
  
  # Check if score is 1000 and wave is 1
  if echo "$value" | jq -e '.score == 1000 and .wave == 1' >/dev/null 2>&1; then
    echo "Deleting: $key"
    wrangler kv key delete "$key" --namespace-id=7c325dba740147a48c9cd836075a2614 --remote
  fi
done

echo "Done!"