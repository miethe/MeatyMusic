# Product Requirements Document – Future Extensions

## 1. Purpose

This PRD outlines **future expansion features** for the Agentic Music Creation System (AMCS) beyond the MVP.  These enhancements are not required for the initial release but are planned to improve usability, functionality and integration with external services.  They should be considered independent modules that can be developed incrementally.

## 2. Feature Overview

### 2.1 Direct Music Engine Integration

**Goal:** Allow the web application to submit prompts directly to music rendering engines (e.g., Suno or similar) and receive audio outputs without requiring the user to copy and paste prompts.

* **API Connector:** Implement a connector service that encapsulates third‑party API calls.  The connector exposes `/render_jobs` endpoints to the app and manages authentication, rate limits, job polling and error handling.  It hides vendor‑specific details from the rest of the system.
* **Job Tracking:** Store render job requests in the database with statuses (`pending`, `running`, `completed`, `failed`).  Update the UI in real time via WebSockets.
* **Model Awareness:** Recognise supported models and their constraints (e.g., maximum prompt length, number of variations).  Provide UI warnings when prompts exceed those limits.
* **User Feedback:** On completion, display audio assets with controls for playback, download and deletion.  Show progress bars during rendering.
* **Fallback:** When direct rendering is disabled (feature flag), allow users to copy the composed prompt and paste it manually into the external service.

### 2.2 Analytics and Tracking

**Goal:** Provide insight into the performance of released songs across platforms (streams, likes, skip rates, completion rates).  Initially manual, later automated.

* **Manual Data Entry:** Allow users to enter metrics for each song: release date, platforms (Spotify, YouTube, etc.), URL links and basic stats (plays, likes, skip rate).
* **Automated Ingestion:** Integrate with platform APIs (Spotify for Artists, Apple Music for Artists) to fetch metrics periodically.  Use OAuth tokens stored securely.  Support scheduled pulls (e.g., daily) with incremental updates.
* **Dashboards:** Add analytics pages to the app.  Show trends over time, comparisons between songs and aggregated metrics per persona or genre.  Provide filter controls and export options (CSV).
* **Notifications:** Alert users when their songs reach certain milestones (e.g., 1 k plays) or when metrics cross thresholds (e.g., high skip rate).  Use real‑time notifications via WebSockets or email.

### 2.3 Direct Claude Code Invocation

**Goal:** Move the Claude Code orchestration closer to the front‑end so that users can generate outputs without leaving the app.

* **Hosted Skills:** Host Claude Code skills as callable APIs.  The app packages the entity specs into JSON and sends them to these endpoints.  The orchestrator remains server‑side but may be invoked via HTTP.
* **Client‑Side Runner:** For limited tasks (e.g., style or lyrics generation), embed lightweight runtime components in the browser using WebAssembly or serverless workers.  These would rely on safe, sandboxed LLM instances.
* **Security:** Use signed JWT tokens to authorise calls.  Throttle requests to avoid abuse.  Ensure data privacy by encrypting transmissions.
* **Observability:** Stream run events back to the client in near real‑time.  Provide local caching of partial results so users can continue editing while generation occurs.

### 2.4 Collaborative Editing

**Goal:** Enable multiple users to edit the same song specification or entity simultaneously.

* **Real‑Time Sync:** Implement CRDTs (Conflict‑free Replicated Data Types) or operational transforms for JSON documents.  Use WebSockets to propagate edits across clients instantly.
* **User Presence:** Show who else is viewing or editing a document.  Use avatars and cursors for context.
* **Commenting:** Allow inline comments on specific fields or sections.  Notifications alert when comments are added or resolved.
* **History & Versioning:** Maintain a changelog for each entity.  Users can revert to previous versions or see diffs between edits.  Provide commit messages when saving major changes.
* **Permissions:** Extend the RBAC system to manage who can view/edit/comment.  Use shareable invite links with role assignments (viewer, editor, admin).

### 2.5 Plugin Ecosystem

**Goal:** Allow external developers to add custom modules (new sources, evaluation functions, render engines) to the AMCS.

* **Plugin API:** Define a set of hooks (e.g., `beforeStyle`, `afterLyrics`, `customEval`) and a manifest format.  Plugins register capabilities and are isolated in sandboxes.
* **Security:** Run plugins in containers or serverless functions with limited permissions.  Use allow‑lists for external network access.
* **Discovery:** Provide a marketplace or listing page where users can browse, enable and configure plugins.  Include rating and review features.
* **Versioning:** Support semantic versioning and automatic updates.  Notify users when a plugin requires new permissions.

### 2.6 Advanced Features

* **Stem Export & DAW Integration:** Provide stems (individual instrument tracks) and project files for common DAWs (Ableton, FL Studio) so users can continue production offline.  A future music engine may support multi‑track output.  This requires a more detailed producer notes spec and advanced rendering capabilities.
* **AI Feedback & Coaching:** After generating a song, use AI to provide feedback (“the chorus could be catchier”, “add a modulation here”).  Suggest improvements based on analytics and user feedback loops.
* **Marketplace & Community Sharing:** Allow users to share styles, lyrics, personas or full songs.  Provide rating systems and leaderboards.  This introduces moderation requirements and terms of service updates.

## 3. Implementation Considerations

* Use **feature flags** to roll out each extension gradually.  Flags can be toggled via the settings panel or environment variables.
* Each new module should have its own PRD and be developed in an isolated branch.  These PRDs should define objectives, architecture, acceptance criteria and security considerations.
* Pay close attention to **platform terms of service** and legal compliance when integrating third‑party APIs or enabling content sharing.
* Design the database schema with extensibility in mind.  For example, use polymorphic tables or JSON fields to store plugin configurations.

## 4. References

* **Suno API Guidelines** – For direct rendering, abide by the latest API limits and usage conditions.  Keep prompts under two sentences and include BPM, mood and special elements【76184295849824†L412-L418】.
* **Meta Tag Categories** – Structural, voice, instrument and sound‑effect tags inform advanced composition and should be accommodated in future features【290562151583449†L313-L333】.
* **Iterative Refinement** – Use experimentation with tags, tempo and instrumentation to improve song output【76184295849824†L420-L429】.

