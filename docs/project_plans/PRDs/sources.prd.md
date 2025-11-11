# PRD – Source Entity

## 1. Purpose

The **Source** entity registers external knowledge bases or documents that can be referenced during lyric generation and style creation.  Each source may be a file, a web API or a custom MCP server.  Sources support scoping and weighting to control how much each contributes to the final lyrics.

## 2. Schema (JSON v1.0)

```json
{
  "$id": "amcs://schemas/source-1.0.json",
  "type": "object",
  "required": ["name", "kind", "mcp_server_id"],
  "properties": {
    "name": {"type": "string"},
    "kind": {"type": "string", "enum": ["file", "web", "api"]},
    "config": {"type": "object"},
    "scopes": {"type": "array", "items": {"type": "string"}},
    "weight": {"type": "number", "minimum": 0, "maximum": 1, "default": 0.5},
    "allow": {"type": "array", "items": {"type": "string"}},
    "deny": {"type": "array", "items": {"type": "string"}},
    "provenance": {"type": "boolean", "default": true},
    "mcp_server_id": {"type": "string"}
  }
}
```

## 3. Field Descriptions

* **name** – Human‑readable identifier for the source (e.g., *Family Document*, *Game of Thrones API*).
* **kind** – Type of source: `file` (uploaded document or audio), `web` (accessed via HTTP/REST) or `api` (custom machine‑callable service).  
* **config** – Source‑specific configuration; for example, an API might specify base URL, authentication tokens, endpoints and rate limits.
* **scopes** – List of categories or topics available in this source.  Examples: `characters`, `family_history`, `location_lore`.  Scopes allow fine‑grained selection when generating lyrics.
* **weight** – Number between 0 and 1 representing the relative contribution of this source during retrieval.  Multiple sources in a lyrics spec are normalised so weights sum to 1.
* **allow** – Terms or patterns explicitly allowed from the source.  Use when the source contains a mix of relevant and irrelevant information; allowed terms restrict retrieval to the allowed subset.
* **deny** – Terms or patterns that must be excluded (e.g., profanity, spoilers).  Deny lists override allow lists.
* **provenance** – If `true`, retrieval functions return text snippets alongside metadata such as document ID, page number and hash to support citation and deterministic regeneration.
* **mcp_server_id** – Identifier of the MCP server that hosts the retrieval functions for this source.  The server implements the tools `search` and `get_context`.

## 4. Validation Rules

* `name` must be unique within the workspace.
* `allow` and `deny` lists cannot contain overlapping terms.  If they do, the overlapping terms are removed from the allow list.
* `weight` values are normalised across all citations in a lyrics spec.  An individual source may have a default weight, but the final weights are scaled so they sum to one.
* `scopes` must be valid for the associated MCP server.  The UI should call `describe_scopes` on the server to populate this list.

## 5. UI Controls & Hints

* Present sources in a card list with icons representing `file`, `web` or `api`.  Each card links to a detail page with editable fields.
* Include toggle controls to enable or disable a source.  Disabled sources are ignored during retrieval.
* Provide a multi‑select for `scopes`.  Use checkboxes or chips.  When a user selects a scope, the app calls the MCP server to verify support.
* Show a weight slider (0–1) next to each source citation in the lyrics editor.  Display the normalised weight distribution to help users balance contributions.
* Provide text areas for `allow` and `deny`.  Use token chips to represent patterns; warnings appear when a term appears in both lists.

## 6. Example

```json
{
  "name": "Family History Document",
  "kind": "file",
  "config": {"file_path": "/documents/family_story.md"},
  "scopes": ["family", "memories"],
  "weight": 0.6,
  "allow": ["grandmother", "thanksgiving"],
  "deny": ["divorce"],
  "provenance": true,
  "mcp_server_id": "family-docs-server"
}
```

## 7. Acceptance Tests

1. **Unique Name** – Attempting to create two sources with the same name triggers a uniqueness error.
2. **Weight Normalisation** – In a lyrics spec citing two sources with weights 0.6 and 0.4, the UI shows a 60/40 distribution.  Changing one weight automatically adjusts the other to keep the sum at 1.0.
3. **Allow vs. Deny** – Adding a term to the `deny` list that already exists in `allow` removes it from the `allow` list and displays a warning.

## 8. References

Meta tags allow specifying sound effects, audience reactions and special instruments, which can be retrieved from external sources【290562151583449†L313-L333】.  When designing sources, ensure that only relevant content is included and weight assignments reflect their importance during lyric generation.
