---
schema_version: 0.1
id: null
type: artifact
artifact_kind: prompt_collection
title: "House Sound: The Unlikely Ensemble Sessions"
project: Agentic Operating System
domain: sonic-design
status: candidate_artifact
owner: Nick Miethe
created_at: 2026-09-30
updated_at: 2026-09-30
system_of_record: proposed-SkillMeat
current_location: conversation-artifact
related_systems: [SkillMeat, MeatyWiki, IntentTree, CCDash, Aural Geometry Lab]
source_context: "House-sound exploration; eight new scores, four motif studies, and ten short assets."
intended_use: "Suno Pro auditions and candidate audio-library assets; not deployed or verified musical fixtures."
next_action: "Audition S1, S2 and S7, then select a root motif from M1."
review_cadence: after-audition
confidentiality: personal
tags: [suno, house-sound, instrumental, earcons, sonic-design]
---

# House Sound: The Unlikely Ensemble Sessions

Eight unusual score experiments, four AOS motif studies, and ten sound effects or collectable materials. These are contemporary creative fusions, not historical ensemble reconstructions.

## Setup

In Advanced creation, enable Instrumental. Use the preset attached to each score or motif. These numeric values are suggested audition starting points, not tested optima. v6 and v6-wild are documented as available on Pro; v6-wild is intended for more exploratory generation. [S1]

| Preset | Model | Weirdness | Style Influence | Variety |
|---|---|---:|---:|---:|
| Structured | v6 | 35 | 85 | 0 |
| Adventure | v6-wild | 60 | 80 | 0 |
| Motif | v6 | 20 | 90 | 0 |

Use standard generation for initial auditions. Variety 0 leaves style tags under your control; the creative sliders and Max Mode are described in the official documentation. [S2, S3]

## Shared Exclude field: scores and motifs

Paste this in Exclude under Advanced Options, not in Style. [S4]

```text
singing, lyrics, spoken word, choir, chants, vocal samples, trailer braaams, stock cinematic risers, festival EDM drops, trap hi-hat rolls, novelty cartoon effects, applause, excessively compressed master
```

For F1-F8 and B1-B2, use Sounds rather than Advanced song generation. Sounds is available on Pro and offers One Shot/Loop plus optional BPM and key controls. The sound prompts include their own short exclusions instead of assuming a separate Sounds Exclude field. [S5, S6]

# I. Unlikely ensembles

## S1 — The Hurdy-Gurdy Has a Pocket

Hurdy-gurdy, baritone sax, dobro, tuba and brushed snare. A lopsided folk-funk band whose drone becomes a bass-and-brass groove.

**Adventure preset · 864 characters**

```text
Instrumental electroacoustic folk-funk, chamber groove, progressive roots music; 98 BPM, loping 4/4 with clipped offbeat accents. Hurdy-gurdy supplies a grainy wheel-bowed melody and buzzing drone; baritone sax answers with short, mischievous riffs; dobro adds slippery blues countermelodies. Tuba and brushed snare create a deep, elastic pocket, tiny glass overtones soften the edges. Begin with exposed hurdy-gurdy, let the low brass steal its rhythm, break into a dobro-sax duet, then reunite the band in a harmonized refrain. Repeated bass figure, modal blues color, open fifths, brief chromatic detours; strong original hook and room for each soloist. Audible wood, breath and string friction, warm tape saturation, precise stereo placement, substantial dynamic contrast. Swaggering, ingenious, oddly elegant; a strange acoustic band with a very good drummer.
```

## S2 — Porcelain Monsoon

Jal tarang, sarangi, ghatam, kanjira and cello. Struck bowls introduce a melody; bowed strings stretch it into something fluid.

**Structured preset · 895 characters**

```text
Instrumental contemporary Indian-inspired chamber fusion, liquid post-minimalism, delicate organic electronica. Jal tarang water-tuned bowls carry clear ringing melodic cells; sarangi answers with long bending bowed phrases; ghatam clay-pot percussion and light kanjira articulate a supple 7/8 cycle, grouped 2+2+3. Low cello resonance and a faint analog sine tone ground the ensemble. Open with separated bowl strikes, reveal a flowing sarangi melody, develop a playful conversation between pitched bowls and clay percussion, then let the bowed melody soar over the original pattern. A free-time central passage feels suspended before the pulse returns. Ornamented modal lines, sustained tonal center, sparse harmony, clear acoustic attacks and overlapping natural decays. Intimate, luminous, rain-bright; ringing precision against expressive pitch bends, ending in a small bowl-and-cello duet.
```

## S3 — The Snowfield Relay

Nyckelharpa, morin khuur, bass clarinet, hammered dulcimer and frame drum. Two bowed leads trade one melody across contrasting rhythms.

**Structured preset · 911 characters**

```text
Instrumental Nordic-steppe chamber fusion, resonant folk minimalism, expansive acoustic exploration score. Nyckelharpa keyed fiddle carries a dancing upper melody; morin khuur supplies broad low bowed answers; bass clarinet joins their inner voices, hammered dulcimer catches scattered harmonics, soft frame drum marks a patient 6/8 pulse. Introduce one original melody in long bowed notes, then give it a nimble rhythmic form on keyed fiddle. Alternate travelling duets with broad three-part harmony; a quiet middle section exposes bow texture and sympathetic resonance before the theme returns at full breadth. Open fifth drones, pentatonic turns, bittersweet suspended chords, occasional warm major color. Close wooden detail within a vast clear room, tiny electronic glints only at transitions. Windswept, companionable, resolute; emotional scale comes from register and counterpoint rather than percussion.
```

## S4 — The Last Tango on Europa

Bandoneon, theremin, cimbalom, cello and double bass. A tense tango loosens into weightless chamber music, then rediscovers its footing.

**Adventure preset · 871 characters**

```text
Instrumental chamber tango, electroacoustic noir, weightless science-fiction romance; 84 BPM, slow tango pulse with 3+3+2 accents. Bandoneon introduces a compact bittersweet melody, cello supplies a winding counterline, cimbalom scatters dry metallic sparks, double bass anchors the dance. A restrained theremin doubles only the ends of phrases, then takes one exposed gliding solo. Begin close and almost dry; open into a breathless bandoneon-cello duet; suspend the bass pulse for a floating theremin passage; return to the dance with the melody in a warmer harmonic light. Chromatic bass movement, minor-major ambiguity, expressive suspensions, sharp rhythmic stops against long singing lines. Intimate bellows and bow detail, deep cool stereo space, tiny analog flickers. Seductive, lonely, playful in flashes; an original memorable melody, not an endless atmosphere.
```

## S5 — Bamboo Brass Circuit

Khaen mouth organ, muted trumpet, mbira, marimbula bass, clean guitar and shaker. Breath-driven chords, plucked patterns and brass hooks build a buoyant groove.

**Adventure preset · 912 characters**

```text
Instrumental bamboo-reed chamber funk, interlocking acoustic minimalism, warm exploratory electronica; 104 BPM, buoyant syncopation with three-against-two accents. Khaen bamboo mouth organ breathes compact chord patterns; muted trumpet offers a cheerful angular hook; mbira supplies interlocking metal-tine figures, marimbula provides round plucked-box bass. Clean guitar plays short muted responses and a soft shaker carries the pulse. Start with reeds and bass, introduce trumpet-mbira dialogue, open into a bright harmonized refrain, then strip to an intimate reed-and-tine duet before the groove returns. Pentatonic themes, suspended ninths, restrained chromatic passing notes, changing accents over a stable bass pattern. Dry acoustic detail, warm low end, selective stereo echoes. Sociable, nimble, slightly eccentric; each instrument gets a recognizable motif and the full ensemble gets one joyful payoff.
```

## S6 — The Riverboat Observatory

Sudanese tanbur lyre, ney, bass trombone, viola and riq. A spare plucked pattern becomes an unexpectedly warm low-brass melody.

**Structured preset · 849 characters**

```text
Instrumental Sudanese-lyre-led chamber fusion, riverine acoustic minimalism, low-brass downtempo; 88 BPM, gently rolling compound pulse. Tanbur lyre plays a clear repeating plucked pattern; ney traces a breathy ornamented melody; bass trombone answers softly in its singing register. Viola adds warm inner counterpoint, riq supplies delicate accents, a faint analog resonance deepens the bass. Begin with lyre alone, let flute and trombone trade long phrases, grow into an unusually warm three-voice refrain, then withdraw to lyre and viola before a final melodic return. Pentatonic cells, open tonal centers, suspended voicings, flexible phrasing, space between percussion events. Wood and breath close to the listener, soft metallic shimmer far behind. Flowing, tender, quietly adventurous; the lyre remains audible even when the ensemble expands.
```

## S7 — Small Machines Learn to Waltz

Daxophone, bassoon, prepared piano, pizzicato cello and tuned spring percussion. Creaky mechanical phrases gradually reveal a graceful dance.

**Adventure preset · 923 characters**

```text
Instrumental eccentric chamber waltz, electroacoustic miniature, playful art-game score; lilting 3/4 with occasional missing beats. Daxophone bowed wooden tongue makes rounded creaks and sliding instrumental tones; bassoon answers in short warm phrases; prepared piano adds muted wooden clicks and bell-like notes. Pizzicato cello carries the bass, tiny tuned springs punctuate the rhythm. Start as an awkward duet whose phrases do not quite meet; repeat their ideas with small changes until a genuinely beautiful waltz emerges. Let bassoon and cello sing the melody together while the wooden instrument becomes accompaniment, then finish with one delightfully crooked reprise. Chromatic neighbors, clear tonal anchor, transparent counterpoint, sudden quiet spaces. Contact-mic intimacy against a small warm room, expressive dynamics. Affectionate, curious, unexpectedly moving; acoustic eccentricity rather than slapstick.
```

## S8 — Tidepool Cathedral

Steelpan, contrabass flute, lap-steel guitar, tuned stone percussion and udu. A percussion-led piece whose melody moves from sharp attacks into sustained glides.

**Structured preset · 839 characters**

```text
Instrumental resonant chamber ambient, oceanic post-minimalism, slow steelpan electronica; patient 5/4 pulse. Soft steelpan carries an original suspended melody, contrabass flute supplies a breathy low counterline, lap-steel guitar stretches selected notes into long luminous glides. Tuned stone percussion adds dry mineral accents, udu clay-pot bass gently marks the cycle, a bowed gong blooms only twice. Begin with separated stone and steel notes, build interlocking melodic ripples, open into a flute-guitar duet, then let the steelpan theme return in broad ensemble harmony. Lydian color, open fifths, major ninths, shifting phrase lengths over a stable pulse. Near-field attack detail, clear low end, long selective resonances, subtle analog space. Vast but intimate, patient but melodic; light reflected in slow-moving architecture.
```

# II. AOS motif studies

The shared proposed gesture is two short notes rising by a leap, a pause, then a longer downward answer. This describes a family, not a guaranteed identical melody. Choose an actual phrase from M1 and preserve that recording as the reference for later variants. These are musical identity studies, not sounds to trigger on every event.

## M1 — AOS Root: Notice, Connect, Continue

A compact identity study for an opening, demonstration bumper or recurring musical signature. The proposed common gesture is two short notes, a pause, then a longer answer.

**Motif preset · 865 characters**

```text
Instrumental sonic-identity miniature, electroacoustic chamber minimalism; target 45-60 seconds, compact arrangement. Muted marimba and plucked cello establish one original three-note motif: two short notes with an upward leap, a small pause, then a longer answer stepping downward. Glass harmonics illuminate the answer; a soft nyckelharpa sustained note and rounded analog bass supply warmth. Repeat the same melody clearly in three orchestrations: bare wood, wood with bowed strings, then a small luminous ensemble. Leave clean silence between statements and finish with one isolated version suitable for extracting a short audio logo. Open fifths, suspended harmony, precise attacks, gentle dynamics, close tactile foreground and deep uncluttered space. Inquisitive, humane, quietly assured; memorable enough to recognize without becoming an advertising jingle.
```

## M2 — Metis: The Useful Question

A proposed character theme: curious, companionable, with a small musical interruption that earns its place. For introductions or selected interaction moments—not every reply.

**Motif preset · 850 characters**

```text
Instrumental character-theme miniature, witty chamber electronica, tactile acoustic minimalism; target 45-60 seconds. Bass clarinet poses a compact three-note idea: two short notes rising by a leap, a pause, then a longer downward answer. Mbira repeats the motif with a gently displaced accent; pizzicato cello adds a warm counterline and muted vibraphone supplies one unexpected high note. Begin as an inquisitive solo, build a conversational duet, interrupt with one soft unresolved question, then reveal a warmer answer in close ensemble harmony. A light asymmetric pulse, modal color, clear melodic identity, brief pockets of silence. Close breath and string detail, low-volume analog warmth, clean short tails. Alert, kind, perceptive, a little mischievous; intelligence conveyed through a well-placed interruption rather than speed or grandeur.
```

## M3 — IntentTree: One Thought, Several Paths

A planning/garden theme whose voices branch and recombine. Keep it for entering a view, a deliberate focus transition or a milestone.

**Motif preset · 882 characters**

```text
Instrumental branching-motif miniature, chamber post-minimalism, organic systems music; target 60-75 seconds, moderate five-beat pulse. Mandolin introduces a three-note cell: two short notes rising by a leap, a small pause, then a longer descending answer. Marimba repeats it more slowly; pizzicato cello creates a low counterline; glass harmonics mark occasional points of agreement. Begin with one exposed path, add a second displaced repetition, let the voices branch into independent phrases, then briefly align them in clear three-part harmony before returning to the solo cell. Open fifths, suspended chords, changing phrase lengths, generous rests, one motif retained throughout. Dry picked and struck detail within a warm spacious mix, faint analog depth. Growing, navigable, purposeful; a tiny ensemble learning to cooperate, with distinct openings and endings for editing.
```

## M4 — MeatyWiki: Something Worth Keeping

A memory/lineage theme with mbira, viola d’amore, bass clarinet and glass harmonics. Earlier statements remain audible beneath later ones.

**Motif preset · 869 characters**

```text
Instrumental memory-theme miniature, resonant chamber ambient, lyrical electroacoustic minimalism; target 60-75 seconds. Mbira states a three-note motif: two short notes rising by a leap, a pause, then a longer descending answer. Viola d'amore sustains its upper harmonics, bass clarinet offers a slow answering line, faint glass resonance preserves traces of earlier phrases. Present the cell clearly, repeat it in a different register while previous notes decay, introduce a new counterline that makes the opening phrase sound newly meaningful, then end with the original motif alone. Open fifths, soft ninths, suspended consonance, free-breathing tempo and very sparse accompaniment. Close plucked detail, selective long natural resonance, quiet electronic horizon. Cumulative, warm, lucid; remembrance without nostalgia, calm continuity without a sentimental swell.
```

# III. Short sound effects

Use Sounds -> One Shot. Leave BPM and key unset initially. Durations are requested targets, not guaranteed output lengths. Playback semantics are proposed, not an existing deployed mapping.

## F1 — context.docked

A context bundle settling into place; a tactile assembly gesture rather than a success cue.

**Sounds: One Shot · 335 characters**

```text
About 1 second. Three tiny felt-lined mechanical pieces slide into a wooden housing and seat with a soft magnetic click; one faint glass harmonic appears after the final piece locks. Close, dry, precise, satisfying, quiet enough for an interface. One discrete assembly gesture. No voices, music bed, alarm, digital beep or long reverb.
```

## F2 — artifact.stamped

An artifact registered or a checkpoint recorded: weight, contact, then a tiny resonant trace.

**Sounds: One Shot · 309 characters**

```text
About 0.8 seconds. A small ceramic seal presses onto dense paper with a soft woody thock, followed by a delicate tuned-metal ring and a tiny latch closing. Tactile, weighty but gentle, clean attack, controlled short decay. One stamp, not a rhythm. No voice, background music, buzzer, fanfare or room ambience.
```

## F3 — approval.requested

An invitation to inspect and decide, without implying urgency or approval.

**Sounds: One Shot · 349 characters**

```text
About 1.4 seconds. A warm muted wooden note, a brief pause, then a rounded bass-clarinet-like instrumental tone rising slightly and stopping expectantly. Intimate, inquisitive, non-urgent, modest volume, clean silence afterward. A question rather than a warning or a success. No speech, breathing noise, backing music, shrill beep or repeated alarm.
```

## F4 — checkpoint.resumed

A paused mechanism finding its place and moving again.

**Sounds: One Shot · 347 characters**

```text
About 1.2 seconds. A tiny spring mechanism gently unwinds through two soft clicks, catches cleanly, then releases one upward wooden pluck with a warm resonant tail. Smooth restart after a pause, not a machine powering on. Dry foreground, delicate mechanical detail, one gesture. No voices, engine noise, alarm, background music or dramatic whoosh.
```

## F5 — review.disagreement

Two distinct answers that do not quite agree; an inspectable discrepancy, not a failure siren.

**Sounds: One Shot · 365 characters**

```text
About 1.5 seconds. Two quiet tactile tones answer from slightly different stereo positions: one wooden, one muted ceramic, close in pitch but gently unresolved together. A brief pause exposes their disagreement, then both decay naturally without a resolving note. Curious and restrained, clearly audible in mono. No voices, music bed, horror sting, buzzer or alarm.
```

## F6 — execution.finished

The activity stopped. Deliberately neutral about correctness.

**Sounds: One Shot · 335 characters**

```text
About 0.7 seconds. Two small dry wooden clicks settle into a softly damped final tap, like a precision mechanism stopping neatly. Descending energy, no rising melody, no harmonic resolution or sparkle. Neutral and clear, close recording, very short tail. One completion gesture. No voices, backing music, fanfare, alarm or bass impact.
```

## F7 — validation.passed

A separate, more resolved cue for an actual passed check—not merely the end of a run.

**Sounds: One Shot · 368 characters**

```text
About 1.3 seconds. One warm marimba pluck, one clean glass tone above it, then a quiet rounded wooden note settling into a consonant final interval. Three distinct attacks with a small pause before the last. Clear, calm, earned resolution rather than celebration; controlled decay and modest dynamics. No voices, backing music, glitter cascade, fanfare or loud impact.
```

## F8 — idea.hatched

For the fun collection: a tiny mechanical creature has just had a useful thought.

**Sounds: One Shot · 377 characters**

```text
About 1.8 seconds. A tiny wooden shell cracks softly; a delicate clockwork spring uncurls with a rising pitched twang; one surprised little glass note appears, then a low contented ceramic plunk. Tactile miniature Foley, charming and physically detailed rather than cartoonish. One complete gesture in a quiet room. No voices, animal calls, backing music, stock boing or alarm.
```

# IV. Collectable materials

## B1 — Computational Weather

A decorative ambient loop for a lab or selected project view; not a claim about live system state.

**Sounds: Loop; 72 BPM · 501 characters**

```text
Seamless sparse electroacoustic ambience at 72 BPM. Three quiet material layers: occasional hollow wooden ticks, low bellows-like air without human breathing, and tiny glass harmonics that drift between two repeating patterns. Calm background with long empty spaces, subtle periodic changes in density, no foreground melody or obvious climax. Deep clean stereo field, soft low end, restrained volume, matching beginning and ending texture. No voices, drum kit, alarms, rain, birds or cinematic risers.
```

## B2 — A Stone That Remembers the Bow

An explicitly imaginary instrument sample to collect, trim or use in a conventional sampler.

**Sounds: One Shot · 472 characters**

```text
A single 3-second note from an imaginary instrument: a hollow polished stone resonator struck with a soft wooden mallet, producing a dry mineral attack followed by a smooth bowed-string-like harmonic bloom. A faint second resonance emerges halfway through the decay, then fades cleanly. One stable perceived pitch, moderate register, close isolated recording. Intriguing but warm. No melody, accompaniment, voices, percussion sequence, environmental noise or added reverb.
```

## Audition and asset boundaries

Keep the unusual timbre only when it contributes a clear musical role. The rare-instrument descriptions are targets for generation, not confirmation that a result reproduces the instrument faithfully. For background layers, listen for distracting level jumps and obvious loop joins. Suno describes Sounds as experimental and warns that loop requests can produce full arrangements. [S6]

For motif identity, retain an accepted recording and derive exact short cues through editing rather than assuming independent generations will share the same notes. Keep execution.finished distinct from validation.passed; only a real passed check should trigger the latter. Do not label the decorative Computational Weather loop as live telemetry, or a generated rhythmic pattern as a validated Aural Geometry fixture.

Suggested ownership: the cross-estate design system owns the sonic identity; individual application projects own event-to-sound mappings. SkillMeat is the proposed home for reusable prompts/settings, MeatyWiki for listening notes and rationale. Suggested postures: Architect for semantic sound mappings, Editor for curation, Critic for identity and usability checks. Scope: personal creative assets first; S2S/GTM use after review. No connector writeback or deployment was performed.

## Sources and instrument references

Checked 2026-09-30. Sources establish available workflows and instrument descriptions, not the effectiveness of the creative prompts.

- [S1] Suno, What's new in v6? https://help.suno.com/en/articles/13924801
- [S2] Suno, How to Use: Creative Sliders. https://help.suno.com/en/articles/6141377
- [S3] Suno, v6 FAQ. https://help.suno.com/en/articles/13924481
- [S4] Suno, How do I exclude elements of a song? https://help.suno.com/en/articles/3161921
- [S5] Suno, Make loops and samples from scratch with Sounds, January 27, 2026. https://suno.com/release-notes/make-loops-and-samples-from-scratch-with-sounds
- [S6] Suno Sounds: Generate Custom Audio Samples, edited September 9, 2026. https://help.suno.com/en/articles/10625537
- [I1] Crafts Council / Aliyah Hussain, Jal Tarang / Waves in Water. https://www.craftscouncil.org.uk/directory/aliyah-hussain/jal-tarang-waves-in-water
- [I2] Smithsonian, Bengali Sarangi. https://music.si.edu/object-day/bengali-sarangi
- [I3] The Metropolitan Museum of Art, Nyckelharpa. https://www.metmuseum.org/art/collection/search/501567
- [I4] UNESCO, Traditional Morin Khuur Music of Mongolia. https://ich.unesco.org/en/projects/implementation-of-the-national-action-plan-for-the-safeguarding-of-traditional-morin-khuur-music-of-mongolia-00013
- [I5] The Metropolitan Museum of Art, Khaen. https://www.metmuseum.org/art/collection/search/500812
- [I6] Smithsonian, Marimbula. https://postalmuseum.si.edu/object/nmah_601901
- [I7] Smithsonian, Sudanese Lyre Tanbur. https://music.si.edu/object-day/sudanese-lyre-tanbur
- [I8] Richard van Hoesel, The Daxophone. https://richardvanhoesel.com/daxophone/
- [I9] The Metropolitan Museum of Art, Viola d'Amore. https://www.metmuseum.org/art/collection/search/501561

The instrument references above support the parenthetical explanations supplied with the collection. All specific ensemble combinations, arrangement arcs, moods and orchestration choices are new creative proposals.
