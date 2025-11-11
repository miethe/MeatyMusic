# PRD – Prompt Composition Entity

## 1. Purpose

The **Prompt** entity represents the final text sent to the music engine (e.g., Suno) to render a song.  It merges the style specification, lyrics (with meta tags) and producer notes into a single structured prompt.  It also records meta information such as style and prompt character limits and per‑section tags.  The prompt contract ensures that the composer and the renderer adhere to engine‑specific constraints.

## 2. Schema (JSON v0.2)

```json
{
  "$id": "amcs://schemas/composed-prompt-0.2.json",
  "type": "object",
  "required": ["text", "meta"],
  "properties": {
    "text": {"type": "string"},
    "meta": {
      "type": "object",
      "properties": {
        "title": {"type": "string"},
        "genre": {"type": "string"},
        "tempo_bpm": {
          "oneOf": [
            {"type": "integer"},
            {"type": "array", "items": {"type": "integer"}, "minItems": 2, "maxItems": 2}
          ]
        },
        "structure": {"type": "string"},
        "style_tags": {"type": "array", "items": {"type": "string"}},
        "negative_tags": {"type": "array", "items": {"type": "string"}},
        "section_tags": {
          "type": "object",
          "additionalProperties": {"type": "array", "items": {"type": "string"}}
        },
        "model_limits": {
          "type": "object",
          "properties": {
            "style_max": {"type": "integer"},
            "prompt_max": {"type": "integer"}
          }
        }
      }
    }
  }
}
```

## 3. Field Descriptions

* **text** – The full prompt string that will be sent to a music engine.  It includes the title, style description, structure hints, lyrics with meta tags and production notes.  The composer ensures that it stays within engine character limits.
* **meta.title** – Song title.  Optional but recommended.
* **meta.genre** – Genre from the style spec.
* **meta.tempo_bpm** – BPM or BPM range.  Copied from the style spec.
* **meta.structure** – Arrangement string (e.g., `Intro–Verse–Pre‑Chorus–Chorus–Bridge–Chorus`).
* **meta.style_tags** – Ordered list of tags (one or two per category) used in the `style` field of the prompt.  Categories may include Era, Genre, Energy, Instrumentation, Rhythm, Mix, Vocal and Section cues.
* **meta.negative_tags** – Tags that instruct the engine to avoid certain qualities (e.g., *overcompressed*, *muddy low‑end*).
* **meta.section_tags** – A dictionary mapping each section (e.g., `Chorus`) to tags that shape its mood and energy.
* **meta.model_limits.style_max** – Maximum characters allowed in the style or tags part of the prompt.  Engine‑specific (e.g., 1000 for Suno v5).
* **meta.model_limits.prompt_max** – Maximum characters for the full prompt.  Engine‑specific (e.g., 5000 for Suno v5).

## 4. Prompt Composition Process

The composer constructs the prompt as follows:

1. **Title & Metadata** – Start with `Title: {title}`, `Genre/Style: {genre} | BPM: {tempo_bpm} | Mood: {primary mood(s)}`.
2. **Style Description** – Append a comma‑separated list of `style_tags` in order: era → genre/sub‑genre/fusion → energy → instrumentation → rhythm → vocal → mix.  Only the most important tag from each category is included to avoid conflicts.
3. **Structure & Voice** – Mention the structure string and the intended vocal profile (from persona or style).  For example: `Structure: Intro-Verse-Pre‑Chorus-Chorus… | Vocal: Female and male duet`.
4. **Lyrics with Meta Tags** – Include the lyrics text and prefix each section with its meta tags.  Example: `[Intro: Soft piano and atmospheric synths] …`【290562151583449†L313-L345】.
5. **Production Notes** – Summarise instrumentation hints, mix preferences and hook count.  Example: `- Arrangement: sleigh bells, upright bass, brass stabs; handclaps in pre‑chorus`.
6. **Constraints & Policy** – Indicate whether explicit content is allowed and the language.  Example: `Clean = TRUE; Language = en`.
7. **Check Limits** – Verify that the `style_tags` string length ≤ `style_max` and the entire prompt length ≤ `prompt_max`.  Trim or simplify tags if necessary.

## 5. Validation Rules

* The composer must enforce model character limits.  Exceeding limits triggers an error and prompts the user to remove tags or shorten descriptions.
* `section_tags` keys must match sections present in the `structure` and the lyrics.
* A conflict matrix prevents contradictory tags (e.g., `very slow` vs. `high energy`).  The composer resolves conflicts by dropping lower priority tags.
* Avoid naming living artists explicitly in public prompts; the persona policy `disallow_named_style_of` instructs the composer to convert such references into generic influences.

## 6. UI Controls & Hints

* Present a read‑only preview of the composed prompt.  Provide a copy button to copy to clipboard.
* Display character counters for the style and prompt parts.  If the limit is exceeded, highlight the overflow portion and suggest removing less important tags.
* Use an accordion to show advanced details such as `negative_tags` and per‑section tags.  Hide these for novice users.
* When exporting the prompt, also include a JSON file containing the `meta` object for reproducibility.

## 7. Example

```json
{
  "text": "Title: Elf On Overtime\nGenre/Style: Christmas Pop | BPM: 120 | Mood: upbeat, cheeky\nInfluences: big band, modern pop, electro swing\nStructure: Intro–Verse–Pre‑Chorus–Chorus–Verse–Pre‑Chorus–Chorus–Bridge–Chorus\nVocal: male/female duet, crooner + bright pop\nHooks: 2\n\nLyrics:\n[Intro: Soft piano and sleigh bells]\n…\n[Chorus: Uplifting orchestral arrangement with handclaps]\n…\n\nProduction Notes:\n- Arrangement: sleigh bells, upright bass, brass stabs\n- Mix: lush, wide stereo\n- Clean = TRUE; Language = en",
  "meta": {
    "title": "Elf On Overtime",
    "genre": "Christmas Pop",
    "tempo_bpm": 120,
    "structure": "Intro–Verse–Pre‑Chorus–Chorus–Verse–Pre‑Chorus–Chorus–Bridge–Chorus",
    "style_tags": ["Era:2010s", "Genre:Christmas Pop", "Energy:anthemic", "Instr:brass", "Rhythm:four-on-the-floor", "Vocal:duet", "Mix:modern-bright"],
    "negative_tags": ["muddy low-end"],
    "section_tags": {
      "Intro": ["instrumental", "low energy"],
      "Chorus": ["anthemic", "hook-forward"]
    },
    "model_limits": {"style_max": 1000, "prompt_max": 5000}
  }
}
```

## 8. Acceptance Tests

1. **Character Limits** – Compose a prompt that exceeds the `prompt_max` limit.  The composer truncates or simplifies tags to fit.  Attempting to submit the oversized prompt triggers a validation error.
2. **Tag Conflicts** – Include `very slow` and `high energy` tags; the composer should remove one to resolve the conflict.
3. **Section Tag Alignment** – Add tags for a section not present in the structure; the composer logs a warning and ignores the extra entry.
4. **Public Policy** – When persona policy prohibits naming living artists, a prompt referencing “Drake” is transformed to “influenced by contemporary hip‑hop”.

## 9. References

Meta tags can be used to define song sections, vocal types, instruments and sound effects【290562151583449†L313-L333】.  When composing prompts, keep them under two sentences but detailed, mention BPM and mood and add special elements like reverb or vinyl crackle【76184295849824†L412-L418】.
