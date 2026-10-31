#!/usr/bin/env python3
"""Refresh public-site facts from a local v8-fuzz-lab checkout.

The public site keeps editorial labels in site-summary.json, while revision,
case status, completed paired comparisons, general metrics, token totals, and
milestone dates are re-derived from the research repository.
"""

from __future__ import annotations

import argparse
import json
import re
import statistics
import subprocess
from pathlib import Path


ROOT = Path(__file__).parent
SUMMARY = ROOT / "site-summary.json"

TIMELINE_RULES = (
    (r"Initialize reproducible V8 fuzzing lab", "재현 가능한 연구 기반 구축", "V8·Fuzzilli 실행 환경과 증거 레코드 구조를 초기화했습니다.", "foundation"),
    (r"Record paired B2 adaptation effect results", "첫 paired B2 적응 효과", "공유 corpus와 다음-window weight 적용을 연결해 목표 generator 증가를 확인했습니다.", "adaptation"),
    (r"Record four-strategy long comparison results", "4-generator 장기 비교", "여러 CVE-derived generator를 포함한 B0/B1/B2 장기 비교를 완료했습니다.", "comparison"),
    (r"Record adaptation-effect-v3 results", "Policy v3 · 1→100 적용", "희박한 generator 호출을 줄이는 고가중치 adaptation을 검증했습니다.", "adaptation"),
    (r"Record long B0/B1/B2 v8 mirror", "v7 신호의 미러 검증", "방향을 뒤집은 v8에서 일반 퍼징 우월성이 재현되지 않아 최종 주장을 축소했습니다.", "verdict"),
    (r"Record cross-family adaptation replication", "교차 계열 반복", "Wasm GC와 Maglev 계열에서 target 적응과 일반 지표를 분리해 평가했습니다.", "comparison"),
    (r"Complete CVE-2024-5838 and CVE-2021-38003 comparisons", "개발·external 비교 확장", "Wasm JSPI와 JSON exception-path 캠페인을 완료했습니다.", "comparison"),
    (r"Complete CVE-2021-21225 holdout comparison", "Array species external holdout", "동결된 정책으로 세 paired repetition을 완료했습니다.", "holdout"),
    (r"Complete CVE-2022-1134 holdout evaluation", "Super IC external holdout", "세 번째 external holdout과 포트폴리오 primary evidence를 완성했습니다.", "holdout"),
    (r"Add external holdout portfolio verdict", "포트폴리오 최종 판정 v2", "9/9 target 효과와 일반 효과 0/3을 최종 주장으로 동결했습니다.", "verdict"),
    (r"Verify CVE-2023-2033 historical boundary", "CVE-2023-2033 역사 경계 검증", "Error stack/global proxy의 parent/fix 구조 차등을 3/3로 확인했습니다.", "cve"),
    (r"Add CVE-2023-2033 bounded generator", "CVE-2023-2033 generator smoke", "500-iteration smoke에서 target hit과 27/27 변형 조합을 확인했습니다.", "cve"),
    (r"Freeze CVE-2023-2033 B0 B1 B2 campaign", "CVE-2023-2033 비교 동결", "Development B0/B1/B2 v1의 schedule·eligibility·runner를 동결했습니다.", "cve"),
)


def git(lab: Path, *args: str) -> str:
    return subprocess.check_output(["git", *args], cwd=lab, text=True).strip()


def parse_index(lab: Path) -> dict[str, dict[str, str]]:
    rows: dict[str, dict[str, str]] = {}
    text = (lab / "cve" / "index.md").read_text(encoding="utf-8")
    for line in text.splitlines():
        match = re.match(r"\| (CVE-\d{4}-\d+) \| ([^|]+) \| ([^|]+) \| (.+) \|$", line)
        if match:
            rows[match.group(1)] = {
                "status": match.group(2).strip(),
                "source_role": match.group(3).strip(),
                "source_description": match.group(4).strip(),
            }
    return rows


def signed_number(text: str) -> float:
    return float(text.replace("+", ""))


def markdown_number(value: str) -> int | float | None:
    cleaned = value.strip().replace(",", "").replace("%", "").replace("−", "-")
    if not cleaned or cleaned in {"-", "—", "N/A", "n/a"}:
        return None
    try:
        number = float(cleaned)
    except ValueError:
        return None
    return int(number) if number.is_integer() else number


def parse_arm_results(text: str) -> list[dict[str, object]]:
    """Extract the per-repetition B0/B1/B2 table from a completed report."""
    lines = text.splitlines()
    for index, line in enumerate(lines[:-2]):
        if not line.startswith("|") or "반복" not in line or not ("arm" in line or "실험군" in line):
            continue
        headers = [item.strip() for item in line.strip("|").split("|")]
        if not re.match(r"^\s*\|?\s*:?-+", lines[index + 1]):
            continue
        rows: list[dict[str, object]] = []
        for raw in lines[index + 2 :]:
            if not raw.startswith("|"):
                break
            values = [item.strip() for item in raw.strip("|").split("|")]
            if len(values) != len(headers):
                continue
            source = dict(zip(headers, values))

            def pick(*needles: str) -> int | float | None:
                for header, value in source.items():
                    lowered = header.lower()
                    if any(needle.lower() in lowered for needle in needles):
                        return markdown_number(value)
                return None

            arm = next((value for header, value in source.items() if header.lower() in {"arm", "실험군"}), "")
            if arm not in {"B0", "B1", "B2"}:
                continue
            rows.append({
                "repetition": pick("반복"),
                "arm": arm,
                "target_hits": pick("목표 도달"),
                "executions": pick("예산 실행"),
                "interesting": pick("유의미 샘플"),
                "corpus": pick("말뭉치"),
                "coverage_percent": pick("커버리지"),
                "crashes": pick("crash", "충돌"),
                "timeouts": pick("timeout"),
            })
        return rows
    return []


def normalized_smoke(record: dict[str, object]) -> dict[str, object] | None:
    smoke = record.get("smoke") or record.get("mutation_axis_smoke") or record.get("initial_smoke")
    if not isinstance(smoke, dict):
        return None

    def first(*keys: str) -> object | None:
        for key in keys:
            if key in smoke and smoke[key] is not None:
                return smoke[key]
        return None

    return {
        "iterations": first("iterations", "budgeted_executions"),
        "executions": first("overall_total_executions", "overall_total_execs", "total_execs"),
        "valid": first("overall_valid", "valid"),
        "interesting": first("overall_interesting", "interesting"),
        "corpus": first("overall_corpus_size", "corpus_size", "final_corpus_size"),
        "coverage_percent": first("overall_coverage_percent", "coverage_percent"),
        "crashes": first("overall_crashes", "crashes", "crashed", "generator_crashed"),
        "timeouts": first("overall_timeouts", "timeouts", "timed_out", "generator_timed_out"),
        "invocations": first("invocations", "generator_invocations"),
        "target_hits": first("structural_target_hits", "retained_target_hits", "target_hit_histories", "generator_interesting", "interesting"),
        "variant_cells_observed": first("variant_cells_observed", "unique_variants", "retained_unique_variants"),
        "variant_cells_expected": first("variant_cells_expected"),
    }


def parse_comparison(path: Path, case: dict[str, object], prior: dict[str, object] | None) -> dict[str, object] | None:
    text = path.read_text(encoding="utf-8")
    target = re.search(r"B2[-−]B1 목표 도달\s*차이\s*:\s*`\[([^]]+)\]`", text)
    general = re.search(
        r"B2[-−]B1 일반 지표 중앙값:\s*유의미 샘플 `([+−-]?\d+)`,\s*말뭉치 `([+−-]?\d+)`,\s*커버리지 `([+−-]?\d+(?:\.\d+)?)%p`",
        text,
    )
    if not target or not general:
        return None
    deltas = [int(value.strip()) for value in target.group(1).split(",")]
    general_line = general.group(0) + text[general.end() : general.end() + 80]
    supported = "지원되지" not in general_line and "미지지" not in general_line and "일관되지" not in general_line

    token_match = re.search(r"총 토큰 `([\d,]+)`", text)
    if not token_match:
        token_match = re.search(r"입력/출력/총 토큰:\s*`[\d,]+\s*/\s*[\d,]+\s*/\s*([\d,]+)`", text)
    tokens = int(token_match.group(1).replace(",", "")) if token_match else None

    role = str(prior["role"]) if prior else str(case["role"])
    mechanism = str(prior["mechanism"]) if prior else str(case["mechanism"])
    return {
        "id": case["id"],
        "mechanism": mechanism,
        "generator": (prior or {}).get("generator") or case.get("generator_name", ""),
        "role": role,
        "deltas": deltas,
        "median": int(statistics.median(deltas)),
        "general_effect": "지원" if supported else "미지지",
        "general_metrics": {
            "interesting": int(signed_number(general.group(1).replace("−", "-"))),
            "corpus": int(signed_number(general.group(2).replace("−", "-"))),
            "coverage_pp": signed_number(general.group(3).replace("−", "-")),
        },
        "tokens": tokens,
        "crashes": 0 if re.search(r"crash(?:나|와|/failure)?\s*0|crash[^\n]{0,30}없", text, re.I) else None,
        "report": path.stem,
        "arm_results": parse_arm_results(text),
    }


def discover_comparisons(lab: Path, data: dict[str, object]) -> list[dict[str, object]]:
    cases = {item["id"]: item for item in data["cve_cases"]}
    previous = {item["id"]: item for item in data.get("comparison_campaigns", [])}
    found: dict[str, dict[str, object]] = {}
    for path in sorted((lab / "experiments" / "results").glob("CVE-*-b012-*.md")):
        if any(word in path.stem.lower() for word in ("abort", "precondition")):
            continue
        match = re.match(r"(CVE-\d{4}-\d+)-", path.name)
        if not match or match.group(1) not in cases:
            continue
        parsed = parse_comparison(path, cases[match.group(1)], previous.get(match.group(1)))
        if parsed:
            found[match.group(1)] = parsed
    order = [item["id"] for item in data.get("comparison_campaigns", [])]
    order += sorted(identifier for identifier in found if identifier not in order)
    return [found[identifier] for identifier in order if identifier in found]


def build_timeline(lab: Path) -> list[dict[str, str]]:
    raw = git(lab, "log", "--date=short", "--pretty=format:%H%x1f%ad%x1f%s", "--", "experiments/results", "cve")
    commits = [line.split("\x1f", 2) for line in raw.splitlines() if line.count("\x1f") == 2]
    timeline: list[dict[str, str]] = []
    for pattern, title, detail, category in TIMELINE_RULES:
        for revision, date, subject in commits:
            if re.search(pattern, subject, re.I):
                timeline.append({
                    "date": date,
                    "revision": revision[:7],
                    "title": title,
                    "detail": detail,
                    "category": category,
                })
                break
    return sorted(timeline, key=lambda item: (item["date"], item["revision"]))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lab-root", required=True, type=Path)
    args = parser.parse_args()
    lab = args.lab_root.resolve()
    data = json.loads(SUMMARY.read_text(encoding="utf-8"))

    revision = git(lab, "rev-parse", "HEAD")
    updated = git(lab, "show", "-s", "--date=format:%Y-%m-%d", "--format=%ad", "HEAD")
    index = parse_index(lab)
    cases = data["cve_cases"]
    public_ids = {item["id"] for item in cases}
    if public_ids != set(index):
        raise SystemExit(f"CVE metadata needs editorial mapping: source={sorted(index)} public={sorted(public_ids)}")

    for case in cases:
        case["status"] = index[case["id"]]["status"]
        case["source_role"] = index[case["id"]]["source_role"]
        normalized = str(case["status"])
        case["stage"] = (
            "deferred" if "deferred" in normalized
            else normalized if normalized in {"migrated", "historical_verified", "linked", "excluded"}
            else case["stage"]
        )

    smoke_verified = 0
    strategy_by_cve: dict[str, dict[str, object]] = {}
    for path in (lab / "records").glob("CVE-*-strategy.json"):
        record = json.loads(path.read_text(encoding="utf-8"))
        smoke_verified += record.get("status") == "smoke_verified"
        match = re.match(r"(CVE-\d{4}-\d+)-strategy\.json", path.name)
        if match:
            strategy_by_cve[match.group(1)] = record
    for case in cases:
        strategy = strategy_by_cve.get(case["id"])
        if strategy:
            case["generator_name"] = strategy.get("implementation", {}).get("generator", "")
            case["smoke_metrics"] = normalized_smoke(strategy)
        else:
            case["smoke_metrics"] = None

    comparisons = discover_comparisons(lab, data)
    for comparison in comparisons:
        case = next(item for item in cases if item["id"] == comparison["id"])
        summary = f"B2−B1 {comparison['deltas']} · 중앙값 +{comparison['median']}"
        if comparison["id"] == "CVE-2023-4069":
            summary += " · transfer [3,5,5] · rollback 완료"
        case["comparison"] = summary
    external = [item for item in comparisons if item["role"] == "external holdout"]
    external_deltas = [value for item in external for value in item["deltas"]]
    external_tokens = sum(item["tokens"] or 0 for item in external)
    metrics = data["metrics"]
    metrics.update({
        "smoke_verified_generators": smoke_verified,
        "cve_cases": len(cases),
        "completed_paired_campaigns": len(comparisons),
        "completed_paired_repetitions": sum(len(item["deltas"]) for item in comparisons),
        "external_holdout_positive_pairs": sum(value > 0 for value in external_deltas),
        "external_holdout_total_pairs": len(external_deltas),
        "external_holdout_campaigns": len(external),
        "pooled_target_hit_median": int(statistics.median(external_deltas)),
        "pooled_target_hit_sum": sum(external_deltas),
        "general_effect_supported_campaigns": sum(item["general_effect"] == "지원" for item in external),
        "codex_calls": len(external) * 6,
        "codex_tokens": external_tokens,
        "target_delta_per_1k_tokens": round(sum(external_deltas) / (external_tokens / 1000), 3),
    })
    data.update({
        "lab_revision": revision,
        "updated": updated,
        "updated_display": updated.replace("-", "."),
        "external_holdouts": external,
        "comparison_campaigns": comparisons,
        "timeline": build_timeline(lab),
    })
    SUMMARY.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"synced {revision[:12]}: {len(cases)} cases, {smoke_verified} generators, {len(comparisons)} comparisons")


if __name__ == "__main__":
    main()
