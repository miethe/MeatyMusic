# Delivery and dependency notes

The review prototype runtime uses Python's standard library and browser APIs. It includes no vendored fonts, JavaScript frameworks, provider SDKs or model weights. Python and the browser remain prerequisites. Optional developer checks use independently installed Playwright and jsonschema; those packages and browser binaries are not bundled.

Diagnostic WAVs were produced by the included `prototype/tools/make_fixtures.py`, not obtained from a music provider or recording library. They are test signals, not evidence of instrument or singer fidelity.

Historical prompt packs, design references and prior proposals were supplied in this conversation and retained for Nick's handoff. Provider and instrument names are descriptive references and do not imply endorsement. No license for the user's existing MeatyMusic, Voice Lab or aos-tts repositories is selected or changed by this delivery.
