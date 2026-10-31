"""Check static output, curated data, and optional lab-source parity."""

import argparse
import json
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).parent
PARSER = argparse.ArgumentParser()
PARSER.add_argument("--lab-root", type=Path, help="optional local v8-fuzz-lab checkout")
ARGS = PARSER.parse_args()
PAGES = (
    "index.html",
    "architecture.html",
    "performance.html",
    "reports.html",
    "portfolio.html",
    "research-verdict.html",
)
DATA = json.loads((ROOT / "site-summary.json").read_text(encoding="utf-8"))
assert DATA["metrics"]["cve_cases"] == len(DATA["cve_cases"])
assert DATA["metrics"]["completed_paired_campaigns"] == len(DATA["comparison_campaigns"])
assert DATA["metrics"]["completed_paired_repetitions"] == sum(
    len(item["deltas"]) for item in DATA["comparison_campaigns"]
)
assert sum(1 for item in DATA["cve_cases"] if item["stage"] == "migrated") == 10

if ARGS.lab_root:
    lab_root = ARGS.lab_root.resolve()
    revision = subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=lab_root, text=True
    ).strip()
    assert revision == DATA["lab_revision"], (revision, DATA["lab_revision"])
    index_text = (lab_root / "cve" / "index.md").read_text(encoding="utf-8")
    source_ids = set(re.findall(r"\| (CVE-\d{4}-\d+) \|", index_text))
    public_ids = {item["id"] for item in DATA["cve_cases"]}
    assert source_ids == public_ids, (sorted(source_ids - public_ids), sorted(public_ids - source_ids))
    for campaign in DATA["comparison_campaigns"]:
        report_text = (
            lab_root / "experiments" / "results" / f"{campaign['report']}.md"
        ).read_text(encoding="utf-8")
        match = re.search(
            r"B2[-−]B1 목표 도달\s*차이\s*:\s*`\[([^]]+)\]`",
            report_text,
        )
        assert match, campaign["report"]
        source_deltas = [int(value.strip()) for value in match.group(1).split(",")]
        assert source_deltas == campaign["deltas"], (campaign["id"], source_deltas, campaign["deltas"])
    print("lab-source parity OK", revision[:12], len(source_ids), "CVE cases")


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
for campaign in DATA["comparison_campaigns"]:
    assert campaign["id"] in performance, campaign["id"]
assert performance.count('class="comparison-chart-row"') == len(DATA["comparison_campaigns"])
assert "CVE-2024-0519" in (ROOT / "reports.html").read_text(encoding="utf-8")
assert "포트폴리오 최종 보고서 v2" in (ROOT / "reports.html").read_text(encoding="utf-8")
reports = (ROOT / "reports.html").read_text(encoding="utf-8")
for case in DATA["cve_cases"]:
    assert case["id"] in reports, case["id"]
assert str(DATA["metrics"]["cve_cases"]) in reports
assert "CVE-2023-2033" in reports and "3/3 구조 차등" in reports
assert 'class="stage-chart"' in reports
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
