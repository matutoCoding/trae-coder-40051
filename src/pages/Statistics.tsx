import { useState, useMemo } from "react";
import { useStore } from "@/store";
import { cn, formatDateTime, statusMap, safeAvg } from "@/utils";
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
      if (dateFrom && b.startTime && b.startTime < dateFrom) return false;
      if (dateTo && b.startTime && b.startTime > dateTo + " 23:59:59") return false;
      const batchParts = partItems.filter((p) => p.batchId === b.id);
      if (customer && !batchParts.some((p) => p.customer === customer)) return false;
      return true;
    });
  }, [furnaceBatches, partItems, dateFrom, dateTo, furnaceNo, processCardId, customer]);

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

    const batchIds = filteredBatches.map((b) => b.id);
    const mt = metallographyRecords.filter((r) => batchIds.includes(r.batchId));
    const hd = hardnessRecords.filter((r) => batchIds.includes(r.batchId));
    const df = deformationRecords.filter((r) => batchIds.includes(r.batchId));
    const totalTests = mt.length + hd.length + df.length;
    const passedTests =
      mt.filter((r) => r.result === "pass").length +
      hd.filter((r) => r.result === "pass").length +
      df.filter((r) => r.result === "pass").length;
    const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : "0";

    return { totalBatches, completedBatches, totalQty, completedQty, passRate, totalTests, passedTests };
  }, [filteredBatches, partItems, metallographyRecords, hardnessRecords, deformationRecords]);

  const dailyTrend = useMemo(() => {
    const map = new Map<string, { batches: number; completed: number; qty: number; passed: number; total: number }>();
    filteredBatches.forEach((b) => {
      const day = b.startTime ? b.startTime.slice(0, 10) : "未知";
      if (!map.has(day)) map.set(day, { batches: 0, completed: 0, qty: 0, passed: 0, total: 0 });
      const d = map.get(day)!;
      d.batches++;
      if (b.status === "completed") d.completed++;
      d.qty += partItems.filter((p) => p.batchId === b.id).reduce((s, p) => s + p.quantity, 0);
    });
    const batchIds = filteredBatches.map((b) => b.id);
    [...metallographyRecords, ...hardnessRecords, ...deformationRecords].forEach((r) => {
      if (!batchIds.includes(r.batchId)) return;
      const day = r.recordTime ? r.recordTime.slice(0, 10) : "未知";
      if (!map.has(day)) map.set(day, { batches: 0, completed: 0, qty: 0, passed: 0, total: 0 });
      const d = map.get(day)!;
      d.total++;
      if (r.result === "pass") d.passed++;
    });
    const arr = Array.from(map.entries())
      .map(([date, v]) => ({
        date,
        炉次数: v.batches,
        完成数: v.completed,
        装炉数量: v.qty,
        合格率: v.total > 0 ? Number(((v.passed / v.total) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    return arr.slice(-14);
  }, [filteredBatches, partItems, metallographyRecords, hardnessRecords, deformationRecords]);

  const processCardStats = useMemo(() => {
    return processCards
      .map((card) => {
        const batches = filteredBatches.filter((b) => b.processCardId === card.id);
        const qty = batches.reduce(
          (s, b) => s + partItems.filter((p) => p.batchId === b.id).reduce((ps, p) => ps + p.quantity, 0),
          0
        );
        const batchIds = batches.map((b) => b.id);
        const tests = [...metallographyRecords, ...hardnessRecords, ...deformationRecords].filter((r) =>
          batchIds.includes(r.batchId)
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "炉次总数", value: stats.totalBatches, unit: "炉", icon: Flame, color: "from-orange-500 to-red-500", bg: "bg-orange-50", text: "text-orange-600" },
          { label: "装炉数量", value: stats.totalQty, unit: "件", icon: Package, color: "from-blue-500 to-indigo-500", bg: "bg-blue-50", text: "text-blue-600" },
          { label: "完成数量", value: stats.completedQty, unit: "件", icon: CheckCircle2, color: "from-green-500 to-emerald-500", bg: "bg-green-50", text: "text-green-600" },
          { label: "检测合格率", value: stats.passRate, unit: "%", icon: TrendingUp, color: "from-purple-500 to-indigo-500", bg: "bg-purple-50", text: "text-purple-600" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="card-base">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-800">{s.value}</span>
                    <span className="text-sm text-slate-400">{s.unit}</span>
                  </div>
                </div>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br text-white", s.color)}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-base">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">
              <BarChart2 className="w-4 h-4 text-primary-600" />
              炉次与数量趋势
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
                <Bar dataKey="炉次数" fill="#f97316" radius={[4, 4, 0, 0]} barSize={18} />
                <Bar dataKey="完成数" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={18} />
                <Bar dataKey="装炉数量" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={18} />
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
