const fmt = n => n == null ? '—' : new Intl.NumberFormat('en-US', {maximumFractionDigits: 1}).format(n);
const pct = n => n == null ? '—' : `${n >= 0 ? '+' : ''}${fmt(n)}%`;
const el = id => document.getElementById(id);

function gate(name, state, detail) {
  return `<div class="gate ${state}"><i></i><b>${name}</b><small>${detail}</small></div>`;
}

let agentStudies = [], campaigns = [], allExperiments = [], discoveryStudies = [];
let activeYear = 'all';
let selectedCve = '';

function latestStudy(cve) {
  return [...agentStudies].reverse().find(item => item.cve_id === cve);
}

const armMeta = {
  stock: {label: 'Stock Fuzzilli', className: 'stock'},
  one_shot: {label: 'LLM one-shot', className: 'one-shot'},
  heuristic_loop: {label: 'Heuristic loop', className: 'heuristic'},
  agent_loop: {label: 'LLM agent loop', className: 'agent'}
};

const cveBriefs = {
  'CVE-2021-4102': {
    component: 'V8 TurboFan', bugClass: 'Type confusion',
    tldr: 'TurboFan이 ChangeTaggedToInt32와 ChangeInt31ToTaggedSigned 변환을 잘못 상쇄해, tagged-signed임이 보장되지 않은 값을 잘못된 타입으로 사용하는 취약점입니다.',
    official: [{label: 'NVD ADVISORY', url: 'https://nvd.nist.gov/vuln/detail/CVE-2021-4102'}]
  },
  'CVE-2020-6418': {
    component: 'TurboFan', bugClass: 'Side-effect modeling',
    tldr: 'TurboFan이 부수 효과 이후에도 객체 map을 신뢰하면서 float와 tagged-pointer element kind가 혼동된 취약점입니다. NodeProperties::InferReceiverMapsUnsafe의 map 신뢰성 판단에서 발생했습니다.',
    official: [{label: 'PROJECT ZERO RCA', url: 'https://googleprojectzero.github.io/0days-in-the-wild/0day-RCAs/2020/CVE-2020-6418.html'}]
  },
  'CVE-2022-4262': {
    component: 'V8 Parser / Scope', bugClass: 'Type confusion',
    tldr: 'Lazy parsing 이후 함수를 다시 파싱할 때 scope strictness와 feedback-vector layout이 달라져 발생한 V8 type confusion입니다. Scope snapshot과 eval bookkeeping 경로가 핵심입니다.',
    official: [{label: 'PROJECT ZERO RCA', url: 'https://googleprojectzero.github.io/0days-in-the-wild/0day-RCAs/2022/CVE-2022-4262.html'}]
  },
  'CVE-2023-3079': {
    component: 'V8 Runtime / IC', bugClass: 'Type confusion',
    tldr: 'Arguments object의 keyed-store fast path가 elements 저장소를 늘리면서 PACKED에서 HOLEY로 전환하지 않아 TheHole이 노출된 취약점입니다. 이후 TurboFan 최적화에서 잘못된 타입 추론으로 이어질 수 있습니다.',
    official: [{label: 'V8 REGRESSION TEST', url: 'https://chromium.googlesource.com/v8/v8/+/a5d1a1cc6911f1d1c7f30da136c8f252b05a58dc/test/mjsunit/regress/regress-40065138.js'}]
  },
  'CVE-2023-0696': {
    component: 'V8 WebAssembly', bugClass: 'Type confusion',
    tldr: 'Wasm-to-JS 호출 프레임에서 instance와 source-position 정보를 잘못 다뤄 런타임 타입 전제가 깨지는 취약점입니다. 취약 빌드와 수정 빌드의 회귀 테스트 차등으로 재현했습니다.',
    official: [{label: 'V8 FIX & TEST', url: 'https://chromium.googlesource.com/v8/v8/+/e17eee4894be67f715a7b2d7f17d8b69724f1cf8'}]
  },
  'CVE-2023-1214': {
    component: 'V8 ValueSerializer', bugClass: 'Type confusion',
    tldr: '중첩 객체를 역직렬화하는 동안 map이 dictionary mode로 바뀌었는데도 ValueSerializer가 기존 fast transition chain을 계속 따라 객체 layout을 잘못 해석하는 취약점입니다.',
    official: [{label: 'V8 FIX COMMIT', url: 'https://chromium.googlesource.com/v8/v8/+/b0db6637936a88807b5512a4de68145d0a9d6f02'}]
  },
  'CVE-2023-4069': {
    component: 'V8 Maglev', bugClass: 'Type confusion',
    tldr: 'Maglev의 constructor 처리에서 필요한 field 검증이 빠져 잘못된 initial map을 가진 객체가 만들어진 취약점입니다. Reflect.construct의 target과 new_target이 다른 경우에 도달할 수 있습니다.',
    official: [{label: 'V8 FIX & TEST', url: 'https://chromium.googlesource.com/v8/v8/+/ed93bef7ab786d5367c2ae7882922c23aa0eda64'}]
  },
  'CVE-2023-4427': {
    component: 'V8 TurboFan', bugClass: 'Out-of-bounds read',
    tldr: '최적화된 for-in loop 도중 callback이 property representation을 바꾸면 enumeration cache 길이와 실제 descriptor 상태가 어긋나 발생하는 out-of-bounds read입니다.',
    official: [{label: 'CHROMIUM ISSUE', url: 'https://issues.chromium.org/issues/40068915'}]
  },
  'CVE-2024-5274': {
    component: 'V8 Parser', bugClass: 'Type confusion',
    tldr: 'Arrow-function parameter initializer 안의 class static block이 잘못된 ExpressionScope를 상속해 this 사용과 context layout이 불일치한 취약점입니다. Lazy reparsing 과정에서 잘못된 context allocation으로 이어집니다.',
    official: [{label: 'V8 FIX COMMIT', url: 'https://chromium.googlesource.com/v8/v8/+/3e037e195e508dea045f5626862412e8f64fc919'}]
  },
  'CVE-2025-13630': {
    component: 'V8 Maglev', bugClass: 'Type confusion',
    tldr: 'Maglev의 Array.prototype.slice 최적화 경로가 배열 상태에 대한 타입 전제를 충분히 검증하지 않아 발생하는 type confusion입니다. 패치에서 고정한 target에 대한 guided localization 대상으로 등록했습니다.',
    official: [{label: 'V8 FIX COMMIT', url: 'https://chromium.googlesource.com/v8/v8/+/00348ef5c3c11842465ca11e7e39706dbe91ed86'}]
  }
};

const cveExplanations = {
  'CVE-2020-6418': {where:'TurboFan map inference', cause:'부수 효과 이후에도 이전 객체 map이 유효하다고 가정해 element kind를 혼동합니다.', impact:'힙 메모리 손상과 브라우저 renderer 내 코드 실행으로 이어질 수 있습니다.', fix:'부수 효과가 있는 경로에서는 unsafe map inference 결과를 신뢰하지 않도록 제한합니다.'},
  'CVE-2021-4102': {where:'TurboFan SimplifiedOperatorReducer', cause:'tagged 값임이 증명되지 않았는데 변환 연산 쌍을 제거해 잘못된 타입을 전달합니다.', impact:'잘못된 정수·tagged 값 해석으로 type confusion이 발생할 수 있습니다.', fix:'입력이 tagged-signed임이 보장된 경우에만 중복 변환을 제거합니다.'},
  'CVE-2022-4262': {where:'Parser scope / lazy reparse', cause:'lazy parsing과 재파싱 사이의 scope·strictness 정보가 달라 feedback layout이 어긋납니다.', impact:'컴파일러가 값을 잘못된 타입으로 취급해 힙 손상으로 이어질 수 있습니다.', fix:'scope snapshot과 eval bookkeeping을 재파싱 경로에서도 일관되게 유지합니다.'},
  'CVE-2023-0696': {where:'Wasm-to-JS frame handling', cause:'Wasm-to-JS 프레임의 instance와 source-position 정보를 잘못 연결해 런타임 타입 전제가 깨집니다.', impact:'crafted page가 V8 heap corruption을 유발할 수 있는 High 등급 type confusion입니다.', fix:'프레임에서 올바른 Wasm instance와 source position을 복원하도록 처리 경계를 수정합니다.'},
  'CVE-2023-1214': {where:'ValueSerializer / Map::Update', cause:'중첩 역직렬화 중 map이 deprecated된 뒤 dictionary map으로 갱신돼도 기존 transition chain을 계속 따릅니다.', impact:'객체 layout을 호환되지 않는 타입으로 해석해 힙 손상으로 이어질 수 있습니다.', fix:'Map::Update가 dictionary map을 반환하면 기존 fast transition 가정을 중단합니다.'},
  'CVE-2023-3079': {where:'Arguments keyed-store fast path', cause:'elements 저장소 확장 시 PACKED에서 HOLEY로 전환하지 않아 TheHole 값이 노출됩니다.', impact:'잘못된 타입 추론과 메모리 손상으로 이어질 수 있습니다.', fix:'저장소 확장 시 elements kind와 hole 상태를 함께 갱신합니다.'},
  'CVE-2023-4069': {where:'Maglev constructor lowering', cause:'constructor target과 new_target이 다를 때 initial map 검증 없이 객체를 생성합니다.', impact:'잘못된 object map을 통한 type confusion과 힙 손상이 가능합니다.', fix:'객체 생성 전에 constructor field와 initial map의 호환성을 검증합니다.'},
  'CVE-2023-4427': {where:'TurboFan for-in optimization', cause:'callback이 property representation을 바꿔도 이전 enumeration cache 길이를 사용합니다.', impact:'descriptor 경계를 벗어난 읽기와 후속 메모리 안전성 문제가 발생할 수 있습니다.', fix:'side effect 이후 enumeration cache와 descriptor 상태를 다시 검증합니다.'},
  'CVE-2024-5274': {where:'Parser ExpressionScope', cause:'parameter initializer 내부 class static block이 잘못된 ExpressionScope를 상속합니다.', impact:'this와 context layout 불일치로 type confusion이 발생할 수 있습니다.', fix:'static block의 scope와 context allocation을 바깥 initializer와 분리합니다.'},
  'CVE-2025-13630': {where:'Maglev Array.prototype.slice reduction', cause:'TryReduceArrayPrototypeSlice 최적화가 배열 상태에 대한 불충분한 타입 전제 아래 적용됩니다.', impact:'crafted page가 V8 heap corruption을 유발할 수 있는 High 등급 type confusion입니다.', fix:'slice 최적화 전에 배열 map·elements 조건을 강화하고 불확실하면 일반 경로로 되돌립니다.'}
};

const studyMetrics = [
  {key: 'target_coverage_auc', label: 'Target coverage AUC', kind: 'ratio', help: '실험 시간 전체에서 취약 함수 영역을 얼마나 지속적으로 탐색했는지'},
  {key: 'target_function_coverage', label: 'Final target coverage', kind: 'ratio', help: '종료 시점에 도달한 타깃 PC 비율'},
  {key: 'edge_coverage', label: 'Edge coverage', kind: 'integer', help: '전체 탐색 폭을 나타내는 최종 edge 수'},
  {key: 'unique_crashes', label: 'Unique crashes', kind: 'integer', help: '중복 제거된 crash bucket 수'}
];

function metricValue(value, kind) {
  if (value == null || !Number.isFinite(value)) return '—';
  if (kind === 'ratio') return `${(value * 100).toFixed(1)}%`;
  return new Intl.NumberFormat('en-US', {maximumFractionDigits: 1}).format(value);
}

function winnersFor(values) {
  const valid = Object.entries(values).filter(([, value]) => Number.isFinite(value));
  if (!valid.length) return [];
  const best = Math.max(...valid.map(([, value]) => value));
  return valid.filter(([, value]) => value === best).map(([arm]) => arm);
}

function intervalsForMetric(study, metricKey) {
  const result = {};
  const assign = (comparisonName, baselineArm, guidedArm) => {
    const row = study?.comparisons?.[comparisonName]?.metrics?.[metricKey];
    if (!row) return;
    if (Array.isArray(row.baseline_iqr)) result[baselineArm] = row.baseline_iqr;
    if (Array.isArray(row.guided_iqr)) result[guidedArm] = row.guided_iqr;
  };
  assign('one_shot_vs_stock', 'stock', 'one_shot');
  assign('heuristic_vs_one_shot', 'one_shot', 'heuristic_loop');
  assign('agent_vs_stock', 'stock', 'agent_loop');
  if (!result.agent_loop) assign('agent_vs_one_shot', 'one_shot', 'agent_loop');
  return result;
}

function renderStudyMetric(metric, arms, study) {
  const values = Object.fromEntries(Object.keys(armMeta).map(arm => [arm, arms?.[arm]?.[metric.key]]));
  const intervals = intervalsForMetric(study, metric.key);
  const valid = [
    ...Object.values(values),
    ...Object.values(intervals).flat()
  ].filter(value => Number.isFinite(value));
  const max = valid.length ? Math.max(...valid) : 0;
  const winners = winnersFor(values);
  const winnerText = winners.length === Object.keys(armMeta).length
    ? 'TIE' : winners.map(arm => armMeta[arm].label).join(' + ');
  const rows = Object.entries(armMeta).map(([arm, meta]) => {
    const value = values[arm];
    const width = max > 0 && Number.isFinite(value) ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0;
    const interval = intervals[arm];
    const hasInterval = Array.isArray(interval) && interval.every(Number.isFinite);
    const intervalLeft = hasInterval && max > 0 ? interval[0] / max * 100 : 0;
    const intervalWidth = hasInterval && max > 0 ? Math.max((interval[1] - interval[0]) / max * 100, 1) : 0;
    const intervalLabel = hasInterval
      ? `${metricValue(interval[0], metric.kind)}–${metricValue(interval[1], metric.kind)}` : '—';
    const isWinner = winners.includes(arm);
    return `<div class="study-row ${isWinner ? 'winner' : ''}">
      <span class="arm-label"><i class="arm-dot ${meta.className}"></i>${meta.label}</span>
      <span class="study-track"><i class="${meta.className}" style="width:${width}%"></i>${hasInterval ? `<em class="study-iqr" style="left:${intervalLeft}%;width:${intervalWidth}%" title="IQR ${intervalLabel}"></em>` : ''}</span>
      <b><span>${metricValue(value, metric.kind)}</span><small>IQR ${intervalLabel}</small></b>
    </div>`;
  }).join('');
  const agent = values.agent_loop;
  const stock = values.stock;
  const primary = study?.comparisons?.agent_vs_stock?.metrics?.[metric.key] || {};
  let insight = '비교할 유효 값이 충분하지 않습니다.';
  if (Number.isFinite(agent) && Number.isFinite(stock)) {
    const delta = agent - stock;
    const direction = delta > 0 ? '높고' : delta < 0 ? '낮고' : '같고';
    const significance = Number.isFinite(primary.p_value)
      ? `p=${primary.p_value.toFixed(4)}${primary.p_value < .05 ? '로 통계적으로 유의합니다' : '로 유의 기준을 충족하지 않습니다'}`
      : '유의성 검정값은 없습니다';
    if (metric.key === 'unique_crashes' || metric.key === 'novel_variant_candidates') {
      insight = agent === 0 && stock === 0
        ? `${metric.label}는 Agent와 Stock 모두 0입니다. 이 그래프만으로 실제 취약점 발견 우위를 주장할 수 없습니다.`
        : `Agent는 ${metricValue(agent, metric.kind)}, Stock은 ${metricValue(stock, metric.kind)}이며 ${significance}.`;
    } else {
      insight = `Agent 중앙값은 Stock보다 ${metricValue(Math.abs(delta), metric.kind)} ${direction} ${significance}.`;
    }
  }
  return `<section class="study-metric">
    <header><div><b>${metric.label}</b><small>${metric.help} · bar=median, outline=IQR</small></div><span>BEST · ${winnerText}</span></header>
    <div class="study-axis"><span>0</span><span>상대 크기</span><span>${metricValue(max, metric.kind)}</span></div>
    <div class="study-rows">${rows}</div><p class="chart-insight">${insight}</p>
  </section>`;
}

function selectExperiment(cve, scroll = true) {
  const exp = allExperiments.find(item => item.cve_id === cve);
  if (!exp) return;
  render(exp);
  if (scroll) el('detail').scrollIntoView({behavior: 'smooth', block: 'start'});
}

function cveYear(cve) {
  return String(cve || '').match(/^CVE-(\d{4})-/)?.[1] || 'OTHER';
}

function visibleExperiments() {
  return allExperiments.filter(exp => activeYear === 'all' || cveYear(exp.cve_id) === activeYear);
}

function renderCveTabs() {
  const tabs = el('cve-tabs');
  tabs.innerHTML = '';
  visibleExperiments().forEach(exp => {
    const button = document.createElement('button');
    button.textContent = exp.cve_id;
    button.dataset.cve = exp.cve_id;
    button.setAttribute('role', 'tab');
    button.onclick = () => selectExperiment(exp.cve_id, false);
    tabs.appendChild(button);
  });
}

function renderYearFilter() {
  const years = [...new Set(allExperiments.map(exp => cveYear(exp.cve_id)))].sort();
  el('year-filter').innerHTML = ['all', ...years].map(year =>
    `<button type="button" data-year="${year}" class="${activeYear === year ? 'active' : ''}" aria-pressed="${activeYear === year}">${year === 'all' ? 'ALL' : year}</button>`
  ).join('');
  el('year-filter').querySelectorAll('button').forEach(button => {
    button.onclick = () => {
      activeYear = button.dataset.year;
      renderYearFilter();
      renderCveTabs();
      const visible = visibleExperiments();
      const selected = selectedCve;
      if (visible.length && !visible.some(exp => exp.cve_id === selected)) {
        selectExperiment(visible.at(-1).cve_id, false);
      } else if (visible.length) {
        render(visible.find(exp => exp.cve_id === selected) || visible.at(-1));
      }
    };
  });
}

function renderCveBrief(exp) {
  const known = cveBriefs[exp.cve_id] || {};
  const component = known.component || exp.component || 'V8';
  const bugClass = known.bugClass || exp.bug_class || 'Unclassified';
  const tldr = known.tldr || `${component}에서 발생한 ${String(bugClass).replaceAll('_', ' ')} 취약점입니다. 현재 대시보드에는 실험 결과가 등록되어 있으며 상세 root-cause 설명은 아직 추가되지 않았습니다.`;
  const explanation = cveExplanations[exp.cve_id] || {
    where: component,
    cause: `${String(bugClass).replaceAll('_', ' ')} 조건에서 V8의 내부 타입 또는 객체 상태 전제가 깨집니다.`,
    impact: 'V8 메모리 안전성 위반으로 이어질 수 있어 취약·수정 빌드의 차등 검증이 필요합니다.',
    fix: '패치와 regression test를 기준으로 문제가 된 전제와 경계 검사를 복원합니다.'
  };
  const links = [
    {label: 'NVD', url: `https://nvd.nist.gov/vuln/detail/${encodeURIComponent(exp.cve_id)}`},
    ...(known.official || [])
  ];
  el('cve-year').textContent = cveYear(exp.cve_id);
  el('cve-brief-title').textContent = exp.cve_id;
  el('cve-taxonomy').innerHTML = `<span>${component}</span><span>${String(bugClass).replaceAll('_', ' ')}</span>`;
  el('cve-tldr').textContent = tldr;
  el('cve-where').textContent = explanation.where;
  el('cve-cause').textContent = explanation.cause;
  el('cve-impact').textContent = explanation.impact;
  el('cve-fix').textContent = explanation.fix;
  el('cve-links').innerHTML = links.map(link =>
    `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.label}<span aria-hidden="true">↗</span></a>`
  ).join('');
}

const findingLabels = {
  target_not_reached: 'TARGET NOT REACHED',
  target_reached: 'TARGET REACHED',
  candidate: 'CANDIDATE',
  confirmed_known_cve: 'KNOWN CVE',
  variant_pending: 'VARIANT PENDING',
  confirmed_variant: 'CONFIRMED VARIANT',
  false_positive: 'FALSE POSITIVE'
};

const findingDetails = {
  target_not_reached: '등록된 target 영역에 도달한 증거가 없습니다.',
  target_reached: 'Target 영역에는 도달했지만 candidate 또는 실제 취약점 finding은 확인되지 않았습니다.',
  candidate: '후보 입력이 생성됐으며 반복 재현·최소화·3-way validation이 필요합니다.',
  confirmed_known_cve: 'Vulnerable 빌드에서 재현되고 fixed 빌드에서 사라져 알려진 CVE 재발견으로 확인됐습니다.',
  variant_pending: 'Patch boundary와 다른 신호가 있지만 최소화·중복 제거·root-cause 확인이 남아 있습니다.',
  confirmed_variant: 'Current-upstream 재현과 최소화·중복 제거·root-cause 확인을 모두 통과했습니다.',
  false_positive: '반복 실행 불안정, timeout 또는 모든 빌드의 동일 동작으로 false positive 처리됐습니다.'
};

function findingStatus(study, cveId) {
  const targetReached = Object.values(study?.arm_metrics || {}).some(
    row => Number(row?.target_function_coverage || 0) > 0
  );
  return targetReached ? 'target_reached' : 'target_not_reached';
}

function renderFinalResult(study, cveId) {
  const panel = el('final-result');
  const decision = study?.statistical_decision?.level || '';
  const comparison = study?.comparisons?.agent_vs_stock?.metrics?.target_coverage_auc || {};
  const agentAuc = study?.arm_metrics?.agent_loop?.target_coverage_auc;
  const stockAuc = study?.arm_metrics?.stock?.target_coverage_auc;
  const delta = Number.isFinite(agentAuc) && Number.isFinite(stockAuc)
    ? (agentAuc - stockAuc) * 100 : null;
  const status = findingStatus(study, cveId);
  const positive = decision === 'confirmatory_positive';
  panel.classList.toggle('inconclusive', !positive);

  if (!study) {
    el('final-result-badge').textContent = 'NO RESULT';
    el('final-result-title').textContent = 'No completed experiment result';
    el('final-result-copy').textContent = '이 CVE에는 아직 품질 게이트를 통과한 최종 실험 결과가 없습니다.';
  } else if (positive) {
    el('final-result-badge').textContent = 'LOCALIZATION POSITIVE';
    el('final-result-title').textContent = '취약 영역 탐색 개선을 확인';
    el('final-result-copy').textContent = 'Agent loop가 Stock보다 target coverage AUC를 유의하게 개선했습니다.';
  } else {
    el('final-result-badge').textContent = 'INCONCLUSIVE';
    el('final-result-title').textContent = '확정적인 target 탐색 개선을 확인하지 못함';
    el('final-result-copy').textContent = 'Target coverage AUC 개선이 confirmatory 기준을 충족하지 못했습니다.';
  }
  el('final-result-delta').textContent = delta == null
    ? '—' : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%p`;
  el('final-result-p').textContent = Number.isFinite(comparison.p_value)
    ? comparison.p_value.toFixed(4) : '—';
  el('final-result-finding').textContent = findingLabels[status];
  const ladder = ['target_not_reached', 'target_reached'];
  el('finding-ladder').innerHTML = ladder.map(item =>
    `<span class="${item === status ? 'active' : ''}">${findingLabels[item]}</span>`
  ).join('');
  el('finding-detail').textContent = findingDetails[status];
  const trials = study?.design?.trials_per_arm;
  const armCount = Object.keys(study?.arm_metrics || {}).length;
  el('result-scale').textContent = Number.isFinite(trials)
    ? `${armCount || 4} arms × ${trials} trials = ${(armCount || 4) * trials} runs` : '실험 규모 정보 없음';
  el('result-quality').textContent = study
    ? `${study.result_quality_gate?.status || 'unknown'} · ${study.research_admissible ? 'research admissible' : 'exploratory'}` : 'NO RESULT';
  el('result-interpretation').textContent = positive
    ? 'Agent의 target 탐색 개선을 확인했습니다.'
    : 'Agent의 target 탐색 우위를 확정할 수 없습니다.';
}

function renderAgentStudy(cve) {
  const study = latestStudy(cve);
  if (!study) {
    el('agent-study-pill').textContent = 'NO DATA';
    el('agent-study').innerHTML = '<p class="caption">이 CVE의 4-arm 결과가 없습니다.</p>';
    return;
  }
  const arms = study.arm_metrics || {};
  const trials = study.design?.trials_per_arm;
  const evidenceReady = study.research_admissible === true;
  const modelPinned = study.design?.llm_model && study.design.llm_model !== 'default';
  const efficacyReady = Number.isFinite(trials) && trials >= 10 && evidenceReady && modelPinned;
  const targetWinners = winnersFor(Object.fromEntries(Object.keys(armMeta).map(arm => [arm, arms?.[arm]?.target_coverage_auc])));
  const edgeWinners = winnersFor(Object.fromEntries(Object.keys(armMeta).map(arm => [arm, arms?.[arm]?.edge_coverage])));
  const targetNames = targetWinners.map(arm => armMeta[arm].label).join(' + ') || '측정 불가';
  const edgeNames = edgeWinners.map(arm => armMeta[arm].label).join(' + ') || '측정 불가';
  el('agent-study-pill').textContent = `${trials ?? '—'} TRIALS / ARM · ${efficacyReady ? 'EFFICACY' : 'EXPLORATORY'}`;
  el('agent-study').innerHTML = `<div class="study-summary">
      <div><small>TARGET SEARCH LEADER</small><b>${targetNames}</b></div>
      <div><small>SEARCH BREADTH LEADER</small><b>${edgeNames}</b></div>
      <div class="confidence ${efficacyReady ? 'ready' : 'smoke'}"><small>EVIDENCE LEVEL</small><b>${efficacyReady ? '효능 비교 가능' : '탐색적 결과'}</b><p>${efficacyReady ? 'PoC 차등·모델 고정·반복 수 기준을 충족했습니다.' : 'PoC 차등, 명시적 모델, n ≥ 10을 모두 충족해야 효능 결론에 포함됩니다.'}</p></div>
    </div>
    <div class="study-chart-grid">${studyMetrics.map(metric => renderStudyMetric(metric, arms, study)).join('')}</div>`;
}

function latestDiscovery(cveId, experimentType = null) {
  return discoveryStudies.filter(row =>
    !row.fixture && row.cve_id === cveId
      && (!experimentType || row.experiment_type === experimentType)
  ).sort((a,b) => Number(b.artifact_mtime_ns || 0) - Number(a.artifact_mtime_ns || 0))[0];
}

function renderDiscoveryEvaluation(cveId) {
  const rediscovery = latestDiscovery(cveId, 'poc_free_rediscovery');
  const variant = latestDiscovery(cveId, 'variant_discovery');
  const active = rediscovery || variant;
  const guided = latestStudy(cveId);
  const guidedFinding = guided?.fuzzer_discovery?.status === 'rediscovered';
  el('guided-lane-summary').textContent = guided
    ? `Target AUC 판정: ${guided.statistical_decision?.level || '미판정'} · 실제 finding ${guidedFinding ? '있음' : '없음'}`
    : 'Guided/localization 결과가 없습니다.';
  el('rediscovery-lane-summary').textContent = rediscovery
    ? `품질 gate ${rediscovery.quality_gate?.status || 'unknown'} · confirmed known-CVE ${rediscovery.coverage_finding_separation?.confirmed_known_cve_count || 0}`
    : 'PoC-free rediscovery 결과가 없습니다.';
  el('variant-lane-summary').textContent = variant
    ? `과거 호환 결과 · confirmed variant ${variant.coverage_finding_separation?.confirmed_variant_count || 0}`
    : '과거 Variant-discovery 결과가 없습니다.';

  if (!active) {
    el('discovery-quality-pill').textContent = 'NO DATA';
    el('discovery-arm-comparison').innerHTML = '<p class="caption">이 CVE의 discovery 실행 결과가 없습니다.</p>';
    el('trigger-funnel').innerHTML = '<p class="caption">No trigger evidence</p>';
    el('discovery-findings').innerHTML = '<p class="caption">No finding evidence</p>';
    el('discovery-cost').innerHTML = '<p class="caption">No cost evidence</p>';
    el('discovery-arm-insight').textContent = 'Discovery arm 결과가 없어 탐색 폭이나 finding 성능을 비교할 수 없습니다.';
    el('trigger-insight').textContent = 'Trigger 단계 도달 증거가 없습니다.';
    el('cost-insight').textContent = 'Provider 사용량과 finding당 비용을 계산할 실행 결과가 없습니다.';
  } else {
    const arms = active.arm_summary || {};
    el('discovery-quality-pill').textContent = `${active.experiment_type} · ${active.quality_gate?.status || 'unknown'}`;
    const maxEdge = Math.max(1, ...Object.values(arms).map(row => Number(row.edge_coverage_median || 0)));
    el('discovery-arm-comparison').innerHTML = Object.entries(arms).map(([name, row]) =>
      `<div class="discovery-bar-row ${name}"><b>${name.replaceAll('_',' ')}</b><span class="discovery-track"><i style="width:${Number(row.edge_coverage_median || 0) / maxEdge * 100}%"></i></span><small>edge ${fmt(row.edge_coverage_median)} · finding ${Number(row.rediscoveries || 0) + Number(row.confirmed_variants || 0)}</small></div>`
    ).join('');
    const edgeLeader = Object.entries(arms).sort((a,b) => Number(b[1].edge_coverage_median || 0) - Number(a[1].edge_coverage_median || 0))[0];
    const totalFindings = Object.values(arms).reduce((n,row) => n + Number(row.rediscoveries || 0) + Number(row.confirmed_variants || 0), 0);
    el('discovery-arm-insight').textContent = edgeLeader
      ? `${armMeta[edgeLeader[0]]?.label || edgeLeader[0].replaceAll('_',' ')}가 edge coverage 중앙값 ${fmt(edgeLeader[1].edge_coverage_median)}로 가장 넓게 탐색했습니다. 전체 confirmed finding은 ${totalFindings}개입니다.`
      : '유효한 arm 비교값이 없습니다.';
    const agent = arms.agent_loop || {};
    const funnel = agent.trigger_stage_reach_rate || {};
    el('trigger-funnel').innerHTML = [1,2,3,4,5].map(stage => {
      const rate = Number(funnel[String(stage)] || 0);
      return `<div class="funnel-row"><b>STAGE ${stage}</b><i style="width:${rate * 100}%"></i><small>${fmt(rate * 100)}%</small></div>`;
    }).join('');
    const reachedStages = [1,2,3,4,5].filter(stage => Number(funnel[String(stage)] || 0) > 0);
    const deepest = reachedStages.length ? Math.max(...reachedStages) : 0;
    el('trigger-insight').textContent = deepest
      ? `Agent arm은 최대 trigger stage ${deepest}까지 도달했습니다. 뒤 단계로 갈수록 비율이 줄면 trigger 조건 조합이 병목입니다.`
      : 'Agent arm이 등록된 trigger stage에 도달하지 못했습니다.';
    const validations = active.candidate_validations || [];
    const statuses = validations.map(row => row?.confirmation?.status).filter(Boolean);
    const findingRows = [
      ['Candidates', Object.values(arms).reduce((n,row)=>n+Number(row.candidates||0),0)],
      ['Known-CVE rediscoveries', active.coverage_finding_separation?.confirmed_known_cve_count || 0],
      ['Validation status', active.candidate_validation_status || 'unknown'],
      ['Evidence states', statuses.join(', ') || 'none']
    ];
    if (active.experiment_type === 'variant_discovery') {
      findingRows.splice(2, 0, ['Confirmed variants', active.coverage_finding_separation?.confirmed_variant_count || 0]);
    }
    el('discovery-findings').innerHTML = findingRows.map(([name,value]) => `<div class="finding-datum"><span>${name}</span><b>${value}</b></div>`).join('');
    const costs = active.discovery_costs || {};
    el('discovery-cost').innerHTML = [
      ['Provider calls', costs.provider_calls], ['Tokens', Number(costs.input_tokens||0)+Number(costs.output_tokens||0)],
      ['Latency', costs.latency_seconds == null ? null : `${fmt(costs.latency_seconds)}s`],
      ['Total cost', costs.cost_usd == null ? 'not priced' : `$${Number(costs.cost_usd).toFixed(4)}`],
      ['Cost / candidate', costs.cost_per_candidate == null ? 'n/a' : `$${Number(costs.cost_per_candidate).toFixed(4)}`],
      ['Cost / confirmed finding', costs.cost_per_confirmed_finding == null ? 'n/a' : `$${Number(costs.cost_per_confirmed_finding).toFixed(4)}`]
    ].map(([name,value]) => `<div class="cost-datum"><span>${name}</span><b>${value ?? '—'}</b></div>`).join('');
    el('cost-insight').textContent = totalFindings > 0
      ? `${costs.provider_calls ?? '—'}회 provider 호출로 confirmed finding ${totalFindings}개를 얻었습니다. 가격표가 고정된 경우에만 달러 비용을 비교할 수 있습니다.`
      : `${costs.provider_calls ?? '—'}회 provider 호출이 있었지만 confirmed finding은 0개여서 finding당 비용은 산출할 수 없습니다.`;
  }

  const forest = discoveryStudies.filter(row => !row.fixture).map(row => ({
    cve: row.cve_id,
    effect: row.discovery_comparisons?.agent_vs_stock?.a12,
    ci: row.discovery_comparisons?.agent_vs_stock?.a12_ci95,
    type: row.experiment_type
  })).filter(row => Number.isFinite(row.effect));
  el('discovery-forest').innerHTML = forest.length ? forest.map(row =>
    `<div class="forest-row"><b>${row.cve}<small> ${row.type}</small></b><span class="forest-axis">${Array.isArray(row.ci) ? `<i class="forest-ci" style="left:${row.ci[0]*100}%;width:${Math.max(1,(row.ci[1]-row.ci[0])*100)}%"></i>` : ''}<i class="forest-point" style="left:${Math.max(0,Math.min(100,row.effect*100))}%"></i></span><small>A12 ${Number(row.effect).toFixed(2)}</small></div>`
  ).join('') : '<p class="caption">Forest plot에 표시할 실제 discovery effect가 없습니다.</p>';
  if (forest.length) {
    const agentFavored = forest.filter(row => row.effect > .5).length;
    const neutral = forest.filter(row => row.effect === .5).length;
    el('forest-insight').textContent = `${forest.length}개 discovery 효과 중 ${agentFavored}개가 Agent 방향(A12 > 0.5), ${neutral}개가 동률입니다. 신뢰구간이 0.5를 가로지르면 우위를 확정할 수 없습니다.`;
  } else {
    el('forest-insight').textContent = '비교 가능한 discovery effect와 신뢰구간이 아직 없습니다.';
  }
}

function renderCampaign() {
  const campaign = [...campaigns].reverse().find(item => item.status === 'complete' && item.preflight?.ready)
    || campaigns.at(-1);
  if (!campaign) return;
  const preflight = campaign.preflight || {};
  el('campaign-pill').textContent = preflight.ready ? 'READY' : 'BLOCKED';
  el('campaign-status').innerHTML = (preflight.entries || []).map(item =>
    `<div class="guide-row"><span>${item.cve} · ${item.split || 'unknown'}</span><b class="${item.ready?'yes':'no'}">${item.ready?'READY':`${item.errors.length} BLOCKERS`}</b></div>`
  ).join('');
}

function render(exp) {
  const study = latestStudy(exp.cve_id);
  selectedCve = exp.cve_id;
  renderCveBrief(exp);
  renderFinalResult(study, exp.cve_id);
  renderDiscoveryEvaluation(exp.cve_id);
  document.querySelectorAll('.tabs button').forEach(b => {
    const active = b.dataset.cve === exp.cve_id;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  const studyEdge = study?.comparisons?.agent_vs_stock?.metrics?.edge_coverage || {};
  const edge = exp.metrics?.edge_coverage || {
    baseline_median: study?.arm_metrics?.stock?.edge_coverage,
    guided_median: study?.arm_metrics?.agent_loop?.edge_coverage,
    a12: studyEdge.a12,
    a12_magnitude: studyEdge.a12_magnitude,
    p_value: studyEdge.p_value
  };
  const studyCrashes = study?.comparisons?.agent_vs_stock?.metrics?.unique_crashes || {};
  const crashes = exp.metrics?.unique_crashes || {
    baseline_median: study?.arm_metrics?.stock?.unique_crashes ?? studyCrashes.baseline_median,
    guided_median: study?.arm_metrics?.agent_loop?.unique_crashes ?? studyCrashes.guided_median
  };
  const max = Math.max(edge.guided_median || 0, edge.baseline_median || 0, 1);
  el('edge-baseline').textContent = fmt(edge.baseline_median);
  el('edge-guided').textContent = fmt(edge.guided_median);
  el('edge-effect').textContent = `A12 ${fmt(edge.a12)}`;
  el('edge-bars').innerHTML = `<div class="edge-axis"><span>0</span><span>EDGE COVERAGE</span><span>${fmt(max)}</span></div>
    <div class="edge-bar-row"><b>Stock</b><div class="bar stock"><i style="width:${(edge.baseline_median||0)/max*100}%"></i></div><strong>${fmt(edge.baseline_median)}</strong></div>
    <div class="edge-bar-row"><b>Guided</b><div class="bar guided"><i style="width:${(edge.guided_median||0)/max*100}%"></i></div><strong>${fmt(edge.guided_median)}</strong></div>`;
  el('edge-caption').textContent = `guided uplift ${pct(exp.edge_uplift_percent)} · ${edge.a12_magnitude || 'n/a'} effect · p ${edge.p_value == null ? 'not computed' : fmt(edge.p_value)}`;
  if (Number.isFinite(edge.guided_median) && Number.isFinite(edge.baseline_median)) {
    const delta = edge.guided_median - edge.baseline_median;
    el('edge-insight').textContent = delta > 0
      ? `Guided가 Stock보다 ${fmt(delta)}개 많은 edge를 탐색했습니다. 이는 탐색 폭의 증가이며 실제 취약점 finding과는 별도입니다.`
      : delta < 0
        ? `Guided가 Stock보다 ${fmt(Math.abs(delta))}개 적은 edge를 탐색했습니다. target AUC가 높다면 넓이보다 취약 영역 집중도가 높았다는 뜻입니다.`
        : 'Guided와 Stock의 edge coverage 중앙값이 같습니다.';
  } else {
    el('edge-insight').textContent = 'Edge coverage 비교값이 없습니다.';
  }
  const poc = study?.poc_evidence || exp.poc_evidence || {
    status: exp.poc_reproduced ? 'verified' : 'not_checked',
    detail: exp.poc_reproduced ? 'legacy PoC check passed' : 'no PoC verification evidence is registered'
  };
  const pocView = {
    verified: ['VERIFIED', 'pass'],
    legacy_vulnerable_only: ['VULNERABLE ONLY', 'warn'],
    failed: ['VERIFICATION FAILED', 'fail'],
    not_checked: ['NOT CHECKED', 'warn'],
    invalid_evidence: ['INVALID EVIDENCE', 'fail']
  }[poc.status] || ['UNKNOWN', 'warn'];
  el('poc-status').textContent = pocView[0];
  el('poc-dot').className = `status-dot ${pocView[1]}`;
  el('poc-detail').textContent = `${poc.detail}${poc.oracle ? ` · oracle: ${poc.oracle}` : ''}`;

  const rediscovery = {status: 'not_evaluated', detail: 'experimental lane is hidden from the default view'};
  const rediscoveryView = {
    rediscovered: ['REDISCOVERED', 'pass'],
    not_rediscovered: ['NOT REDISCOVERED', 'warn'],
    not_evaluated: ['NOT EVALUATED', '']
  }[rediscovery.status] || ['UNKNOWN', ''];
  el('rediscovery-status').textContent = rediscoveryView[0];
  el('rediscovery-dot').className = `status-dot ${rediscoveryView[1]}`;
  el('rediscovery-detail').textContent = rediscovery.detail;
  const studyTarget = study?.arm_metrics?.agent_loop?.target_function_coverage;
  const target = (exp.target_coverage && Object.keys(exp.target_coverage).length)
    ? exp.target_coverage
    : (Number.isFinite(studyTarget)
      ? {status:'available', reason:'Agent-study report의 instrumented target map을 사용했습니다.'}
      : {});
  el('target-tag').textContent = target.status || 'unknown';
  el('target-value').textContent = target.status === 'available'
    ? metricValue(exp.metrics?.target_function_coverage?.guided_median ?? studyTarget, 'ratio') : 'UNAVAILABLE';
  el('target-reason').textContent = target.reason || 'Instrumented target map is available.';
  el('crash-baseline').textContent = fmt(crashes.baseline_median);
  el('crash-guided').textContent = fmt(crashes.guided_median);

  const d = exp.design || {}, budget = d.budget || {};
  el('mode-pill').textContent = `${exp.run_metadata.mode || 'unknown'} / ${exp.run_metadata.llm_provider || 'unknown'}`;
  el('contract').innerHTML = [
    ['TRIALS / ARM', budget.trials_per_arm ?? d.trials_per_arm],
    ['WALL / TRIAL', (budget.wall_seconds_per_trial ?? d.wall_seconds_per_trial) == null ? '—' : `${budget.wall_seconds_per_trial ?? d.wall_seconds_per_trial}s`],
    ['CPU CORES', budget.cpu_cores], ['SPLIT', exp.split], ['COMPONENT', exp.component], ['BUG CLASS', exp.bug_class]
  ].map(([k,v]) => `<div class="datum"><small>${k}</small><b>${v ?? '—'}</b></div>`).join('');

  const applied = exp.guided_execution[0]?.applied || {};
  const compiled = exp.guided_execution[0]?.seed_compilation;
  el('seed-pill').textContent = compiled ? `${compiled.compiled}/${compiled.requested} seeds` : 'no seed data';
  el('guidance').innerHTML = Object.entries(applied).map(([k,v]) => `<div class="guide-row"><span>${k.replaceAll('_',' ')}</span><b class="${v?'yes':'no'}">${v?'APPLIED':'NOT APPLIED'}</b></div>`).join('');

  const enough = !!d.recommended_repetitions_met, paired = !!d.paired_seed_lineage;
  const targetReady = target.status === 'available';
  el('gates').innerHTML = [
    gate('KNOWN PoC DIFFERENTIAL', poc.differential_verified ? 'pass' : poc.status === 'failed' ? 'fail' : 'warn', pocView[0]),
    gate('BUDGET PARITY', d.identical_budget_verified?'pass':'fail', d.identical_budget_verified?'arms use the same limits':'budget mismatch'),
    gate('REPETITIONS', enough?'pass':'warn', enough?'n ≥ 10':'smoke only; n < 10'),
    gate('RNG PAIRING', paired?'pass':'warn', paired?'paired inference enabled':'CLI cannot fix RNG seed'),
    gate('TARGET MAP', targetReady?'pass':'warn', targetReady?`${target.target_edges} PCs mapped`:'target coverage unavailable')
  ].join('');
  const evidenceAdmissible = study?.research_admissible === true;
  const explicitModel = study?.design?.llm_model && study.design.llm_model !== 'default';
  el('verdict').textContent = enough && paired && targetReady && evidenceAdmissible && explicitModel ? 'EFFICACY-READY' : 'EXPLORATORY · NOT A CONFIRMATORY EFFICACY CLAIM';
  renderAgentStudy(exp.cve_id);
}

fetch('data/results.json').then(r => r.json()).then(data => {
  agentStudies = data.agent_studies || [];
  campaigns = data.campaigns || [];
  discoveryStudies = data.discovery_studies || [];
  const experiments = [...data.experiments];
  const represented = new Set(experiments.map(exp => exp.cve_id));
  agentStudies.forEach(study => {
    if (represented.has(study.cve_id)) return;
    represented.add(study.cve_id);
    experiments.push({
      cve_id: study.cve_id,
      component: '—', bug_class: '—', split: study.status || 'agent study',
      metrics: {}, target_coverage: {}, design: study.design || {},
      run_metadata: {mode: 'real', llm_provider: 'see study'},
      guided_execution: [], validation: {}, poc_reproduced: false,
      poc_evidence: study.poc_evidence,
      edge_uplift_percent: null
    });
  });
  allExperiments = experiments;
  renderYearFilter();
  renderCveTabs();
  if (experiments.length) render(experiments.at(-1));
  el('generated').textContent = `SNAPSHOT ${new Date(data.generated_at).toLocaleString('ko-KR')}`;
  renderCampaign();
}).catch(err => { el('verdict').textContent = `DATA LOAD FAILED · ${err.message}`; });

