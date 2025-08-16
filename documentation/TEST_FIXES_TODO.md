# Test Fixes TODO

## Summary
As of v1.123.0, the application is working correctly in production but has 67 failing tests out of 355 total tests. The failing tests are due to:

1. **API changes** - Tests using old API patterns
2. **Component changes** - UI components have been refactored
3. **Feature changes** - Some features work differently than tests expect

## Failing Tests by Category

### 1. GameContext Tests (unit-tests/context/GameContext.test.tsx)
- Several tests still expect the old difficulty-based API
- Tests need to be updated to use level-based logic
- Some reducer state expectations are outdated

### 2. Tutorial Modal Tests (src/components/modals/__tests__/TutorialModal.test.tsx)
- Tests are mocking context incorrectly
- Modal behavior has changed
- Need to update test setup and expectations

### 3. Component Tests
- Some components have been refactored but tests not updated
- Props and behavior expectations need alignment

### 4. E2E Tests (tests/e2e/)
- Likely failing due to UI changes
- Need to update selectors and expectations

## Recommended Approach

### Option 1: Update Tests Only (Recommended)
Keep the current working code and update all tests to match:
- No risk to production
- Tests will accurately reflect current behavior
- Can be done incrementally

### Option 2: Refactor Code to Match Tests
Change code to match test expectations:
- Risk breaking working features
- May reintroduce old behaviors
- Not recommended since app works well

### Option 3: Hybrid Approach
- Update most tests to match current code
- For critical test failures, evaluate if code should change
- Document any intentional behavior changes

## Next Steps

1. **Fix remaining GameContext tests**
   - Update all NEW_GAME dispatches to use proper payload
   - Fix state expectations to match current implementation
   - Update difficulty-based tests to use levels

2. **Fix TutorialModal tests**
   - Fix context mocking approach
   - Update expectations for modal behavior
   - Ensure test isolation

3. **Update component tests**
   - Align with current component implementations
   - Fix prop expectations
   - Update DOM queries

4. **Fix E2E tests**
   - Update selectors for current UI
   - Fix user flow expectations
   - Ensure tests match actual gameplay

## Test Command
```bash
npm test          # Run tests in watch mode
npm test -- --run # Run tests once
```

## Current Test Status
- Total: 355 tests
- Passing: 288 tests (81%)
- Failing: 67 tests (19%)
- Test files: 39 (20 failing, 19 passing)