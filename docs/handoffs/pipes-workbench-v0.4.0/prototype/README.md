# Sonic Workshop local review prototype

Python 3.11+, macOS/Linux. No third-party runtime packages, Node, npm, build step or API keys required.

```bash
python3 serve.py --port 8786
# Open http://127.0.0.1:8786
```

The server creates `data/`. This is a local single-operator workspace, not public hosting. All provider actions are manual handoffs or draft exports. Diagnostic audio is original test synthesis, not music from a provider. See `../START_HERE.md` and `../IMPLEMENTATION_STATUS.md`.

```bash
python3 -m unittest discover -s tests -v
python3 tools/music.py state
python3 tools/music.py command --json ../examples/compile-request.json
```

For a custom data directory pass `--data-dir` before the CLI subcommand. MCP runs `python3 tools/mcp_stdio.py` with `MM_URL` and `MM_DATA_DIR`; the HTTP server must already be running. Do not launch a second server in the same data directory. No mutation retries are automatic.

“Export workspace” downloads metadata only. Full backup: stop the server and copy the complete data directory including assets. Do not distribute its `.session-token`. The delivered directory contains no real workspace or provider credentials.
