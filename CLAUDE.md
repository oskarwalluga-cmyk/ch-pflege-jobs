# CLAUDE.md

Guidance for AI assistants (Claude Code and others) working in this repository.

## Project overview

**ch-pflege-jobs** is a small Python tool that automatically collects open
nursing positions for **Dipl. Pflegefachmann/-frau (registered nurse) in
Switzerland**. It queries several job sources, merges and de-duplicates the
results, and writes them to Excel/CSV/JSON plus a self-contained, clickable
HTML dashboard.

It serves a double purpose: a real personal job-search tool **and** a
showable GitHub portfolio project (API integration, data pipeline,
deduplication, reporting). See `project_goal.md`.

**Language note:** Source comments, docstrings, console output, and all the
project-memory `.md` files are written in **German** (often without umlauts,
e.g. "oeffentlich"). Match this style when editing existing code/docs. This
`CLAUDE.md` is the exception — it is in English for AI tooling.

## Architecture

A simple, linear data pipeline. `run.py` orchestrates everything:

1. **`sources/jobroom.py`** — queries job-room.ch, the official Swiss federal
   job portal (SECO / Arbeit.swiss). This is the **primary source**: legal,
   free, no login. Many nursing jobs are subject to the Swiss reporting
   obligation (Stellenmeldepflicht) and appear here first (5 days exclusively).
   Uses the website's public search endpoint
   `POST https://www.job-room.ch/jobadservice/api/jobAdvertisements/_search`
   (paginated via the `X-Total-Count` response header).
2. **`sources/jobspy_source.py`** — uses the optional `python-jobspy` library
   to additionally scrape Indeed.ch / LinkedIn / Google Jobs. Decoupled via
   `try/except` import, so the tool still runs if JobSpy is not installed.
3. **Merge + dedupe** (`run.py:dedupe`) — key is `(title, company)`,
   lowercased and stripped.
4. **Export** — `output/jobs.xlsx`, `jobs.csv`, `jobs.json` via pandas.
5. **`dashboard.py`** — builds `output/dashboard.html` with the job data
   **embedded directly** into the HTML (not fetched), so it works by simple
   double-click without a local server (avoids `file://` CORS blocking).

### Unified data schema

Every source must return a list of dicts with exactly these keys (consumed by
`run.py` and `dashboard.py`):

```
source, title, company, location, canton, workload, date_posted, url,
apply_contact, reporting_obligation, description
```

When adding a source, conform to this schema. Fields with no value should be
`""` (or `False` for `reporting_obligation`), never missing.

## Repository layout

| Path | Purpose |
|------|---------|
| `run.py` | Entry point + `CONFIG` block + merge/dedupe/export orchestration |
| `dashboard.py` | Generates the standalone HTML dashboard |
| `sources/jobroom.py` | job-room.ch client (primary source) |
| `sources/jobspy_source.py` | JobSpy client (optional secondary source) |
| `sources/__init__.py` | Makes `sources` a package (empty) |
| `requirements.txt` | Dependencies (core + optional JobSpy) |
| `run_daily.bat` | Windows scheduled-task wrapper (absolute paths) |
| `output/` | Generated data — **git-ignored**, regenerated each run |
| `README.md` | End-user docs (German) |
| `*.md` (memory files) | Project memory — see below |

### Project-memory files (German)

`project_goal.md`, `architecture.md`, `decision_log.md`, `task_board.md`,
`runbook.md`, `risks_and_constraints.md`, `learnings.md` preserve goal, design,
and decisions across sessions. **Keep them in sync** when you make meaningful
changes:
- `decision_log.md` — record significant design decisions (with date).
- `learnings.md` — capture non-obvious technical findings.
- `task_board.md` — move items between "Erledigt" (done) and "Offen" (open).
- `architecture.md` — update if the pipeline or job-room API shape changes.

## Configuration

All user-facing settings live in the `CONFIG` dict at the top of `run.py`:
`keywords`, `cantons` (empty = all of Switzerland), `jobroom_online_since_days`,
`jobroom_max_results`, `use_jobspy`, and the `jobspy_*` parameters. There is no
external config file or environment variable — editing `run.py` is the
intended way to change the search.

## Development workflow

This is a tiny, dependency-light project with **no test suite, linter, or CI**.

### Setup & run

```bash
pip install -r requirements.txt   # Python >= 3.10
python run.py                     # writes to output/, then open output/dashboard.html
```

### Smoke-testing individual sources

Both source modules are runnable directly for a quick check:

```bash
python -m sources.jobroom         # prints first 5 job-room hits
```

`jobroom.py` has an `if __name__ == "__main__"` block that fetches 5 results.
Network access to job-room.ch is required; JobSpy additionally needs the
`python-jobspy` package and reachable target portals.

### When changing job-room request fields

The valid search-body fields are documented in `architecture.md`
(`professionCodes`, `keywords`, `cantonCodes`, `onlineSince`, etc.). If
job-room returns HTTP 400, the API likely changed — verify field names against
that file. Trick (from `learnings.md`): send a request with an invalid field;
the error response often lists all valid fields.

## Key conventions

- **Schema first.** Any new/changed source must emit the unified schema above.
- **Sources are decoupled and fail soft.** A source that errors or is missing
  should print a short note and return `[]` — never crash the whole run. Follow
  the existing `try/except` pattern.
- **Be polite to servers.** Keep small page sizes, `time.sleep` between
  paginated requests, and conservative `results_wanted` / `hours_old`. This is
  a personal-use tool; do not turn it into an aggressive scraper.
- **Dashboard stays serverless.** Keep job data embedded in the HTML (the
  `__DATA__` placeholder in `dashboard.py`); do not switch to runtime `fetch()`
  of a local file.
- **No secrets, no external services.** Everything runs locally; output stays
  in the git-ignored `output/` folder. Do not add accounts, API keys, or
  cloud dependencies.
- **German for code/docs**, no umlauts in source, to match existing style.

## Git workflow

- Default branch: `main`. Active development branch for this work:
  `claude/claude-md-docs-cht9dk`.
- Do **not** commit the `output/` directory (already git-ignored).
- After pushing, open a **draft** pull request.

## Risks & constraints (see `risks_and_constraints.md`)

- job-room uses an internal website endpoint, not an officially documented
  public API; it can change without notice.
- JobSpy depends on third-party portals; LinkedIn rate-limits aggressively.
- No guarantee of completeness. Intended for personal job search only.
