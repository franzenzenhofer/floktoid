# Manual Test: Save/Restore Functionality

## Test Steps

1. **Open game**: https://floktoid.franzai.com
2. **Clear any saved games**: Open browser console and run `localStorage.removeItem('floktoid-saved-game')`
3. **Start new game**: Click "START GAME"
4. **Play to Wave 2**: Let wave 1 complete, wait for "WAVE 2" to appear
5. **Note current state**: 
   - Wave number (should be 2)
   - Score
   - Bird positions
6. **Click Home button** (bottom right corner)
7. **Verify Continue button**: Should see "CONTINUE GAME (W2)" above START GAME
8. **Click Continue**: 
   - Should restore to Wave 2 (NOT Wave 3!)
   - Energy dots in proper formation at bottom
   - Score preserved

## Expected Results
✅ Save in Wave 2 → Continue shows "W2" → Restores to Wave 2
✅ Energy dots in proper formation (not corner)
✅ Score preserved
✅ Auto-save works on browser refresh

## Bug to Watch For
❌ OLD BUG: Save in Wave 2 → Continue shows "W3" → Wrong wave!

## Test Auto-Save
1. Play to Wave 3
2. Close browser tab (don't click home)
3. Reopen game
4. Should see "CONTINUE GAME (W3)"