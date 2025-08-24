#!/bin/bash

echo "Fast deletion of remaining invalid entries..."

# Get all invalid keys
wrangler kv key list --namespace-id=7c325dba740147a48c9cd836075a2614 --remote | \
  jq -r '.[].name' | \
  grep -E 'Player|fixed|TauPi|τπ|🎮|ΓαμμαΔέλτα|__________' > invalid-keys.txt

count=$(wc -l < invalid-keys.txt)
echo "Found $count invalid keys to delete"

# Delete in parallel
cat invalid-keys.txt | xargs -P 20 -I {} sh -c 'wrangler kv key delete "{}" --namespace-id=7c325dba740147a48c9cd836075a2614 --remote >/dev/null 2>&1 && echo -n "."'

echo ""
echo "Done!"

# Verify
remaining=$(wrangler kv key list --namespace-id=7c325dba740147a48c9cd836075a2614 --remote | jq -r '.[].name' | grep -cE 'Player|fixed|TauPi|τπ|🎮|ΓαμμαΔέλτα' || echo "0")
echo "Remaining invalid entries: $remaining"