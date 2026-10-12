---
schema_version: 0.1
id: null
type: artifact
artifact_kind: prompt_collection
title: "House Sound: Symphonic Expeditions"
project: Agentic Operating System
domain: sonic-design
status: candidate_artifact
owner: Nick Miethe
created_at: 2026-10-01
updated_at: 2026-10-01
system_of_record: "Suggested: SkillMeat"
current_location: conversation-attachment
related_systems: [SkillMeat, MeatyWiki, Signal to System, Aural Geometry Lab]
source_context: "Current house-sound conversation; named game/film influences; official Suno and instrument references"
intended_use: "Manual Suno instrumental score experimentation; original house-sound development"
next_action: "Generate and audition prompts 01, 08, 10 and 13"
review_cadence: after-first-audition
confidentiality: personal
tags: [suno, instrumental, orchestral, house-sound, cross-cultural-fusion]
---

# House Sound: Symphonic Expeditions

Fourteen original instrumental score prompts. Each Style field is self-contained and contains fewer than 1,000 characters. Common exclusions are separate. Titles, descriptions and sources are not part of the Style field.

The artistic direction is melodic cross-cultural symphonic writing: distinctive acoustic soloists, interlocking inner voices, memorable recurring themes, emotional orchestral development and detailed natural sound. These are imagined contemporary ensembles, not reconstructions of traditional repertoire or claims of exact regional tuning.

## Source boundary

The live Spotify lookup returned a generated recommendation playlist, not the tracks of the supplied Soundtracks playlist. This collection therefore uses the user's explicitly named game and film-composer influences and stated instrumentation preferences; it does not claim analysis of the user's playlist or listening history. The orchestration, melodies requested, combinations and structures below are original proposed experiments. Instrument references support instrument identity, not predictions about Suno's rendering fidelity.

## Suggested starting settings

| Control | Initial setting |
| --- | --- |
| Model | v6 |
| Creation | Custom/Advanced; Instrumental enabled |
| Weirdness | 35 |
| Style Influence | 85 |
| Variety | 0 |
| Max Mode | Off for the initial audition |

The numerical values are proposed starting settings, not measured optima. v6 and v6-wild are available on Pro according to Suno's September 9, 2026 documentation. For an optional model comparison, retry 05, 07, 10 and 13 with v6-wild while initially keeping the other settings unchanged. Variety 0 avoids that control rewriting the style tags. Sources: [Suno models][suno-models], [Creative Sliders][suno-controls], [v6 FAQ][suno-faq]. Checked October 1, 2026.

## Common Excludes

Paste into the separate Exclude field under Advanced Options, not into Style. See [Suno's Exclude instructions][suno-exclude].

```text
singing, lyrics, spoken word, choir, chanting, vocal samples, trailer braaams, stock cinematic risers, festival EDM drops, trap hi-hat rolls, canned applause, constant percussion pounding, heavily compressed master
```

# I. India: plucked metal, warm wood, and orchestral melody

## 01. Sarod on the Ridgeline

**Ensemble:** Sarod, mandolin, fiddle, dobro, cello and upright bass, expanding into strings and French horns.

**Experiment:** A bluegrass string band and sarod trade the lead before the orchestra inherits their shared refrain.

**Style: 987 characters**

```text
Instrumental symphonic folk adventure, progressive bluegrass, Indian chamber fusion, lyrical film score; relaxed 96 BPM in 4/4. Sarod sings a fluid, metallic plucked melody; mandolin answers with a crisp rhythmic version, fiddle and cello weave warm counterlines, dobro adds slow answering slides, upright bass anchors the pocket. An original broad refrain grows from their short opening phrases. Begin with sarod and mandolin, reveal mandolin-fiddle-cello-bass harmony, then expand into divided orchestral strings and rounded French horns while the acoustic leads remain audible. A bass-and-dobro interlude changes the groove before the refrain returns in full ensemble counterpoint. Modal warmth, open fifths, expressive bends against spacious chord voicings; clean soul-funk guitar ghost notes only in the returning groove. Woody transients, detailed bows, natural hall depth, wide dynamics. Adventurous, companionable, deeply melodic; an intimate band gradually becoming a landscape.
```

Instrument context: [The Metropolitan Museum of Art: Sarod][sarod].

## 02. A Monsoon Written for Horns

**Ensemble:** Bansuri and shehnai over tabla, tanpura, harp, cello, divided strings and French horns.

**Experiment:** Two wind soloists give the same long melody different emotional meanings; the horns deliver the panoramic statement.

**Style: 993 characters**

```text
Instrumental Indian-inspired symphonic romance, pastoral chamber music, expansive cinematic storytelling; flowing 6/8 with expressive rubato. Bansuri introduces a long tender melody, shehnai answers with an ornamented rising phrase, solo cello joins in lyrical dialogue. Tanpura sustains a quiet tonal center; tabla and harp create a gentle rippling pulse. Divided strings gradually deepen the harmony, French horns carry the melody at the emotional summit. Shape a complete journey: unaccompanied flute, intimate reed-and-cello exchange, gathering rhythmic motion, one sweeping orchestral arrival, then a transformed flute reprise over warm strings. Let the soloists bend and decorate notes while accompaniment uses open spacious voicings. Bittersweet suspensions, clear bass movement, singing inner parts, memorable melodic contour. Natural breath and bow detail, broad dynamics, distant glass harmonics. Rain-bright tenderness, anticipation and release; emotional melody remains the center.
```

## 03. The Veena and the Willow

**Ensemble:** Saraswati veena, bassoon, flute, cello, mridangam, string orchestra and harp.

**Experiment:** Plucked ornament becomes woodwind counterpoint, then a lilting chamber dance. More intimate and nimble than the surrounding epics.

**Style: 958 characters**

```text
Instrumental South Indian-inspired chamber concerto, lyrical woodwind pastoral, acoustic post-minimalism. Saraswati veena plays warm resonant plucked phrases with expressive pitch bends; bassoon answers in its lyrical middle register, flute supplies a lighter second melody, cello supports a singing bass line. Gentle mridangam pulses sit beneath a buoyant composed five-beat pattern. Begin with a veena-bassoon duet, build a playful exchange with flute, then let a small string orchestra develop the theme in flowing counterpoint. The slow middle movement exposes veena over sustained cello before the opening dance returns with richer harmony. Clear modal center, open accompaniment during ornamented solos, warm suspensions in the orchestral passages. Harp harmonics link the scenes; acoustic grain, precise articulation and breathing room stay audible. Graceful, affectionate, curious; a genuinely melodic miniature concerto with a smiling final cadence.
```

Instrument context: [The Metropolitan Museum of Art: Vina (ekanda vina)][veena].

# II. Middle Eastern ensembles with symphonic depth

## 04. The City Inside the Lantern

**Ensemble:** Oud, qanun and ney with viola, riq, darbuka, strings, bassoons and French horns.

**Experiment:** A tiny plucked idea becomes a city-scale orchestral theme without losing the intimacy of the opening.

**Style: 986 characters**

```text
Instrumental Arabic-inspired orchestral world-building suite, oud concerto, cinematic chamber storytelling. Oud introduces a memorable ornamented theme; qanun gives it a bright rippling answer, ney unfolds its longer lyrical shape, viola adds a dark inner voice. Light riq and darbuka establish an unhurried pulse. Develop three connected scenes: intimate courtyard duet, intricate moving street of overlapping plucked patterns, then a broad city vista where strings and French horns sustain the theme above its original oud figure. Let bassoons and cellos carry the rhythmic pattern during the final return. Melodic inflection over open tonal centers, selective rich orchestral suspensions, contrasting registers and long cadences. Brass expands the space rather than dominating it; warm string detail, clear hand percussion, delicate metallic resonance, deep natural hall. Wonder, human bustle and quiet grandeur, ending with the full melody rather than an anonymous atmospheric fade.
```

## 05. Nine Steps to the Palace

**Ensemble:** Baglama and Black Sea kemence with clarinet, bassoon, frame drum, strings and horns.

**Experiment:** A buoyant nine-beat dance becomes a broad orchestral statement without abandoning its uneven rhythmic character.

**Style: 972 characters**

```text
Instrumental Turkish-inspired symphonic folk dance, chamber orchestral adventure, intricate acoustic counterpoint; lively 9/8 grouped 2+2+2+3. Baglama states a bright picked motif; Black Sea kemence answers with agile bowed turns, clarinet sings a broader refrain, bassoon and pizzicato cellos articulate the uneven gait. Soft frame drum supports the groove. Open with two acoustic leads trading phrases, pass the motif through woodwinds, then broaden the refrain into lush strings and noble French horns without straightening the meter. A half-speed clarinet-and-cello interlude reveals the melody's tenderness before the dance returns in layered counterpoint. Ornamented modal lines, flexible melodic inflection over sparse bass, suspended orchestral voicings. Crisp plectrum attacks, clear bow texture, restrained percussion, warm concert-hall depth. Elegant, animated, adventurous; courtly poise with a mischievous rhythmic step, finishing in a vivid ensemble cadence.
```

Instrument context: [Turkish Ministry of Culture and Tourism: Traditional/Local Musical Instruments][anatolian].

## 06. A Thousand Windows, One Moon

**Ensemble:** Persian tar, kamancheh and santur, with English horn, viola, cello, tombak and divided strings.

**Experiment:** A tender double-concerto atmosphere: short plucked phrases become long bowed and wind lines, with a warm rather than triumphant orchestral crest.

**Style: 975 characters**

```text
Instrumental Persian-inspired orchestral nocturne, lyrical double-concerto writing, intimate cinematic romance. Tar introduces a short resonant plucked idea; kamancheh stretches it into a long expressive bowed melody, English horn answers with a tender descending line. Santur adds sparse shining figures, tombak supplies a soft heartbeat, cello and viola sustain an open harmonic frame. Begin as tar and kamancheh, let the orchestra quietly absorb their motif, then reveal a sweeping string passage where English horn and bowed soloist sing in dialogue. Suspend the pulse for a santur-cello interlude; return to the main melody with richer inner voices and a gently resolved ending. Flexible modal phrases, subtle pitch inflections, restrained bass movement, warm suspensions; melody in the foreground rather than dense chord blocks. Detailed plucks and bow grain, luminous overtones, soft low end, natural hall depth. Intimate longing opening into generosity and belonging.
```

# III. Southeast Asian colors: wood, reeds, metal, and gliding strings

## 07. The Bamboo Clockmaker

**Ensemble:** Thai ranat ek and saw u with clarinet, bassoon, harp, celesta and strings.

**Experiment:** The xylophone supplies the mechanism; the bowed soloist supplies the heart. A playful orchestral scherzo with a lyrical center.

**Style: 977 characters**

```text
Instrumental Thai-inspired chamber fantasy, orchestral scherzo, bright acoustic minimalism; nimble 6/8 with occasional two-against-three accents. Ranat ek wooden xylophone plays a clear looping figure; saw u bowed fiddle sings a warm contrasting melody, clarinet answers lightly, bassoon and pizzicato strings provide springy accompaniment. Harp and celesta catch only selected notes. Introduce the clockwork figure alone, add conversational woodwind counterpoint, then slow the surface motion for a lyrical saw u and cello duet. Bring back the opening figure beneath a broad string melody so the small mechanism becomes the engine of a larger musical world. Pentatonic melodic cells in contemporary hybrid orchestration, transparent chord voicings, playful rests and changing registers. Warm struck wood, expressive bowed lines, precise attacks, airy orchestral space. Ingenious, joyful, tender beneath the activity; a satisfying composed ending with one last wooden flourish.
```

Instrument context: [Smithsonian: Siamese Xylophone (Ranat Ek.)][ranat].

## 08. Two Rivers, One Voice

**Ensemble:** Vietnamese dan bau and dan nguyet, pedal-steel guitar, fiddle, cello, upright bass, orchestral strings and horns.

**Experiment:** Dan bau and pedal steel trade gliding phrases without doubling continuously. A roots ballad that opens into a sweeping score.

**Style: 966 characters**

```text
Instrumental Vietnamese-Appalachian symphonic ballad, lyrical chamber folk, cinematic Americana; slow rolling 6/8. Dan bau sings pure harmonic tones with supple pitch bends; pedal-steel guitar answers with warm gliding phrases, each soloist leaving space for the other. Dan nguyet moon lute supplies crisp plucked patterns, fiddle and cello weave long counterlines, upright bass grounds the ensemble. Begin as the two sliding voices in dialogue, introduce a memorable shared melody, then open into divided orchestral strings and soft French horns. A quiet moon-lute and cello passage changes the harmonic light before the melody returns in full, the two leads now carrying distinct parts. Pentatonic turns, open fifths, bittersweet added-note harmony, generous suspensions. Intimate attacks against long singing lines, detailed acoustic foreground and luminous hall depth. Tender, searching, expansive; emotional continuity across very different instrumental colors.
```

Instrument context: [Smithsonian Folkways: Music of Viet Nam][vietnam].

## 09. The Canopy Learns to Fly

**Ensemble:** Bornean sape and West African kora with flute, cello, bass clarinet, strings and French horns.

**Experiment:** Two plucked patterns become the accompaniment to a melody they initially concealed. Buoyant exploration music rather than generic forest ambience.

**Style: 958 characters**

```text
Instrumental Bornean-West African chamber fusion, symphonic exploration music, flowing acoustic minimalism. Sape boat lute presents a warm repeating melodic figure; kora answers with lighter cascading plucks. Solo cello reveals a long melody hidden inside those patterns, flute carries its upper answer, bass clarinet anchors a gentle compound pulse. Introduce each plucked voice separately, join them in interlocking dialogue, then let divided strings and rounded French horns unfold the cello melody at panoramic scale. Clear the ensemble for a soft sape-kora duet before a buoyant final refrain. Pentatonic cells, rolling cross-rhythms, open harmonic spaces and luminous suspended chords. Light hand percussion, tiny glass harmonics and restrained analog depth connect the sections without masking the acoustic detail. Sunlit, graceful, adventurous; plucked intimacy becomes orchestral flight while both original instrumental patterns remain recognizable.
```

Instrument context: [Sarawak Tourism Board: Explore Sarawak's Sape and Music][sape].

## 10. A Garden of Bronze and Breath

**Ensemble:** Javanese-inspired gender metallophone and bonang gong-chimes, Japanese sho, cello, harp and string orchestra.

**Experiment:** Three moving musical layers: a ringing cyclic pattern, sustained reed harmony, and a long cello melody. Contemporary hybrid tuning rather than a traditional ensemble reconstruction.

**Style: 982 characters**

```text
Instrumental Javanese-Japanese symphonic fantasy, resonant chamber minimalism, luminous cinematic impressionism. Gender metallophone and rounded bonang gong-chimes form complementary repeating patterns; Japanese sho mouth organ sustains quiet reed clusters, solo cello sings a long arching original melody. Harp lightly bridges struck and sustained textures. Keep the ringing instrumental pitch colors exposed; use sparse open orchestral voicings rather than covering every note with a chord. Begin with bronze and breath, introduce the cello theme slowly, let divided strings broaden it while the cyclic patterns continue underneath, then return to the two resonant layers with a changed melodic answer. Patient pulse, alternating dense and empty phrases, low gong punctuation only at major transitions. Warm acoustic detail, natural decays, subtle spatial electronics, broad dynamics. Suspended wonder, tenderness and scale; a distinctive melody above an intricate living lattice.
```

Instrument context: [Smithsonian National Museum of Asian Art: Javanese Gamelan Music][gamelan]; [The Metropolitan Museum of Art: Sho][sho].

# IV. East Asian soloists inside a larger orchestra

## 11. The Mountain Answers in Silk

**Ensemble:** Korean gayageum, haegeum and daegeum with English horn, cello, janggu, strings and French horns.

**Experiment:** A quietly ornamented chamber melody expands into a slow, generous orchestral theme. More sustained singing lines than busy plucked patterns.

**Style: 968 characters**

```text
Instrumental Korean-inspired symphonic chamber romance, lyrical exploration score, contemporary acoustic impressionism; slow spacious 4/4. Gayageum supplies resonant plucked phrases and expressive bends; haegeum carries an original long-lined melody, daegeum flute offers a breathy upper answer. English horn and solo cello add warm contrasting counterlines; soft janggu marks only selected pulses. Begin with gayageum and haegeum, pass the melody through flute and English horn, then let divided strings and French horns reveal its broad orchestral form. A cello-haegeum duet becomes the emotional center before the final return. Pentatonic contours, open harmonic support under ornamented solos, richer suspensions in ensemble passages, patient cadences and a memorable melodic peak. Intimate string grain and breath, clear soloist separation, deep natural hall, tiny glass accents. Reflective, tender, quietly magnificent; scale without losing the individual voice.
```

Instrument context: [Busan National Gugak Center: Gugak Education][korea].

## 12. Paper Kites, Brass Wings

**Ensemble:** Chinese suona, sheng and yangqin with clarinets, French horns, cellos, divided strings and timpani.

**Experiment:** Let reeds and brass build a bright, melodic overture. The suona gets short featured entrances rather than sitting over the entire orchestra.

**Style: 954 characters**

```text
Instrumental Chinese-inspired symphonic adventure overture, bright wind concerto, lyrical orchestral storytelling; buoyant 2/2 with crisp dancing accents. Yangqin hammered strings establish a sparkling motif; sheng mouth organ supports warm reed harmonies; suona introduces a bold original theme in short featured entrances, answered by French horns rather than doubled continuously. Clarinets and cellos carry nimble inner lines, divided strings add breadth, timpani marks structural arrivals. Begin with delicate hammered strings, reveal the wind theme, open into a broad orchestral refrain, then contrast it with a tender cello-sheng passage before an exuberant return. Pentatonic melodic contours, clear bass movement, suspended brass voicings, playful rhythmic handoffs. Detailed attacks, rounded orchestral warmth, natural dynamic growth. Radiant, adventurous, melodic; a genuine overture with contrasting themes and an earned full-ensemble ending.
```

Instrument context: [Singapore Chinese Orchestra: Resounding Winds][chinese-orchestra].

# V. Australia and a full-house finale

## 13. Red Earth, Silver Strings

**Ensemble:** Didgeridoo and clapsticks with shakuhachi, mandocello, solo viola, string orchestra and French horns.

**Experiment:** Keep didgeridoo as a living rhythmic foundation; let flute and strings carry the melody. The orchestra changes register and density above a stable tonal center.

**Style: 950 characters**

```text
Instrumental Australian-Japanese symphonic landscape, contemporary didgeridoo concerto, lyrical chamber minimalism; patient 6/8 with gently shifting accents. Didgeridoo supplies a low sustained drone shaped by rhythmic breath pulses and changing overtones; soft clapsticks define space. Shakuhachi sings an original spacious melody, solo viola answers warmly, mandocello adds sparse dark plucks. Keep the drone's tonal center stable while a string orchestra changes harmony, register and density above it. Begin with breath and viola, introduce the flute theme, expand into broad strings and French horns, then withdraw to flute and mandocello before a radiant final ensemble statement. Open fifths, suspended harmonies, long melodic arcs, large quiet spaces. Natural reed, wood and bow detail, clear low end, vast but transparent hall depth. Grounded, tender, immense; rhythmic earth beneath singing orchestral light, with a complete melodic ending.
```

Instrument context: [National Museum of Australia: William Barton][australia].

## 14. The Orchestra Remembers Every Road

**Ensemble:** Oud, mandolin, sarod, koto, erhu and cello with sheng, full strings, woodwinds and French horns.

**Experiment:** Two original themes travel through four instrumental settings and finally combine. The finale treats the acoustic ensembles as the orchestra’s protagonists, not ornamentation.

**Style: 977 characters**

```text
Instrumental cross-cultural symphonic adventure suite, leitmotivic fantasy score, progressive acoustic chamber music. Establish two original themes: a nimble rising oud-and-mandolin figure and a long lyrical erhu-and-cello answer. Develop them through four connected scenes: intimate plucked duet; sarod and koto exchange rhythmic variations; sheng, woodwinds and divided strings reveal the bowed theme in rich harmony; full orchestra with French horns combines both themes in clear counterpoint. Acoustic soloists stay forward, with no more than two lead lines at once. Flowing compound pulse, occasional asymmetric turnarounds, open fifths growing into warm extended harmony, purposeful bass movement. One quiet solo interlude makes the final orchestral arrival feel earned. Tactile strings, ringing overtones, subtle analog depth, expansive natural dynamics. Wonder, fellowship and discovery; finish with a complete, emotionally generous reprise rather than a trailer sting.
```

## Audition notes

Judge the melody, soloist audibility, interaction between the unusual instruments and the orchestra, and whether the quieter sections make the larger ones matter. Exact meters, instrument identities, tuning, register and stated arrangement changes are generation targets, not verified results.

For a useful second pass, keep one chosen prompt fixed and change only one leading instrument or one model setting. Keep the resulting audio and generation details; text prompts alone are not deterministic reproductions of a recording.

## Suggested portfolio routing

Owner: cross-estate sonic design under the Agentic OS meta-project. Artifact: orchestral house-sound prompt collection and audition notes. Postures: creative synthesizer for new pairings; editor/listening reviewer for selection. Classification: personal creative experimentation, potentially reusable for S2S communication. Suggested stores: SkillMeat for reusable prompt/settings packs; MeatyWiki for rationale and listening notes. No live application integration, control-plane change or writeback has been performed.

## References

[suno-models]: https://help.suno.com/en/articles/13924801 "Suno: What's new in v6? (edited September 9, 2026)"
[suno-controls]: https://help.suno.com/en/articles/6141377 "Suno: Creative Sliders"
[suno-faq]: https://help.suno.com/en/articles/13924481 "Suno: v6 FAQ (edited September 9, 2026)"
[suno-exclude]: https://help.suno.com/en/articles/3161921 "Suno: Exclude"
[sarod]: https://www.metmuseum.org/art/collection/search/500717 "The Metropolitan Museum of Art: Sarod"
[veena]: https://www.metmuseum.org/art/collection/search/505637 "The Metropolitan Museum of Art: Vina (ekanda vina)"
[anatolian]: https://www.ktb.gov.tr/EN-98659/traditionallocal-musical-instruments.html "Turkish Ministry of Culture and Tourism: Traditional/Local Musical Instruments"
[ranat]: https://www.si.edu/object/siamese-xylophone-ranat-ek%3Anmnhanthropology_8468310 "Smithsonian: Siamese Xylophone (Ranat Ek.)"
[vietnam]: https://folkways.si.edu/music-of-vietnam/world/album/smithsonian "Smithsonian Folkways: Music of Viet Nam"
[sape]: https://www.sarawaktourism.com/web/stories/story-view/explore-sarawak-s-sape-and-music "Sarawak Tourism Board: Explore Sarawak's Sape and Music"
[gamelan]: https://asia.si.edu/explore-art-culture/audio/javanese-gamelan-music/ "Smithsonian National Museum of Asian Art: Javanese Gamelan Music"
[sho]: https://www.metmuseum.org/art/collection/search/503052 "The Metropolitan Museum of Art: Sho"
[korea]: https://busan.gugak.go.kr/ENG/contents/ENG0301000000.do%3B "Busan National Gugak Center: Gugak Education"
[chinese-orchestra]: https://sco.com.sg/huayue-stories/%E3%80%90concert-highlights%E3%80%91resounding-winds-liu-chiang-pin-and-sco/ "Singapore Chinese Orchestra: Resounding Winds"
[australia]: https://www.nma.gov.au/exhibitions/2023-australian-of-the-year/william-barton "National Museum of Australia: William Barton"
