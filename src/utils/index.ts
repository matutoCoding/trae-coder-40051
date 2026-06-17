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
