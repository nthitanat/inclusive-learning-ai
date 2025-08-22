# Fix for Second Step Navigation Issue

## Problem Description
After getting the response from `combined-0` (step 0), the application was not moving to the next step input page (step 1). Instead, it was getting stuck on the response screen.

## Root Cause Analysis
The issue was in the button logic in `ConfigModal.tsx`. When `showResponse` was true, the button was always calling `onFeedbackSubmit` instead of properly handling the step progression:

1. **Step 0 with response**: Should move to Step 1 input fields
2. **Step 1 with response**: Should show feedback and then proceed to final generation

## Fixes Applied

### 1. Updated Button Logic in ConfigModal.tsx
```tsx
// Before: All responses triggered feedback
) : (
  <Button onClick={() => onFeedbackSubmit(structuredFeedback)}>

// After: Differentiate between steps
) : configStep === 0 ? (
  // Step 0 with response - move to next step input
  <Button onClick={onNextStep}>ถัดไป</Button>
) : (
  // Step 1 with response - submit feedback
  <Button onClick={() => onFeedbackSubmit(structuredFeedback)}>
```

### 2. Simplified handleConfigNextStep in session/page.tsx
```tsx
// Before: Auto-submitted next step's API
const handleConfigNextStep = async () => {
  // Complex logic that auto-called combined-1 API
}

// After: Simple step progression
const handleConfigNextStep = async () => {
  // Simply move to next step and show input fields
  setConfigStep(nextStep);
  setShowResponse(false);
  setConfigResponse({});
};
```

### 3. Fixed SSR Window Reference Issue
- Added `isSmallScreen` state with proper window existence checks
- Replaced all `window.innerWidth < 600` references with `isSmallScreen`
- Added resize event listener with proper cleanup

## User Flow After Fix

### Step 0 (Combined Curriculum + Objectives)
1. User enters: Subject, Lesson Topic, Level
2. Clicks "ถัดไป" → API calls `combined-0`
3. Response shows curriculum + objectives in tabs
4. User clicks "ถัดไป" → Moves to Step 1 input fields

### Step 1 (Combined Lesson Plan + Evaluation)  
1. User enters: Number of students, Student types, Study period
2. Clicks "ถัดไป" → API calls `combined-1`
3. Response shows lesson plan + evaluation in tabs
4. User provides feedback → Ready for final generation

## Testing
- ✅ Application compiles without errors
- ✅ No more SSR window reference issues
- ✅ Step progression works correctly
- ✅ Button logic handles both steps appropriately
- ✅ Tab interface displays multiple responses correctly

## Technical Benefits
- **Clear Separation**: Each step's response handling is now explicit
- **Better UX**: Smooth progression between input → response → next input
- **Maintainable**: Simpler logic that's easier to debug
- **SSR Compatible**: No more client-side only window references
