# PRD – Persona Entity

## 1. Purpose

The **Persona** entity models the performing artist or band for a song.  It stores identity information, vocal characteristics, influences and default creative preferences.  Personas are reusable across songs, enabling consistent vocal profiles and stylistic biases.  Policy settings determine how names and influences are handled in public releases.

## 2. Schema (JSON v1.0)

```json
{
  "$id": "amcs://schemas/persona-1.0.json",
  "type": "object",
  "required": ["name", "kind"],
  "properties": {
    "name": {"type": "string"},
    "kind": {"type": "string", "enum": ["artist", "band"]},
    "bio": {"type": "string"},
    "voice": {"type": "string"},
    "vocal_range": {"type": "string"},
    "delivery": {"type": "array", "items": {"type": "string"}},
    "influences": {"type": "array", "items": {"type": "string"}},
    "style_defaults": {"$ref": "amcs://schemas/style-1.0.json"},
    "lyrics_defaults": {"$ref": "amcs://schemas/lyrics-1.0.json"},
    "policy": {
      "type": "object",
      "properties": {
        "public_release": {"type": "boolean", "default": false},
        "disallow_named_style_of": {"type": "boolean", "default": true}
      }
    }
  }
}
```

## 3. Field Descriptions

* **name** – Display name of the persona.  Required.
* **kind** – `artist` for solo performers or `band` for groups.  Influences presentation and pronoun usage.
* **bio** – Biographical text used in marketing or as a creative backstory.  Optional.
* **voice** – Free text describing the timbre or character (e.g., *airy soprano*, *gritty baritone*).
* **vocal_range** – Range classification (e.g., *soprano*, *mezzo‑soprano*, *baritone*).  Helps select pitch and key.
* **delivery** – List of delivery styles (e.g., *crooning*, *belting*, *rap*, *whispered*).  Supports multiple styles.
* **influences** – List of artists or genres influencing the persona.  When releasing publicly, references to living artists should be generic to avoid copyright issues.
* **style_defaults** – A reference to a default **Style** spec that biases new songs.  Optional.
* **lyrics_defaults** – A reference to a default **Lyrics** spec.  Optional.
* **policy.public_release** – Indicates if the persona may be used for publicly released songs.  If false, outputs remain private.
* **policy.disallow_named_style_of** – When true, prohibits explicit “style of [Living Artist]” references in prompts.  Forces the composer to convert such instructions into generic influences.

## 4. Validation Rules

* `name` must not be empty and should be unique within a user’s workspace.
* When `public_release = true`, the system automatically sanitises influences to remove specific living artist names.  It replaces them with generic descriptions (e.g., “influenced by Motown classic soul”).
* `delivery` accepts multiple values but warns if mutually exclusive (e.g., `whispered` and `belting`).

## 5. UI Controls & Hints

* Provide separate tabs for **Identity**, **Vocal**, **Influences** and **Defaults**.  Collapsed sections keep the form compact.
* Use a dropdown for `kind` (artist or band).  If `band` is selected, allow adding multiple names for group members.
* The `delivery` field uses multi‑select chips.  Tooltips describe each delivery style.
* For `influences`, use an autocomplete input.  When the user selects a known living artist, display a note explaining that direct “style of” prompts are discouraged for public releases.
* Provide a preview card on the right showing the persona name, voice description, influences and an avatar placeholder.  The preview updates live.

## 6. Example

```json
{
  "name": "North Pole Duo",
  "kind": "band",
  "bio": "A charming husband‑and‑wife team who perform festive songs with a modern twist.",
  "voice": "smooth male lead with playful female harmonies",
  "vocal_range": "baritone + mezzo-soprano",
  "delivery": ["crooning", "belting"],
  "influences": ["Bublé", "modern pop"],
  "style_defaults": {
    "genre_detail": {"primary": "Christmas Pop"},
    "tempo_bpm": 120,
    "key": {"primary": "C major"},
    "mood": ["upbeat", "warm"],
    "energy": "high",
    "instrumentation": ["sleigh bells", "brass", "upright bass"],
    "tags": ["Era:2000s", "Mix:vintage"]
  },
  "lyrics_defaults": {
    "section_order": ["Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus"],
    "rhyme_scheme": "AABB",
    "hook_strategy": "lyrical",
    "repetition_policy": "hook-heavy"
  },
  "policy": {
    "public_release": true,
    "disallow_named_style_of": true
  }
}
```

## 7. Acceptance Tests

1. **Unique Name** – Creating two personas with the same name in the same workspace triggers a uniqueness error.
2. **Public Policy Sanitisation** – For a public persona with `disallow_named_style_of = true`, entering influences like “Beyoncé” should automatically change the prompt composer’s output to “influenced by contemporary R&B divas” in the final prompt.
3. **Delivery Conflicts** – Selecting both `whispered` and `belting` triggers a warning that these delivery styles may conflict.

## 8. References

When constructing prompts, meta tags can specify vocal style (e.g., `[Female singer]`, `[Whispers]`, `[Harmonized chorus]`)【290562151583449†L313-L333】.  The persona’s voice and delivery preferences influence which tags should appear in the composed prompt.
