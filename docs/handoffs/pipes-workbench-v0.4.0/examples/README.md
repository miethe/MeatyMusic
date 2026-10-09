# Examples

All example data is synthetic or original editorial content. No provider voice, generation or live estate record is implied. `voice-lab-demo-promotion.json` is explicitly diagnostic metadata.

Read-only request examples run on a fresh workspace. For mutation examples, retrieve the current sequence first and replace `expected_sequence`; never silently replay a stale edit with a newly guessed revision. Keep an idempotency key stable only when retrying the exact same request.

The MCP configuration is a template: replace both absolute paths, start the loopback server first, and reload the MCP client. Its local token comes from the workspace, not a provider account. Do not put provider keys into the template.

Suno compiled fields and handoff snapshots are examples of **preparation**, not submission. The Eleven plan has placeholder timings and is not ready for live vocal submission. Production SDS/capability/event examples are target-contract illustrations.
