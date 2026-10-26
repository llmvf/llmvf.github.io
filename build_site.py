# -*- coding: utf-8 -*-
"""Render the static public summary of v8-fuzz-lab.

Numbers and claims in these pages are curated from the lab revision named below.
This script keeps the shared layout consistent across GitHub Pages entry points.
"""

from pathlib import Path

ROOT = Path(__file__).parent
LAB_REVISION = "63d3267fb6735972bbaf2587a2989ac67977e89c"


def page(title: str, active: str, body: str, description: str) -> str:
    nav = [
        ("index.html", "개요"),
        ("architecture.html", "연구 설계"),
        ("performance.html", "실험 결과"),
        ("reports.html", "CVE 기록"),
    ]
    links = "".join(
        f'<a href="{href}"{current}>{label}</a>'
        for href, label in nav
        for current in (' aria-current="page"' if href == active else '',)
    )
    return f'''<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{description}">
  <meta name="theme-color" content="#101820">
  <meta property="og:title" content="{title} · V8 Fuzz Lab">
  <meta property="og:description" content="{description}">
  <meta property="og:type" content="website">
  <title>{title} · V8 Fuzz Lab</title>
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="styles.css">
  <script src="script.js" defer></script>
</head>
<body>
  <a class="skip" href="#main">본문으로 이동</a>
  <header class="site-header">
    <a class="brand" href="index.html" aria-label="V8 Fuzz Lab 홈"><span class="brand-icon">V8<span> / </span></span><span>FUZZ LAB<small>LLMVF RESEARCH</small></span></a>
    <button class="menu-button" type="button" aria-expanded="false" aria-controls="site-nav">메뉴 <span aria-hidden="true">☰</span></button>
    <nav id="site-nav" aria-label="주요 메뉴">{links}</nav>
  </header>
  <main id="main">{body}</main>
  <footer class="footer"><div><strong>V8 FUZZ LAB</strong><p>Historical CVE evidence → current V8 experiments.</p></div><div><span>근거 기준: v8-fuzz-lab <code>{LAB_REVISION[:12]}</code></span><span>최종 반영 2026.10.26</span></div></footer>
</body>
</html>
'''


home = '''
<section class="hero wrap">
  <div class="hero-copy"><div class="kicker"><span class="pulse"></span> RESEARCH STATUS / 2026.10.26</div>
    <h1>과거 V8 버그에서<br><em>검증 가능한 퍼징</em>으로.</h1>
    <p class="lede">공개 CVE의 실패 메커니즘을 역사적 빌드에서 확인하고, 현재 V8과 Fuzzilli에서 실행할 전략으로 옮깁니다. 실험의 실행 가능성, 메커니즘 도달, 실제 버그 발견을 서로 다른 증거로 기록합니다.</p>
    <div class="actions"><a class="button primary" href="performance.html">실험 결과 보기 <span>↗</span></a><a class="button secondary" href="architecture.html">연구 흐름 살펴보기 <span>→</span></a></div>
  </div>
  <div class="hero-panel" aria-label="CVE에서 검증된 결과까지의 연구 계보"><div class="panel-head"><span>LAB / EVIDENCE TRACE</span><span class="online">CURRENT</span></div><ol class="trace"><li><span>01</span><div><strong>HISTORICAL CVE</strong><small>parent ↔ fix replay</small></div><b>VERIFIED</b></li><li><span>02</span><div><strong>CURRENT MAPPING</strong><small>V8 source + invariant</small></div><b>TRACED</b></li><li><span>03</span><div><strong>FUZZIL STRATEGY</strong><small>5 dedicated generators</small></div><b>RUNNING</b></li><li><span>04</span><div><strong>INDEPENDENT FINDING</strong><small>reproduce + human review</small></div><b class="pending">OPEN</b></li></ol><div class="panel-foot">case → hypothesis → mapping → strategy → campaign → run → finding → report</div></div>
</section>
<section class="ticker" aria-label="현재 연구 수치"><div class="wrap ticker-grid"><div><strong>5</strong><span>현재 V8용 CVE generator</span></div><div><strong>9</strong><span>온보딩된 CVE 계열</span></div><div><strong>v7→v8</strong><span>방향 미러로 적응 효과 검증</span></div><div><strong>0</strong><span>전 실행 범위 관찰 crash</span></div></div></section>
<section class="section wrap"><div class="section-top"><div><span class="eyebrow">01 / RESEARCH LOOP</span><h2>근거를 쌓는 순서</h2></div><p>각 단계의 산출물을 연결하고 상태 전이를 검사합니다. 역사 재현만으로 현재 V8의 새 버그를 주장하지 않습니다.</p></div><div class="step-grid"><article><span>01 — SOURCE</span><h3>CVE와 패치</h3><p>공개 공지, fix commit, 회귀 테스트의 출처와 해시를 고정합니다.</p></article><article><span>02 — REPLAY</span><h3>역사적 차이</h3><p>동일 조건의 취약 부모와 수정 빌드에서 동작 차이를 반복 확인합니다.</p></article><article><span>03 — MIGRATE</span><h3>현재 경로</h3><p>보존된 불변식과 변이 가능한 차원을 현재 V8의 FuzzIL generator로 옮깁니다.</p></article><article><span>04 — MEASURE</span><h3>통제 실험</h3><p>동일 예산의 비교군, 실행 로그, target hit, coverage, crash를 분리해 읽습니다.</p></article></div></section>
<section class="section section-ink"><div class="wrap"><div class="section-top"><div><span class="eyebrow">02 / CURRENT EVIDENCE</span><h2>현재까지 확인한 것</h2></div><a class="text-link" href="performance.html">수치와 한계 자세히 보기 ↗</a></div><div class="finding-grid"><article><span class="tag">INTEGRATION</span><h3>다섯 generator가 동작합니다.</h3><p>Wasm GC 두 계열, TurboFan receiver-map, parser eval-scope, Maglev allocation-folding 전략을 현재 Fuzzilli 실행에 연결했습니다.</p></article><article><span class="tag">CONTROL PATH</span><h3>Agent의 제안이 다음 window에 적용됩니다.</h3><p>B2의 weight 제안·검증·적용 경로를 Codex·Claude CLI 두 provider로 확인했습니다. v3 통제 실험에서 발동 쌍에 1→100 action이 적용됐습니다.</p></article><article><span class="tag muted">LIMITATION</span><h3>적응의 일반 우월성은 미입증입니다.</h3><p>v7의 양의 신호가 미러(v8)에서 재현되지 않고 약한 음으로 뒤집혀, 방향 특정 artifact로 판단했습니다. 전체 coverage·corpus 우월성은 판정하지 않습니다.</p></article></div></div></section>
<section class="section wrap"><div class="section-top"><div><span class="eyebrow">03 / CASES</span><h2>추적 중인 CVE 계열</h2></div><a class="text-link" href="reports.html">모든 사례 보기 ↗</a></div><div class="case-strip"><div><b>CVE-2023-4070</b><span>Wasm Liftoff register alias</span></div><div><b>CVE-2023-4068</b><span>Wasm GC default reference</span></div><div><b>CVE-2020-6418</b><span>TurboFan receiver map</span></div><div><b>CVE-2022-4262</b><span>Parser eval scope</span></div><div><b>CVE-2024-0517</b><span>Maglev allocation-folding</span></div><div><b>CVE-2020-16040</b><span>TurboFan integer-truncation</span></div></div></section>
<section class="closing wrap"><span class="eyebrow">RESEARCH PRINCIPLE</span><h2>실패와 null 결과도<br>연구 기록으로 남깁니다.</h2><p>Crash 후보는 독립 재현과 사람 검토 전까지 finding에 포함하지 않습니다. 데이터 재시작 이전 실행은 현재 결과에 승계하지 않습니다.</p><a class="button primary" href="architecture.html">검증 기준 읽기 →</a></section>
'''

architecture = (ROOT / "architecture_content.html").read_text(encoding="utf-8")

performance = '''
<section class="page-hero wrap"><span class="eyebrow">RESULTS / 02</span><h1>실험 결과와<br><em>남은 불확실성.</em></h1><p>2026년 10월 26일 기준 저장소에 기록된 완료 실험만 표시합니다. 아래의 crash 0은 기재된 실행 범위의 관찰값이며, 전체 시스템의 안전성을 뜻하지 않습니다.</p></section>
<section class="section wrap"><div class="section-top"><div><span class="eyebrow">LATEST CONTROLLED RUN</span><h2>장기 비교 v7 → v8 미러</h2></div><p>불균형 weight로 B2 적응을 안정 발동시킨 v7과, 방향을 뒤집어 대칭을 검증한 v8(미러)의 결과입니다.</p></div><div class="stat-grid"><article><span>완료 run · window</span><strong>9 · 27</strong><small>각 방향</small></article><article><span>적응 발동</span><strong>안정</strong><small>LiveAlias 1 → 100</small></article><article><span>미러 재현</span><strong>실패</strong><small>v7 양의 신호 → v8 음</small></article><article><span>Crash</span><strong>0</strong><small>양방향 전체</small></article></div><div class="result-callout"><span>판정 / CONTROL PATH PASS · GENERAL SUPERIORITY UNPROVEN</span><h3>v7의 첫 양의 신호는 미러에서 뒤집혔습니다.</h3><p>v7은 안정 발동 조건에서 B2가 B1을 일관되게 앞서는 첫 신호(interesting +4.6%·corpus +7.5% 중앙값)를 보였지만, 방향을 뒤집은 v8에서 재현되지 않고 약한 음으로 뒤집혔습니다(interesting −38·corpus −22). 양방향 공통 양수는 정의상 당연한 stable-target-path뿐이라, 이를 방향 특정 artifact(또는 n=3 저검정력)로 판단했습니다.</p></div></section>
<section class="section section-ink"><div class="wrap"><div class="section-top"><div><span class="eyebrow">COMPARATIVE RUNS</span><h2>비교 실험 읽기</h2></div><p>완료 상태와 함께 결과의 적용 범위를 표시합니다.</p></div><div class="result-table-wrap"><table class="result-table"><thead><tr><th>실험</th><th>규모</th><th>주요 관찰</th><th>판정</th></tr></thead><tbody><tr><td><strong>반복 B0 / B1</strong><small>두 Wasm generator</small></td><td>12 run</td><td>B1 target 구조 반복 보존. Coverage 차이의 부호는 3회씩 갈림.</td><td><span class="pill">통합 확인</span></td></tr><tr><td><strong>적응 효과 v3</strong><small>동일 corpus 분기</small></td><td>6쌍 · 18 window</td><td>action을 1→100으로 교정. 발동 4쌍 중 3쌍에서 조정 대상 hit 차이 양수(+6/+7).</td><td><span class="pill">제어 확인</span></td></tr><tr><td><strong>장기 v6</strong><small>세 CVE generator</small></td><td>9 run · 18 window<br>362,008 budgeted executions</td><td>Crash 0. 균형 weight 시작으로 적응 발동률 낮음. B2가 B1을 앞서지 않음.</td><td><span class="pill muted">우월성 미판정</span></td></tr><tr><td><strong>장기 v7</strong><small>불균형 weight 시작</small></td><td>9 run · 27 window</td><td>안정 발동. B2가 B1을 일관되게 앞서는 첫 신호(interesting·corpus 양). 단 저검정력.</td><td><span class="pill">첫 양의 신호</span></td></tr><tr><td><strong>장기 v8 (미러)</strong><small>방향 대칭 검증</small></td><td>9 run · 27 window</td><td>v7 우위가 미러에서 재현되지 않고 음으로 뒤집힘 → 방향 특정 artifact.</td><td><span class="pill muted">신호 반증</span></td></tr></tbody></table></div></div></section>
<section class="section wrap"><div class="section-top"><div><span class="eyebrow">INTERPRETATION</span><h2>이 수치가 말하지 않는 것</h2></div></div><div class="note-grid"><article><h3>Target hit ≠ 취약점</h3><p>목표 구조를 생성하거나 현재 빌드에서 실행했다는 관찰은 새 버그 발견이 아닙니다.</p></article><article><h3>0 crash ≠ 안전성</h3><p>관찰된 예산에서 crash가 없었다는 뜻입니다. finding은 생성되지 않았습니다.</p></article><article><h3>Coverage ≠ 적응 효과</h3><p>Fuzzilli 내부 entropy와 희박한 generator 호출 때문에 작은 차이를 Agent의 인과 효과로 해석할 수 없습니다.</p></article></div></section>
<section class="source-note wrap"><strong>출처</strong><p>v8-fuzz-lab/experiments/results의 long-b0-b1-b2-v6.md, long-b0-b1-b2-v7.md, long-b0-b1-b2-v8.md, adaptation-effect-v3.md, b0-b1-b2-matched-pilot.md. 수치는 각 캠페인을 합산하지 않았습니다.</p></section>
'''

reports = '''
<section class="page-hero wrap"><span class="eyebrow">CASE FILES / 03</span><h1>CVE별 증거와<br><em>현재 상태.</em></h1><p>역사적 parent/fix 차이와 현재 V8용 전략의 상태를 구분합니다. 아래는 CVE 연구 기록이며 새 취약점 보고서 목록이 아닙니다.</p></section>
<section class="section wrap"><div class="section-top"><div><span class="eyebrow">MIGRATED CASES</span><h2>네 가지 메커니즘</h2></div><p>원본 기록의 replay와 mapping, strategy smoke를 기준으로 요약했습니다.</p></div><div class="case-grid"><article><div class="case-head"><span>WASM / LIFTOFF</span><b>MIGRATED</b></div><h3>CVE-2023-4070</h3><p>Wasm Liftoff register ownership과 alias 경로. 역사적 parent는 호환성 한 토큰 변경 후 3/3 SIGSEGV, fix는 3/3 정상 종료했습니다.</p><div class="case-meta"><span>현재 전략</span><strong>WasmGCLiveAliasGenerator</strong></div></article><article><div class="case-head"><span>WASM / GC</span><b>MIGRATED</b></div><h3>CVE-2023-4068</h3><p>Nullable internal reference의 default value. 무수정 공식 회귀 테스트에서 parent는 3/3 assertion 실패, fix는 3/3 정상 종료했습니다.</p><div class="case-meta"><span>현재 전략</span><strong>WasmGCDefaultRefFieldGenerator</strong></div></article><article><div class="case-head"><span>JIT / TURBOFAN</span><b>MIGRATED</b></div><h3>CVE-2020-6418</h3><p>Receiver-map reliability와 elements transition. 현재 전략은 4개 transition과 3개 consumer 차원으로 확장됐습니다.</p><div class="case-meta"><span>현재 전략</span><strong>JSReceiverMapSideEffectGenerator</strong></div></article><article><div class="case-head"><span>PARSER / SCOPE</span><b>MIGRATED</b></div><h3>CVE-2022-4262</h3><p>재파싱 시 eval scope 추적 불일치. 공개 축약 입력에서 dcheck parent는 3/3 bytecode mismatch, fix는 3/3 정상 종료했습니다.</p><div class="case-meta"><span>현재 전략</span><strong>ParserReparseEvalScopeGenerator</strong></div></article></div></section>
<section class="section section-ink"><div class="wrap"><div class="section-top"><div><span class="eyebrow">LINKED / EXCLUDED</span><h2>이식 전·제외도 근거와 함께</h2></div></div><div class="exclusion"><span>CVE-2024-0517</span><div><h3>Maglev allocation-folding · 게이트4 완료, 게이트2 미재현</h3><p>게이트1 연결과 게이트4(MaglevAllocationFoldingGenerator 이식·smoke_verified)를 마쳤고, current mapping은 execution verified입니다. 다만 게이트2(역사 재현)는 fold가 GC safepoint를 가로지르지 않아 미재현이라, 고친 버그의 재현이 아니라 current-V8 불변식 fuzzing 기여로 두고 case는 linked로 유지합니다.</p></div><b>LINKED</b></div><div class="exclusion"><span>CVE-2020-16040</span><div><h3>TurboFan SimplifiedLowering 정수-절단 오판</h3><p>게이트1 완료. Word32 truncation 시 restriction을 Signed32로 잘못 타이핑해 overflow를 놓치는 계열로, 기존 receiver-map 버그와 다릅니다. 공식 mjsunit 회귀 테스트가 동반돼 게이트2를 무수정 oracle로 진행할 수 있습니다.</p></div><b>LINKED</b></div><div class="exclusion"><span>CVE-2024-0519</span><div><h3>공개 replay oracle 부족</h3><p>Fix 연결은 확인했지만 공개 자료만으로 역사 재현을 검증할 oracle이 부족해 현재 연구 대상에서 제외했습니다. Generator나 발견 성과로 집계하지 않습니다.</p></div><b>EXCLUDED</b></div></div></section>
<section class="section wrap"><div class="section-top"><div><span class="eyebrow">STATUS CONTRACT</span><h2>상태를 읽는 법</h2></div></div><div class="status-line"><span>candidate</span><i>→</i><span>linked</span><i>→</i><span>historical_verified</span><i>→</i><span>migrated</span><i>→</i><span>approved</span></div><p class="status-explain">실행 중 관찰한 crash는 별도 candidate입니다. 최소화, 중복 검토, 독립 재현과 사람 검토를 마치기 전에는 검증된 bug 수에 넣지 않습니다.</p></section>
<section class="source-note wrap"><strong>출처</strong><p>v8-fuzz-lab/README.md와 experiments/results의 각 CVE historical-replay, current-mapping, strategy-smoke 기록. CVE-2024-0517은 historical-replay 진단 기록을, CVE-2024-0519는 replay-eligibility 기록을 기준으로 했습니다.</p></section>
'''

pages = {
    "index.html": ("개요", home, "V8 과거 CVE를 역사적으로 재현하고 현재 Fuzzilli 퍼징 전략으로 이식하는 연구 프로젝트."),
    "architecture.html": ("연구 설계", architecture, "V8 Fuzz Lab의 CVE 증거 계보, Fuzzilli 비교군, 실행과 finding 검증 기준."),
    "performance.html": ("실험 결과", performance, "B0/B1/B2 실험, 적응 효과 v2 및 CVE generator smoke의 관찰 결과와 한계."),
    "reports.html": ("CVE 기록", reports, "V8 역사적 CVE 재현과 현재 generator 이식 상태."),
}

for filename, (title, body, description) in pages.items():
    (ROOT / filename).write_text(page(title, filename, body, description), encoding="utf-8")

(ROOT / "styles.css").write_bytes(
    (ROOT / "site_styles_new.css").read_bytes()
    + b"\n"
    + (ROOT / "architecture_styles.css").read_bytes()
)
(ROOT / "script.js").write_text('''const button = document.querySelector('.menu-button');
const navigation = document.querySelector('#site-nav');
button?.addEventListener('click', () => {
  const open = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('open', open);
});
navigation?.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    button.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('open');
  }
});
''', encoding="utf-8")
(ROOT / "favicon.svg").write_text('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#14212a"/><path d="m10 16 11 32h9l11-32h-9l-6 22-7-22zm36 0h8v32h-8z" fill="#b6f55f"/></svg>''', encoding="utf-8")
(ROOT / "README.md").write_text('''# V8 Fuzz Lab public site

Static GitHub Pages site at https://llmvf.github.io/. It summarizes the current `llmvf/v8-fuzz-lab` research and replaces the previous LLM variant fuzzing dashboard.

## Content baseline

- Lab revision: `cac645968cc17fe7f7fe9d0befa161402407be8f` (2026-10-23)
- Core sources: lab `README.md`, `architecture/workflow.md`, `architecture/integration.md`, `experiments/protocol.md`, and the named files in `experiments/results/`.
- Experiment totals are kept per campaign. A historical replay, generator smoke, target hit, or coverage observation must not be presented as a new vulnerability finding.
- The lab repository and raw artifacts may be private. This site publishes curated summaries only.

## Updating

Edit `build_site.py`, `architecture_content.html`, `site_styles_new.css`, and `architecture_styles.css`, then run `py -3 build_site.py`. Commit the generated HTML, CSS, JavaScript, and favicon with the source changes. GitHub Pages serves the repository root without a build dependency.

The old `/llm_variant_fuzz_agent/` route redirects to the new results page for existing links.
''', encoding="utf-8")
legacy = ROOT / "llm_variant_fuzz_agent"
(legacy / "index.html").write_text('''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="refresh" content="0; url=../performance.html"><link rel="canonical" href="../performance.html"><title>실험 결과로 이동 · V8 Fuzz Lab</title></head><body><p>최신 실험 결과는 <a href="../performance.html">실험 결과 페이지</a>에서 확인하세요.</p></body></html>''', encoding="utf-8")

for relative in (
    "dashboard.js", "data/metrics.json", "data/reports.json",
    "assets/llmvf-avatar-1024.png", "assets/llmvf-avatar.svg",
    "llm_variant_fuzz_agent/app.js", "llm_variant_fuzz_agent/styles.css",
    "llm_variant_fuzz_agent/data/results.json",
):
    target = (ROOT / relative).resolve()
    if not target.is_relative_to(ROOT.resolve()):
        raise ValueError(relative)
    target.unlink(missing_ok=True)
for relative in ("llm_variant_fuzz_agent/data", "data", "assets"):
    target = (ROOT / relative).resolve()
    if target.is_relative_to(ROOT.resolve()) and target.exists():
        target.rmdir()
