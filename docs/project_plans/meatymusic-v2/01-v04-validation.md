# MeatyMusic Pipes Workbench v0.4.0 validation (2026-10-09)

## Import and checksums

- Imported 148 files from the v0.4.0 handoff, excluding `.DS_Store`.
- `CHECKSUMS.sha256`: 147 copied entries passed; 1 entry was intentionally excluded because it is larger than 5 MiB and its source hash was independently verified; 0 checksum mismatches.
- The excluded file and source hash are listed in `docs/handoffs/pipes-workbench-v0.4.0/LARGE_FILES.md`.

## Prototype tests and build

Ran from a writable temporary copy at `/private/tmp/meatymusic-v04.JYyvOH/handoff`, with the full study WAV copied into the temporary tree (the repository copy deliberately excludes it):

```text
cd prototype
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -v
Ran 81 tests in 1.794s
OK
```

Prototype source compilation also passed:

```text
python3 -m compileall -q prototype/app prototype/tools pipes/src
exit 0
```

## Standalone Pipes SDK tests

The optional standalone SDK suite was run with its declared dependencies installed only under `/private/tmp/meatymusic-v04.JYyvOH/deps`:

```text
cd pipes
PYTHONPATH="src:/private/tmp/meatymusic-v04.JYyvOH/deps" PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -v
Ran 5 tests in 21.872s
OK
```

The first attempt without `PYTHONPATH=src` could not import `pipes_mcp`; a second attempt with the package path but no SDK dependencies had 3 tests pass and 2 fail on missing `librosa` and `pretty_midi`. With the declared dependencies isolated in the temporary directory, all five passed. No project files or global Python packages were modified by validation.

## Scope limits

This validates automated tests and Python compilation. No browser session, provider submission, DAW integration, or production server was started. The handoff remains a behavior reference; its JSON store and review server are not MeatyMusic production infrastructure.
