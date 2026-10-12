---
schema_version: 0.1
id: tlb-rowan-reach-what-we-carry-v0.3
type: artifact
artifact_kind: soundtrack_bible_and_prompt_pack
title: "Rowan Reach — What We Carry"
project: The Long Becoming
domain: cinematic-game-music
status: candidate_artifact
owner: Nick Miethe
created_at: 2026-10-09
updated_at: 2026-10-09
system_of_record: unassigned
current_location: generated-conversation-artifact
related_systems: [Pipes, Aural Geometry Lab, SkillMeat, MeatyWiki]
source_context: "Approved Above the Rowan Canopy recording; raw Basic Pitch transcription; v2 prompt pack; Nick's listening interpretation and expanded 1:25–1:52 target."
intended_use: "Compose and audition eight linked instrumental culture cues without replacing the approved reference recording."
next_action: "Audition And Still, We Rise against the complete approved returning phrase, then test the contrasting home and absence cues."
review_cadence: after-audition
confidentiality: personal
tags: [rowan-reach, game-score, leitmotif, fiddle, cello, instrumental, suno]
---

# Rowan Reach — What We Carry

**Design revision:** from a fiddle-first instrumentation palette to a cinematic, thematic narrative. These are composition briefs, not generated audio or verified score reconstructions.

## Emotional premise

Hope does not replace the longing. It arrives carrying it.

Treat loss as a possible fictional reading, not a confirmed plot event or the only available emotion. Rowan Reach must also have ordinary work, unguarded joy, affection, distance, resilience and continuity. The score gains meaning through different contexts, not through repeating a single grief-to-hope crescendo in every cue.

## Evidence and precedence

1. The user-approved recording remains the listening reference and must not be overwritten.
2. The user's listening notes establish the important perceived relationship: first fiddle swell near 0:30; recognition and renewed reach before 1:30; lower yearning retreat near 1:34–1:37; renewed higher ascent from approximately 1:38; release and continuation.
3. The Basic Pitch file is a machine transcription with overlaps and artifacts. It does not establish the exact solo line, expressive bowing, chord progression or original tempo.
4. The earlier written `D–F#–A–B–A–F#` Rowan Call remains an authored sketch, not the canonical transcription of the beloved performance. Do not force the recording to match that sketch.
5. All new harmonic, orchestral and narrative choices below are proposals. No one has verified that the existing recording uses a specific suspension, appoggiatura or cadence at the emotional dip.

## The connected musical identity

- **Rowan theme:** the actual principal fiddle melody selected by listening in the approved recording. Its exact notation remains under review.
- **Rowan Return:** the larger relationship between the initial statement and the later reaching, withdrawing, held and renewed phrase. The unit includes the preparation and retreat, not only the high arrival.
- **Hearth answer:** a short descending response assigned to mountain dulcimer or cello; the old `F#–E–D` is optional sketch material until it is deliberately chosen in a score.
- **Working pattern:** clipped mandolin or hammered-dulcimer figures supporting work and movement; not a rival lead melody.
- **World motif:** the previously authored `D–A–G–E–D`, retained in the game's motif register but not forced into every culture cue or asserted to exist in the reference recording.

**Instrument roles:** fiddle carries the present-tense human voice; cello can carry memory, answer, support or take over the melody; plucked wood gives place and ordinary life; horns represent expanded communal scale without replacing the soloist; banjo, when requested, is low-mixed brushed accompaniment. These are fictional scoring assignments, not historical claims.

## Similarity assessment: what is and is not established

The relevant comparison families are the Danna brothers' folk-and-orchestra writing for The Good Dinosaur, the user's Braveheart association, and the cultural thematic development of Howard Shore's Lord of the Rings scores. Disney's 2015 release directly supports the Good Dinosaur orchestral/folk palette and emotionally transforming themes. Shore's materials support the use of a folk fiddle in an orchestral score and the development/interweaving of cultural themes. [M1, M3, M4]

Candidate listening comparisons include The Good Dinosaur's Homestead and Goodbye Spot; Braveheart's A Gift of a Thistle and For the Love of a Princess; and the Rohan-centered material in The Two Towers. These are an A/B shortlist, not note-for-note matches or a finding of derivation. No audio-fingerprint identification, perceptual audition by this assistant, or score-to-score match has been performed here. The raw transcription alone cannot establish either copying or uniqueness.

For an exact comparison, curate the melody across the WHOLE 1:25–1:52 phrase, preserve onset relationships and held notes, compare transposition-normalized intervals with authorized reference scores, and then inspect harmony and orchestration separately. Do not overinterpret a few shared diatonic notes. [M5 identifies an authorized Good Dinosaur score source.]

## Suno workflow and settings

Verified October 9, 2026 against official documentation: v6 is available on Pro and is the controlled starting model; v6-wild is the exploratory alternative. [S1] Use v6 for this first pass, Instrumental enabled, Variety 0. The latter keeps Suno from modifying supplied style tags. Max Mode is an optional higher-cost experiment for longer pieces or close Covers; standard mode is the initial baseline. [S2]

Use the actual approved Suno song as the source for Cover when preserving melody is central, rather than relying on a title or text prompt alone. Cover is designed for melody retention while changing style; precision still needs listening verification. [S4, S5] For freer companion cues, attach the same recording as reference in the available reference-guided workflow; Suno documents multiple-input instructions in v6 Simple Mode. [S2]

The W/S values in the cue entries are proposed audition starting points, not calibrated probabilities or guarantees. Audio Influence is exposed with an audio upload in documented workflows; try 80 as an initial reference-focused setting WHEN that control is present. It does not mean 80 percent note preservation. [S3]

All Style blocks are under 1,000 characters; all arrangement blocks are under 5,000. Paste Style into Styles. Keep Instrumental enabled and use the bracketed block in the Lyrics area only where your current workflow accepts it. Brackets are experimental guidance, not an executable score language. A blank-Lyrics baseline is included in the audition plan below.

Every cue is self-contained as a composition brief. A repeated text description can suggest a relationship within a cue; exact cross-song thematic continuity requires the reference or a deliberately authored score. The original full recording is the best source for the callback relationship; the supplied clips are study windows, not replacement masters.

### Shared Exclude

```text
vocals, singing, spoken word, chanting, choir, banjo lead, banjo solos, foreground banjo, rapid three-finger banjo rolls, novelty hoedown, generic country jingle, frantic fiddle shredding, trailer braaams, oversized trailer drums, EDM drops, abrupt beat drops, constant maximum intensity, dense pad wash, sugary piano ballad
```

This excludes foreground banjo behavior, not orchestral emotion. Sweeping strings, deliberate swells, emotional cadences and a genuinely large arrival are welcome when earned. To remove banjo entirely from a control take, add `banjo` to Exclude and remove its positive request from that cue. [S6]

## Album sequence

**Preserved anchor:** Above the Rowan Canopy — approved original, unchanged.

- 01. **The Light We Built** — Founding / home before it becomes memory.
- 02. **When Every Window Was Warm** — Daily life / shared work and unguarded joy.
- 03. **The Road Beyond the Orchard** — Departure / longing before loss is certain.
- 04. **Where Your Answer Should Have Been** — Absence / the familiar duet becomes one-sided.
- 05. **What the River Carries** — Remembrance / the first believable continuation.
- 06. **And Still, We Rise** — Cultural centerpiece / full Rowan Return.
- 07. **A Thousand Hearths, One Horizon** — Flourishing city / scale without losing people.
- 08. **The Valley Goes On** — Cultural finale / inheritance, remembrance and future.

## Full cue prompts

### 01. The Light We Built

Founding / home before it becomes memory

**Model:** v6 · **Weirdness:** 28 · **Style Influence:** 92 · **Variety:** 0

**Style — 716 characters**

```text
Instrumental cinematic Appalachian chamber folk, lyrical orchestral Americana, intimate pastoral neoclassical; solo fiddle leads in connected expressive bows, answered by warm solo cello. Fingerpicked mountain dulcimer and soft autoharp supply ringing home colors; upright bass anchors a patient lilting 6/8. A memorable rising fiddle phrase settles into a gentle descending answer. Modest early swell, small instrumental conversations, a warm return without a grand climax. Clear major-centered melody, open fifths, tender added-second harmony, selective natural resonance. Close bow texture within a spacious room, flexible phrasing, audible silence. The feeling of a place being loved before anyone must leave it.
```

**Lyrics / instrumental arrangement — 921 characters**

```text
[Instrumental only. These brackets are performance directions, never lyrics.]
[Theme source: with reference audio attached, use its principal fiddle melody and characteristic phrasing; without it, introduce one original singable theme and reuse it throughout.]
[First room: expose the theme on solo fiddle at an intimate dynamic. Cello answers its descending tail in a separate register; mountain dulcimer adds one quiet response.]
[Gathering: autoharp and upright bass establish a gentle 6/8 sway. Let the fiddle make a modest first ascent, with room to breathe after its sustained note.]
[Belonging: exchange complete phrases between fiddle and cello; keep the accompaniment spare enough to hear each bow change.]
[Home: repeat the opening theme with slightly warmer inner harmony, not higher or louder. Let mountain dulcimer complete the last phrase. Ordinary safety and affection; no dramatic setback is needed here.]
```

**Audition test:** The tune should feel like home before we give it a history of loss.

### 02. When Every Window Was Warm

Daily life / shared work and unguarded joy

**Model:** v6 · **Weirdness:** 36 · **Style Influence:** 88 · **Variety:** 0

**Style — 741 characters**

```text
Instrumental cinematic Appalachian village dance, lyrical chamber Americana, acoustic counterpoint; singing fiddle above clipped mandolin, sparkling hammered dulcimer, playful cello and woody upright bass. Light wooden percussion and very quiet damped clawhammer banjo brushes support a relaxed 6/8 pocket. Short work patterns alternate with broad bowed melody; instruments trade phrases like neighbors trading stories. Major-pentatonic warmth, open-string resonance, buoyant syncopation and brief unexpected rests. Two lively ensemble refrains separated by a teasing mandolin-cello duet. Clear transient detail, natural timing, wide acoustic space, warm bass. Spirited, affectionate, nimble and genuinely happy, with a small smiling ending.
```

**Lyrics / instrumental arrangement — 998 characters**

```text
[Instrumental only. These brackets are performance directions, never lyrics.]
[Theme source: with reference audio attached, retain its main fiddle tune in a lighter rhythmic treatment; otherwise introduce one original tune and bring it back clearly.]
[Morning: mandolin and hammered dulcimer establish complementary short figures. Cello answers playfully. Keep banjo low and brushed, never melodic foreground.]
[Street opens: fiddle carries the complete tune over the working pulse, using broad bows against the short picked patterns.]
[Conversation: remove percussion. Mandolin begins a question; cello answers at a different pace; fiddle waits before joining their joke.]
[Evening: return the familiar melody with fiddle and cello in independent harmony. Quiet banjo resumes only beneath the bass. Let the last refrain dance, then end with a compact acoustic cadence.]
[Emotional rule: this piece is allowed uncomplicated joy. Do not manufacture a grief episode or an enormous orchestral climax.]
```

**Audition test:** The pleasure should come from instrumental dialogue, not fast banjo picking or a forced emotional swell.

### 03. The Road Beyond the Orchard

Departure / longing before loss is certain

**Model:** v6 · **Weirdness:** 30 · **Style Influence:** 92 · **Variety:** 0

**Style — 751 characters**

```text
Instrumental lyrical Appalachian travel score, cinematic chamber folk, expansive acoustic Americana; expressive lead fiddle, solo cello, breathy low whistle, sparse dobro and deep fingerpicked octave mandolin. Patient traveling 12/8, open low-string resonance, major-centered melody with passing minor shadows, long suspended tones. Present a warm theme early, let its later return sink into a yearning lower answer, then rise only modestly as the journey continues. Fiddle slides and bow swells carry emotion; whistle enters between complete phrases, dobro colors distant spaces. Close human-scale instruments against a wide landscape, breathing tempo and restrained harmonic expansion. Tender anticipation, homesickness, resolve; an open-ended coda.
```

**Lyrics / instrumental arrangement — 1019 characters**

```text
[Instrumental only. These brackets are performance directions, never lyrics.]
[Theme source: with reference audio attached, carry its principal fiddle melody into this new journey; otherwise establish a clear original melody before developing it.]
[Departure: fiddle states the tune warmly over cello and sparse octave-mandolin plucks. Let the initial ascent feel possible rather than victorious.]
[Distance: low whistle inherits the melody while dobro supplies answers after the phrases; keep each instrument identifiable.]
[Looking back: return to the fiddle opening, then bend the phrase into a lower sustained answer. Thin the upper harmony while cello continues moving underneath; leave the final resolution waiting.]
[Next step: repeat a small part of the original rising gesture, supported by a newly steady bass pulse. The rise is quieter and smaller than a finale.]
[Coda: fiddle and whistle leave an incomplete exchange over the continuing travel rhythm. The road remains ahead, and home has not disappeared.]
```

**Audition test:** Can a small return express resolve without spending the album’s biggest release?

### 04. Where Your Answer Should Have Been

Absence / the familiar duet becomes one-sided

**Model:** v6 · **Weirdness:** 24 · **Style Influence:** 94 · **Variety:** 0

**Style — 742 characters**

```text
Instrumental elegiac Appalachian chamber score, lyrical cinematic folk, intimate string lament; solo cello carries a familiar singing melody in its low register, with exposed fiddle fragments, quiet mountain dulcimer, soft autoharp and a nearly imperceptible pump organ. Slow compound-meter rubato, restrained minor-colored reharmonization, falling inner voices, patient suspensions and unfinished cadences. Begin as a duet remembered by one player. Reach gently upward, withdraw into a lower yearning phrase, then let the expected answer remain absent. Bow texture, subtle pitch slides and long natural decays stay close and human. A single later fiddle entrance offers companionship rather than triumph. End tenderly without a great ascent.
```

**Lyrics / instrumental arrangement — 1042 characters**

```text
[Instrumental only. These brackets are performance directions, never lyrics.]
[Theme source: with reference audio attached, give its actual fiddle tune to the cello at a lower octave; otherwise establish a simple original tune with an identifiable answering phrase.]
[Memory: cello begins the familiar opening. Leave the space where a fiddle response would normally arrive. Let quiet dulcimer resonance occupy that space without replacing the missing melody.]
[Yearning: cello reaches upward, then descends into a lingering unresolved note. A moving bass or inner voice changes the feeling beneath the held melody; merely lowering the volume is insufficient.]
[Presence: solo fiddle enters late with only the end of the answering phrase. Keep it fragile and close rather than high and brilliant.]
[Afterward: return the melody to cello, now accompanied by a single quiet fiddle line. No triumphant recovery, sudden bright-key switch or orchestral rescue.]
[Coda: the dulcimer finishes one small interval while the larger phrase remains open.]
```

**Audition test:** The withheld answer must be audible as an absence, rather than generic slow sadness.

### 05. What the River Carries

Remembrance / the first believable continuation

**Model:** v6 · **Weirdness:** 28 · **Style Influence:** 92 · **Variety:** 0

**Style — 740 characters**

```text
Instrumental reflective Appalachian chamber symphony, lyrical folk neoclassical; solo fiddle and warm cello share the melody, with quiet viola d'amore resonance, plucked mountain dulcimer and sparse upright bass. Slow breathing 6/8, long connected bows, descending suspensions, restrained minor shadows within a warm tonal center. An early simple theme returns with deeper meaning: first an incomplete ascent, then a lower yearning pause, finally a modest continuation supported by another instrument. Keep sorrow audible beneath the returning warmth. Intimate strings widen briefly into three independent lines, then return to a duet. Natural bow changes, selective sympathetic resonance, generous phrase space and a quiet grounded ending.
```

**Lyrics / instrumental arrangement — 980 characters**

```text
[Instrumental only. These brackets are performance directions, never lyrics.]
[Theme source: with reference audio attached, preserve the melody and lower retreat within its returning fiddle passage; otherwise state one original theme early and recall that same theme later.]
[Water: mountain dulcimer introduces sparse separated tones. Cello presents the theme in a low, patient voice.]
[Recognition: fiddle takes the opening ascent but hesitates before its expected high point; descend into a sustained lower answer and wait.]
[Support: while the fiddle holds, cello begins a quiet ascending counterline. Viola d'amore adds resonance, not a new lead.]
[Continuation: the fiddle completes the unfinished phrase over the cello's support. This arrival is warm and modest, not the highest register or loudest moment.]
[Memory stays: let cello retain a trace of the earlier descending answer under the settled fiddle melody. End with two distinct voices, neither replacing the other.]
```

**Audition test:** The return should sound supported, not magically cured by a major chord.

### 06. And Still, We Rise

Cultural centerpiece / full Rowan Return

**Model:** v6 · **Weirdness:** 32 · **Style Influence:** 94 · **Variety:** 0

**Style — 757 characters**

```text
Instrumental sweeping Appalachian folk symphony, lyrical cinematic string storytelling, expansive orchestral Americana; passionate solo fiddle remains the clear lead, with expressive cello counterpoint, viola, mountain dulcimer, upright bass and rounded French horns reserved for the late arrival. Flowing 6/8 with expressive rubato, long bow swells, audible slides, sustained melodic peaks and moving inner harmony. Establish a beautiful first ascent; later recall that same phrase, let it sink into an aching lower answer and unresolved hesitation, then grow from that exact withdrawal into a higher, broader return. Longing remains beneath the hope. Natural dynamic range, tactile soloists within a widening hall, one earned crest and a small human coda.
```

**Lyrics / instrumental arrangement — 1583 characters**

```text
[Instrumental only. These brackets are performance directions, never lyrics.]
[Reference contract: when the approved recording is attached, preserve the relationship between its first fiddle swell near 0:30 and its whole returning phrase at 1:25-1:52. These are source timestamps, not required output timestamps. Without audio, compose one original theme and give it the same early-statement/later-return relationship.]
[First ascent: expose the principal fiddle melody before swelling around it. Cello answers in a warm separate register. Make this statement beautiful and memorable, but keep later breadth in reserve.]
[Life between: develop fragments through quiet fiddle-cello dialogue and sparse dulcimer. The later reprise must have something recognizable to return to.]
[Reaching again: bring back the opening melodic idea. Begin to rise, then let the line descend into a lower, aching answer. Sustain a yearning note while harmony moves beneath it; leave the cadence unresolved.]
[Held breath: retain a thread of cello motion through the retreat. Do not cut to silence, launch a riser or insert a drum fill. The next ascent must grow out of this same phrase.]
[Continuance: resume with the opening idea extended upward into a longer arch and a higher sustained arrival. Keep fiddle foremost. Horns enter after the climb has begun; cello still remembers the earlier falling answer.]
[Release: let the high phrase descend naturally. Withdraw the ensemble until fiddle and cello remain, then finish with a small dulcimer answer. Hope carries the longing rather than erasing it.]
```

**Audition test:** The second ascent must be a recognizable callback made meaningful by the retreat—not an unrelated louder chorus.

### 07. A Thousand Hearths, One Horizon

Flourishing city / scale without losing people

**Model:** v6 · **Weirdness:** 34 · **Style Influence:** 90 · **Variety:** 0

**Style — 744 characters**

```text
Instrumental grand Appalachian civic symphony, progressive orchestral Americana, lyrical chamber folk; featured solo fiddle, singing cello, divided violas and violins, mandolin, hammered dulcimer, mountain dulcimer and deep upright bass. Rounded horns and intimate flugelhorn expand the ensemble only late; soft damped clawhammer brushes stay beneath the work rhythm. Buoyant 6/8 opens into spacious broad phrasing, interlocking acoustic figures and clear melodic handoffs. A warm village theme grows into a full civic statement, pauses for one exposed cello remembrance, then returns with rich moving harmony. Acoustic roots remain audible at maximum scale. Tactile wood, warm breath, luminous strings, genuine joy and a quiet domestic ending.
```

**Lyrics / instrumental arrangement — 1151 characters**

```text
[Instrumental only. These brackets are performance directions, never lyrics.]
[Theme source: with reference audio attached, keep its principal fiddle melody recognizable in this larger arrangement; otherwise introduce one original folk-like theme and preserve it through every scale change.]
[One window: mountain dulcimer answers an intimate solo fiddle phrase.]
[Many hands: mandolin and hammered dulcimer develop complementary work patterns. Cello supplies a melodic counterline; any banjo is quiet brushed timekeeping below the bass.]
[City: broaden the familiar theme across strings and warm horn responses. Keep at most one principal melody, one answering line and one rhythmic figure in the foreground.]
[Remembrance: the city texture recedes. Cello briefly recalls the theme's lower yearning answer while distant dulcimer keeps the opening pulse.]
[Horizon: the same melody returns in a broad fiddle-led statement. Horns support rather than replace the fiddle; flugelhorn provides one warm response after the phrase.]
[Last window: finish with the intimate instrument pair that opened the piece. The city has grown; home remains recognizable.]
```

**Audition test:** The great city should still contain the small home, both melodically and in its audible instruments.

### 08. The Valley Goes On

Cultural finale / inheritance, remembrance and future

**Model:** v6 · **Weirdness:** 28 · **Style Influence:** 94 · **Variety:** 0

**Style — 746 characters**

```text
Instrumental long-form Appalachian symphonic narrative, lyrical folk-orchestral elegy and homecoming; solo fiddle and cello are equal emotional voices, surrounded by mountain dulcimer, mandolin, harp, divided strings and warm French horns. Patient 6/8 with breathing transitions, major-centered warmth, minor-colored memories, long suspensions and richly moving inner voices. Introduce an intimate original theme, recall it across work and departure, withdraw into an aching unfinished answer, then let another instrument help complete a wider hopeful return. One true orchestral summit with the solo fiddle still audible; a long gentle aftermath returns the melody to plucked wood and cello. Human-scale tenderness survives the largest panorama.
```

**Lyrics / instrumental arrangement — 1646 characters**

```text
[Instrumental only. These brackets are performance directions, never lyrics.]
[Theme source: with the approved recording attached, preserve its recognizable fiddle theme and the full longing-to-continuance relationship, not merely its highest notes. Without audio, introduce one original theme and transform it rather than adding unrelated melodies.]
[Home remembered: solo fiddle gives a complete, unhurried statement. Mountain dulcimer supplies a small descending reply; cello joins only after the reply has had space.]
[The years: mandolin and harp build a light working pulse while strings exchange fragments of the same melody. Let a warm episode of ordinary happiness become substantial enough to miss later.]
[Absence: stop the work patterns. Cello attempts the melody alone, reaches upward, then withdraws into the lower yearning answer. The expected fiddle response is withheld.]
[Another voice: after a real pause within the phrase, fiddle takes up the cello's unfinished idea. Sustain a gentle inner line so the transition feels continuous, not a new song.]
[Carried forward: the recognizable opening melody grows into its broadest arch. Horns enter gradually beneath fiddle and cello; the lower voice retains a transformed trace of the earlier descent. Only one great crest.]
[After the horizon: allow a generous decrescendo and a complete quiet melody, not a rapid fade immediately after the peak. Pass the theme to mountain dulcimer with cello underneath.]
[Closing: let the final descending reply resolve softly. What was missing is remembered inside what remains; the last sound is a small acoustic instrument, not the orchestra.]
```

**Audition test:** The aftermath must be a real part of the composition. Do not end immediately after the emotional peak.

## First audition and acceptance

Start with 06 (the complete expressive return), then 01 (home) and 04 (absence). They should feel related without producing three versions of the same emotional scene.

For cue 06, compare two conditions with the same reference, style, exclusions and slider settings: bracketed arrangement versus blank Lyrics. Generate at least three independent output pairs per condition when feasible, keep every output, randomize audition order, and rate before looking at condition labels. If a reproducible seed is not exposed, this is a small exploratory comparison, not a controlled paired-seed experiment.

Ask whether the opening melody is memorable; whether the later rise is a recognizable callback; whether the lower retreat feels like a meaningful change of phrase/harmony/expression rather than a simple volume dip; whether the new rise grows continuously out of it; whether fiddle remains the narrator; whether cello has an independent role; and whether the ending makes time for the emotional aftermath.

Keep listening appeal and literal prompt compliance as separate judgments. An extraordinary variation should not be rejected just because it diverges from the written sketch; record the divergence and preserve it as a candidate performance.

## Source windows and files

- `rowan_first_swell_025_055.wav`: exact source PCM frames from 0:25–0:55.
- `rowan_complete_return_085_112.wav`: exact source PCM frames from 1:25–1:52.
- `reference_manifest.json`: original filename, SHA-256, time windows and derivation method.
- `raw_note_events_085_112.csv`: uncurated transcription events overlapping the return window, retaining original timestamps; NOT an approved melody.
- `prompts.json`: prompt text, settings, character counts and audition questions for local workflow integration; not a claim of a Suno API.
- `validation.json`: structural checks on this package.

## Project routing

**Owner:** The Long Becoming / music and worldbuilding. **AOS relationship:** personal creative work, using memory and reusable-asset layers; not a rebranding of the enterprise systems. **Postures:** composer/synthesizer for alternatives, editor for album coherence, critic for theme continuity. **Suggested memory:** MeatyWiki soundtrack bible and audition decisions. **Suggested reusable recipe:** SkillMeat only after repeated useful results. **Pipes:** store references and eventual verified note/phrase annotations; avoid premature automatic transcription claims. **Next action:** audition the three contrasting cues above. No connected system-of-record writeback has been performed.

## Sources

Local sources: the approved `Above the Rowan Canopy - OMG.wav`; `basic_pitch_note_events.csv` and `ROWAN_FIDDLE_MIDI_STUDY.md`; `rowan_reach_fiddle_first_soundtrack_v2.md`; the user's listening notes in this conversation. These establish lineage and evidence limits, not a verified score.

External sources checked October 9, 2026:

- [S1] Suno, Current Models: v6; edited September 9, 2026: https://help.suno.com/en/articles/13924737
- [S2] Suno, v6 FAQ; edited September 9, 2026: https://help.suno.com/en/articles/13924481
- [S3] Suno, Creative Sliders; edited June 3, 2025: https://help.suno.com/en/articles/6141377
- [S4] Suno, Cover product description; checked October 9, 2026: https://suno.com/products/covers
- [S5] Suno, What is a Cover?; older help article, September 27, 2024: https://help.suno.com/en/articles/2872257
- [S6] Suno, Exclude; edited December 19, 2025: https://help.suno.com/en/articles/3161921
- [M1] Walt Disney Records, The Good Dinosaur soundtrack press release, November 20, 2015: https://www.prnewswire.com/news-releases/walt-disney-records-releases-the-good-dinosaur-original-motion-picture-soundtrack-score-composed-by-mychael-and-jeff-danna-300182744.html
- [M2] Universal Music / Decca, Braveheart soundtrack listing: https://www.universalmusic.it/popular-music/album/braveheart-original-motion-picture-soundtrack_20012537738/
- [M3] Howard Shore, The Two Towers concert instrumentation: https://howardshore.com/rentals/lotr-ttt/
- [M4] Doug Adams, The Two Towers commentary published on Howard Shore site, June 14, 2018: https://howardshore.com/the-two-towers-iceland/
- [M5] Jeff Danna, authorized sheet-music listings: https://jeffdanna.com/sheet-music/
