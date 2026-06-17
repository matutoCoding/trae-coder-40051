import { useState, useMemo } from "react";
import { useStore } from "@/store";
import { cn, formatDateTime, statusMap, safeAvg, calcBatchAbnormalities } from "@/utils";
import {
  BarChart3,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Package,
  CheckCircle2,
  AlertTriangle,
  Flame,
  FileText,
  Users,
  TrendingUp,
  BarChart2,
  LineChart as LineChartIcon,
  XCircle,
  Trophy,
  Wrench,
  PieChart as PieChartIcon,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";

const parseDateKey = (s: string | undefined) => {
  if (!s) return "";
  return s.slice(0, 10);
};

const toEndOfDay = (dateStr: string) => {
  if (!dateStr) return "";
  return `${dateStr} 23:59:59`;
};

const inDateRange = (ts: string | undefined, from: string, to: string): boolean => {
  if (!ts) return !from && !to;
  const t = ts.replace(/\//g, "-");
  if (from && t < from) return false;
  if (to && t > toEndOfDay(to)) return false;
  return true;
};

export default function Statistics() {
  const {
    furnaceBatches,
    partItems,
    processCards,
    carburizingRecords,
    temperingRecords,
    metallographyRecords,
    hardnessRecords,
    deformationRecords,
    abnormalDispositions,
    batchDispositions,
  } = useStore();

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [furnaceNo, setFurnaceNo] = useState("");
  const [processCardId, setProcessCardId] = useState("");
  const [customer, setCustomer] = useState("");

  const allFurnaceNos = useMemo(
    () => Array.from(new Set(furnaceBatches.map((b) => b.furnaceNo).filter(Boolean))),
    [furnaceBatches]
  );
  const allCustomers = useMemo(
    () => Array.from(new Set(partItems.map((p) => p.customer).filter(Boolean))),
    [partItems]
  );

  const filteredBatches = useMemo(() => {
    return furnaceBatches.filter((b) => {
      if (furnaceNo && b.furnaceNo !== furnaceNo) return false;
      if (processCardId && b.processCardId !== processCardId) return false;
      if (!inDateRange(b.startTime, dateFrom, dateTo)) return false;
      const batchParts = partItems.filter((p) => p.batchId === b.id);
      if (customer && !batchParts.some((p) => p.customer === customer)) return false;
      return true;
    });
  }, [furnaceBatches, partItems, dateFrom, dateTo, furnaceNo, processCardId, customer]);

  const batchIds = useMemo(() => filteredBatches.map((b) => b.id), [filteredBatches]);

  const batchPartCustomers = useMemo(() => {
    const map = new Map<string, string[]>();
    partItems.forEach((p) => {
      if (!p.batchId || !p.customer) return;
      const arr = map.get(p.batchId) || [];
      if (!arr.includes(p.customer)) arr.push(p.customer);
      map.set(p.batchId, arr);
    });
    return map;
  }, [partItems]);

  const stats = useMemo(() => {
    const totalBatches = filteredBatches.length;
    const completedBatches = filteredBatches.filter((b) => b.status === "completed").length;

    let totalQty = 0;
    let completedQty = 0;
    filteredBatches.forEach((b) => {
      const qty = partItems.filter((p) => p.batchId === b.id).reduce((s, p) => s + p.quantity, 0);
      totalQty += qty;
      if (b.status === "completed") completedQty += qty;
    });

    const mt = metallographyRecords.filter((r) => batchIds.includes(r.batchId));
    const hd = hardnessRecords.filter((r) => batchIds.includes(r.batchId));
    const df = deformationRecords.filter((r) => batchIds.includes(r.batchId));
    const totalTests = mt.length + hd.length + df.length;
    const passedTests =
      mt.filter((r) => r.result === "pass").length +
      hd.filter((r) => r.result === "pass").length +
      df.filter((r) => r.result === "pass").length;
    const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : "0";

    const failTests =
      mt.filter((r) => r.result === "fail").length +
      hd.filter((r) => r.result === "fail").length +
      df.filter((r) => r.result === "fail").length;

    const reworkCount = abnormalDispositions.filter(
      (x) => batchIds.includes(x.batchId) && x.status === "rework"
    ).length;
    const concessionCount = abnormalDispositions.filter(
      (x) => batchIds.includes(x.batchId) && x.status === "concession"
    ).length;

    return {
      totalBatches, completedBatches, totalQty, completedQty,
      passRate, totalTests, passedTests,
      failTests, reworkCount, concessionCount,
    };
  }, [filteredBatches, partItems, metallographyRecords, hardnessRecords, deformationRecords, batchIds, abnormalDispositions]);

  const dailyTrend = useMemo(() => {
    const map = new Map<string, { batches: number; completed: number; qty: number; passed: number; total: number; rework: number }>();
    filteredBatches.forEach((b) => {
      const day = parseDateKey(b.startTime) || "未知";
      if (!map.has(day)) map.set(day, { batches: 0, completed: 0, qty: 0, passed: 0, total: 0, rework: 0 });
      const d = map.get(day)!;
      d.batches++;
      if (b.status === "completed") d.completed++;
      d.qty += partItems.filter((p) => p.batchId === b.id).reduce((s, p) => s + p.quantity, 0);
    });
    [...metallographyRecords, ...hardnessRecords, ...deformationRecords].forEach((r) => {
      if (!batchIds.includes(r.batchId)) return;
      const day = parseDateKey(r.recordTime) || "未知";
      if (!map.has(day)) map.set(day, { batches: 0, completed: 0, qty: 0, passed: 0, total: 0, rework: 0 });
      const d = map.get(day)!;
      d.total++;
      if (r.result === "pass") d.passed++;
    });
    abnormalDispositions.forEach((a) => {
      if (!batchIds.includes(a.batchId) || a.status !== "rework") return;
      const day = parseDateKey(a.updatedAt) || "未知";
      if (!map.has(day)) map.set(day, { batches: 0, completed: 0, qty: 0, passed: 0, total: 0, rework: 0 });
      map.get(day)!.rework++;
    });
    const arr = Array.from(map.entries())
      .map(([date, v]) => ({
        date,
        炉次数: v.batches,
        完成数: v.completed,
        装炉数量: v.qty,
        合格率: v.total > 0 ? Number(((v.passed / v.total) * 100).toFixed(1)) : 0,
        返工数: v.rework,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    return arr.slice(-14);
  }, [filteredBatches, partItems, metallographyRecords, hardnessRecords, deformationRecords, batchIds, abnormalDispositions]);

  const processCardStats = useMemo(() => {
    return processCards
      .map((card) => {
        const batches = filteredBatches.filter((b) => b.processCardId === card.id);
        const qty = batches.reduce(
          (s, b) => s + partItems.filter((p) => p.batchId === b.id).reduce((ps, p) => ps + p.quantity, 0),
          0
        );
        const bIds = batches.map((b) => b.id);
        const tests = [...metallographyRecords, ...hardnessRecords, ...deformationRecords].filter((r) =>
          bIds.includes(r.batchId)
        );
        const passed = tests.filter((r) => r.result === "pass").length;
        return {
          card,
          batches: batches.length,
          qty,
          passRate: tests.length > 0 ? ((passed / tests.length) * 100).toFixed(1) : "-",
        };
      })
      .filter((s) => s.batches > 0)
      .sort((a, b) => b.batches - a.batches);
  }, [filteredBatches, processCards, partItems, metallographyRecords, hardnessRecords, deformationRecords]);

  const customerStats = useMemo(() => {
    const map = new Map<string, { batches: Set<string>; qty: number; tests: number; passed: number; rework: number; failTests: number }>();
    partItems.forEach((p) => {
      if (!p.customer || !batchIds.includes(p.batchId)) return;
      if (!map.has(p.customer)) map.set(p.customer, { batches: new Set(), qty: 0, tests: 0, passed: 0, rework: 0, failTests: 0 });
      const c = map.get(p.customer)!;
      c.batches.add(p.batchId);
      c.qty += p.quantity;
    });
    [...metallographyRecords, ...hardnessRecords, ...deformationRecords].forEach((r) => {
      if (!batchIds.includes(r.batchId)) return;
      const custs = batchPartCustomers.get(r.batchId) || [];
      custs.forEach((cust) => {
        if (!map.has(cust)) map.set(cust, { batches: new Set(), qty: 0, tests: 0, passed: 0, rework: 0, failTests: 0 });
        const c = map.get(cust)!;
        c.tests++;
        if (r.result === "pass") c.passed++;
        if (r.result === "fail") c.failTests++;
      });
    });
    abnormalDispositions.forEach((a) => {
      if (!batchIds.includes(a.batchId)) return;
      const custs = batchPartCustomers.get(a.batchId) || [];
      custs.forEach((cust) => {
        if (map.has(cust) && a.status === "rework") map.get(cust)!.rework++;
      });
    });
    const arr = Array.from(map.entries()).map(([name, v]) => ({
      name,
      batches: v.batches.size,
      qty: v.qty,
      passRate: v.tests > 0 ? Number(((v.passed / v.tests) * 100).toFixed(1)) : 0,
      tests: v.tests,
      passed: v.passed,
      failTests: v.failTests,
      rework: v.rework,
    })).sort((a, b) => b.passRate - a.passRate);
    return arr;
  }, [partItems, batchIds, metallographyRecords, hardnessRecords, deformationRecords, batchPartCustomers, abnormalDispositions]);

  const monthlyStats = useMemo(() => {
    const monthMap = new Map<string, { month: string; 客户: number; 工艺: number; 炉次数: number }>();
    filteredBatches.forEach((b) => {
      const dt = parseDateKey(b.startTime);
      if (!dt) return;
      const month = dt.slice(0, 7);
      if (!monthMap.has(month)) monthMap.set(month, { month, 客户: 0, 工艺: 0, 炉次数: 0 });
      const m = monthMap.get(month)!;
      m.炉次数++;
      const custs = batchPartCustomers.get(b.id) || [];
      m.客户 = Math.max(m.客户, custs.length);
      const uniqCards = new Set<string>();
      uniqCards.add(b.processCardId);
      m.工艺 = Math.max(m.工艺, uniqCards.size);
    });
    const custMonth = new Map<string, Map<string, number>>();
    customerStats.forEach((c) => { c.name; });
    partItems.forEach((p) => {
      if (!p.customer || !batchIds.includes(p.batchId)) return;
      const b = furnaceBatches.find((fb) => fb.id === p.batchId);
      const month = parseDateKey(b?.startTime).slice(0, 7);
      if (!month) return;
      if (!custMonth.has(p.customer)) custMonth.set(p.customer, new Map());
      const mm = custMonth.get(p.customer)!;
      mm.set(month, (mm.get(month) || 0) + p.quantity);
    });
    return {
      byMonth: Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month)),
    };
  }, [filteredBatches, batchPartCustomers, customerStats, partItems, furnaceBatches, batchIds]);

  const resetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setFurnaceNo("");
    setProcessCardId("");
    setCustomer("");
  };

  const exportReport = () => {
    let content = "============================================================\n";
    content += "            生 产 统 计 报 表\n";
    content += "============================================================\n\n";
    content += `生成时间: ${new Date().toLocaleString()}\n`;
    content += `统计范围: ${dateFrom || "不限"} ~ ${dateTo || "不限"}\n`;
    content += `炉号: ${furnaceNo || "全部"}\n`;
    content += `工艺卡: ${processCards.find((c) => c.id === processCardId)?.code || "全部"}\n`;
    content += `客户: ${customer || "全部"}\n\n`;

    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    content += "一、总体指标\n";
    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    content += `  炉次总数: ${stats.totalBatches} 炉\n`;
    content += `  已完成炉次: ${stats.completedBatches} 炉\n`;
    content += `  完成率: ${stats.totalBatches > 0 ? ((stats.completedBatches / stats.totalBatches) * 100).toFixed(1) : "0"}%\n`;
    content += `  装炉总数量: ${stats.totalQty} 件\n`;
    content += `  已完成数量: ${stats.completedQty} 件\n`;
    content += `  检测合格率: ${stats.passRate}% (${stats.passedTests}/${stats.totalTests})\n\n`;

    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    content += "二、按工艺卡统计\n";
    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    if (processCardStats.length > 0) {
      processCardStats.forEach((s, i) => {
        content += `  ${i + 1}. ${s.card.code} - ${s.card.name}\n`;
        content += `     炉次数: ${s.batches} | 数量: ${s.qty}件 | 合格率: ${s.passRate}%\n`;
      });
    } else {
      content += "  无数据\n";
    }
    content += "\n";

    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    content += "三、炉次明细\n";
    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    if (filteredBatches.length > 0) {
      filteredBatches.forEach((b, i) => {
        const qty = partItems.filter((p) => p.batchId === b.id).reduce((s, p) => s + p.quantity, 0);
        const card = processCards.find((c) => c.id === b.processCardId);
        content += `  ${i + 1}. ${b.batchNo} [${statusMap[b.status]?.label}]\n`;
        content += `     炉号: ${b.furnaceNo} | 工艺: ${card?.code || "-"} | 数量: ${qty}件\n`;
        content += `     开始: ${b.startTime || "-"} | 操作员: ${b.operator || "-"}\n`;
      });
    } else {
      content += "  无符合条件的炉次\n";
    }
    content += "\n";

    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    content += "四、客户合格率排行榜\n";
    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    if (customerStats.length > 0) {
      customerStats.forEach((c, i) => {
        content += `  ${i + 1}. ${c.name}\n`;
        content += `     炉次: ${c.batches}炉 | 数量: ${c.qty}件 | 检测: ${c.passed}/${c.tests}\n`;
        content += `     合格率: ${c.passRate}% | 返工: ${c.rework}项 | 不合格: ${c.failTests}项\n`;
      });
    } else {
      content += "  无客户数据\n";
    }
    content += "\n";

    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    content += "五、月度对比\n";
    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    if (monthlyStats.byMonth.length > 0) {
      monthlyStats.byMonth.forEach((m, i) => {
        content += `  ${i + 1}. ${m.month}\n`;
        content += `     炉次: ${m.炉次数}炉 | 客户数: ${m.客户} | 工艺数: ${m.工艺}\n`;
      });
    } else {
      content += "  无月度数据\n";
    }
    content += "\n";

    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    content += "六、返工与让步汇总\n";
    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    content += `  总返工项: ${stats.reworkCount} 项\n`;
    content += `  总让步放行项: ${stats.concessionCount} 项\n`;
    content += `  总不合格检测项: ${stats.failTests} 项\n\n`;
    content += "  按日返工趋势:\n";
    dailyTrend.forEach((d) => {
      content += `    ${d.date}: 返工${d.返工数}项 / 炉次${d.炉次数}炉 / 合格率${d.合格率}%\n`;
    });
    content += "\n";

    content += "============================================================\n";
    content += "                   报表结束\n";
    content += "============================================================\n";

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `生产统计报表_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="card-base">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary-50 border border-primary-100 text-primary-600 flex items-center justify-center">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">筛选条件</h3>
              <p className="text-[11px] text-slate-400">按日期、炉号、工艺卡、客户筛选汇总</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={resetFilters} className="btn-outline !py-2 !px-3 text-xs">
              <RefreshCw className="w-3.5 h-3.5" />
              重置
            </button>
            <button onClick={exportReport} className="btn-primary !py-2 !px-3 text-xs">
              <Download className="w-3.5 h-3.5" />
              导出报表
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-[11px] text-slate-500 mb-1.5 block">开始日期</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input-field pl-9 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-slate-500 mb-1.5 block">结束日期</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input-field pl-9 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-slate-500 mb-1.5 block">炉号</label>
            <select
              value={furnaceNo}
              onChange={(e) => setFurnaceNo(e.target.value)}
              className="input-field py-2 text-sm"
            >
              <option value="">全部炉号</option>
              {allFurnaceNos.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-slate-500 mb-1.5 block">工艺卡片</label>
            <select
              value={processCardId}
              onChange={(e) => setProcessCardId(e.target.value)}
              className="input-field py-2 text-sm"
            >
              <option value="">全部工艺</option>
              {processCards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-slate-500 mb-1.5 block">客户</label>
            <select
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="input-field py-2 text-sm"
            >
              <option value="">全部客户</option>
              {allCustomers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "炉次总数", value: stats.totalBatches, unit: "炉", icon: Flame, color: "from-orange-500 to-red-500" },
          { label: "装炉数量", value: stats.totalQty, unit: "件", icon: Package, color: "from-blue-500 to-indigo-500" },
          { label: "完成数量", value: stats.completedQty, unit: "件", icon: CheckCircle2, color: "from-green-500 to-emerald-500" },
          { label: "检测合格率", value: stats.passRate, unit: "%", icon: TrendingUp, color: "from-purple-500 to-indigo-500" },
          { label: "返工数量", value: stats.reworkCount, unit: "项", icon: Wrench, color: "from-amber-500 to-orange-500" },
          { label: "不合格项", value: stats.failTests, unit: "项", icon: XCircle, color: "from-red-500 to-pink-500" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="card-base">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] text-slate-500 mb-1">{s.label}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-slate-800">{s.value}</span>
                    <span className="text-xs text-slate-400">{s.unit}</span>
                  </div>
                </div>
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br text-white shadow-sm", s.color)}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card-base lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">
              <BarChart2 className="w-4 h-4 text-primary-600" />
              炉次 / 装炉 / 返工趋势
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="炉次数" fill="#f97316" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="装炉数量" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="返工数" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-base">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">
              <LineChartIcon className="w-4 h-4 text-primary-600" />
              合格率趋势 (%)
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrend}>
                <defs>
                  <linearGradient id="passRateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="合格率"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card-base lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">
              <Trophy className="w-4 h-4 text-primary-600" />
              客户合格率排行榜
            </h3>
            <span className="text-[11px] text-slate-400">按合格率排序</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header-cell w-10 text-center">排名</th>
                  <th className="table-header-cell">客户</th>
                  <th className="table-header-cell text-center">炉次</th>
                  <th className="table-header-cell text-center">数量</th>
                  <th className="table-header-cell text-center">检测项</th>
                  <th className="table-header-cell text-center">合格率</th>
                  <th className="table-header-cell text-center">返工</th>
                  <th className="table-header-cell text-center">不合格</th>
                </tr>
              </thead>
              <tbody>
                {customerStats.map((c, i) => (
                  <tr key={c.name} className="hover:bg-slate-50/60 transition-colors">
                    <td className="table-cell text-center">
                      <span className={cn(
                        "inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold",
                        i === 0 ? "bg-amber-100 text-amber-700" :
                        i === 1 ? "bg-slate-200 text-slate-700" :
                        i === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-slate-50 text-slate-500"
                      )}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="table-cell text-sm font-medium text-slate-800 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {c.name}
                    </td>
                    <td className="table-cell text-center font-semibold text-slate-700">{c.batches}</td>
                    <td className="table-cell text-center font-semibold text-blue-600">{c.qty} 件</td>
                    <td className="table-cell text-center text-xs text-slate-500">{c.passed}/{c.tests}</td>
                    <td className="table-cell text-center">
                      <span className={cn(
                        "font-bold",
                        c.passRate < 80 ? "text-red-600" :
                        c.passRate < 95 ? "text-amber-600" : "text-green-600"
                      )}>
                        {c.passRate}%
                      </span>
                    </td>
                    <td className="table-cell text-center">
                      {c.rework > 0 ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[11px] font-medium">{c.rework}</span>
                      ) : (
                        <span className="text-slate-300 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="table-cell text-center">
                      {c.failTests > 0 ? (
                        <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[11px] font-medium">{c.failTests}</span>
                      ) : (
                        <span className="text-slate-300 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {customerStats.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 text-sm">暂无客户数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-base">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">
              <BarChart3 className="w-4 h-4 text-primary-600" />
              月度对比
            </h3>
          </div>
          {monthlyStats.byMonth.length > 0 ? (
            <>
              <div className="h-56 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyStats.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", fontSize: 12 }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                    <Bar dataKey="炉次数" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={22} />
                    <Bar dataKey="客户" fill="#10b981" radius={[4, 4, 0, 0]} barSize={22} />
                    <Bar dataKey="工艺" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5">
                {monthlyStats.byMonth.slice(-4).reverse().map((m) => (
                  <div key={m.month} className="flex items-center justify-between p-2 rounded bg-slate-50">
                    <div className="text-xs font-semibold text-slate-700">{m.month}</div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-slate-500">炉次 <b className="text-blue-600">{m.炉次数}</b></span>
                      <span className="text-slate-500">客户 <b className="text-emerald-600">{m.客户}</b></span>
                      <span className="text-slate-500">工艺 <b className="text-purple-600">{m.工艺}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
              <PieChartIcon className="w-10 h-10 mb-2 opacity-20" />
              暂无月度数据
            </div>
          )}
        </div>
      </div>

      <div className="card-base">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title mb-0">
            <FileText className="w-4 h-4 text-primary-600" />
            按工艺卡汇总
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header-cell">工艺编号</th>
                <th className="table-header-cell">工艺名称</th>
                <th className="table-header-cell">材料</th>
                <th className="table-header-cell text-center">炉次数</th>
                <th className="table-header-cell text-center">装炉数量</th>
                <th className="table-header-cell text-center">合格率</th>
              </tr>
            </thead>
            <tbody>
              {processCardStats.map((s) => (
                <tr key={s.card.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="table-cell font-mono text-xs text-primary-600 font-medium">{s.card.code}</td>
                  <td className="table-cell text-sm">{s.card.name}</td>
                  <td className="table-cell text-xs text-slate-500">{s.card.material}</td>
                  <td className="table-cell text-center font-semibold text-slate-700">{s.batches}</td>
                  <td className="table-cell text-center font-semibold text-blue-600">{s.qty} 件</td>
                  <td className="table-cell text-center">
                    <span className={cn(
                      "font-bold",
                      s.passRate !== "-" && Number(s.passRate) < 80 ? "text-red-600" :
                      s.passRate !== "-" && Number(s.passRate) < 95 ? "text-amber-600" : "text-green-600"
                    )}>
                      {s.passRate}{s.passRate !== "-" && "%"}
                    </span>
                  </td>
                </tr>
              ))}
              {processCardStats.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 text-sm">
                    暂无统计数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-base">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title mb-0">
            <BarChart3 className="w-4 h-4 text-primary-600" />
            炉次明细 ({filteredBatches.length} 炉)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header-cell">批次号</th>
                <th className="table-header-cell">炉号</th>
                <th className="table-header-cell">工艺卡片</th>
                <th className="table-header-cell">状态</th>
                <th className="table-header-cell text-center">数量</th>
                <th className="table-header-cell">操作员</th>
                <th className="table-header-cell">开始时间</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map((b) => {
                const st = statusMap[b.status];
                const qty = partItems.filter((p) => p.batchId === b.id).reduce((s, p) => s + p.quantity, 0);
                const card = processCards.find((c) => c.id === b.processCardId);
                return (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="table-cell font-mono font-medium text-primary-600">{b.batchNo}</td>
                    <td className="table-cell">{b.furnaceNo}</td>
                    <td className="table-cell text-xs">
                      {card ? <span className="font-mono text-slate-600">{card.code}</span> : "-"}
                    </td>
                    <td className="table-cell">
                      <span className={cn("badge", st?.bgColor, st?.color)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", st?.dotColor)} />
                        {st?.label}
                      </span>
                    </td>
                    <td className="table-cell text-center font-semibold text-slate-700">{qty} 件</td>
                    <td className="table-cell">{b.operator || "-"}</td>
                    <td className="table-cell text-slate-500 text-xs">{formatDateTime(b.startTime)}</td>
                  </tr>
                );
              })}
              {filteredBatches.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-sm">
                    暂无符合条件的炉次
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
