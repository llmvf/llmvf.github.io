# llmvf.github.io

Public website for the LLMVF research organization.

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
