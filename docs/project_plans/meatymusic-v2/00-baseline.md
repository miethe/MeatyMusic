# MeatyMusic primary-checkout baseline (2026-10-09)

This inventory records the primary checkout without changing, stashing, resetting, or switching it. The active work is isolated in `MeatyMusic-wt-v2` on `feat/meatymusic-v2-standup`, based on the live `origin/development` branch.

Primary checkout: `/Users/miethe/dev/homelab/development/MeatyMusic`, branch `main`, `HEAD` `ed9a0f2`, ahead 1 / behind 4 relative to `origin/main`.

## Dirty paths

| Path | State | Classification |
|---|---|---|
| `.claude/.skillmeat-deployed.toml` | modified | keep |
| `.claude/settings.json` | modified | needs-Nick |
| `.claude/skills/notebooklm-skill/scripts/__init__.py` | modified | keep |
| `.claude/skills/notebooklm-skill/scripts/ask_question.py` | modified | keep |
| `.claude/skills/notebooklm-skill/scripts/auth_manager.py` | modified | keep |
| `.claude/skills/notebooklm-skill/scripts/browser_session.py` | modified | keep |
| `.claude/skills/notebooklm-skill/scripts/cleanup_manager.py` | modified | keep |
| `.claude/skills/notebooklm-skill/scripts/notebook_manager.py` | modified | keep |
| `.claude/skills/notebooklm-skill/scripts/run.py` | modified | keep |
| `.claude/skills/notebooklm-skill/scripts/setup_environment.py` | modified | keep |
| `.claude/skills/skill-creator/scripts/__pycache__/quick_validate.cpython-312.pyc` | deleted | likely-generated |
| `.claude/skills/symbols/scripts/__pycache__/config.cpython-312.pyc` | deleted | likely-generated |
| `.claude/skills/symbols/scripts/__pycache__/extract_symbols_python.cpython-312.pyc` | deleted | likely-generated |
| `.claude/skills/symbols/scripts/__pycache__/merge_symbols.cpython-312.pyc` | deleted | likely-generated |
| `.claude/skills/symbols/scripts/__pycache__/symbol_tools.cpython-312.pyc` | deleted | likely-generated |
| `.claude/skills/symbols/scripts/__pycache__/test_init_symbols.cpython-312-pytest-8.4.1.pyc` | deleted | likely-generated |
| `.claude/skills/symbols/scripts/__pycache__/test_update_claude_md.cpython-312-pytest-8.4.1.pyc` | deleted | likely-generated |
| `.claude/skills/symbols/scripts/__pycache__/update_claude_md.cpython-312.pyc` | deleted | likely-generated |
| `.claude/worknotes/bug-fixes-2025-11.md` | modified | keep |
| `.claude/worktrees/` | untracked | likely-generated |

Classification means preserve as-is; `needs-Nick` marks personal settings requiring Nick's review before any future reconciliation; `likely-generated` identifies caches or worktree metadata without authorizing deletion.

## Local-only commit

- `ed9a0f2 chore(aos): declare artifacts manifest for fleet visibility`

## Commits present on origin/main but absent locally

- `a26d3dc chore(integration): development → main, 2026-10-04 (#34)`
- `1430327 chore(integration): development → main, 2026-10-03 (#33)`
- `9e18ac5 chore(integration): development → main, 2026-10-02 (#31)`
- `4e08dad fix(ci): add development to pull_request/push branch filters (#27)`

There are 20 porcelain entries in the primary checkout. No item in this inventory was modified by this task.
