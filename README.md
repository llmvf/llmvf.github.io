# llmvf.github.io

Public website for the LLMVF research organization.

## Live website

**https://llmvf.github.io/**

- [Home](https://llmvf.github.io/)
- [성과 요약](https://llmvf.github.io/performance.html)
- [Report](https://llmvf.github.io/reports.html)

The site is intentionally dependency-free: edit the HTML, CSS, or JavaScript and
push to `main`. GitHub Pages publishes the result from the repository root.

Public experiment summaries are read from `data/metrics.json` and report links
from `data/reports.json`. Keep raw or sensitive experiment output in the private
research repository and publish only reviewed summary data here.

## Local preview

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.
