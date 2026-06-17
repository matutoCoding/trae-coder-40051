import { BatchStatus, ProcessCard } from "../types";

export const statusMap: Record<
  BatchStatus,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  pending: { label: "待排产", color: "text-slate-600", bgColor: "bg-slate-50", dotColor: "bg-slate-400" },
  loading: { label: "装炉中", color: "text-blue-600", bgColor: "bg-blue-50", dotColor: "bg-blue-500" },
  carburizing: { label: "渗碳淬火中", color: "text-orange-600", bgColor: "bg-orange-50", dotColor: "bg-orange-500" },
  quenching: { label: "淬火中", color: "text-cyan-600", bgColor: "bg-cyan-50", dotColor: "bg-cyan-500" },
  tempering: { label: "回火中", color: "text-amber-600", bgColor: "bg-amber-50", dotColor: "bg-amber-500" },
  inspecting: { label: "检测中", color: "text-purple-600", bgColor: "bg-purple-50", dotColor: "bg-purple-500" },
  correcting: { label: "矫正中", color: "text-pink-600", bgColor: "bg-pink-50", dotColor: "bg-pink-500" },
  completed: { label: "已完成", color: "text-green-600", bgColor: "bg-green-50", dotColor: "bg-green-500" },
};

export const resultMap: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  pass: { label: "合格", color: "text-green-700", bgColor: "bg-green-100" },
  fail: { label: "不合格", color: "text-red-700", bgColor: "bg-red-100" },
  pending: { label: "待检测", color: "text-slate-600", bgColor: "bg-slate-100" },
  correcting: { label: "矫正中", color: "text-pink-700", bgColor: "bg-pink-100" },
};

export const processStatusMap: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  active: { label: "生效中", color: "text-green-700", bgColor: "bg-green-100" },
  draft: { label: "草稿", color: "text-slate-600", bgColor: "bg-slate-100" },
  obsolete: { label: "已废止", color: "text-red-700", bgColor: "bg-red-100" },
};

export const cn = (...classes: (string | undefined | false)[]) =>
  classes.filter(Boolean).join(" ");

export const formatDateTime = (str?: string) => {
  if (!str) return "-";
  return str;
};

export const parseNumberArray = (input: string): number[] => {
  if (!input || input.trim() === "") return [];
  return input
    .split(/[,，\s]+/)
    .map((s) => s.trim())
    .filter((s) => s !== "")
    .map((s) => parseFloat(s))
    .filter((n) => !isNaN(n) && isFinite(n) && n !== null && n !== undefined);
};

export const strictValidateNumberArray = (
  input: string,
  minCount: number = 1,
  min?: number,
  max?: number
): { valid: boolean; values: number[]; error?: string; details?: string[] } => {
  const details: string[] = [];

  if (!input || input.trim() === "") {
    return { valid: false, values: [], error: "请输入数值", details: ["输入不能为空"] };
  }

  if (/[a-zA-Z\u4e00-\u9fa5]/.test(input.replace(/[，]/g, ""))) {
    const letters = input.match(/[a-zA-Z\u4e00-\u9fa5]/g);
    details.push(`检测到 ${letters?.length || 0} 个非数字字符`);
  }

  const rawItems = input.split(/[,，]/).map((s) => s.trim());
  const emptyCount = rawItems.filter((s) => s === "").length;
  if (emptyCount > 0) {
    details.push(`存在 ${emptyCount} 个空项（重复分隔符或首尾分隔符）`);
  }

  const doubleDot = rawItems.filter((s) => (s.match(/\./g) || []).length > 1).length;
  if (doubleDot > 0) {
    details.push(`有 ${doubleDot} 项格式错误（多个小数点）`);
  }

  const values = parseNumberArray(input);

  if (values.length < minCount) {
    details.unshift(`有效数值仅 ${values.length} 个，至少需要 ${minCount} 个`);
    return { valid: false, values, error: `有效数值不足，需要至少 ${minCount} 个`, details };
  }

  if (details.length > 0 && values.length > 0) {
    return { valid: false, values, error: "输入格式有问题，请检查", details };
  }

  if (min !== undefined && values.some((v) => v < min)) {
    const below = values.filter((v) => v < min);
    details.push(`有 ${below.length} 个数值小于最小值 ${min}`);
    return { valid: false, values, error: `存在数值超出下限 (${min})`, details };
  }

  if (max !== undefined && values.some((v) => v > max)) {
    const above = values.filter((v) => v > max);
    details.push(`有 ${above.length} 个数值大于最大值 ${max}`);
    return { valid: false, values, error: `存在数值超出上限 (${max})`, details };
  }

  return { valid: true, values };
};

export const safeAvg = (arr: number[]): number => {
  if (!arr || arr.length === 0) return 0;
  const valid = arr.filter((n) => !isNaN(n) && isFinite(n));
  if (valid.length === 0) return 0;
  const sum = valid.reduce((a, b) => a + b, 0);
  return Math.round((sum / valid.length) * 1000) / 1000;
};

export const validateNumberArray = (
  input: string,
  minCount: number = 1,
  min?: number,
  max?: number
): { valid: boolean; values: number[]; error?: string; details?: string[] } => {
  return strictValidateNumberArray(input, minCount, min, max);
};

export interface AbnormalityResult {
  isAbnormal: boolean;
  reasons: string[];
  details: string[];
  missingItems: string[];
  failItems: string[];
  limitItems: string[];
  layerDepth: { avg: number; min: number; max: number; pass: boolean } | null;
  surfaceHardness: { avg: number; min: number; max: number; pass: boolean } | null;
  coreHardness: { avg: number; min: number; max: number; pass: boolean } | null;
}

export function calcBatchAbnormalities(
  batchId: string,
  data: {
    furnaceBatches: any[];
    processCards: any[];
    partItems: any[];
    carburizingRecords: any[];
    temperingRecords: any[];
    metallographyRecords: any[];
    hardnessRecords: any[];
    deformationRecords: any[];
  }
): AbnormalityResult {
  const reasons: string[] = [];
  const details: string[] = [];
  const missingItems: string[] = [];
  const failItems: string[] = [];
  const limitItems: string[] = [];

  const carb = data.carburizingRecords.find((r) => r.batchId === batchId);
  const temp = data.temperingRecords.find((r) => r.batchId === batchId);
  const mt = data.metallographyRecords.filter((r) => r.batchId === batchId);
  const hd = data.hardnessRecords.filter((r) => r.batchId === batchId);
  const df = data.deformationRecords.filter((r) => r.batchId === batchId);
  const batchParts = data.partItems.filter((p) => p.batchId === batchId);
  const batch = data.furnaceBatches.find((b) => b.id === batchId);
  const card: ProcessCard | undefined = data.processCards.find((c) => c.id === batch?.processCardId);

  if (batchParts.length === 0) { reasons.push("缺装炉零件"); details.push("装炉零件清单为空"); missingItems.push("装炉零件"); }
  if (!carb) { reasons.push("缺渗碳记录"); details.push("缺少渗碳淬火环节记录"); missingItems.push("渗碳记录"); }
  if (!temp) { reasons.push("缺回火记录"); details.push("缺少回火处理环节记录"); missingItems.push("回火记录"); }
  if (mt.length === 0) { reasons.push("缺金相记录"); details.push("缺少金相检测环节记录"); missingItems.push("金相记录"); }
  if (hd.length === 0) { reasons.push("缺硬度记录"); details.push("缺少硬度检验环节记录"); missingItems.push("硬度记录"); }

  const failMt = mt.filter((m) => m.result === "fail");
  if (failMt.length > 0) {
    reasons.push("金相不合格");
    failMt.forEach((m) => { const s = `金相不合格: 试样${m.sampleNo} (${m.partNo})`; details.push(s); failItems.push(s); });
  }
  const failHd = hd.filter((h) => h.result === "fail");
  if (failHd.length > 0) {
    reasons.push("硬度不合格");
    failHd.forEach((h) => { const s = `硬度不合格: 试样${h.sampleNo} 表面${h.surfaceAvg}HRC`; details.push(s); failItems.push(s); });
  }
  const failDf = df.filter((d) => d.result === "fail");
  if (failDf.length > 0) {
    reasons.push("变形矫正不合格");
    failDf.forEach((d) => { const s = `变形不合格: 零件${d.partNo} ${d.measurementPoint}`; details.push(s); failItems.push(s); });
  }

  let layerDepthResult: AbnormalityResult["layerDepth"] = null;
  let surfaceHardnessResult: AbnormalityResult["surfaceHardness"] = null;
  let coreHardnessResult: AbnormalityResult["coreHardness"] = null;

  if (card && carb) {
    const avgD = safeAvg(carb.layerDepths);
    layerDepthResult = { avg: avgD, min: card.layerDepthMin, max: card.layerDepthMax, pass: true };
    if (avgD < card.layerDepthMin) {
      const s = `渗碳层深偏低: 均值${avgD.toFixed(3)}mm < 要求${card.layerDepthMin}mm`;
      reasons.push("渗碳层深超限"); details.push(s); limitItems.push(s);
      layerDepthResult.pass = false;
    }
    if (avgD > card.layerDepthMax) {
      const s = `渗碳层深偏高: 均值${avgD.toFixed(3)}mm > 要求${card.layerDepthMax}mm`;
      reasons.push("渗碳层深超限"); details.push(s); limitItems.push(s);
      layerDepthResult.pass = false;
    }
  }

  if (card && hd.length > 0) {
    const avgS = safeAvg(hd.map((h) => h.surfaceAvg));
    const avgC = safeAvg(hd.map((h) => h.coreAvg));

    surfaceHardnessResult = { avg: avgS, min: card.hardnessMin, max: card.hardnessMax, pass: true };
    if (avgS < card.hardnessMin) {
      const s = `表面硬度偏低: 均值${avgS.toFixed(1)}HRC < 要求${card.hardnessMin}HRC`;
      reasons.push("表面硬度超限"); details.push(s); limitItems.push(s);
      surfaceHardnessResult.pass = false;
    }
    if (avgS > card.hardnessMax) {
      const s = `表面硬度偏高: 均值${avgS.toFixed(1)}HRC > 要求${card.hardnessMax}HRC`;
      reasons.push("表面硬度超限"); details.push(s); limitItems.push(s);
      surfaceHardnessResult.pass = false;
    }

    const cMin = card.coreHardnessMin;
    const cMax = card.coreHardnessMax;
    coreHardnessResult = { avg: avgC, min: cMin, max: cMax, pass: true };
    if (avgC < cMin) {
      const s = `心部硬度偏低: 均值${avgC.toFixed(1)}HRC < 要求${cMin}HRC`;
      reasons.push("心部硬度超限"); details.push(s); limitItems.push(s);
      coreHardnessResult.pass = false;
    }
    if (avgC > cMax) {
      const s = `心部硬度偏高: 均值${avgC.toFixed(1)}HRC > 要求${cMax}HRC`;
      reasons.push("心部硬度超限"); details.push(s); limitItems.push(s);
      coreHardnessResult.pass = false;
    }
  }

  return {
    isAbnormal: reasons.length > 0,
    reasons: Array.from(new Set(reasons)),
    details,
    missingItems,
    failItems,
    limitItems,
    layerDepth: layerDepthResult,
    surfaceHardness: surfaceHardnessResult,
    coreHardness: coreHardnessResult,
  };
}
