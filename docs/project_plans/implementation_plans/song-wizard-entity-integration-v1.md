# Implementation Plan: Song Creation Wizard - Entity Editor Integration (Phase 2B)

**Status**: Ready for Implementation
**Complexity**: Medium-High (M-H)
**Estimated Effort**: 21 Story Points (5-8 days)
**Timeline**: 1-2 weeks (including testing)
**Track**: Standard (Haiku + Sonnet agents)
**Priority**: High
**Assigned To**: frontend-developer, ui-engineer-enhanced
**Related PRDs**: website_app.prd.md, style.prd.md, lyrics.prd.md, persona.prd.md, producer_notes.prd.md, sds.prd.md

---

## Executive Summary

This implementation plan defines the integration of existing entity editors (StyleEditor, LyricsEditor, PersonaEditor, ProducerNotesEditor) into the Song Creation Wizard multi-step flow. All entity editor components are production-ready and follow consistent patterns. The work focuses on orchestration, state management, and submission flow to enable complete song + entity creation in a single wizard session.

**Key Objectives**:
1. Replace wizard placeholder steps with functional entity editors
2. Implement wizard state management for multi-entity data collection
3. Create sequential entity submission workflow
4. Enhance review step to display all collected data
5. Handle optional entity creation (skip functionality)

**Expected Outcomes**:
- Users can create Song + Style + Lyrics + Persona + ProducerNotes in single wizard flow
- All entity editors integrated without modifications
- Graceful handling of optional entities (skip with null values)
- Enhanced review step showing all collected entity data
- Sequential API submission with error handling and rollback

**Current State**:
- ✅ All entity editors built and tested (StyleEditor, LyricsEditor, PersonaEditor, ProducerNotesEditor)
- ✅ Song creation API integration complete
- ✅ React Query hooks available for all entities
- ✅ Wizard steps 0 (Song Info) and 5 (Review) implemented
- ❌ Steps 1-4 are placeholders ("coming soon" messages)
- ❌ Wizard only creates Song entity (no entity associations)

---

## Architecture Context

### Wizard Structure (Current)

**File**: `apps/web/src/app/(dashboard)/songs/new/page.tsx`

**Steps 0-5**:
| Step | Label | Status | Component |
|------|-------|--------|-----------|
| 0 | Song Info | ✅ Implemented | `SongInfoStep` |
| 1 | Style | ❌ Placeholder | "Style editor coming soon" |
| 2 | Lyrics | ❌ Placeholder | "Lyrics editor coming soon" |
| 3 | Persona | ❌ Placeholder | "Persona selector coming soon" |
| 4 | Producer Notes | ❌ Placeholder | "Producer notes editor coming soon" |
| 5 | Review | ✅ Partial | `ReviewStep` (song data only) |

### Entity Editor Architecture

**Reference Analysis**: See codebase exploration output above for complete details.

**Common Pattern** (all editors follow this):
```typescript
interface EditorProps {
  songId?: string;           // Required for song-linked entities (Lyrics, ProducerNotes)
  initialValue?: Partial<EntityBase>;
  onSave: (entity: EntityCreate) => void;
  onCancel: () => void;
  className?: string;
}
```

**Editors Available**:
- `StyleEditor` - `/apps/web/src/components/entities/StyleEditor.tsx`
- `LyricsEditor` - `/apps/web/src/components/entities/LyricsEditor.tsx`
- `PersonaEditor` - `/apps/web/src/components/entities/PersonaEditor.tsx`
- `ProducerNotesEditor` - `/apps/web/src/components/entities/ProducerNotesEditor.tsx`

**Key Characteristics**:
- ✅ Self-contained validation (real-time)
- ✅ Preview panel with JSON display
- ✅ Consistent save/cancel callbacks
- ✅ No external dependencies
- ✅ **No modifications needed for integration**

### API Integration Available

**React Query Hooks** (all implemented in `/apps/web/src/hooks/api/`):
- `useCreateSong()` - Song creation
- `useCreateStyle()` - Style creation
- `useCreateLyrics()` - Lyrics creation
- `useCreatePersona()` - Persona creation
- `useCreateProducerNotes()` - ProducerNotes creation
- `useUpdateSong(id)` - Update song with entity references

**Hook Pattern** (consistent across all):
```typescript
const createEntity = useCreateEntity();
const result = await createEntity.mutateAsync(entityData);
// Returns: Created entity with id
// Side effects: Invalidates cache, shows toast
```

---

## PRD Requirements

### Multi-Step Wizard Flow (website_app.prd.md:62-70)

**Required Steps**:
1. Template Selection (future) or Song Info (MVP)
2. **Style Editor** - Genre, BPM, mood, tags
3. **Lyrics Editor** - Sections, rhyme scheme, citations
4. **Persona Selector** - Link or create persona
5. **Producer Notes** - Structure, hooks, mix settings
6. Summary/Preview - Review all data
7. Submission - Create all entities

**MVP Scope for Phase 2B**: Steps 1-6 (defer template system)

### Entity Validation Requirements

**Reference PRDs**:
- `style.prd.md:74-79` - Tempo range, energy-tempo alignment, tag conflicts, instrumentation limits
- `lyrics.prd.md:79-85` - Chorus required, source weights, hook-heavy policy, profanity filter, syllable range
- `persona.prd.md:49-53` - Unique name, public release sanitization, delivery conflicts
- `producer_notes.prd.md:54-58` - Hooks ≥0, structure-lyrics alignment, section name matching, duration budget

**Validation Strategy**:
- ✅ **Client-side**: All editors have built-in validation
- ✅ **Real-time**: Validation runs on field changes
- ✅ **Step gates**: Prevent progression on critical errors
- ⚠️ **Cross-entity**: Defer to backend validation (Phase 2 gaps)

### UX Requirements (website_app.prd.md:80-86)

**Progressive Disclosure**:
- Optional entities can be skipped
- Collapsible sections for advanced fields
- Clear indicators for required vs optional steps

**Real-Time Feedback**:
- Inline validation messages
- Preview panel updates live
- Step-level error indicators

**Data Persistence**:
- Maintain state across step navigation
- Allow back navigation without data loss
- Confirm before canceling mid-wizard

---

## Implementation Design

### Work Package Breakdown

#### **WP2B-1: Wizard State Management** (3 SP, 1 day)

**Goal**: Expand wizard state to handle multi-entity data collection

**Tasks**:

1. **Expand FormData Interface**
   ```typescript
   // Current
   const [formData, setFormData] = useState({
     title: '',
     description: '',
     genre: '',
     mood: [],
     global_seed: Date.now(),
   });

   // Enhanced
   interface WizardFormData {
     song: {
       title: string;
       description: string;
       genre: string;
       mood: string[];
       global_seed: number;
       sds_version: string;
     };
     style: StyleCreate | null;
     lyrics: LyricsCreate | null;
     persona: PersonaCreate | null;
     producerNotes: ProducerNotesCreate | null;
   }
   ```

2. **Add State Update Helpers**
   ```typescript
   const updateSongData = (updates: Partial<SongCreate>) => {
     setFormData(prev => ({
       ...prev,
       song: { ...prev.song, ...updates }
     }));
   };

   const updateStyleData = (style: StyleCreate | null) => {
     setFormData(prev => ({ ...prev, style }));
   };

   // Similar for lyrics, persona, producerNotes
   ```

3. **Add Step Validation Logic**
   ```typescript
   const canProgress = useMemo(() => {
     switch (currentStep) {
       case 0: return !!formData.song.title;
       case 1: return true; // Optional
       case 2: return true; // Optional
       case 3: return true; // Optional
       case 4: return true; // Optional
       case 5: return true; // Review
       default: return false;
     }
   }, [currentStep, formData]);
   ```

**Deliverables**:
- Enhanced `WizardFormData` type
- State update helper functions
- Step validation logic
- Unit tests for state management

**Success Criteria**:
- ✅ State maintains all entity data across navigation
- ✅ Validation prevents progression when title missing
- ✅ State updates trigger re-renders correctly

---

#### **WP2B-2: Style Editor Integration** (3 SP, 1 day)

**Goal**: Replace Step 1 placeholder with StyleEditor

**Tasks**:

1. **Import StyleEditor Component**
   ```typescript
   import { StyleEditor } from '@/components/entities/StyleEditor';
   ```

2. **Replace Step 1 Content**
   ```typescript
   {currentStep === 1 && (
     <StyleEditor
       initialValue={formData.style || undefined}
       onSave={(style) => {
         updateStyleData(style);
         handleNext(); // Auto-advance after save
       }}
       onCancel={() => {
         updateStyleData(null); // Clear if skipped
         handleNext(); // Skip to next step
       }}
     />
   )}
   ```

3. **Add Skip Button to Step Navigation**
   ```typescript
   {currentStep === 1 && (
     <Button variant="ghost" onClick={() => {
       updateStyleData(null);
       handleNext();
     }}>
       Skip Style (Optional)
     </Button>
   )}
   ```

4. **Update Step Indicator**
   ```typescript
   <div className={`step ${formData.style ? 'completed' : 'optional'}`}>
     {WIZARD_STEPS[1].label}
     {!formData.style && <span className="text-xs ml-2">(Optional)</span>}
   </div>
   ```

**Deliverables**:
- StyleEditor integrated into Step 1
- Skip functionality implemented
- Visual indicators for optional step
- Integration tests

**Success Criteria**:
- ✅ StyleEditor displays with empty initial state
- ✅ Save stores style data and advances to Step 2
- ✅ Cancel/Skip clears style data and advances to Step 2
- ✅ Back navigation preserves style data

---

#### **WP2B-3: Remaining Editors Integration** (6 SP, 2 days)

**Goal**: Integrate LyricsEditor, PersonaEditor, ProducerNotesEditor into Steps 2-4

**Tasks**:

1. **Step 2: LyricsEditor**
   ```typescript
   {currentStep === 2 && (
     <LyricsEditor
       songId="wizard-temp-id" // Placeholder, will be replaced in submission
       initialValue={formData.lyrics || undefined}
       onSave={(lyrics) => {
         // Remove temporary song_id before storing
         const { song_id, ...lyricsData } = lyrics;
         updateLyricsData(lyricsData as LyricsCreate);
         handleNext();
       }}
       onCancel={() => {
         updateLyricsData(null);
         handleNext();
       }}
     />
   )}
   ```

2. **Step 3: PersonaEditor**
   ```typescript
   {currentStep === 3 && (
     <PersonaEditor
       initialValue={formData.persona || undefined}
       onSave={(persona) => {
         updatePersonaData(persona);
         handleNext();
       }}
       onCancel={() => {
         updatePersonaData(null);
         handleNext();
       }}
     />
   )}
   ```

3. **Step 4: ProducerNotesEditor**
   ```typescript
   {currentStep === 4 && (
     <ProducerNotesEditor
       songId="wizard-temp-id" // Placeholder
       initialValue={formData.producerNotes || undefined}
       onSave={(notes) => {
         const { song_id, ...notesData } = notes;
         updateProducerNotesData(notesData as ProducerNotesCreate);
         handleNext();
       }}
       onCancel={() => {
         updateProducerNotesData(null);
         handleNext();
       }}
     />
   )}
   ```

4. **Add Optional Skip Buttons** (Steps 2-4)
   ```typescript
   const OptionalStepNavigation = ({ onSkip }: { onSkip: () => void }) => (
     <div className="flex items-center gap-3">
       <Button variant="outline" onClick={onSkip}>
         Skip (Optional)
       </Button>
       {/* ... existing navigation */}
     </div>
   );
   ```

**Deliverables**:
- LyricsEditor integrated (Step 2)
- PersonaEditor integrated (Step 3)
- ProducerNotesEditor integrated (Step 4)
- Skip functionality for all steps
- Integration tests

**Success Criteria**:
- ✅ All editors display with correct initial states
- ✅ Temporary song_id handled correctly for Lyrics/ProducerNotes
- ✅ Back navigation preserves all entity data
- ✅ Skip buttons clear respective entity data

---

#### **WP2B-4: Review Step Enhancement** (3 SP, 1 day)

**Goal**: Expand ReviewStep to display all collected entity data

**Tasks**:

1. **Create Entity Review Components**
   ```typescript
   function EntityReviewSection({
     title,
     data,
     onEdit
   }: {
     title: string;
     data: any | null;
     onEdit: () => void;
   }) {
     if (!data) {
       return (
         <Card className="p-4 bg-muted">
           <p className="text-muted-foreground">
             No {title.toLowerCase()} provided (optional)
           </p>
         </Card>
       );
     }

     return (
       <Card className="p-6">
         <div className="flex items-center justify-between mb-4">
           <h3 className="font-semibold">{title}</h3>
           <Button variant="ghost" size="sm" onClick={onEdit}>
             <Edit className="w-4 h-4 mr-2" />
             Edit
           </Button>
         </div>
         <dl className="space-y-2">
           {/* Render key fields from data */}
         </dl>
       </Card>
     );
   }
   ```

2. **Update ReviewStep Component**
   ```typescript
   function ReviewStep({
     formData,
     onEditStep
   }: {
     formData: WizardFormData;
     onEditStep: (step: number) => void;
   }) {
     return (
       <div className="space-y-6">
         <EntityReviewSection
           title="Song Information"
           data={formData.song}
           onEdit={() => onEditStep(0)}
         />

         <EntityReviewSection
           title="Style"
           data={formData.style}
           onEdit={() => onEditStep(1)}
         />

         <EntityReviewSection
           title="Lyrics"
           data={formData.lyrics}
           onEdit={() => onEditStep(2)}
         />

         <EntityReviewSection
           title="Persona"
           data={formData.persona}
           onEdit={() => onEditStep(3)}
         />

         <EntityReviewSection
           title="Producer Notes"
           data={formData.producerNotes}
           onEdit={() => onEditStep(4)}
         />

         <div className="bg-info/10 border-2 border-info/30 rounded-xl p-6">
           <p className="text-sm">
             Review all details before submission. Click "Create Song" to save.
           </p>
         </div>
       </div>
     );
   }
   ```

3. **Add Edit Navigation**
   ```typescript
   const handleEditStep = (step: number) => {
     setCurrentStep(step);
   };
   ```

**Deliverables**:
- EntityReviewSection component
- Enhanced ReviewStep with all entities
- Edit navigation from review
- Unit tests for review display

**Success Criteria**:
- ✅ Review displays all non-null entity data
- ✅ "Not provided" shown for skipped entities
- ✅ Edit buttons navigate back to correct step
- ✅ Visual hierarchy (song prominent, entities secondary)

---

#### **WP2B-5: Sequential Submission Flow** (4 SP, 2 days)

**Goal**: Implement multi-entity creation with proper sequencing and error handling

**Tasks**:

1. **Create Submission Orchestration Hook**
   ```typescript
   function useWizardSubmission() {
     const createSong = useCreateSong();
     const createStyle = useCreateStyle();
     const createLyrics = useCreateLyrics();
     const createPersona = useCreatePersona();
     const createProducerNotes = useCreateProducerNotes();
     const updateSong = useUpdateSong();

     const [isSubmitting, setIsSubmitting] = useState(false);
     const [progress, setProgress] = useState({ current: 0, total: 0 });

     const submitWizard = async (formData: WizardFormData) => {
       setIsSubmitting(true);
       const createdIds: Partial<Record<string, string>> = {};

       try {
         // Step 1: Create Song
         setProgress({ current: 1, total: 5 });
         const song = await createSong.mutateAsync({
           title: formData.song.title,
           global_seed: formData.song.global_seed,
           sds_version: formData.song.sds_version,
           extra_metadata: {
             description: formData.song.description,
             genre: formData.song.genre,
             mood: formData.song.mood,
           },
         });
         createdIds.song = song.id;

         // Step 2: Create Style (if provided)
         if (formData.style) {
           setProgress({ current: 2, total: 5 });
           const style = await createStyle.mutateAsync(formData.style);
           createdIds.style = style.id;
         }

         // Step 3: Create Persona (if provided)
         if (formData.persona) {
           setProgress({ current: 3, total: 5 });
           const persona = await createPersona.mutateAsync(formData.persona);
           createdIds.persona = persona.id;
         }

         // Step 4: Create Lyrics (if provided)
         if (formData.lyrics) {
           setProgress({ current: 4, total: 5 });
           const lyrics = await createLyrics.mutateAsync({
             ...formData.lyrics,
             song_id: createdIds.song!,
           });
           createdIds.lyrics = lyrics.id;
         }

         // Step 5: Create ProducerNotes (if provided)
         if (formData.producerNotes) {
           setProgress({ current: 5, total: 5 });
           const producerNotes = await createProducerNotes.mutateAsync({
             ...formData.producerNotes,
             song_id: createdIds.song!,
           });
           createdIds.producerNotes = producerNotes.id;
         }

         // Step 6: Link entities to Song
         setProgress({ current: 6, total: 6 });
         await updateSong(createdIds.song!).mutateAsync({
           style_id: createdIds.style || null,
           persona_id: createdIds.persona || null,
         });

         return createdIds.song;
       } catch (error) {
         // Rollback handled by React Query invalidation
         throw error;
       } finally {
         setIsSubmitting(false);
       }
     };

     return { submitWizard, isSubmitting, progress };
   }
   ```

2. **Update handleSubmit Function**
   ```typescript
   const { submitWizard, isSubmitting, progress } = useWizardSubmission();

   const handleSubmit = async () => {
     try {
       const songId = await submitWizard(formData);
       router.push(ROUTES.SONG_DETAIL(songId));
     } catch (error) {
       console.error('Failed to create song:', error);
       // Error toast handled by mutation hooks
     }
   };
   ```

3. **Add Progress Indicator**
   ```typescript
   {isSubmitting && (
     <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
       <Card className="p-6 max-w-md">
         <h3 className="font-semibold mb-4">Creating Song...</h3>
         <div className="space-y-2">
           <div className="h-2 bg-muted rounded-full overflow-hidden">
             <div
               className="h-full bg-primary transition-all duration-300"
               style={{ width: `${(progress.current / progress.total) * 100}%` }}
             />
           </div>
           <p className="text-sm text-muted-foreground text-center">
             Step {progress.current} of {progress.total}
           </p>
         </div>
       </Card>
     </div>
   )}
   ```

4. **Add Error Handling & Rollback**
   ```typescript
   // Leverage React Query's automatic cache invalidation on error
   // Manual cleanup only needed for partial success scenarios

   const handleRollback = async (createdIds: Partial<Record<string, string>>) => {
     // Future enhancement: Delete created entities on partial failure
     // For MVP: Let user retry from current state
   };
   ```

**Deliverables**:
- `useWizardSubmission` hook
- Sequential entity creation logic
- Progress indicator UI
- Error handling and user feedback
- Integration tests

**Success Criteria**:
- ✅ Song + all entities created in correct sequence
- ✅ Entity IDs linked to Song entity
- ✅ Progress indicator shows current step
- ✅ Errors display with actionable messages
- ✅ Successful submission navigates to song detail page

---

#### **WP2B-6: Polish & UX Enhancements** (2 SP, 1 day)

**Goal**: Production-ready UX with confirmation dialogs and state persistence

**Tasks**:

1. **Add Cancel Confirmation**
   ```typescript
   const handleCancel = () => {
     const hasData = formData.song.title ||
                     formData.style ||
                     formData.lyrics ||
                     formData.persona ||
                     formData.producerNotes;

     if (hasData) {
       if (confirm('Are you sure? All progress will be lost.')) {
         router.push(ROUTES.SONGS);
       }
     } else {
       router.push(ROUTES.SONGS);
     }
   };
   ```

2. **Add Prevent Navigation During Submission**
   ```typescript
   useEffect(() => {
     const handleBeforeUnload = (e: BeforeUnloadEvent) => {
       if (isSubmitting) {
         e.preventDefault();
         e.returnValue = '';
       }
     };

     window.addEventListener('beforeunload', handleBeforeUnload);
     return () => window.removeEventListener('beforeunload', handleBeforeUnload);
   }, [isSubmitting]);
   ```

3. **Add LocalStorage Persistence (Optional)**
   ```typescript
   // Save draft on step changes
   useEffect(() => {
     if (formData.song.title) {
       localStorage.setItem('song-wizard-draft', JSON.stringify(formData));
     }
   }, [formData]);

   // Restore on mount
   useEffect(() => {
     const draft = localStorage.getItem('song-wizard-draft');
     if (draft) {
       const parsed = JSON.parse(draft);
       if (confirm('Resume previous draft?')) {
         setFormData(parsed);
       } else {
         localStorage.removeItem('song-wizard-draft');
       }
     }
   }, []);

   // Clear on success
   const handleSuccess = (songId: string) => {
     localStorage.removeItem('song-wizard-draft');
     router.push(ROUTES.SONG_DETAIL(songId));
   };
   ```

4. **Add Validation Summary Before Submit**
   ```typescript
   const getValidationSummary = (): string[] => {
     const warnings: string[] = [];

     if (!formData.song.title) warnings.push('Song title required');
     if (!formData.style) warnings.push('No style defined (optional)');
     if (!formData.lyrics) warnings.push('No lyrics defined (optional)');
     if (!formData.persona) warnings.push('No persona selected (optional)');
     if (!formData.producerNotes) warnings.push('No producer notes (optional)');

     return warnings;
   };

   // Display in review step
   {warnings.length > 0 && (
     <div className="bg-warning/10 border-2 border-warning/30 rounded-xl p-4">
       <h4 className="font-semibold mb-2">Review Checklist:</h4>
       <ul className="list-disc list-inside text-sm space-y-1">
         {warnings.map(w => <li key={w}>{w}</li>)}
       </ul>
     </div>
   )}
   ```

**Deliverables**:
- Cancel confirmation dialog
- Navigation prevention during submission
- LocalStorage draft persistence (optional)
- Validation summary in review
- UX polish tests

**Success Criteria**:
- ✅ Cancel prompts confirmation if data exists
- ✅ Browser warns before navigation during submission
- ✅ Draft restored on page reload (if implemented)
- ✅ Validation summary shows missing optional entities

---

## Testing Requirements

### Unit Tests (WP2B-1 through WP2B-6)

**State Management**:
- [ ] FormData updates correctly for each entity
- [ ] Step validation logic prevents/allows progression
- [ ] State helpers update nested data correctly

**Editor Integration**:
- [ ] Each editor receives correct initialValue
- [ ] onSave callback stores data and advances step
- [ ] onCancel callback clears data and advances step
- [ ] Skip buttons work correctly

**Review Step**:
- [ ] Displays all non-null entity data
- [ ] Shows "not provided" for null entities
- [ ] Edit navigation returns to correct step

**Submission Flow**:
- [ ] Sequential API calls execute in order
- [ ] Entity IDs linked to Song correctly
- [ ] Progress indicator updates on each step
- [ ] Error handling stops submission

### Integration Tests

**Complete Wizard Flow**:
- [ ] Create song with all entities
- [ ] Create song with no entities (song only)
- [ ] Create song with partial entities (e.g., song + style)
- [ ] Back navigation preserves data
- [ ] Skip functionality works for all optional steps

**Error Scenarios**:
- [ ] API failure on song creation
- [ ] API failure on entity creation (partial success)
- [ ] Network interruption during submission
- [ ] Validation errors prevent submission

### E2E Tests (Playwright)

**User Journeys**:
- [ ] Complete wizard from start to finish
- [ ] Skip all optional entities
- [ ] Edit entity from review step
- [ ] Cancel mid-wizard and confirm data loss
- [ ] Submit and verify song created successfully

---

## Dependencies

### Internal Dependencies
- ✅ Entity editor components (StyleEditor, LyricsEditor, etc.)
- ✅ React Query hooks (useCreateSong, useCreateStyle, etc.)
- ✅ API client with entity endpoints
- ✅ Type definitions (SongCreate, StyleCreate, etc.)

### External Dependencies
- ✅ React Hook Form (if used for form state)
- ✅ Zustand (if wizard state moved to store)
- ✅ React Query v5 (mutation orchestration)

### Blockers
- ❌ None - all dependencies met

---

## Rollout Strategy

### Phase 1: Single Entity Integration (WP2B-1, WP2B-2)
**Duration**: 2 days
**Deliverable**: Wizard with Song + Style creation
**Validation**: Users can create song with style, verify in database

### Phase 2: Full Entity Integration (WP2B-3, WP2B-4)
**Duration**: 3 days
**Deliverable**: All entities integrated, review step enhanced
**Validation**: Users can create song with all entities, review shows all data

### Phase 3: Submission & Polish (WP2B-5, WP2B-6)
**Duration**: 3 days
**Deliverable**: Sequential submission, error handling, UX polish
**Validation**: Complete E2E user journey works, errors handled gracefully

---

## Success Metrics

### Functional Metrics
- ✅ 100% of entity editors integrated (4/4)
- ✅ Submission success rate ≥ 95%
- ✅ Zero data loss on step navigation
- ✅ All optional entities can be skipped

### Quality Metrics
- ✅ Unit test coverage ≥ 80%
- ✅ Zero critical bugs in wizard flow
- ✅ Wizard completion time < 5 minutes (UX metric)

### Technical Metrics
- ✅ No entity editor modifications required
- ✅ Wizard component < 500 lines (maintainability)
- ✅ Sequential submission < 10s for all entities

---

## Risk Mitigation

### Risk 1: Complex State Management
**Mitigation**: Use proven patterns from existing editors, consider Zustand for complex state

### Risk 2: API Failure Mid-Submission
**Mitigation**: Implement progress indicator, clear error messages, allow retry without data loss

### Risk 3: User Confusion with Optional Steps
**Mitigation**: Clear "Skip" buttons, visual indicators, validation summary in review

### Risk 4: Performance with Large Forms
**Mitigation**: Lazy load editors, debounce validation, optimize re-renders with React.memo

---

## Follow-up Work

### Immediate (Within Sprint)
- Add keyboard navigation (Tab, Enter, Escape)
- Add form autosave every 30s
- Add step completion indicators

### Near-term (Next Sprint)
- Implement template system (load pre-built configurations)
- Add "Save as Draft" button (partial save)
- Add entity preview in wizard (live preview panel)

### Long-term (Future Phases)
- Multi-language support for wizard
- Advanced validation (cross-entity constraints)
- Workflow execution from wizard (auto-start after creation)

---

## References

### Implementation Analysis
- See codebase exploration output above for complete current state analysis
- All editor props, patterns, and integration challenges documented

### PRD References
- `website_app.prd.md:62-70` - Multi-step wizard flow
- `website_app.prd.md:80-86` - UX requirements (progressive disclosure, real-time feedback)
- `style.prd.md:74-79` - Style validation rules
- `lyrics.prd.md:79-85` - Lyrics validation rules
- `persona.prd.md:49-53` - Persona validation rules
- `producer_notes.prd.md:54-58` - Producer notes validation rules
- `sds.prd.md:69-74` - SDS validation (future integration)

### Related Implementation Plans
- `frontend-state-management-v1.md` - For Zustand store patterns (if needed)
- `websocket-realtime-client-v1.md` - For future workflow monitoring integration
- `NEXT-STEPS-REPORT.md:198-267` - Phase 4 frontend completion status

### Key Files
| Component | Path |
|-----------|------|
| Wizard | `/apps/web/src/app/(dashboard)/songs/new/page.tsx` |
| StyleEditor | `/apps/web/src/components/entities/StyleEditor.tsx` |
| LyricsEditor | `/apps/web/src/components/entities/LyricsEditor.tsx` |
| PersonaEditor | `/apps/web/src/components/entities/PersonaEditor.tsx` |
| ProducerNotesEditor | `/apps/web/src/components/entities/ProducerNotesEditor.tsx` |
| Song Hooks | `/apps/web/src/hooks/api/useSongs.ts` |
| Entity Hooks | `/apps/web/src/hooks/api/use*.ts` |
| Types | `/apps/web/src/types/api/entities.ts` |

---

**Last Updated**: 2025-11-14
**Version**: 1.0
**Status**: Ready for Implementation
**Estimated Completion**: 2025-11-28 (2 weeks from start)
