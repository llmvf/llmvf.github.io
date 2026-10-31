# V8 Fuzz Lab public site

Static GitHub Pages site at https://llmvf.github.io/. It summarizes the current `llmvf/v8-fuzz-lab` research and replaces the previous LLM variant fuzzing dashboard.

## Content baseline

- Lab revision: `87a31f2eaa109fb6b0fa797a394f3d35fe9dd2d9` (2026-10-31)
- Public metrics and case rows: `site-summary.json` (revision, normalized smoke metrics, per-repetition B0/B1/B2 arm results, comparison values, tokens, and timeline are refreshed by `sync_from_lab.py`)
- Core sources: lab `README.md`, `architecture/workflow.md`, `architecture/integration.md`, `experiments/protocol.md`, and the named files in `experiments/results/`.
- Experiment totals are kept per campaign. A historical replay, generator smoke, target hit, or coverage observation must not be presented as a new vulnerability finding.
- The lab repository and raw artifacts may be private. This site publishes curated summaries only.

## Updating

Update editorial case labels when a new CVE appears, then run `py -3 sync_from_lab.py --lab-root <path-to-v8-fuzz-lab>`, `py -3 build_site.py`, and `py -3 validate_site.py --lab-root <path-to-v8-fuzz-lab>`. The sync step discovers completed non-aborted `CVE-*-b012-*.md` reports, extracts every repetition's B0/B1/B2 target, execution, interesting, corpus, coverage, crash, and timeout values, and normalizes the latest strategy smoke record. Validation fails on stale revisions, missing CVEs, or mismatched report and arm values. Commit the generated HTML, CSS, JavaScript, sitemap, robots file, and images with the source changes. GitHub Pages serves the repository root without a build dependency.

The old `/llm_variant_fuzz_agent/` route redirects to the new results page for existing links.
