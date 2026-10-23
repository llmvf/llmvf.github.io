"""Check static output and local navigation before publishing."""

from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).parent
PAGES = ("index.html", "architecture.html", "performance.html", "reports.html")


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
    for target in parser.targets:
        if target.startswith(("http:", "https:", "#", "mailto:")):
            continue
        assert (ROOT / target.split("#")[0]).exists(), (name, target)
    assert "llm_variant_fuzz_agent/" not in content, name
    print(name, "OK", len(parser.targets), "links")

assert "18 / 18" in (ROOT / "performance.html").read_text(encoding="utf-8")
assert "CVE-2024-0519" in (ROOT / "reports.html").read_text(encoding="utf-8")
architecture = (ROOT / "architecture.html").read_text(encoding="utf-8")
for anchor in ("system-map", "lineage", "control-loop", "validation"):
    assert f'id="{anchor}"' in architecture
    assert f'href="#{anchor}"' in architecture
assert "Experiment Manager" in architecture and "B3" in architecture
assert "performance.html" in (ROOT / "llm_variant_fuzz_agent/index.html").read_text(encoding="utf-8")
assert not (ROOT / "llm_variant_fuzz_agent/data/results.json").exists()
assert not (ROOT / "data/metrics.json").exists()
print("site checks passed")
