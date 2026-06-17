import { useState } from "react";
import { useStore } from "@/store";
import { resultMap, cn, formatDateTime } from "@/utils";
import {
  Plus,
  Search,
  Ruler,
  Edit2,
  X,
  Save,
  User,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  TrendingDown,
  ArrowRight,
  Hammer,
} from "lucide-react";

export default function Deformation() {
  const { deformationRecords, furnaceBatches, partItems, addDeformationRecord, updateDeformationRecord } = useStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    batchId: "",
    partNo: "",
    partName: "",
    measurementPoint: "",
    beforeValue: 0,
    standardValue: 0,
    tolerance: 0,
    afterValue: undefined as number | undefined,
    correctionMethod: "压力机校直",
    correctionTimes: 1,
    recheckValue: undefined as number | undefined,
    result: "correcting" as any,
    operator: "",
    inspector: "",
    remark: "",
  });

  const filtered = deformationRecords.filter((r) => {
    const b = furnaceBatches.find((f) => f.id === r.batchId);
    const match = !search || r.partNo.includes(search) || r.partName.includes(search) || (b && b.batchNo.includes(search));
    const matchStatus = statusFilter === "all" || r.result === statusFilter;
    return match && matchStatus;
  });

  const partsForBatch = (batchId: string) => partItems.filter((p) => p.batchId === batchId);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      batchId: "",
      partNo: "",
      partName: "",
      measurementPoint: "",
      beforeValue: 0,
      standardValue: 0,
      tolerance: 0,
      afterValue: undefined,
      correctionMethod: "压力机校直",
      correctionTimes: 1,
      recheckValue: undefined,
      result: "correcting",
      operator: "",
      inspector: "",
      remark: "",
    });
    setShowModal(true);
  };

  const openEdit = (r: any) => {
    setEditingId(r.id);
    setForm({ ...r });
    setShowModal(true);
  };

  const save = () => {
    if (!form.batchId || !form.partNo || !form.measurementPoint || !form.operator) {
      alert("请填写必填项");
      return;
    }
    if (editingId) {
      updateDeformationRecord(editingId, form as any);
    } else {
      addDeformationRecord({ ...form, recordTime: new Date().toLocaleString() } as any);
    }
    setShowModal(false);
  };

  const stats = [
    { label: "矫正中", value: deformationRecords.filter((r) => r.result === "correcting").length, color: "text-pink-600", bg: "bg-pink-50" },
    { label: "已完成", value: deformationRecords.filter((r) => r.result === "pass").length, color: "text-green-600", bg: "bg-green-50" },
    { label: "不合格", value: deformationRecords.filter((r) => r.result === "fail").length, color: "text-red-600", bg: "bg-red-50" },
    { label: "平均矫正次数", value: (deformationRecords.reduce((a, b) => a + b.correctionTimes, 0) / (deformationRecords.length || 1)).toFixed(1), color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="card-base flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", s.bg)}>
              <Ruler className={cn("w-6 h-6", s.color)} />
            </div>
            <div>
              <div className="text-xs text-slate-500">{s.label}</div>
              <div className={cn("text-2xl font-bold mt-1", s.color)}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card-base">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="搜索零件号、名称、批次..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-72 pl-9 input-base"
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-base w-36">
              <option value="all">全部状态</option>
              <option value="correcting">矫正中</option>
              <option value="pass">已合格</option>
              <option value="fail">不合格</option>
              <option value="pending">待检测</option>
            </select>
          </div>
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" />
            新增矫正记录
          </button>
        </div>

        <div className="space-y-3">
          {filtered.map((r) => {
            const b = furnaceBatches.find((f) => f.id === r.batchId);
            const rm = resultMap[r.result];
            const isOver = r.beforeValue > r.standardValue + r.tolerance;
            const maxAllow = r.standardValue + r.tolerance;
            return (
              <div key={r.id} className="rounded-xl border border-slate-100 p-5 hover:shadow-card-hover transition-all bg-white">
                <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                      r.result === "pass" ? "bg-green-100" : r.result === "fail" ? "bg-red-100" : "bg-pink-100"
                    )}>
                      {r.result === "pass" ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : r.result === "fail" ? (
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      ) : (
                        <Hammer className="w-6 h-6 text-pink-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-semibold text-primary-600">{r.partNo}</span>
                        <span className="text-sm font-medium text-slate-700">{r.partName}</span>
                        <span className={cn("badge", rm.bgColor, rm.color)}>{rm.label}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span>批次: {b?.batchNo}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>测量点: {r.measurementPoint}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>标准 {r.standardValue}mm ±{r.tolerance}mm</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => openEdit(r)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                  <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                    <div className="text-[10px] text-red-600 mb-1 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      矫正前
                    </div>
                    <div className={cn("text-2xl font-bold", isOver ? "text-red-600" : "text-slate-700")}>
                      {r.beforeValue}
                      <span className="text-xs font-normal text-slate-400 ml-1">mm</span>
                    </div>
                    {isOver && <div className="text-[10px] text-red-500 mt-0.5">超差 +{(r.beforeValue - r.standardValue).toFixed(2)}mm</div>}
                  </div>

                  <div className="flex items-center justify-center pb-6">
                    <ArrowRight className="w-5 h-5 text-slate-300" />
                  </div>

                  <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                    <div className="text-[10px] text-purple-600 mb-1 flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" />
                      矫正后
                    </div>
                    <div className="text-2xl font-bold text-purple-700">
                      {r.afterValue !== undefined ? r.afterValue : "-"}
                      <span className="text-xs font-normal text-slate-400 ml-1">mm</span>
                    </div>
                    {r.correctionMethod && <div className="text-[10px] text-slate-500 mt-0.5">{r.correctionMethod} x{r.correctionTimes}</div>}
                  </div>

                  <div className="flex items-center justify-center pb-6">
                    <ArrowRight className="w-5 h-5 text-slate-300" />
                  </div>

                  <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                    <div className="text-[10px] text-green-600 mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      复检值
                    </div>
                    <div className={cn("text-2xl font-bold", r.recheckValue !== undefined && r.recheckValue <= maxAllow ? "text-green-600" : "text-slate-700")}>
                      {r.recheckValue !== undefined ? r.recheckValue : "-"}
                      <span className="text-xs font-normal text-slate-400 ml-1">mm</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">允差 ≤{maxAllow}mm</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-3">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />操作: {r.operator}</span>
                    <span className="flex items-center gap-1">检验: {r.inspector}</span>
                    <span>记录: {formatDateTime(r.recordTime)}</span>
                  </div>
                  {r.remark && <span className="text-amber-600 max-w-md truncate">备注: {r.remark}</span>}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-16 text-center text-slate-400">
              <Ruler className="w-16 h-16 mx-auto mb-3 opacity-20" />
              <div>暂无变形矫正记录</div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-pink-500 to-rose-500 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Ruler className="w-4 h-5" />
                </div>
                <h3 className="font-bold text-sm">{editingId ? "编辑矫正记录" : "新增矫正记录"}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-white/20">
                <X className="w-4 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">批次号 *</label>
                  <select
                    value={form.batchId}
                    onChange={(e) => {
                      const batchId = e.target.value;
                      const parts = partsForBatch(batchId);
                      setForm({
                        ...form,
                        batchId,
                        partNo: parts[0]?.partNo || "",
                        partName: parts[0]?.partName || "",
                      });
                    }}
                    className="input-base"
                  >
                    <option value="">请选择</option>
                    {furnaceBatches.map((b) => <option key={b.id} value={b.id}>{b.batchNo} - {b.processCardName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">零件号 *</label>
                  <input value={form.partNo} onChange={(e) => setForm({ ...form, partNo: e.target.value })} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">零件名称</label>
                  <input value={form.partName} onChange={(e) => setForm({ ...form, partName: e.target.value })} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">测量部位 *</label>
                  <input value={form.measurementPoint} onChange={(e) => setForm({ ...form, measurementPoint: e.target.value })} className="input-base" placeholder="如: 内孔圆度、轴径跳动、端面跳动" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">矫正方式</label>
                  <select value={form.correctionMethod} onChange={(e) => setForm({ ...form, correctionMethod: e.target.value })} className="input-base">
                    <option>压力机校直</option>
                    <option>冷压校直</option>
                    <option>火焰校直</option>
                    <option>热压校直</option>
                    <option>手工矫正</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">变形前数值 (mm) *</label>
                  <input type="number" step="0.01" value={form.beforeValue} onChange={(e) => setForm({ ...form, beforeValue: Number(e.target.value) })} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">标准值 (mm)</label>
                  <input type="number" step="0.01" value={form.standardValue} onChange={(e) => setForm({ ...form, standardValue: Number(e.target.value) })} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">公差 ±(mm)</label>
                  <input type="number" step="0.01" value={form.tolerance} onChange={(e) => setForm({ ...form, tolerance: Number(e.target.value) })} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">矫正后数值 (mm)</label>
                  <input type="number" step="0.01" value={form.afterValue ?? ""} onChange={(e) => setForm({ ...form, afterValue: e.target.value ? Number(e.target.value) : undefined })} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">矫正次数</label>
                  <input type="number" value={form.correctionTimes} onChange={(e) => setForm({ ...form, correctionTimes: Number(e.target.value) })} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">复检数值 (mm)</label>
                  <input type="number" step="0.01" value={form.recheckValue ?? ""} onChange={(e) => setForm({ ...form, recheckValue: e.target.value ? Number(e.target.value) : undefined })} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">结果</label>
                  <select value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value as any })} className="input-base">
                    <option value="correcting">矫正中</option>
                    <option value="pass">合格</option>
                    <option value="fail">不合格</option>
                    <option value="pending">待复检</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">操作员 *</label>
                  <input value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">检验员</label>
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
