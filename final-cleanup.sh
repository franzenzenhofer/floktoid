#!/bin/bash

echo "Final cleanup of remaining test keys..."

wrangler kv key list --namespace-id=7c325dba740147a48c9cd836075a2614 --remote | jq -r '.[].name' | grep -iE 'test|Test' | while read key; do
  echo "Deleting: $key"
  wrangler kv key delete "$key" --namespace-id=7c325dba740147a48c9cd836075a2614 --remote
done

echo "Done!"