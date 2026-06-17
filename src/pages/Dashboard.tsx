import { useStore } from "@/store";
import {
  LayoutDashboard,
  FileText,
  CalendarClock,
  Flame,
  Thermometer,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Clock,
  Users,
  Package,
  Gauge,
  Microscope,
  Ruler,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { statusMap, cn, formatDateTime, safeAvg } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
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

  const totalBatches = furnaceBatches.length;

  const inProcessBatchIds = furnaceBatches
    .filter((b) => b.status !== "completed" && b.status !== "pending")
    .map((b) => b.id);
  const inProcessParts = partItems.filter((p) => inProcessBatchIds.includes(p.batchId));
  const totalPartsInProcess = inProcessParts.reduce((sum, p) => sum + p.quantity, 0);
  const totalPartsCount = inProcessParts.length;

  const completedBatches = furnaceBatches.filter((b) => b.status === "completed");
  const inProcessBatches = inProcessBatchIds.length;

  const allTests = hardnessRecords.length + metallographyRecords.length + deformationRecords.length;
  const passedTests = hardnessRecords.filter((h) => h.result === "pass").length
    + metallographyRecords.filter((m) => m.result === "pass").length
    + deformationRecords.filter((d) => d.result === "pass").length;
  const overallPassRate = allTests > 0 ? ((passedTests / allTests) * 100).toFixed(1) : "0";

  const failedTests = hardnessRecords.filter((h) => h.result === "fail").length
    + metallographyRecords.filter((m) => m.result === "fail").length
    + deformationRecords.filter((d) => d.result === "fail").length;

  const pendingIssues = failedTests + furnaceBatches.filter((b) => b.status === "pending").length;

  const batchStatusCounts = furnaceBatches.reduce((acc, b) => {
    const label = statusMap[b.status]?.label || b.status;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusColorMap: Record<string, string> = {
    "待排产": "#64748b",
    "装料中": "#3b82f6",
    "渗碳淬火": "#f97316",
    "淬火冷却": "#06b6d4",
    "回火中": "#f59e0b",
    "检测中": "#a855f7",
    "矫正中": "#ec4899",
    "已完成": "#22c55e",
  };

  const batchStatusData = Object.entries(batchStatusCounts).map(([name, value]) => ({
    name,
    value,
    color: statusColorMap[name] || "#94a3b8",
  }));

  const recentDays = 7;
  const qualityTrendData = Array.from({ length: recentDays }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (recentDays - 1 - i));
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
    const dayRecords = hardnessRecords.filter((h) => {
      const rd = new Date(h.recordTime);
      return rd.toDateString() === d.toDateString();
    });
    const dayPass = dayRecords.filter((h) => h.result === "pass").length;
    const passRate = dayRecords.length > 0 ? (dayPass / dayRecords.length) * 100 : 0;
    return {
      date: dateStr,
      pass: Number(passRate.toFixed(1)),
      total: dayRecords.length,
    };
  });

  const dailyBatches = Array.from({ length: recentDays }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (recentDays - 1 - i));
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
    const carb = carburizingRecords.filter((r) => new Date(r.recordTime).toDateString() === d.toDateString()).length;
    const temp = temperingRecords.filter((r) => new Date(r.recordTime).toDateString() === d.toDateString()).length;
    return {
      date: dateStr,
      渗碳炉: carb,
      回火炉: temp,
    };
  });

  const recentBatches = furnaceBatches.slice(0, 5);

  const avgLayerDepth = carburizingRecords.length > 0
    ? safeAvg(carburizingRecords.flatMap((r) => r.layerDepths)).toFixed(3)
    : "0";

  const avgSurfaceHardness = hardnessRecords.length > 0
    ? safeAvg(hardnessRecords.map((h) => h.surfaceAvg)).toFixed(1)
    : "0";

  const checkBatchAbnormal = (batchId: string) => {
    const reasons: string[] = [];
    const carb = carburizingRecords.find((r) => r.batchId === batchId);
    const temp = temperingRecords.find((r) => r.batchId === batchId);
    const mt = metallographyRecords.filter((r) => r.batchId === batchId);
    const hd = hardnessRecords.filter((r) => r.batchId === batchId);
    const df = deformationRecords.filter((r) => r.batchId === batchId);
    const batchParts = partItems.filter((p) => p.batchId === batchId);
    const card = processCards.find((c) => c.id === furnaceBatches.find((b) => b.id === batchId)?.processCardId);

    if (batchParts.length === 0) reasons.push("缺装炉零件");
    if (!carb) reasons.push("缺渗碳记录");
    if (!temp) reasons.push("缺回火记录");
    if (mt.length === 0) reasons.push("缺金相记录");
    if (hd.length === 0) reasons.push("缺硬度记录");

    if (mt.some((m) => m.result === "fail")) reasons.push("金相不合格");
    if (hd.some((h) => h.result === "fail")) reasons.push("硬度不合格");
    if (df.some((d) => d.result === "fail")) reasons.push("变形矫正不合格");

    if (card && carb) {
      const avgD = safeAvg(carb.layerDepths);
      if (avgD < card.layerDepthMin || avgD > card.layerDepthMax) reasons.push("渗碳层深超限");
    }
    if (card && hd.length > 0) {
      const avgS = safeAvg(hd.map((h) => h.surfaceAvg));
      const avgC = safeAvg(hd.map((h) => h.coreAvg));
      if (avgS < card.hardnessMin || avgS > card.hardnessMax) reasons.push("表面硬度超限");
      if (avgC < (card.hardnessMin - 10) || avgC > (card.hardnessMax - 5)) reasons.push("心部硬度超限");
    }

    return reasons;
  };

  const abnormalBatches = furnaceBatches
    .map((b) => ({ batch: b, reasons: checkBatchAbnormal(b.id) }))
    .filter((x) => x.reasons.length > 0)
    .sort((a, b) => b.reasons.length - a.reasons.length);

  const statsData = [
    {
      label: "总炉次数",
      value: totalBatches,
      unit: "炉",
      sub: `在制 ${inProcessBatches} 炉`,
      icon: Flame,
      color: "from-orange-500 to-red-500",
      bg: "bg-orange-50",
      text: "text-orange-600",
      trend: "+0",
      trendUp: true,
    },
    {
      label: "在制零件",
      value: totalPartsInProcess,
      unit: "件",
      sub: `${totalPartsCount} 种零件`,
      icon: Package,
      color: "from-blue-500 to-indigo-500",
      bg: "bg-blue-50",
      text: "text-blue-600",
      trend: "+0",
      trendUp: true,
    },
    {
      label: "综合合格率",
      value: overallPassRate,
      unit: "%",
      sub: `${passedTests}/${allTests} 项合格`,
      icon: CheckCircle2,
      color: "from-green-500 to-emerald-500",
      bg: "bg-green-50",
      text: "text-green-600",
      trend: "+0",
      trendUp: true,
    },
    {
      label: "待处理问题",
      value: pendingIssues,
      unit: "项",
      sub: `${failedTests} 项不合格`,
      icon: AlertTriangle,
      color: "from-amber-500 to-yellow-500",
      bg: "bg-amber-50",
      text: "text-amber-600",
      trend: "-0",
      trendUp: false,
    },
  ];

  const quickStats = [
    { label: "工艺卡片", desc: "已定义工艺", icon: FileText, color: "primary", count: processCards.length, path: "/process-cards" },
    { label: "渗碳记录", desc: "淬火过程", icon: Thermometer, color: "orange", count: carburizingRecords.length, path: "/carburizing" },
    { label: "回火记录", desc: "回火过程", icon: Flame, color: "amber", count: temperingRecords.length, path: "/tempering" },
    { label: "金相检测", desc: "组织分析", icon: Microscope, color: "purple", count: metallographyRecords.length, path: "/metallography" },
    { label: "硬度检验", desc: "硬度测试", icon: Gauge, color: "emerald", count: hardnessRecords.length, path: "/hardness" },
    { label: "变形矫正", desc: "校直处理", icon: Ruler, color: "pink", count: deformationRecords.length, path: "/deformation" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statsData.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="card-base hover:shadow-card-hover transition-all duration-300 group cursor-pointer"
              onClick={() => navigate(idx === 0 ? "/furnace-planning" : idx === 1 ? "/furnace-planning" : idx === 2 ? "/hardness" : "/traceability")}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-xs text-slate-500 font-medium mb-1">
                    {stat.label}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-800">
                      {stat.value}
                    </span>
                    <span className="text-sm text-slate-400 font-medium">
                      {stat.unit}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2">
                    {stat.sub}
                  </div>
                </div>
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl p-3 bg-gradient-to-br shadow-lg",
                    stat.color,
                    "shadow-opacity-20 group-hover:scale-110 transition-transform duration-300"
                  )}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card-base lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title mb-0">
              <Activity className="w-5 h-5 text-primary-600" />
              近7天质量趋势
            </h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-primary-500" />
                合格率(%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-slate-300" />
                检测数量
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={qualityTrendData}>
                <defs>
                  <linearGradient id="passGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "none",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    fontSize: 12,
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="pass"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6 }}
                />
                <Bar yAxisId="right" dataKey="total" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={18} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-base">
          <h2 className="section-title">
            <LayoutDashboard className="w-5 h-5 text-primary-600" />
            炉次状态分布
          </h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={batchStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {batchStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 max-h-24 overflow-y-auto">
            {batchStatusData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                <span className="text-slate-600">{item.name}</span>
                <span className="ml-auto font-semibold text-slate-700">{item.value}</span>
              </div>
            ))}
            {batchStatusData.length === 0 && (
              <div className="col-span-2 text-center text-xs text-slate-400 py-4">
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card-base lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title mb-0">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              近期炉次处理情况
            </h2>
            <button
              onClick={() => navigate("/furnace-planning")}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              查看全部
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyBatches}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="渗碳炉" fill="#f97316" radius={[4, 4, 0, 0]} barSize={22} />
                <Bar dataKey="回火炉" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-base">
          <h2 className="section-title">
            <FileText className="w-5 h-5 text-primary-600" />
            业务统计
          </h2>
          <div className="space-y-2">
            {quickStats.map((item, idx) => {
              const Icon = item.icon;
              const colorMap: Record<string, string> = {
                primary: "bg-primary-100 text-primary-600",
                orange: "bg-orange-100 text-orange-600",
                amber: "bg-amber-100 text-amber-600",
                purple: "bg-purple-100 text-purple-600",
                emerald: "bg-emerald-100 text-emerald-600",
                pink: "bg-pink-100 text-pink-600",
              };
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => navigate(item.path)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colorMap[item.color])}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-700">{item.label}</div>
                      <div className="text-[10px] text-slate-400">{item.desc}</div>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-slate-800">{item.count}</span>
                </div>
              );
            })}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700">完成炉次</div>
                  <div className="text-[10px] text-slate-400">已归档</div>
                </div>
              </div>
              <span className="text-lg font-bold text-slate-800">{completedBatches.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card-base">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">
            <Clock className="w-5 h-5 text-primary-600" />
            最新炉次动态
          </h2>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              平均渗碳层深: {avgLayerDepth}mm
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              平均硬度: {avgSurfaceHardness} HRC
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header-cell">批次号</th>
                <th className="table-header-cell">炉号</th>
                <th className="table-header-cell">工艺名称</th>
                <th className="table-header-cell">状态</th>
                <th className="table-header-cell">数量</th>
                <th className="table-header-cell">操作员</th>
                <th className="table-header-cell">开始时间</th>
              </tr>
            </thead>
            <tbody>
              {recentBatches.map((batch) => {
                const st = statusMap[batch.status];
                return (
                  <tr key={batch.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="table-cell font-mono font-medium text-primary-600">{batch.batchNo}</td>
                    <td className="table-cell">{batch.furnaceNo}</td>
                    <td className="table-cell">{batch.processCardName}</td>
                    <td className="table-cell">
                      <span className={cn("badge", st?.bgColor, st?.color)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", st?.dotColor)} />
                        {st?.label}
                      </span>
                    </td>
                    <td className="table-cell">{batch.totalQuantity} 件</td>
                    <td className="table-cell">{batch.operator}</td>
                    <td className="table-cell text-slate-500">{formatDateTime(batch.startTime)}</td>
                  </tr>
                );
              })}
              {recentBatches.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                    暂无炉次记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-base border-red-100 bg-red-50/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">
            <AlertCircle className="w-5 h-5 text-red-500" />
            质量预警中心
            <span className="ml-2 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-medium">
              {abnormalBatches.length} 个异常炉次
            </span>
          </h2>
          <button
            onClick={() => navigate("/traceability")}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            追溯详情
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        {abnormalBatches.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto -mx-1 px-1">
            {abnormalBatches.map(({ batch, reasons }) => {
              const st = statusMap[batch.status];
              const severity = reasons.some((r) => r.includes("不合格") || r.includes("超限")) ? "严重" : "警告";
              return (
                <div
                  key={batch.id}
                  onClick={() => navigate(`/traceability?batchId=${batch.id}`)}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
                    severity === "严重"
                      ? "bg-red-50/70 border-red-200 hover:bg-red-50"
                      : "bg-amber-50/70 border-amber-200 hover:bg-amber-50"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center",
                        severity === "严重" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                      )}>
                        {severity === "严重" ? <XCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      </span>
                      <span className="font-mono text-sm font-semibold text-slate-800">{batch.batchNo}</span>
                      <span className={cn("badge text-[10px]", st?.bgColor, st?.color)}>{st?.label}</span>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-medium",
                      severity === "严重" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {severity} · {reasons.length}项
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 ml-8.5 pl-1">
                    {reasons.map((r, i) => (
                      <span
                        key={i}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px]",
                          r.includes("缺") ? "bg-slate-100 text-slate-600" :
                          r.includes("不合格") ? "bg-red-100 text-red-700" :
                          "bg-orange-100 text-orange-700"
                        )}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-400 mb-2" />
            <div className="text-sm text-slate-500">所有炉次运行正常，无异常预警</div>
          </div>
        )}
      </div>
    </div>
  );
}
