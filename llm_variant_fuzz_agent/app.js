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
  }
};

const studyMetrics = [
  {key: 'target_coverage_auc', label: 'Target coverage AUC', kind: 'ratio', help: '실험 시간 전체에서 취약 함수 영역을 얼마나 지속적으로 탐색했는지'},
  {key: 'target_function_coverage', label: 'Final target coverage', kind: 'ratio', help: '종료 시점에 도달한 타깃 PC 비율'},
  {key: 'edge_coverage', label: 'Edge coverage', kind: 'integer', help: '전체 탐색 폭을 나타내는 최종 edge 수'},
  {key: 'unique_crashes', label: 'Unique crashes', kind: 'integer', help: '중복 제거된 crash bucket 수'},
  {key: 'novel_variant_candidates', label: 'Variant candidates', kind: 'integer', help: '후속 검증 대상으로 분류된 신규 변종 후보'}
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
  return `<section class="study-metric">
    <header><div><b>${metric.label}</b><small>${metric.help} · bar=median, outline=IQR</small></div><span>BEST · ${winnerText}</span></header>
    <div class="study-rows">${rows}</div>
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
  const links = [
    {label: 'NVD', url: `https://nvd.nist.gov/vuln/detail/${encodeURIComponent(exp.cve_id)}`},
    ...(known.official || [])
  ];
  el('cve-year').textContent = cveYear(exp.cve_id);
  el('cve-brief-title').textContent = exp.cve_id;
  el('cve-taxonomy').innerHTML = `<span>${component}</span><span>${String(bugClass).replaceAll('_', ' ')}</span>`;
  el('cve-tldr').textContent = tldr;
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
  const discovery = [...discoveryStudies].reverse().find(row =>
    !row.fixture && row.cve_id === cveId
  );
  const confirmation = discovery?.candidate_validation?.confirmation?.status;
  if (confirmation === 'confirmed_variant') return 'confirmed_variant';
  if (confirmation === 'confirmed_known_cve'
      || study?.fuzzer_discovery?.status === 'rediscovered') return 'confirmed_known_cve';
  if (confirmation === 'false_positive') return 'false_positive';
  if (['related_variant_candidate', 'variant_priority'].includes(confirmation)) return 'variant_pending';
  const armCandidateCount = Object.values(study?.arm_metrics || {}).reduce(
    (total, row) => total + Number(row?.novel_variant_candidates || 0), 0
  );
  const triageCandidateCount = Object.values(study?.crash_triage?.arms || {}).reduce(
    (total, row) => total + Number(row?.variant_candidates || 0), 0
  );
  if (armCandidateCount + triageCandidateCount > 0) return 'candidate';
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
  const rediscovered = study?.fuzzer_discovery?.status === 'rediscovered';
  const status = findingStatus(study, cveId);
  const positive = decision === 'confirmatory_positive';
  panel.classList.toggle('inconclusive', !positive);

  if (!study) {
    el('final-result-badge').textContent = 'NO RESULT';
    el('final-result-title').textContent = 'No completed experiment result';
    el('final-result-copy').textContent = '이 CVE에는 아직 품질 게이트를 통과한 최종 실험 결과가 없습니다.';
  } else if (positive && rediscovered) {
    el('final-result-badge').textContent = 'CONFIRMED + FINDING';
    el('final-result-title').textContent = 'Localization improved and the CVE was rediscovered';
    el('final-result-copy').textContent = 'Agent loop가 preregistered target AUC를 개선했고, 퍼징 과정에서 알려진 CVE oracle도 독립적으로 재발견했습니다.';
  } else if (positive) {
    el('final-result-badge').textContent = 'LOCALIZATION POSITIVE';
    el('final-result-title').textContent = 'Better target localization, no actual rediscovery';
    el('final-result-copy').textContent = 'Agent loop는 Stock보다 target coverage AUC를 유의하게 개선했지만, 이번 퍼징 실행에서 실제 CVE 재발견은 확인되지 않았습니다.';
  } else if (rediscovered) {
    el('final-result-badge').textContent = 'FINDING OBSERVED';
    el('final-result-title').textContent = 'CVE rediscovered without a localization efficacy claim';
    el('final-result-copy').textContent = '실제 CVE 재발견은 관찰됐지만, target coverage AUC 개선은 confirmatory 기준을 충족하지 못했습니다.';
  } else {
    el('final-result-badge').textContent = 'INCONCLUSIVE';
    el('final-result-title').textContent = 'No confirmatory improvement or actual rediscovery';
    el('final-result-copy').textContent = 'Target coverage AUC 개선이 confirmatory 기준을 충족하지 못했고, 실제 CVE 재발견도 확인되지 않았습니다.';
  }
  el('final-result-delta').textContent = delta == null
    ? '—' : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%p`;
  el('final-result-p').textContent = Number.isFinite(comparison.p_value)
    ? comparison.p_value.toFixed(4) : '—';
  el('final-result-finding').textContent = ['confirmed_known_cve', 'confirmed_variant'].includes(status)
    ? findingLabels[status] : 'NO CONFIRMED FINDING';
  const ladder = [
    status === 'target_not_reached' ? 'target_not_reached' : 'target_reached',
    'candidate', 'confirmed_known_cve', 'variant_pending',
    'confirmed_variant', 'false_positive'
  ];
  el('finding-ladder').innerHTML = ladder.map(item =>
    `<span class="${item === status ? 'active' : ''}">${findingLabels[item]}</span>`
  ).join('');
  el('finding-detail').textContent = findingDetails[status];
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
  document.querySelectorAll('.tabs button').forEach(b => {
    const active = b.dataset.cve === exp.cve_id;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  const edge = exp.metrics.edge_coverage || {};
  const crashes = exp.metrics.unique_crashes || {};
  const max = Math.max(edge.guided_median || 0, edge.baseline_median || 0, 1);
  el('edge-baseline').textContent = fmt(edge.baseline_median);
  el('edge-guided').textContent = fmt(edge.guided_median);
  el('edge-effect').textContent = `A12 ${fmt(edge.a12)}`;
  el('edge-bars').innerHTML = `<div class="bar stock"><i style="width:${(edge.baseline_median||0)/max*100}%"></i></div><div class="bar guided"><i style="width:${(edge.guided_median||0)/max*100}%"></i></div>`;
  el('edge-caption').textContent = `guided uplift ${pct(exp.edge_uplift_percent)} · ${edge.a12_magnitude || 'n/a'} effect · p ${edge.p_value == null ? 'not computed' : fmt(edge.p_value)}`;
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

  const rediscovery = study?.fuzzer_discovery || {status: 'not_evaluated', detail: 'no four-arm study is registered'};
  const rediscoveryView = {
    rediscovered: ['REDISCOVERED', 'pass'],
    not_rediscovered: ['NOT REDISCOVERED', 'warn'],
    not_evaluated: ['NOT EVALUATED', '']
  }[rediscovery.status] || ['UNKNOWN', ''];
  el('rediscovery-status').textContent = rediscoveryView[0];
  el('rediscovery-dot').className = `status-dot ${rediscoveryView[1]}`;
  el('rediscovery-detail').textContent = rediscovery.detail;
  const target = exp.target_coverage || {};
  el('target-tag').textContent = target.status || 'unknown';
  el('target-value').textContent = target.status === 'available' ? fmt(exp.metrics.target_function_coverage?.guided_median) : 'UNAVAILABLE';
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
    gate('FUZZER REDISCOVERY', rediscovery.status === 'rediscovered' ? 'pass' : rediscovery.status === 'not_rediscovered' ? 'warn' : 'fail', rediscoveryView[0]),
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

