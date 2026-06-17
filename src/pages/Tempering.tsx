import { useState } from "react";
import { useStore } from "@/store";
import { cn, formatDateTime } from "@/utils";
import {
  Plus,
  Search,
  Thermometer,
  Clock,
  X,
  Save,
  User,
  Activity,
  Flame,
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
} from "recharts";

export default function Tempering() {
  const { temperingRecords, furnaceBatches, addTemperingRecord } = useStore();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [viewing, setViewing] = useState<any>(null);
  const [form, setForm] = useState({
    batchId: "",
    furnaceNo: "TH-01",
    targetTemp: 180,
    holdingTime: 240,
    operator: "",
    recorder: "",
    remark: "",
  });

  const filtered = temperingRecords.filter((r) => {
    const b = furnaceBatches.find((f) => f.id === r.batchId);
    return !search || r.furnaceNo.includes(search) || (b && b.batchNo.toLowerCase().includes(search.toLowerCase()));
  });

  const save = () => {
    if (!form.batchId || !form.operator) {
      alert("请选择批次并填写操作员");
      return;
    }
    const now = new Date().toLocaleString();
    const points = [];
    for (let i = 0; i < 10; i++) {
      const t = i * 30;
      let temp;
      if (i < 2) temp = 25 + (form.targetTemp - 25) * (i / 2) + (Math.random() - 0.5) * 8;
      else if (i < 8) temp = form.targetTemp + (Math.random() - 0.5) * 5;
      else temp = form.targetTemp - 30 * (i - 8);
      points.push({ time: t, temp: Math.max(20, Math.round(temp)) });
    }
    addTemperingRecord({ ...form, tempCurve: points, recordTime: now });
    setShowModal(false);
  };

  const avgTemp = (curve: any[]) => {
    const holding = curve.slice(2, -2);
    if (holding.length === 0) return "-";
    return (holding.reduce((a, b) => a + b.temp, 0) / holding.length).toFixed(1);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "平均回火温度", value: "186", unit: "℃", color: "from-amber-500 to-orange-500" },
          { label: "平均保温时长", value: "268", unit: "min", color: "from-blue-500 to-indigo-500" },
          { label: "运行回火炉", value: "2", unit: "台", color: "from-green-500 to-emerald-500" },
          { label: "总记录数", value: temperingRecords.length.toString(), unit: "条", color: "from-purple-500 to-pink-500" },
        ].map((s, i) => (
          <div key={i} className="card-base flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br shadow-lg flex items-center justify-center", s.color)}>
              <Thermometer className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs text-slate-500">{s.label}</div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-800">{s.value}</span>
                <span className="text-xs text-slate-400">{s.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filtered.map((r) => {
          const b = furnaceBatches.find((f) => f.id === r.batchId);
          return (
            <div key={r.id} className="card-base hover:shadow-card-hover transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                    <Flame className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-mono font-semibold text-primary-600 text-sm">{b?.batchNo || "-"}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>炉号: {r.furnaceNo}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span>{formatDateTime(r.recordTime)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setViewing(r)}
                  className="text-xs px-3 py-1.5 rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100 font-medium"
                >
                  详情
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="text-[10px] text-amber-700 mb-1 flex items-center gap-1">
                    <Thermometer className="w-3 h-3" />
                    目标温度
                  </div>
                  <div className="text-xl font-bold text-amber-700">{r.targetTemp}℃</div>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="text-[10px] text-blue-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    保温时长
                  </div>
                  <div className="text-xl font-bold text-blue-700">{r.holdingTime}min</div>
                </div>
                <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                  <div className="text-[10px] text-green-700 mb-1 flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    实际均温
                  </div>
                  <div className="text-xl font-bold text-green-700">{avgTemp(r.tempCurve)}℃</div>
                </div>
              </div>

              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={r.tempCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fef3c7" vertical={false} />
                    <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip contentStyle={{ borderRadius: 6, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 11 }} />
                    <ReferenceLine y={r.targetTemp} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1} />
                    <Line type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1"><User className="w-3 h-3" />操作: {r.operator}</span>
                <span>记录: {r.recorder}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card-base">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="搜索炉号、批次号..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-72 pl-9 input-base"
            />
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            新增回火记录
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-100">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header-cell">批次号</th>
                <th className="table-header-cell">炉号</th>
                <th className="table-header-cell">目标温度</th>
                <th className="table-header-cell">保温时间</th>
                <th className="table-header-cell">实际均温</th>
                <th className="table-header-cell">操作员</th>
                <th className="table-header-cell">记录时间</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const b = furnaceBatches.find((f) => f.id === r.batchId);
                return (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="table-cell font-mono text-xs text-primary-600 font-semibold">{b?.batchNo}</td>
                    <td className="table-cell">{r.furnaceNo}</td>
                    <td className="table-cell"><span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs font-medium">{r.targetTemp}℃</span></td>
                    <td className="table-cell">{r.holdingTime} min</td>
                    <td className="table-cell text-green-600 font-medium">{avgTemp(r.tempCurve)}℃</td>
                    <td className="table-cell text-xs">{r.operator}</td>
                    <td className="table-cell text-xs text-slate-500">{formatDateTime(r.recordTime)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                  <Thermometer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">回火处理详情</h3>
                  <p className="text-xs text-white/80">炉号 {viewing.furnaceNo} | 目标 {viewing.targetTemp}℃</p>
                </div>
              </div>
              <button onClick={() => setViewing(null)} className="p-1.5 rounded-lg hover:bg-white/20">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="p-5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
                <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-600" />
                  回火炉温曲线
                </h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={viewing.tempCurve}>
                      <defs>
                        <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" vertical={false} />
                      <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} label={{ value: "时间 (min)", position: "insideBottom", offset: -5, fontSize: 11, fill: "#94a3b8" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} label={{ value: "温度(℃)", angle: -90, position: "insideLeft", fontSize: 11, fill: "#94a3b8" }} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", fontSize: 12 }} />
                      <ReferenceLine y={viewing.targetTemp} stroke="#ea580c" strokeDasharray="5 5" label={{ value: `目标 ${viewing.targetTemp}℃`, position: "right", fontSize: 11, fill: "#ea580c" }} />
                      <Line type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: "#fff", stroke: "#f59e0b", strokeWidth: 2 }} fill="url(#tGrad)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">保温时长</div>
                  <div className="text-xl font-bold text-blue-700">{viewing.holdingTime} min</div>
                </div>
                <div className="p-4 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">操作员</div>
                  <div className="text-base font-semibold text-slate-700">{viewing.operator}</div>
                </div>
                <div className="p-4 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">记录员</div>
                  <div className="text-base font-semibold text-slate-700">{viewing.recorder}</div>
                </div>
              </div>
              {viewing.remark && (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-100 text-sm text-amber-800">
                  <div className="font-semibold mb-1">备注</div>
                  {viewing.remark}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Thermometer className="w-4 h-5" />
                </div>
                <h3 className="font-bold text-sm">新增回火记录</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-white/20">
                <X className="w-4 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">批次号 *</label>
                  <select value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} className="input-base">
                    <option value="">请选择批次</option>
                    {furnaceBatches.map((b) => (
                      <option key={b.id} value={b.id}>{b.batchNo} - {b.furnaceNo}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">回火炉号</label>
                  <select value={form.furnaceNo} onChange={(e) => setForm({ ...form, furnaceNo: e.target.value })} className="input-base">
                    <option>TH-01</option>
                    <option>TH-02</option>
                    <option>TH-03</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">目标温度(℃)</label>
                  <input type="number" value={form.targetTemp} onChange={(e) => setForm({ ...form, targetTemp: Number(e.target.value) })} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">保温时长(min)</label>
                  <input type="number" value={form.holdingTime} onChange={(e) => setForm({ ...form, holdingTime: Number(e.target.value) })} className="input-base" />
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
                <label className="block text-xs font-medium text-slate-600 mb-1.5">备注</label>
                <textarea rows={2} value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} className="input-base resize-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <button onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
              <button onClick={save} className="btn-primary"><Save className="w-4 h-4" />保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
