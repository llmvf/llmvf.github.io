# -*- coding: utf-8 -*-
"""Render the static public summary of v8-fuzz-lab.

Numbers and claims in these pages are curated from the lab revision named below.
This script keeps the shared layout consistent across GitHub Pages entry points.
"""

from pathlib import Path

ROOT = Path(__file__).parent
LAB_REVISION = "0628093fd2c3e92939b00b1524a73876fb7c1a5f"


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
  <footer class="footer"><div><strong>V8 FUZZ LAB</strong><p>Historical CVE evidence → current V8 experiments.</p></div><div><span>근거 기준: v8-fuzz-lab <code>{LAB_REVISION[:12]}</code></span><span>최종 반영 2026.10.31</span></div></footer>
</body>
</html>
'''


home = '''
<section class="hero wrap">
  <div class="hero-copy"><div class="kicker"><span class="pulse"></span> RESEARCH STATUS / 2026.10.31</div>
    <h1>과거 V8 버그에서<br><em>검증 가능한 퍼징</em>으로.</h1>
    <p class="lede">공개 CVE의 실패 메커니즘을 역사적 빌드에서 확인하고, 현재 V8과 Fuzzilli에서 실행할 전략으로 옮깁니다. 실험의 실행 가능성, 메커니즘 도달, 실제 버그 발견을 서로 다른 증거로 기록합니다.</p>
    <div class="actions"><a class="button primary" href="performance.html">실험 결과 보기 <span>↗</span></a><a class="button secondary" href="architecture.html">연구 흐름 살펴보기 <span>→</span></a></div>
  </div>
  <div class="hero-panel" aria-label="CVE에서 검증된 결과까지의 연구 계보"><div class="panel-head"><span>LAB / EVIDENCE TRACE</span><span class="online">CURRENT</span></div><ol class="trace"><li><span>01</span><div><strong>HISTORICAL CVE</strong><small>parent ↔ fix replay</small></div><b>VERIFIED</b></li><li><span>02</span><div><strong>CURRENT MAPPING</strong><small>V8 source + invariant</small></div><b>TRACED</b></li><li><span>03</span><div><strong>FUZZIL STRATEGY</strong><small>11 dedicated generators</small></div><b>RUNNING</b></li><li><span>04</span><div><strong>INDEPENDENT FINDING</strong><small>reproduce + human review</small></div><b class="pending">0 FOUND</b></li></ol><div class="panel-foot">case → hypothesis → mapping → strategy → campaign → run → finding → report</div></div>
</section>
<section class="ticker" aria-label="현재 연구 수치"><div class="wrap ticker-grid"><div><strong>11</strong><span>검증된 CVE generator</span></div><div><strong>16</strong><span>온보딩된 CVE 계열</span></div><div><strong>9/9</strong><span>external-holdout 양수 pair</span></div><div><strong>0</strong><span>독립 검증 신규 버그</span></div></div></section>
<section class="section wrap"><div class="section-top"><div><span class="eyebrow">OVERVIEW</span><h2>이 프로젝트는 무엇인가</h2></div></div><p class="lede">공개된 과거 V8 CVE의 실패 메커니즘을 역사적 빌드(부모↔fix)에서 검증하고, 현재 V8에 남은 불변식을 Fuzzilli generator로 이식한 뒤, LLM 에이전트의 피드백 적응(B2)이 기본 퍼징(B0)·CVE 전략 고정(B1)을 측정 가능하게 넘어서는지를 버전·예산·corpus를 동결한 공정 비교로 평가합니다. 최신 external holdout에서 B2는 선택한 CVE-derived target의 도달을 9/9 pair에서 늘렸지만, 일반 coverage·corpus·interesting sample 우월성은 0/3 campaign에서 지지되지 않았습니다.</p><div class="step-grid"><article><span>연구 설계</span><h3>증거 계보와 동결된 비교</h3><p>제어면·증거 계보·검증 기준과 실험 반복에서 holdout까지.</p><a class="text-link" href="architecture.html">살펴보기 →</a></article><article><span>실험 결과</span><h3>External holdout · 9/9</h3><p>CVE별 B0/B1/B2 수치, 비용, 일반화 한계와 최종 판정.</p><a class="text-link" href="performance.html">수치 보기 ↗</a></article><article><span>CVE 기록</span><h3>포트폴리오 v2</h3><p>최신 종합 보고서와 CVE별 분석·실행 결과로 연결.</p><a class="text-link" href="reports.html">기록 보기 →</a></article></div></section>
<section class="section wrap"><div class="result-callout"><span>QUICKSTART / ACCEPTANCE VERIFIED</span><h3>후보 수집부터 500-sample smoke 보고서까지 한 명령으로 검증했습니다.</h3><p><code>python -m llmvf quickstart</code>는 연도와 규모를 선택해 evidence gate를 통과한 후보만 실행합니다. 2024 실제 수용 테스트에서 CVE-2024-5838을 선택해 500 samples, valid 474, interesting 304, crash 0으로 완료했으며 이 smoke는 성능 결론이 아닌 통합 검증으로만 사용합니다.</p></div></section>
'''

architecture = (ROOT / "architecture_content.html").read_text(encoding="utf-8")

performance = '''
<section class="page-hero wrap"><span class="eyebrow">RESULTS / 02</span><h1>실험 결과와<br><em>주장의 경계.</em></h1><p>2026년 10월 31일 기준 완료된 external holdout과 최신 포트폴리오 판정을 표시합니다. target hit은 수정된 current V8의 메커니즘 도달이며 새 취약점 발견이 아닙니다.</p></section>
<section class="section wrap"><div class="section-top"><div><span class="eyebrow">EXTERNAL HOLDOUT / FINAL</span><h2>선택한 target 도달은 반복적으로 증가했습니다</h2></div><p>정책을 holdout 결과에 맞춰 다시 조정하지 않고, 동일한 neutral corpus 기반 9-arm 설계를 세 메커니즘 계열에 적용했습니다.</p></div><div class="stat-grid"><article><span>Holdout campaign</span><strong>3</strong><small>서로 다른 CVE 계열</small></article><article><span>Paired repetition</span><strong>9/9</strong><small>B2−B1 target hit 양수</small></article><article><span>Pooled 중앙값</span><strong>+37</strong><small>target-hit delta</small></article><article><span>일반 효과 지지</span><strong>0/3</strong><small>coverage·corpus·interesting</small></article></div><div class="result-callout"><span>최종 판정 / TARGET ADAPTATION SUPPORTED · GENERAL SUPERIORITY UNSUPPORTED</span><h3>Codex-guided B2는 선택한 generator에 실행 노력을 재배분했습니다.</h3><p>세 external holdout의 9개 pair가 모두 양수였고 누적 target-hit delta는 +266입니다. 그러나 세 primary campaign 모두 일반 coverage·corpus·interesting sample의 방향 독립적 개선을 지지하지 않았고, 독립 검증 신규 버그도 0건입니다.</p></div></section>
<style>.vmx,.cvenum{width:100%;border-collapse:collapse;margin-top:12px;font-variant-numeric:tabular-nums}.vmx th,.vmx td{padding:8px 10px;text-align:center;border:1px solid rgba(128,128,128,.25)}.vmx th:first-child,.vmx td:first-child,.vmx td:last-child{text-align:left}.vmx .pos{background:rgba(40,160,90,.16);color:#1b7a44;font-weight:600}.vmx .neg{background:rgba(200,60,60,.16);color:#b23b3b;font-weight:600}.vmx .def{color:#8a8a8a;font-style:italic;background:none;font-weight:400}.cvenum th,.cvenum td{padding:8px 10px;text-align:left;border-bottom:1px solid rgba(128,128,128,.2);vertical-align:top}.cvenum code{font-size:.85em}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .vmx .pos{color:#5fd99a}:root:not([data-theme="light"]) .vmx .neg{color:#ef8b8b}}:root[data-theme="dark"] .vmx .pos{color:#5fd99a}:root[data-theme="dark"] .vmx .neg{color:#ef8b8b}</style>
<section class="section wrap"><div class="section-top"><div><span class="eyebrow">PAIRED RESULTS</span><h2>External-holdout target 효과</h2></div><p>각 셀은 같은 반복에서의 B2−B1 완전 구조 hit 차이입니다. 일반 퍼징 지표와 분리해 읽어야 합니다.</p></div><div class="result-table-wrap"><table class="vmx"><thead><tr><th>CVE / 메커니즘</th><th>paired delta</th><th>중앙값</th><th>일반 효과</th></tr></thead><tbody><tr><td>CVE-2021-38003 · JSON exception path</td><td class="pos">[17, 1, 42]</td><td class="pos">+17</td><td class="def">미지지</td></tr><tr><td>CVE-2021-21225 · Array species</td><td class="pos">[37, 1, 37]</td><td class="pos">+37</td><td class="def">미지지</td></tr><tr><td>CVE-2022-1134 · super IC/API getter</td><td class="pos">[32, 48, 51]</td><td class="pos">+48</td><td class="def">미지지</td></tr></tbody></table></div></section>
<section class="section section-ink"><div class="wrap"><div class="section-top"><div><span class="eyebrow">PORTFOLIO</span><h2>최신 CVE 상태</h2></div><p>완료된 비교뿐 아니라 current surface 제거와 실행 전제 부족으로 비적용·보류한 사례도 함께 공개합니다.</p></div><div class="result-table-wrap"><table class="cvenum"><thead><tr><th>CVE</th><th>계열</th><th>상태</th><th>현재 전략 / 처분</th><th>핵심 관찰</th></tr></thead><tbody><tr><td><strong>2023-4069</strong></td><td>Maglev initial-map</td><td>migrated holdout</td><td><code>MaglevInitialMapValidity</code></td><td>trigger-conditional B2−B1 [3,5,5]</td></tr><tr><td><strong>2024-5838</strong></td><td>Wasm import/JSPI</td><td>migrated development</td><td><code>WasmImportWrapperJSPI</code></td><td>development B2−B1 [2,10,20]</td></tr><tr><td><strong>2021-38003</strong></td><td>JSON exception path</td><td>migrated external</td><td><code>JSONStringifyExceptionPath</code></td><td>external B2−B1 [17,1,42]</td></tr><tr><td><strong>2021-21225</strong></td><td>Array species</td><td>migrated external</td><td><code>ArrayConcatSpeciesSideEffect</code></td><td>external B2−B1 [37,1,37]</td></tr><tr><td><strong>2022-1134</strong></td><td>super IC/API getter</td><td>migrated external</td><td><code>SuperICApiGetter</code></td><td>external B2−B1 [32,48,51]</td></tr><tr><td><strong>2024-3832/3833</strong></td><td>Wasm JSPI sibling cluster</td><td>historical verified</td><td>current surface retired</td><td>CVE campaign 비적용</td></tr><tr><td><strong>2022-1096</strong></td><td>Blink interceptor</td><td>linked / deferred</td><td>Blink replay lane 필요</td><td>V8-only 차등 없음</td></tr></tbody></table></div></div></section>
<section class="section section-ink"><div class="wrap"><div class="section-top"><div><span class="eyebrow">COST & SAFETY</span><h2>효과와 비용을 함께 기록합니다</h2></div></div><div class="stat-grid"><article><span>Codex 호출</span><strong>18</strong><small>external holdout 3건</small></article><article><span>총 tokens</span><strong>382,582</strong><small>input + output</small></article><article><span>1k tokens당 delta</span><strong>0.695</strong><small>누적 target hit 기준</small></article><article><span>Crash / failure</span><strong>0 / 0</strong><small>primary holdout</small></article></div></div></section>
<section class="section wrap"><div class="section-top"><div><span class="eyebrow">QUICKSTART ACCEPTANCE</span><h2>실제 2024 smoke 경로도 검증했습니다</h2></div><p>후보 수집 → lineage gate → candidate-pinned runtime → Fuzzilli smoke → run/finding/report 생성을 한 명령으로 완료했습니다.</p></div><div class="result-table-wrap"><table class="result-table"><thead><tr><th>후보</th><th>규모</th><th>결과</th><th>판정</th></tr></thead><tbody><tr><td><strong>CVE-2024-5838</strong><small>WasmImportWrapperJSPIGenerator</small></td><td>500 samples<br>16,235 executions</td><td>valid 474 · interesting 304 · coverage 4.47% · crash 0</td><td><span class="pill">통합 수용 통과</span></td></tr></tbody></table></div></section>
<section class="section wrap"><div class="section-top"><div><span class="eyebrow">INTERPRETATION</span><h2>이 수치가 말하지 않는 것</h2></div></div><div class="note-grid"><article><h3>Target hit ≠ 취약점</h3><p>목표 구조를 생성하거나 현재 빌드에서 실행했다는 관찰은 새 버그 발견이 아닙니다.</p></article><article><h3>0 crash ≠ 안전성</h3><p>관찰된 예산에서 crash가 없었다는 뜻입니다. finding은 생성되지 않았습니다.</p></article><article><h3>Coverage ≠ 적응 효과</h3><p>Fuzzilli 내부 entropy와 희박한 generator 호출 때문에 작은 차이를 Agent의 인과 효과로 해석할 수 없습니다.</p></article></div></section>
<section class="source-note wrap"><strong>출처</strong><p>v8-fuzz-lab의 report/cve-portfolio-final-report-v2.md, report/research-question-verdict-v2.md, external-holdout 세 캠페인 보고서, quickstart-2024-acceptance-2026-10-31.md. 탐색적 sign test는 공유 인프라의 독립성 한계 때문에 보조 기술통계로만 사용합니다.</p></section>
'''

reports = '''
<section class="page-hero wrap"><span class="eyebrow">CASE FILES / 03</span><h1>CVE별 증거와<br><em>현재 상태.</em></h1><p>역사적 parent/fix 차이와 현재 V8용 전략의 상태를 구분합니다. 아래는 CVE 연구 기록이며 새 취약점 보고서 목록이 아닙니다.</p></section>
<style>.report-links{display:grid;gap:10px;margin-top:14px}.report-links a{display:block;padding:12px 14px;border:1px solid rgba(128,128,128,.3);border-radius:10px;text-decoration:none;color:inherit}.report-links a .ext{float:right;opacity:.55}.report-links a small{display:block;opacity:.7;margin-top:3px}.report-links a.primary{border-width:2px;border-color:rgba(128,128,128,.5)}</style>
<section class="section wrap"><div class="section-top"><div><span class="eyebrow">READ ON GITHUB</span><h2>최신 판정과 실행별 보고서</h2></div><p>전체 서술은 저장소 문서에서 읽을 수 있습니다. <code>llmvf/v8-fuzz-lab</code> 접근 권한이 있는 계정에서 열립니다.</p></div><div class="report-links"><a class="primary" href="https://github.com/llmvf/v8-fuzz-lab/blob/main/report/cve-portfolio-final-report-v2.md"><span class="ext">↗</span><strong>포트폴리오 최종 보고서 v2</strong><small>External holdout, 비적용·보류 사례, 최종 주장 경계</small></a><a class="primary" href="https://github.com/llmvf/v8-fuzz-lab/blob/main/report/research-question-verdict-v2.md"><span class="ext">↗</span><strong>연구질문 최종 판정 v2</strong><small>9/9 paired target 효과와 일반 효과 0/3</small></a><a href="https://github.com/llmvf/v8-fuzz-lab/blob/main/experiments/results/CVE-2021-38003-b012-holdout-v1.md"><span class="ext">↗</span>CVE-2021-38003 external holdout</a><a href="https://github.com/llmvf/v8-fuzz-lab/blob/main/experiments/results/CVE-2021-21225-b012-holdout-v1.md"><span class="ext">↗</span>CVE-2021-21225 external holdout</a><a href="https://github.com/llmvf/v8-fuzz-lab/blob/main/experiments/results/CVE-2022-1134-b012-holdout-v1.1.md"><span class="ext">↗</span>CVE-2022-1134 external holdout</a><a href="https://github.com/llmvf/v8-fuzz-lab/blob/main/experiments/results/quickstart-2024-acceptance-2026-10-31.md"><span class="ext">↗</span>2024 quickstart 실제 수용 테스트</a><a href="https://github.com/llmvf/v8-fuzz-lab/blob/main/cve/index.md"><span class="ext">↗</span>전체 CVE 인덱스</a></div></section>
<section class="section wrap"><div class="section-top"><div><span class="eyebrow">CONFIRMATORY CASES</span><h2>External holdout 세 계열</h2></div><p>역사 재현, current mapping, bounded generator, 동일 설계 B0/B1/B2 비교까지 연결된 사례입니다.</p></div><div class="case-grid"><article><div class="case-head"><span>RUNTIME / JSON</span><b>MIGRATED</b></div><h3>CVE-2021-38003</h3><p>JSON string-builder 예외 상태와 TheHole 노출 계열. B2−B1 target hit은 [17,1,42]로 세 반복 모두 양수였습니다.</p><div class="case-meta"><span>현재 전략</span><strong>JSONStringifyExceptionPathGenerator</strong></div></article><article><div class="case-head"><span>ARRAY / SPECIES</span><b>MIGRATED</b></div><h3>CVE-2021-21225</h3><p>Array.concat과 typed-array species의 부수효과 계열. B2−B1 target hit은 [37,1,37]로 세 반복 모두 양수였습니다.</p><div class="case-meta"><span>현재 전략</span><strong>ArrayConcatSpeciesSideEffectGenerator</strong></div></article><article><div class="case-head"><span>IC / API GETTER</span><b>MIGRATED</b></div><h3>CVE-2022-1134</h3><p>super load IC의 receiver/start-object 혼동 계열. B2−B1 target hit은 [32,48,51]로 세 반복 모두 양수였습니다.</p><div class="case-meta"><span>현재 전략</span><strong>SuperICApiGetterGenerator</strong></div></article></div></section>
<section class="section section-ink"><div class="wrap"><div class="section-top"><div><span class="eyebrow">NOT APPLICABLE / DEFERRED</span><h2>실행하지 않은 이유도 결과입니다</h2></div></div><div class="exclusion"><span>CVE-2024-3832/3833</span><div><h3>역사 재현 성공 · current affected surface 제거</h3><p>두 sibling CVE의 역사적 차등은 확인했지만 현재 V8에서 직접 영향을 받던 설치 표면이 사라져 CVE 전용 generator와 B0/B1/B2 campaign을 만들지 않았습니다.</p></div><b>N/A</b></div><div class="exclusion"><span>CVE-2022-1096</span><div><h3>Blink host-object replay lane 필요</h3><p>V8-only 대체 oracle은 parent/fix 차등을 만들지 못했습니다. 공개 트리거가 의존하는 CSSStyleDeclaration 경계를 제공하는 Blink lane 확보 전까지 보류합니다.</p></div><b>DEFERRED</b></div><div class="exclusion"><span>CVE-2024-0519</span><div><h3>공개 replay oracle 부족</h3><p>Fix 연결은 확인했지만 공개 자료만으로 역사 재현을 검증할 oracle이 부족해 연구 대상에서 제외했습니다.</p></div><b>EXCLUDED</b></div></div></section>
<section class="section wrap"><div class="section-top"><div><span class="eyebrow">STATUS CONTRACT</span><h2>상태를 읽는 법</h2></div></div><div class="status-line"><span>candidate</span><i>→</i><span>linked</span><i>→</i><span>historical_verified</span><i>→</i><span>migrated</span><i>→</i><span>approved</span></div><p class="status-explain">실행 중 관찰한 crash는 별도 candidate입니다. 최소화, 중복 검토, 독립 재현과 사람 검토를 마치기 전에는 검증된 bug 수에 넣지 않습니다.</p></section>
<section class="source-note wrap"><strong>출처</strong><p>v8-fuzz-lab의 포트폴리오 최종 보고서 v2, 연구질문 최종 판정 v2, cve/index.md와 각 historical replay·mapping·strategy·holdout 보고서를 기준으로 했습니다.</p></section>
'''

pages = {
    "index.html": ("개요", home, "V8 과거 CVE를 역사적으로 재현하고 현재 Fuzzilli 퍼징 전략으로 이식하는 연구 프로젝트."),
    "architecture.html": ("연구 설계", architecture, "V8 Fuzz Lab의 제어면 구조도, CVE 증거 계보, 검증 기준과 external-holdout 전이."),
    "performance.html": ("실험 결과", performance, "External holdout 9/9 target 효과, 일반 효과의 한계, 비용과 최신 CVE 상태."),
    "reports.html": ("CVE 기록", reports, "V8 역사적 CVE 재현, external-holdout 결과와 포트폴리오 최종 판정 링크."),
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

- Lab revision: `0628093fd2c3e92939b00b1524a73876fb7c1a5f` (2026-10-31)
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
