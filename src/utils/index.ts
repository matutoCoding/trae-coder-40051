import { BatchStatus } from "../types";

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
