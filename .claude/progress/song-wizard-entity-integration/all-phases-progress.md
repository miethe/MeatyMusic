# Song Wizard Entity Integration - All Phases Progress

**Plan:** docs/project_plans/implementation_plans/song-wizard-entity-integration-v1.md
**Started:** 2025-11-14
**Last Updated:** 2025-11-14
**Status:** In Progress

---

## Executive Summary

Integrating existing entity editors (StyleEditor, LyricsEditor, PersonaEditor, ProducerNotesEditor) into the Song Creation Wizard multi-step flow. All entity editors are production-ready and follow consistent patterns. Focus is on orchestration, state management, and submission flow.

**Estimated Effort:** 21 Story Points (5-8 days)
**Timeline:** 1-2 weeks

---

## Work Packages

### WP2B-1: Wizard State Management (3 SP, 1 day)
**Subagent:** ui-engineer-enhanced or frontend-developer
**Status:** Complete

**Tasks:**
- [x] Expand FormData interface to include all entities
- [x] Add state update helpers (updateSongData, updateStyleData, etc.)
- [x] Add step validation logic
- [ ] Write unit tests for state management (deferred to future)

**Success Criteria:**
- [x] State maintains all entity data across navigation
- [x] Validation prevents progression when title missing
- [x] State updates trigger re-renders correctly

**Implementation Details:**
- Created `WizardFormData` interface with song, style, lyrics, persona, and producerNotes
- Added 5 helper functions: updateSongData, updateStyleData, updateLyricsData, updatePersonaData, updateProducerNotesData
- Implemented canProgress validation logic using React.useMemo
- Step 0 requires title; other steps are optional
- Updated SongInfoStep and ReviewStep components with proper TypeScript types
- Updated Next button to use canProgress validation
- All existing functionality preserved

---

### WP2B-2: Style Editor Integration (3 SP, 1 day)
**Subagent:** ui-engineer-enhanced
**Status:** Complete

**Tasks:**
- [x] Import StyleEditor component
- [x] Replace Step 1 placeholder with StyleEditor
- [x] Implement skip functionality via onCancel handler
- [x] Update step indicator for optional state with visual indicators
- [x] Hide wizard navigation buttons for Step 1

**Success Criteria:**
- [x] StyleEditor displays with empty initial state
- [x] Save stores style data and advances to Step 2
- [x] Cancel/Skip clears style data and advances to Step 2
- [x] Back navigation preserves style data
- [x] Step indicator shows "(Optional)" badge for optional steps
- [x] Step indicator shows "Skipped" badge when step is cancelled
- [x] Step indicator shows green checkmark with "Success" style when step is completed

---

### WP2B-3: Remaining Editors Integration (6 SP, 2 days)
**Subagent:** ui-engineer-enhanced
**Status:** Pending

**Tasks:**
- [ ] Integrate LyricsEditor into Step 2
- [ ] Integrate PersonaEditor into Step 3
- [ ] Integrate ProducerNotesEditor into Step 4
- [ ] Add optional skip buttons for all steps
- [ ] Handle temporary song_id for Lyrics/ProducerNotes
- [ ] Write integration tests

**Success Criteria:**
- All editors display with correct initial states
- Temporary song_id handled correctly for Lyrics/ProducerNotes
- Back navigation preserves all entity data
- Skip buttons clear respective entity data

---

### WP2B-4: Review Step Enhancement (3 SP, 1 day)
**Subagent:** ui-engineer-enhanced
**Status:** Pending

**Tasks:**
- [ ] Create EntityReviewSection component
- [ ] Update ReviewStep to display all entities
- [ ] Add edit navigation from review step
- [ ] Write unit tests for review display

**Success Criteria:**
- Review displays all non-null entity data
- "Not provided" shown for skipped entities
- Edit buttons navigate back to correct step
- Visual hierarchy (song prominent, entities secondary)

---

### WP2B-5: Sequential Submission Flow (4 SP, 2 days)
**Subagent:** frontend-developer
**Status:** Pending

**Tasks:**
- [ ] Create useWizardSubmission hook
- [ ] Implement sequential entity creation logic
- [ ] Add progress indicator UI
- [ ] Implement error handling and user feedback
- [ ] Write integration tests

**Success Criteria:**
- Song + all entities created in correct sequence
- Entity IDs linked to Song entity
- Progress indicator shows current step
- Errors display with actionable messages
- Successful submission navigates to song detail page

---

### WP2B-6: Polish & UX Enhancements (2 SP, 1 day)
**Subagent:** ui-engineer-enhanced
**Status:** Pending

**Tasks:**
- [ ] Add cancel confirmation dialog
- [ ] Add prevent navigation during submission
- [ ] Add LocalStorage persistence (optional)
- [ ] Add validation summary before submit
- [ ] Write UX polish tests

**Success Criteria:**
- Cancel prompts confirmation if data exists
- Browser warns before navigation during submission
- Draft restored on page reload (if implemented)
- Validation summary shows missing optional entities

---

## Overall Success Metrics

### Functional Metrics
- [ ] 100% of entity editors integrated (4/4)
- [ ] Submission success rate ≥ 95%
- [ ] Zero data loss on step navigation
- [ ] All optional entities can be skipped

### Quality Metrics
- [ ] Unit test coverage ≥ 80%
- [ ] Zero critical bugs in wizard flow
- [ ] Wizard completion time < 5 minutes (UX metric)

### Technical Metrics
- [ ] No entity editor modifications required
- [ ] Wizard component < 500 lines (maintainability)
- [ ] Sequential submission < 10s for all entities

---

## Work Log

### 2025-11-14 - Session 1

**Status:** Planning phase - setting up tracking infrastructure

**Completed:**
- Created all-phases-progress.md with work package breakdown

### 2025-11-14 - Session 2 (WP2B-1 Implementation)

**Status:** WP2B-1 Complete - Wizard State Management Implemented

**Key Changes:**
1. **WizardFormData Interface** (lines 42-55 in page.tsx)
   - Extended form state to support all entity types
   - Song data structure with title, description, genre, mood, global_seed, sds_version
   - Optional style, lyrics, persona, producerNotes data

2. **State Update Helpers** (lines 76-125)
   - updateSongData: Updates song-specific fields with proper typing
   - updateStyleData: Updates or clears style data
   - updateLyricsData: Updates or clears lyrics data
   - updatePersonaData: Updates or clears persona data
   - updateProducerNotesData: Updates or clears producer notes data
   - All use functional state updates to avoid stale closures

3. **Validation Logic** (lines 127-140)
   - canProgress computed with React.useMemo
   - Step 0: Requires non-empty title
   - Steps 1-5: Always allow progression (optional entities)

4. **Component Updates**
   - SongInfoStep: Now properly typed with WizardFormData and updateSongData
   - ReviewStep: Updated to access formData.song properties
   - All event handlers typed with React.ChangeEvent

5. **Preserved Functionality**
   - Song submission still works exactly as before
   - Step navigation maintained
   - Next button validation updated to use canProgress

**Files Modified:**
- `/home/user/MeatyMusic/apps/web/src/app/(dashboard)/songs/new/page.tsx`
- `/home/user/MeatyMusic/.claude/progress/song-wizard-entity-integration/all-phases-progress.md`

**Testing Notes:**
- TypeScript type checking: Types properly annotated with no implicit 'any'
- Helper functions ready for future entity editor integration (WP2B-2, WP2B-3)
- Backwards compatible - no breaking changes to existing functionality

**Next Steps:**
- WP2B-3: Integrate remaining entity editors (Lyrics, Persona, ProducerNotes)
- WP2B-4: Enhance Review Step to display all entity data
- WP2B-5: Implement sequential submission flow for all entities

### 2025-11-14 - Session 3 (WP2B-2 Implementation)

**Status:** WP2B-2 Complete - Style Editor Integration Complete

**Key Changes:**
1. **StyleEditor Import** (line 13)
   - Added: `import { StyleEditor } from '@/components/entities/StyleEditor';`
   - Component is production-ready, no modifications needed

2. **State Tracking for Step Status** (lines 62-63)
   - Added `completedSteps` Set to track which steps have been saved
   - Added `skippedSteps` Set to track which steps have been skipped
   - Initialized with Step 0 as completed (Song Info is required first)

3. **Step Management Helpers** (lines 130-152)
   - `markStepCompleted(stepIndex)`: Marks step as completed and removes from skipped
   - `markStepSkipped(stepIndex)`: Marks step as skipped and removes from completed

4. **StyleEditor Handlers** (lines 182-202)
   - `handleStyleSave(style)`: Updates style data, marks step complete, advances
   - `handleStyleCancel()`: Clears style data, marks step skipped, advances
   - Both handlers properly manage state transitions

5. **Step Content Rendering** (lines 289-308)
   - StyleEditor rendered directly for currentStep === 1
   - Applied styling: `rounded-lg border border-border shadow-elev1 bg-surface`
   - Other steps remain in Card wrapper with title
   - Props properly connected: initialValue, onSave, onCancel

6. **Enhanced Step Indicator** (lines 239-305)
   - Completed steps: Green background with checkmark
   - Skipped steps: Warning color background with ⊘ symbol
   - Optional badge: Blue info badge for steps not yet completed
   - Skipped badge: Warning badge for skipped steps
   - Proper visual distinction between states

7. **Navigation Button Management** (lines 330-374)
   - Hidden wizard navigation buttons for Step 1
   - StyleEditor's built-in Save/Cancel buttons handle navigation
   - Previous button still available for back navigation on Step 1

**Visual Enhancements:**
- Completed steps show as green with checkmark ✓
- Skipped steps show as orange/warning with ⊘ symbol
- Optional steps show "(Optional)" badge
- Skipped steps show "Skipped" badge
- Smooth transitions between states with Tailwind transitions

**Files Modified:**
- `/home/user/MeatyMusic/apps/web/src/app/(dashboard)/songs/new/page.tsx`
- `/home/user/MeatyMusic/.claude/progress/song-wizard-entity-integration/all-phases-progress.md`

**Testing Approach:**
- Verify StyleEditor displays on Step 1 with empty state
- Test save: data persists, Step 1 marked completed, advances to Step 2
- Test cancel: data cleared, Step 1 marked skipped, advances to Step 2
- Test back navigation: returns to Step 1 with data intact
- Verify visual indicators update correctly
- Confirm navigation buttons hidden for Step 1

**Technical Notes:**
- StyleEditor is self-contained with own Save/Cancel buttons
- State management delegates to callback handlers
- No modifications to StyleEditor component itself
- Pattern established for future editors (Lyrics, Persona, ProducerNotes)
