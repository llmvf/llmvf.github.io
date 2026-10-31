# V8 Fuzz Lab public site

Static GitHub Pages site at https://llmvf.github.io/. It summarizes the current `llmvf/v8-fuzz-lab` research and replaces the previous LLM variant fuzzing dashboard.

## Content baseline

- Lab revision: `0628093fd2c3e92939b00b1524a73876fb7c1a5f` (2026-10-31)
- Curated public metrics and case rows: `site-summary.json`
- Core sources: lab `README.md`, `architecture/workflow.md`, `architecture/integration.md`, `experiments/protocol.md`, and the named files in `experiments/results/`.
- Experiment totals are kept per campaign. A historical replay, generator smoke, target hit, or coverage observation must not be presented as a new vulnerability finding.
- The lab repository and raw artifacts may be private. This site publishes curated summaries only.

## Updating

Edit `site-summary.json`, `build_site.py`, `architecture_content.html`, and the CSS sources, then run `py -3 build_site.py`. Commit the generated HTML, CSS, JavaScript, sitemap, robots file, and images with the source changes. GitHub Pages serves the repository root without a build dependency.

The old `/llm_variant_fuzz_agent/` route redirects to the new results page for existing links.
