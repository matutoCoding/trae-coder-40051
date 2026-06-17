import { useState } from "react";
import { useStore } from "@/store";
import { resultMap, cn, formatDateTime } from "@/utils";
import {
  Plus,
  Search,
  Gauge,
  X,
  Save,
  User,
  Target,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export default function Hardness() {
  const { hardnessRecords, furnaceBatches, addHardnessRecord, processCards } = useStore();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewing, setViewing] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    batchId: "",
    sampleNo: "",
    partNo: "",
    testType: "rockwell" as "rockwell" | "core",
    surfaceValues: [58, 59, 60, 59.5, 58.5] as number[],
    coreValues: [35, 36, 38, 37, 36] as number[],
    result: "pending" as "pass" | "fail" | "pending",
    inspector: "",
    remark: "",
  });

  const filtered = hardnessRecords.filter((r) => {
    const b = furnaceBatches.find((f) => f.id === r.batchId);
    const match = !search || r.sampleNo.includes(search) || r.partNo.includes(search) || (b && b.batchNo.includes(search));
    const matchType = typeFilter === "all" || r.testType === typeFilter;
    return match && matchType;
  });

  const passRate = hardnessRecords.length > 0
    ? ((hardnessRecords.filter((r) => r.result === "pass").length / hardnessRecords.length) * 100).toFixed(1)
    : "0";

  const save = () => {
    if (!form.batchId || !form.sampleNo || !form.partNo || !form.inspector) {
      alert("请填写必填项");
      return;
    }
    const surfaceAvg = Number((form.surfaceValues.reduce((a, b) => a + b, 0) / form.surfaceValues.length).toFixed(1));
    const coreAvg = Number((form.coreValues.reduce((a, b) => a + b, 0) / form.coreValues.length).toFixed(1));
    addHardnessRecord({
      ...form,
      surfaceAvg,
      coreAvg,
      recordTime: new Date().toLocaleString(),
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "检测总数", value: hardnessRecords.length, unit: "件", icon: Gauge, color: "from-blue-500 to-indigo-500" },
          { label: "平均表面硬度", value: (hardnessRecords.reduce((a, b) => a + b.surfaceAvg, 0) / (hardnessRecords.length || 1)).toFixed(1), unit: "HRC", icon: Target, color: "from-emerald-500 to-teal-500" },
          { label: "平均心部硬度", value: (hardnessRecords.reduce((a, b) => a + b.coreAvg, 0) / (hardnessRecords.length || 1)).toFixed(1), unit: "HRC", icon: TrendingUp, color: "from-amber-500 to-orange-500" },
          { label: "合格率", value: passRate, unit: "%", icon: BarChart3, color: "from-green-500 to-emerald-500" },
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
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="搜索试样号、零件号、批次..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-72 pl-9 input-base"
              />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-base w-40">
              <option value="all">全部类型</option>
              <option value="rockwell">洛氏硬度</option>
              <option value="core">心部硬度</option>
            </select>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            新增检验记录
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-100">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header-cell">试样号</th>
                <th className="table-header-cell">批次</th>
                <th className="table-header-cell">零件号</th>
                <th className="table-header-cell">类型</th>
                <th className="table-header-cell">表面硬度(HRC) 5点检测值</th>
                <th className="table-header-cell">平均</th>
                <th className="table-header-cell">心部硬度</th>
                <th className="table-header-cell">平均</th>
                <th className="table-header-cell">结果</th>
                <th className="table-header-cell">检验员</th>
                <th className="table-header-cell">时间</th>
                <th className="table-header-cell text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const b = furnaceBatches.find((f) => f.id === r.batchId);
                const rm = resultMap[r.result];
                return (
                  <tr key={r.id} className="hover:bg-slate-50/60 group">
                    <td className="table-cell font-mono font-semibold text-primary-600 text-xs">{r.sampleNo}</td>
                    <td className="table-cell text-xs text-slate-500">{b?.batchNo}</td>
                    <td className="table-cell text-xs">{r.partNo}</td>
                    <td className="table-cell">
                      <span className={cn("badge", r.testType === "rockwell" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600")}>
                        {r.testType === "rockwell" ? "洛氏" : "心部"}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        {r.surfaceValues.map((v, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono font-semibold text-slate-700">
                            {v}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="font-bold text-emerald-600 text-sm">{r.surfaceAvg}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        {r.coreValues.map((v, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-amber-50 text-[10px] font-mono font-semibold text-amber-700">
                            {v}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="font-bold text-amber-600 text-sm">{r.coreAvg}</span>
                    </td>
                    <td className="table-cell">
                      <span className={cn("badge", rm.bgColor, rm.color)}>{rm.label}</span>
                    </td>
                    <td className="table-cell text-xs">{r.inspector}</td>
                    <td className="table-cell text-xs text-slate-500">{formatDateTime(r.recordTime)}</td>
                    <td className="table-cell text-right">
                      <button
                        onClick={() => setViewing(r)}
                        className="text-xs px-3 py-1.5 rounded-md bg-primary-50 text-primary-600 hover:bg-primary-100 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        图表
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <Gauge className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <div>暂无硬度检验记录</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">硬度检验报告</h3>
                  <p className="text-xs text-white/80">试样: {viewing.sampleNo} | {viewing.testType === "rockwell" ? "洛氏硬度" : "心部硬度抽检"}</p>
                </div>
              </div>
              <button onClick={() => setViewing(null)} className="p-1.5 rounded-lg hover:bg-white/20">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div className="p-4 rounded-xl border border-slate-100 bg-gradient-to-br from-emerald-50 to-teal-50">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-600" />
                    表面硬度分布 (HRC)
                  </h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={viewing.surfaceValues.map((v: number, i: number) => ({ point: `#${i + 1}`, value: v }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" vertical={false} />
                        <XAxis dataKey="point" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <YAxis domain={[50, 65]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={35} />
                        <Tooltip contentStyle={{ borderRadius: 6, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }} />
                        <ReferenceLine y={viewing.surfaceAvg} stroke="#059669" strokeDasharray="3 3" label={{ value: `均值 ${viewing.surfaceAvg}`, position: "right", fontSize: 10, fill: "#059669" }} />
                        <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 bg-gradient-to-br from-amber-50 to-orange-50">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                    心部硬度分布 (HRC)
                  </h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={viewing.coreValues.map((v: number, i: number) => ({ point: `#${i + 1}`, value: v }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#fef3c7" vertical={false} />
                        <XAxis dataKey="point" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <YAxis domain={[20, 50]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={35} />
                        <Tooltip contentStyle={{ borderRadius: 6, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }} />
                        <ReferenceLine y={viewing.coreAvg} stroke="#d97706" strokeDasharray="3 3" label={{ value: `均值 ${viewing.coreAvg}`, position: "right", fontSize: 10, fill: "#d97706" }} />
                        <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "批次号", value: furnaceBatches.find((f) => f.id === viewing.batchId)?.batchNo || "-" },
                  { label: "零件号", value: viewing.partNo },
                  { label: "检验员", value: viewing.inspector },
                  { label: "检验时间", value: formatDateTime(viewing.recordTime) },
                ].map((i, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-400 mb-1">{i.label}</div>
                    <div className="text-sm font-semibold text-slate-700">{i.value}</div>
                  </div>
                ))}
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Gauge className="w-4 h-5" />
                </div>
                <h3 className="font-bold text-sm">新增硬度检验</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-white/20">
                <X className="w-4 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">批次号 *</label>
                  <select value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} className="input-base">
                    <option value="">请选择</option>
                    {furnaceBatches.map((b) => <option key={b.id} value={b.id}>{b.batchNo} - {b.processCardName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">试样号 *</label>
                  <input value={form.sampleNo} onChange={(e) => setForm({ ...form, sampleNo: e.target.value })} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">零件号 *</label>
                  <input value={form.partNo} onChange={(e) => setForm({ ...form, partNo: e.target.value })} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">检验类型</label>
                  <select value={form.testType} onChange={(e) => setForm({ ...form, testType: e.target.value as any })} className="input-base">
                    <option value="rockwell">洛氏硬度检验</option>
                    <option value="core">心部硬度抽检</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">检验结果</label>
                  <select value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value as any })} className="input-base">
                    <option value="pending">待判定</option>
                    <option value="pass">合格</option>
                    <option value="fail">不合格</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">表面硬度5点检测值 (HRC，逗号分隔)</label>
                  <input
                    value={form.surfaceValues.join(", ")}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        surfaceValues: e.target.value.split(",").map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n)),
                      })
                    }
                    className="input-base font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">心部硬度5点检测值 (HRC，逗号分隔)</label>
                  <input
                    value={form.coreValues.join(", ")}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        coreValues: e.target.value.split(",").map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n)),
                      })
                    }
                    className="input-base font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">检验员 *</label>
                  <input value={form.inspector} onChange={(e) => setForm({ ...form, inspector: e.target.value })} className="input-base" />
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
