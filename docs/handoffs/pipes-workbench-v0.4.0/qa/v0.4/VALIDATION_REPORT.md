# Workbench v0.4 validation

- 81/81 prototype domain/HTTP/CLI/MCP tests passed.
- 5/5 inherited Pipes core tests passed in this execution environment.
- 28 tool schemas exported from actual MCP tools/list.
- JSON Schema passed structural validation on seeded state after preparation and render.
- Python source compiled; both main JS modules passed node --check.
- Original full WAV checksum matched exactly; no source rewrite.
- Raw MIDI: 434 events; parser cross-check is file interpretation, not musical verification.
- The selected high return's context packet includes its complete phrase and earlier statement.
- Authored 14-note sketch produced bounded MIDI and a 36.25-second diagnostic sine WAV.
- Unverified actual Rowan melody correctly blocked exact rendering.
- Browser review: 7 flow checks, no page errors, no document overflow at 390px.

## Limits

Browser navigation to loopback was blocked by environment policy. Review used actual UI scripts/styles in about:blank with a test-only authenticated Python bridge to the actual local HTTP service; original playback was exposed as a Blob. Native HTTP/session/media range and MCP read/write were tested separately. Native browser startup should be tested after local unpacking. Real DAW/notation/model connections, production deployment and perceptual audio audition were not performed. The optional standalone Pipes SDK handshake remains untested.

The browser test helper needs development-only Playwright and a Chromium binary; the app itself does not. The no-dependency app tests use the standard library. JSON Schema and PrettyMIDI were validation tools in this environment, not app runtime dependencies.
