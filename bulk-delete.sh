#!/bin/bash

echo "🧹 Bulk deleting test data from KV store..."

# Get all keys
echo "Fetching keys..."
keys=$(wrangler kv key list --namespace-id=7c325dba740147a48c9cd836075a2614 --remote | jq -r '.[].name')

# Count
total=$(echo "$keys" | wc -l)
echo "Found $total total keys"

# Filter test keys
test_keys=$(echo "$keys" | grep -iE 'test|Test|LiveTest|DirectTest|FixedLeaderboard|TauPi776|AlphaBeta123|Player123|TestUser|_____')

count=$(echo "$test_keys" | wc -l)
echo "Found $count test keys to delete"

# Delete in parallel batches
echo "Deleting test keys..."
echo "$test_keys" | xargs -P 10 -I {} sh -c 'wrangler kv key delete "{}" --namespace-id=7c325dba740147a48c9cd836075a2614 --remote > /dev/null 2>&1 && echo -n "."'

echo ""
echo "✅ Cleanup complete!"

# Verify
echo "Verifying..."
remaining=$(wrangler kv key list --namespace-id=7c325dba740147a48c9cd836075a2614 --remote | jq -r '.[].name' | wc -l)
echo "Remaining keys: $remaining"