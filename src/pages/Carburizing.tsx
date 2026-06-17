import { useState } from "react";
import { useStore } from "@/store";
import { cn, formatDateTime, resultMap, validateNumberArray, safeAvg } from "@/utils";
import {
  Plus,
  Search,
  Flame,
  Thermometer,
  Droplets,
  Clock,
  Target,
  X,
  Save,
  User,
  FileText,
  Ruler,
  Activity,
  AlertCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";

export default function Carburizing() {
  const { carburizingRecords, furnaceBatches, addCarburizingRecord } = useStore();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [viewing, setViewing] = useState<any>(null);
  const [form, setForm] = useState<any>({
    batchId: "",
    furnaceNo: "RC-01",
    startTemp: 25,
    targetTemp: 920,
    layerDepths: [0.9, 0.95, 1.0, 1.05, 0.98],
    quenchingMediumTemp: 65,
    oilTankStartTemp: 40,
    oilTankEndTemp: 78,
    coolingDuration: 45,
    operator: "",
    recorder: "",
    remark: "",
  });

  const [layerDepthsInput, setLayerDepthsInput] = useState("0.9, 0.95, 1.0, 1.05, 0.98");
  const [layerDepthsError, setLayerDepthsError] = useState<string>("");

  const filtered = carburizingRecords.filter((r) => {
    const b = furnaceBatches.find((f) => f.id === r.batchId);
    return (
      !search ||
      r.furnaceNo.includes(search) ||
      (b && b.batchNo.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const save = () => {
    if (!form.batchId || !form.operator) {
      alert("请选择批次并填写操作员");
      return;
    }

    const layerValidation = validateNumberArray(layerDepthsInput, 3, 0.1, 10);
    if (!layerValidation.valid) {
      setLayerDepthsError(layerValidation.error || "渗碳层深度数据无效");
      return;
    }
    setLayerDepthsError("");

    const now = new Date().toLocaleString();
    const targetTemp = isNaN(form.targetTemp) ? 920 : Number(form.targetTemp);
    const points = [];
    for (let i = 0; i < 12; i++) {
      const t = i * 30;
      let temp;
      if (i < 3) temp = 20 + (targetTemp - 20) * (i / 3) + (Math.random() - 0.5) * 10;
      else if (i < 10) temp = targetTemp + (Math.random() - 0.5) * 8;
      else temp = targetTemp - 50 * (i - 10);
      points.push({ time: t, temp: Math.max(20, Math.round(temp)) });
    }
    addCarburizingRecord({
      ...form,
      layerDepths: layerValidation.values,
      tempCurve: points,
      recordTime: now,
      startTemp: isNaN(form.startTemp) ? 25 : Number(form.startTemp),
      quenchingMediumTemp: isNaN(form.quenchingMediumTemp) ? 60 : Number(form.quenchingMediumTemp),
      oilTankStartTemp: isNaN(form.oilTankStartTemp) ? 40 : Number(form.oilTankStartTemp),
      oilTankEndTemp: isNaN(form.oilTankEndTemp) ? 80 : Number(form.oilTankEndTemp),
      coolingDuration: isNaN(form.coolingDuration) ? 45 : Number(form.coolingDuration),
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "平均渗碳温度", value: "923", unit: "℃", icon: Thermometer, color: "from-orange-500 to-red-500" },
          { label: "平均层深", value: "1.04", unit: "mm", icon: Ruler, color: "from-blue-500 to-indigo-500" },
          { label: "平均淬火油温", value: "68", unit: "℃", icon: Droplets, color: "from-cyan-500 to-blue-500" },
          { label: "总记录数", value: carburizingRecords.length.toString(), unit: "条", icon: FileText, color: "from-green-500 to-emerald-500" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="card-base flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br shadow-lg flex items-center justify-center", s.color)}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xs text-slate-500">{s.label}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-800">{s.value}</span>
                  <span className="text-xs text-slate-400">{s.unit}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card-base">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="搜索炉号、批次号..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-72 pl-9 input-base"
              />
            </div>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            新增记录
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-100">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header-cell">批次号</th>
                <th className="table-header-cell">炉号</th>
                <th className="table-header-cell">目标温度</th>
                <th className="table-header-cell">渗碳层深度 (mm)</th>
                <th className="table-header-cell">淬火介质温度</th>
                <th className="table-header-cell">油槽冷却</th>
                <th className="table-header-cell">操作员/记录员</th>
                <th className="table-header-cell">记录时间</th>
                <th className="table-header-cell text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const b = furnaceBatches.find((f) => f.id === r.batchId);
                const layerAvg = (r.layerDepths.reduce((a, b) => a + b, 0) / r.layerDepths.length).toFixed(2);
                return (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="table-cell font-mono font-semibold text-primary-600 text-xs">{b?.batchNo || "-"}</td>
                    <td className="table-cell">{r.furnaceNo}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                        <span className="font-semibold text-orange-600">{r.targetTemp}℃</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-purple-500" />
                          <span className="text-xs font-medium">{r.layerDepths.map((d) => d.toFixed(2)).join(" / ")}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">平均 {layerAvg}mm</div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Droplets className="w-3.5 h-3.5 text-cyan-500" />
                        <span>{r.quenchingMediumTemp}℃</span>
                      </div>
                    </td>
                    <td className="table-cell text-xs">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Clock className="w-3 h-3" />
                        {r.oilTankStartTemp}℃ → {r.oilTankEndTemp}℃
                      </div>
                      <div className="text-[10px] text-slate-400">冷却 {r.coolingDuration}min</div>
                    </td>
                    <td className="table-cell text-xs">
                      <div className="flex items-center gap-1 text-slate-700">
                        <User className="w-3 h-3 text-slate-400" />
                        {r.operator}
                      </div>
                      <div className="text-[10px] text-slate-400">记录: {r.recorder}</div>
                    </td>
                    <td className="table-cell text-xs text-slate-500">{formatDateTime(r.recordTime)}</td>
                    <td className="table-cell text-right">
                      <button
                        onClick={() => setViewing(r)}
                        className="text-xs px-3 py-1.5 rounded-md bg-primary-50 text-primary-600 hover:bg-primary-100 font-medium transition-colors"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Flame className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <div>暂无渗碳淬火记录</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">渗碳淬火记录详情</h3>
                  <p className="text-xs text-white/70">炉号: {viewing.furnaceNo}</p>
                </div>
              </div>
              <button onClick={() => setViewing(null)} className="p-1.5 rounded-lg hover:bg-white/20">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="p-5 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100">
                <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-600" />
                  炉温曲线
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={viewing.tempCurve}>
                      <defs>
                        <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" vertical={false} />
                      <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} label={{ value: "时间 (min)", position: "insideBottom", offset: -5, fontSize: 11, fill: "#94a3b8" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} label={{ value: "温度(℃)", angle: -90, position: "insideLeft", fontSize: 11, fill: "#94a3b8" }} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", fontSize: 12 }} />
                      <ReferenceLine y={viewing.targetTemp} stroke="#ef4444" strokeDasharray="5 5" label={{ value: `目标 ${viewing.targetTemp}℃`, position: "right", fontSize: 11, fill: "#ef4444" }} />
                      <Line type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3, fill: "#fff", stroke: "#f97316", strokeWidth: 2 }} activeDot={{ r: 5 }} fill="url(#tempGrad)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "起始温度", value: `${viewing.startTemp}℃`, icon: Thermometer, color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "目标温度", value: `${viewing.targetTemp}℃`, icon: Target, color: "text-orange-600", bg: "bg-orange-50" },
                  { label: "淬火介质温度", value: `${viewing.quenchingMediumTemp}℃`, icon: Droplets, color: "text-cyan-600", bg: "bg-cyan-50" },
                  { label: "冷却时长", value: `${viewing.coolingDuration}min`, icon: Clock, color: "text-purple-600", bg: "bg-purple-50" },
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={i} className="p-4 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn("w-7 h-7 rounded-md flex items-center justify-center", s.bg)}>
                          <Icon className={cn("w-4 h-4", s.color)} />
                        </div>
                        <span className="text-xs text-slate-500">{s.label}</span>
                      </div>
                      <div className={cn("text-lg font-bold", s.color)}>{s.value}</div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-lg border border-slate-100 bg-slate-50/50">
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-purple-600" />
                  渗碳层深度测量 (mm)
                </h4>
                <div className="flex items-center gap-3 flex-wrap">
                  {viewing.layerDepths.map((d: number, i: number) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="text-[10px] text-slate-400 mb-1">#{i + 1}</div>
                      <div className="w-16 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-mono font-bold text-primary-600 text-sm">
                        {d.toFixed(2)}
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-col items-center ml-4">
                    <div className="text-[10px] text-green-600 mb-1">平均</div>
                    <div className="w-20 h-10 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center font-bold text-green-700 text-sm">
                      {safeAvg(viewing.layerDepths).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-cyan-100 bg-cyan-50/30">
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-600" />
                  油槽冷却记录
                </h4>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">入槽温度</div>
                    <div className="text-xl font-bold text-cyan-700">{viewing.oilTankStartTemp}℃</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">出槽温度</div>
                    <div className="text-xl font-bold text-red-600">{viewing.oilTankEndTemp}℃</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">冷却时间</div>
                    <div className="text-xl font-bold text-purple-600">{viewing.coolingDuration} min</div>
                  </div>
                </div>
              </div>

              {viewing.remark && (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="text-xs font-semibold text-amber-800 mb-1">备注</div>
                  <div className="text-sm text-amber-900">{viewing.remark}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-orange-600 to-red-600 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Flame className="w-4 h-5" />
                </div>
                <h3 className="font-bold text-sm">新增渗碳淬火记录</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-white/20">
                <X className="w-4 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">批次号 *</label>
                  <select
                    value={form.batchId}
                    onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                    className="input-base"
                  >
                    <option value="">请选择批次</option>
                    {furnaceBatches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.batchNo} - {b.furnaceNo}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">炉号</label>
                  <select
                    value={form.furnaceNo}
                    onChange={(e) => setForm({ ...form, furnaceNo: e.target.value })}
                    className="input-base"
                  >
                    <option>RC-01</option>
                    <option>RC-02</option>
                    <option>RC-03</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">起始温度(℃)</label>
                  <input type="number" value={form.startTemp} onChange={(e) => setForm({ ...form, startTemp: Number(e.target.value) })} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">目标温度(℃)</label>
                  <input type="number" value={form.targetTemp} onChange={(e) => setForm({ ...form, targetTemp: Number(e.target.value) })} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">淬火介质温度(℃)</label>
                  <input type="number" value={form.quenchingMediumTemp} onChange={(e) => setForm({ ...form, quenchingMediumTemp: Number(e.target.value) })} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">冷却时长(min)</label>
                  <input type="number" value={form.coolingDuration} onChange={(e) => setForm({ ...form, coolingDuration: Number(e.target.value) })} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">油槽起始温度(℃)</label>
                  <input type="number" value={form.oilTankStartTemp} onChange={(e) => setForm({ ...form, oilTankStartTemp: Number(e.target.value) })} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">油槽结束温度(℃)</label>
                  <input type="number" value={form.oilTankEndTemp} onChange={(e) => setForm({ ...form, oilTankEndTemp: Number(e.target.value) })} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">操作员 *</label>
                  <input value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">记录员</label>
                  <input value={form.recorder} onChange={(e) => setForm({ ...form, recorder: e.target.value })} className="input-base" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  渗碳层深度测量 (mm)，用逗号分隔 *
                </label>
                <input
                  value={layerDepthsInput}
                  onChange={(e) => {
                    setLayerDepthsInput(e.target.value);
                    if (layerDepthsError) setLayerDepthsError("");
                  }}
                  className={cn(
                    "input-base font-mono",
                    layerDepthsError && "border-red-300 focus:ring-red-200 focus:border-red-400"
                  )}
                  placeholder="0.9, 0.95, 1.0, 1.05, 0.98"
                />
                {layerDepthsError && (
                  <div className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {layerDepthsError}
                  </div>
                )}
                <div className="text-[10px] text-slate-400 mt-1">
                  至少输入 3 个有效值，范围 0.1-10mm，当前 {validateNumberArray(layerDepthsInput).values.length} 个有效数值
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">备注</label>
                <textarea rows={2} value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} className="input-base resize-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <button onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
              <button onClick={save} className="btn-primary">
                <Save className="w-4 h-4" />保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
