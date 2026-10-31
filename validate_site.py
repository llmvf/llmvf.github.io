"""Check static output, curated data, and local navigation before publishing."""

import json
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).parent
PAGES = (
    "index.html",
    "architecture.html",
    "performance.html",
    "reports.html",
    "portfolio.html",
    "research-verdict.html",
)
DATA = json.loads((ROOT / "site-summary.json").read_text(encoding="utf-8"))


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.targets = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        key = "href" if tag in ("a", "link") else "src" if tag == "script" else None
        if key and attributes.get(key):
            self.targets.append(attributes[key])


for name in PAGES:
    content = (ROOT / name).read_text(encoding="utf-8")
    parser = Links()
    parser.feed(content)
    assert '<html lang="ko">' in content, name
    assert content.count('aria-current="page"') == 1, name
    canonical = "https://llmvf.github.io/" + ("" if name == "index.html" else name)
    assert f'<link rel="canonical" href="{canonical}">' in content, name
    assert f'<meta property="og:url" content="{canonical}">' in content, name
    for target in parser.targets:
        if target.startswith(("http:", "https:", "#", "mailto:")):
            continue
        assert (ROOT / target.split("#")[0]).exists(), (name, target)
    assert "llm_variant_fuzz_agent/" not in content, name
    print(name, "OK", len(parser.targets), "links")

performance = (ROOT / "performance.html").read_text(encoding="utf-8")
for marker in ("EXTERNAL HOLDOUT / FINAL", "9/9", "CVE-2021-38003", "CVE-2021-21225", "CVE-2022-1134"):
    assert marker in performance, marker
assert "CVE-2024-0519" in (ROOT / "reports.html").read_text(encoding="utf-8")
assert "포트폴리오 최종 보고서 v2" in (ROOT / "reports.html").read_text(encoding="utf-8")
reports = (ROOT / "reports.html").read_text(encoding="utf-8")
for case in DATA["cve_cases"]:
    assert case["id"] in reports, case["id"]
assert str(DATA["metrics"]["cve_cases"]) in reports
assert "portfolio.html" in reports and "research-verdict.html" in reports
architecture = (ROOT / "architecture.html").read_text(encoding="utf-8")
for anchor in ("system-map", "lineage", "control-loop", "validation"):
    assert f'id="{anchor}"' in architecture
    assert f'href="#{anchor}"' in architecture
assert "Experiment Manager" in architecture and "B3" in architecture
assert "performance.html" in (ROOT / "llm_variant_fuzz_agent/index.html").read_text(encoding="utf-8")
assert not (ROOT / "llm_variant_fuzz_agent/data/results.json").exists()
assert not (ROOT / "data/metrics.json").exists()
assert (ROOT / "social-card.svg").exists()
assert (ROOT / "sitemap.xml").exists()
assert (ROOT / "robots.txt").exists()
assert "sitemap.xml" in (ROOT / "robots.txt").read_text(encoding="utf-8")
print("site checks passed")
