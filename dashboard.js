const formatValue = (value, suffix = "") =>
  value === null || value === undefined ? "—" : `${value}${suffix}`;

async function loadMetrics() {
  const container = document.querySelector("[data-metrics]");
  if (!container) return;

  try {
    const response = await fetch("data/metrics.json", { cache: "no-store" });
    if (!response.ok) throw new Error("metrics unavailable");
    const data = await response.json();
    const cards = [
      ["검증 완료 CVE", formatValue(data.summary.verified_cves), "공개 검증을 통과한 대상"],
      ["총 대응 실험", formatValue(data.summary.paired_trials), "Baseline + Guided"],
      ["표적 커버리지 향상", formatValue(data.summary.median_target_coverage_delta, "%p"), "중앙값 기준"],
      ["최초 신호 시간 단축", formatValue(data.summary.median_time_reduction, "%"), "중앙값 기준"],
    ];

    container.innerHTML = cards
      .map(([label, value, note]) => `<article class="summary-card visible"><p>${label}</p><strong>${value}</strong><span>${note}</span></article>`)
      .join("");

    const status = document.querySelector("[data-status] p");
    const updated = document.querySelector("[data-updated]");
    if (status) status.textContent = data.status === "published" ? "검증된 공개 데이터" : "공개 데이터 준비 중";
    if (updated) updated.textContent = data.updated_at ? `업데이트 ${data.updated_at}` : "업데이트 예정";

    const experiments = document.querySelector("[data-experiments]");
    if (experiments && data.experiments?.length) {
      experiments.querySelector(".empty-state")?.remove();
      experiments.insertAdjacentHTML(
        "beforeend",
        data.experiments.map((item) => `
          <a class="table-row" href="${item.report_url || "reports.html"}">
            <span>${item.target}</span><span>${item.reproduced ? "성공" : "미확인"}</span>
            <span>${formatValue(item.coverage_delta, "%p")}</span><span>${formatValue(item.effect_size)}</span>
            <span class="result-badge">${item.status}</span>
          </a>`).join("")
      );
    }
  } catch (error) {
    document.querySelector("[data-status] p").textContent = "공개 데이터 준비 중";
    document.querySelector("[data-updated]").textContent = "업데이트 예정";
  }
}

async function loadReports() {
  const container = document.querySelector("[data-reports]");
  if (!container) return;

  try {
    const response = await fetch("data/reports.json", { cache: "no-store" });
    if (!response.ok) throw new Error("reports unavailable");
    const data = await response.json();
    const reports = data.reports || [];
    document.querySelector("[data-report-count]").textContent = reports.length;
    if (!reports.length) return;

    container.innerHTML = reports.map((report, index) => `
      <a class="report-item visible" href="${report.url}">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <div><p>${report.type}</p><h2>${report.title}</h2><small>${report.summary}</small></div>
        <time>${report.date}</time><b>↗</b>
      </a>`).join("");
  } catch (error) {
    document.querySelector("[data-report-count]").textContent = "0";
  }
}

loadMetrics();
loadReports();
