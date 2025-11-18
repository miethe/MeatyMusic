# Sources - JSON Specification

## Overview

The **Sources** entity registers external knowledge bases and documents that can be referenced during lyric generation and style creation. Sources support fine-grained scoping, weighting, and filtering to control how much each contributes to the final outputs. Each source is accessed through an MCP server that provides retrieval functions (`search` and `get_context`) and maintains citations with provenance metadata for deterministic regeneration.

## Schema

### Field: `name`
- **Type**: `string`
- **Description**: Human-readable identifier for the source (e.g., "Family Document", "Game of Thrones API").
- **Required**: Yes
- **Constraints**: Must be unique within the workspace.

### Field: `kind`
- **Type**: `string` (enum)
- **Description**: Type of source defining how it is accessed: `file` (uploaded document or audio), `web` (accessed via HTTP/REST), or `api` (custom machine-callable service).
- **Required**: Yes
- **Constraints**: Must be one of: `"file"`, `"web"`, `"api"`

### Field: `config`
- **Type**: `object`
- **Description**: Source-specific configuration object. Contents vary by kind (e.g., file path for file sources, base URL and auth tokens for API sources, endpoint and rate limits for web sources).
- **Required**: No
- **Constraints**: Structure depends on the source `kind`.

### Field: `scopes`
- **Type**: `array<string>`
- **Description**: List of categories or topics available in this source (e.g., "characters", "family_history", "location_lore"). Enables fine-grained selection during lyric generation.
- **Required**: No
- **Constraints**: Scopes must be valid for the associated MCP server. Verify via `describe_scopes` server call.

### Field: `weight`
- **Type**: `number`
- **Description**: Relative contribution weight of this source during retrieval, normalized across all sources in a lyrics spec so weights sum to 1.
- **Required**: No
- **Constraints**: Must be between 0 and 1 (inclusive). Default: `0.5`

### Field: `allow`
- **Type**: `array<string>`
- **Description**: Explicit allow list of terms or patterns permitted from the source. Use when source contains a mix of relevant and irrelevant information.
- **Required**: No
- **Constraints**: Terms cannot overlap with `deny` list. Overlapping terms are removed from `allow` and a warning is displayed.

### Field: `deny`
- **Type**: `array<string>`
- **Description**: Explicit deny list of terms or patterns to exclude from retrieval (e.g., profanity, spoilers). Overrides allow list for matching terms.
- **Required**: No
- **Constraints**: Takes precedence over `allow` list. Any term in `deny` is excluded even if in `allow`.

### Field: `provenance`
- **Type**: `boolean`
- **Description**: If `true`, retrieval functions return text snippets alongside metadata (document ID, page number, hash) for citation support and deterministic regeneration.
- **Required**: No
- **Constraints**: Default: `true`

### Field: `mcp_server_id`
- **Type**: `string`
- **Description**: Identifier of the MCP server that hosts retrieval functions (`search` and `get_context`) for this source.
- **Required**: Yes
- **Constraints**: Must reference a valid MCP server in the workspace.

## Example

```json
{
  "name": "Family History Document",
  "kind": "file",
  "config": {
    "file_path": "/documents/family_story.md"
  },
  "scopes": ["family", "memories", "traditions"],
  "weight": 0.6,
  "allow": ["grandmother", "thanksgiving", "holiday"],
  "deny": ["divorce", "scandal"],
  "provenance": true,
  "mcp_server_id": "family-docs-server"
}
```

### Multi-Source Example (Weighted Distribution)

```json
[
  {
    "name": "Game of Thrones Lore",
    "kind": "api",
    "config": {
      "base_url": "https://api.gameofthrones.example.com",
      "endpoints": ["characters", "locations", "houses"],
      "rate_limit": 100,
      "auth_token": "${GOTAPI_TOKEN}"
    },
    "scopes": ["characters", "locations", "battles", "politics"],
    "weight": 0.7,
    "allow": ["Stark", "Targaryen", "throne"],
    "deny": ["spoilers", "unconfirmed_theories"],
    "provenance": true,
    "mcp_server_id": "gotlore-server"
  },
  {
    "name": "Original Song Samples",
    "kind": "web",
    "config": {
      "base_url": "https://music-samples.example.com",
      "search_endpoint": "/v1/search",
      "context_endpoint": "/v1/context"
    },
    "scopes": ["lyrics", "melodies", "arrangements"],
    "weight": 0.3,
    "allow": ["chorus", "hook", "bridge"],
    "deny": ["explicit", "copyright_protected"],
    "provenance": true,
    "mcp_server_id": "music-samples-server"
  }
]
```

**Note:** In the multi-source example above, the weights sum to 1.0 (0.7 + 0.3). When multiple sources are cited in a single lyrics spec, the system normalizes individual source weights proportionally to maintain this invariant.
