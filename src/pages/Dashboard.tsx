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
import { statusMap, cn, formatDateTime } from "@/utils";
import { useNavigate } from "react-router-dom";

const statsData = [
  {
    label: "本月炉次",
    value: 86,
    unit: "炉",
    trend: "+12%",
    trendUp: true,
    icon: Flame,
    color: "from-orange-500 to-red-500",
    bg: "bg-orange-50",
    text: "text-orange-600",
  },
  {
    label: "在制零件",
    value: 324,
    unit: "件",
    trend: "+8%",
    trendUp: true,
    icon: CalendarClock,
    color: "from-blue-500 to-indigo-500",
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
  {
    label: "合格率",
    value: 96.8,
    unit: "%",
    trend: "+1.2%",
    trendUp: true,
    icon: CheckCircle2,
    color: "from-green-500 to-emerald-500",
    bg: "bg-green-50",
    text: "text-green-600",
  },
  {
    label: "待处理问题",
    value: 5,
    unit: "项",
    trend: "-2",
    trendUp: false,
    icon: AlertTriangle,
    color: "from-amber-500 to-yellow-500",
    bg: "bg-amber-50",
    text: "text-amber-600",
  },
];

const batchStatusData = [
  { name: "已完成", value: 42, color: "#22c55e" },
  { name: "渗碳淬火中", value: 12, color: "#f97316" },
  { name: "回火中", value: 8, color: "#f59e0b" },
  { name: "检测中", value: 6, color: "#a855f7" },
  { name: "矫正中", value: 3, color: "#ec4899" },
  { name: "待排产", value: 15, color: "#64748b" },
];

const qualityTrendData = [
  { date: "6/10", pass: 95.2, total: 78 },
  { date: "6/11", pass: 96.1, total: 82 },
  { date: "6/12", pass: 94.8, total: 75 },
  { date: "6/13", pass: 97.3, total: 90 },
  { date: "6/14", pass: 96.5, total: 85 },
  { date: "6/15", pass: 97.0, total: 88 },
  { date: "6/16", pass: 96.8, total: 86 },
];

const dailyBatches = [
  { date: "6/10", 渗碳炉: 6, 回火炉: 5 },
  { date: "6/11", 渗碳炉: 7, 回火炉: 6 },
  { date: "6/12", 渗碳炉: 5, 回火炉: 6 },
  { date: "6/13", 渗碳炉: 8, 回火炉: 7 },
  { date: "6/14", 渗碳炉: 7, 回火炉: 7 },
  { date: "6/15", 渗碳炉: 8, 回火炉: 6 },
  { date: "6/16", 渗碳炉: 6, 回火炉: 5 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { furnaceBatches, processCards, carburizingRecords } = useStore();
  const recentBatches = furnaceBatches.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statsData.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="card-base hover:shadow-card-hover transition-all duration-300 group cursor-pointer"
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
                  <div
                    className={cn(
                      "flex items-center gap-1 mt-2 text-xs font-medium",
                      stat.trendUp ? "text-green-600" : "text-red-500"
                    )}
                  >
                    <ArrowUpRight
                      className={cn(
                        "w-3 h-3",
                        !stat.trendUp && "rotate-180"
                      )}
                    />
                    <span>较上月 {stat.trend}</span>
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
              近7天生产质量趋势
            </h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-primary-500" />
                合格率(%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-slate-300" />
                处理炉次
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
                  domain={[90, 100]}
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
          <div className="grid grid-cols-2 gap-2 mt-2">
            {batchStatusData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                <span className="text-slate-600">{item.name}</span>
                <span className="ml-auto font-semibold text-slate-700">{item.value}</span>
              </div>
            ))}
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
            快速统计
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => navigate("/process-cards")}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700">工艺卡片</div>
                  <div className="text-[10px] text-slate-400">已定义工艺</div>
                </div>
              </div>
              <span className="text-lg font-bold text-slate-800">{processCards.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => navigate("/carburizing")}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Thermometer className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700">渗碳记录</div>
                  <div className="text-[10px] text-slate-400">淬火过程</div>
                </div>
              </div>
              <span className="text-lg font-bold text-slate-800">{carburizingRecords.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => navigate("/traceability")}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700">完成炉次</div>
                  <div className="text-[10px] text-slate-400">已归档</div>
                </div>
              </div>
              <span className="text-lg font-bold text-slate-800">
                {furnaceBatches.filter((b) => b.status === "completed").length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700">在岗人员</div>
                  <div className="text-[10px] text-slate-400">白班</div>
                </div>
              </div>
              <span className="text-lg font-bold text-slate-800">12</span>
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
                      <span className={cn("badge", st.bgColor, st.color)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", st.dotColor)} />
                        {st.label}
                      </span>
                    </td>
                    <td className="table-cell">{batch.totalQuantity} 件</td>
                    <td className="table-cell">{batch.operator}</td>
                    <td className="table-cell text-slate-500">{formatDateTime(batch.startTime)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
