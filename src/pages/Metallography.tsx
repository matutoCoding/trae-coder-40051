import { useState } from "react";
import { useStore } from "@/store";
import { resultMap, cn, formatDateTime } from "@/utils";
import {
  Plus,
  Search,
  Microscope,
  CheckCircle2,
  XCircle,
  X,
  Save,
  User,
  FileImage,
  AlertCircle,
} from "lucide-react";

export default function Metallography() {
  const { metallographyRecords, furnaceBatches, addMetallographyRecord } = useStore();
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [viewing, setViewing] = useState<any>(null);
  const [form, setForm] = useState({
    batchId: "",
    sampleNo: "",
    partNo: "",
    pearliteLevel: "",
    ferriteContent: "",
    martensiteLevel: "3级",
    carbideLevel: "",
    retainedAustenite: "",
    structureLevel: "",
    result: "pending" as "pass" | "fail" | "pending",
    inspector: "",
    remark: "",
  });

  const filtered = metallographyRecords.filter((r) => {
    const b = furnaceBatches.find((f) => f.id === r.batchId);
    const matchSearch =
      !search ||
      r.sampleNo.toLowerCase().includes(search.toLowerCase()) ||
      r.partNo.toLowerCase().includes(search.toLowerCase()) ||
      (b && b.batchNo.includes(search));
    const matchResult = resultFilter === "all" || r.result === resultFilter;
    return matchSearch && matchResult;
  });

  const stats = [
    { label: "合格", value: metallographyRecords.filter((r) => r.result === "pass").length, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
    { label: "不合格", value: metallographyRecords.filter((r) => r.result === "fail").length, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
    { label: "待判定", value: metallographyRecords.filter((r) => r.result === "pending").length, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-100" },
    { label: "合格率", value: metallographyRecords.length > 0 ? ((metallographyRecords.filter((r) => r.result === "pass").length / metallographyRecords.length) * 100).toFixed(1) + "%" : "0%", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  ];

  const save = () => {
    if (!form.batchId || !form.sampleNo || !form.partNo || !form.martensiteLevel || !form.inspector) {
      alert("请填写完整必填项");
      return;
    }
    addMetallographyRecord({ ...form, recordTime: new Date().toLocaleString() });
    setShowModal(false);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={cn("card-base border-l-4", s.border)}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">{s.label}</div>
                <div className={cn("text-2xl font-bold mt-1", s.color)}>{s.value}</div>
              </div>
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", s.bg)}>
                <Microscope className={cn("w-6 h-6", s.color)} />
              </div>
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
                placeholder="搜索试样号、零件号、批次..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-72 pl-9 input-base"
              />
            </div>
            <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} className="input-base w-36">
              <option value="all">全部结果</option>
              <option value="pass">合格</option>
              <option value="fail">不合格</option>
              <option value="pending">待判定</option>
            </select>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            新增检测记录
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => {
            const b = furnaceBatches.find((f) => f.id === r.batchId);
            const rm = resultMap[r.result];
            return (
              <div key={r.id} className="rounded-xl border border-slate-100 bg-white overflow-hidden hover:shadow-card-hover transition-all group">
                <div className={cn("h-1.5", r.result === "pass" ? "bg-green-500" : r.result === "fail" ? "bg-red-500" : "bg-slate-400")} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-mono font-semibold text-primary-600 text-sm">{r.sampleNo}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{b?.batchNo}</div>
                    </div>
                    <span className={cn("badge", rm.bgColor, rm.color)}>{rm.label}</span>
                  </div>

                  <div className="space-y-1.5 text-xs mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">零件编号</span>
                      <span className="font-mono text-slate-700">{r.partNo}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">马氏体级别</span>
                      <span className="font-semibold text-purple-600">{r.martensiteLevel}</span>
                    </div>
                    {r.carbideLevel && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">碳化物</span>
                        <span className="text-slate-700">{r.carbideLevel}</span>
                      </div>
                    )}
                    {r.retainedAustenite && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">残余奥氏体</span>
                        <span className="text-slate-700">{r.retainedAustenite}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">组织判定</span>
                      <span className={cn("font-medium", r.structureLevel === "合格" ? "text-green-600" : "text-amber-600")}>
                        {r.structureLevel || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <User className="w-3 h-3" />
                      {r.inspector}
                    </div>
                    <button
                      onClick={() => setViewing(r)}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      查看详情 →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-400">
            <Microscope className="w-16 h-16 mx-auto mb-3 opacity-20" />
            <div>暂无金相检测记录</div>
          </div>
        )}
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                  <Microscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">金相检测报告</h3>
                  <p className="text-xs text-white/80">试样号: {viewing.sampleNo}</p>
                </div>
              </div>
              <span className={cn("badge !bg-white/20 !text-white px-3 py-1")}>
                {resultMap[viewing.result].label}
              </span>
              <button onClick={() => setViewing(null)} className="p-1.5 rounded-lg hover:bg-white/20">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 p-4 rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg bg-white border-2 border-dashed border-purple-200 flex items-center justify-center flex-shrink-0">
                    <FileImage className="w-10 h-10 text-purple-300" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-700 mb-1">金相显微组织图像</div>
                    <div className="text-xs text-slate-400">500x 放大倍率 | 硝酸酒精腐蚀</div>
                    <div className="mt-2 text-xs text-purple-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      点击上传金相图像
                    </div>
                  </div>
                </div>

                {[
                  { label: "批次号", value: furnaceBatches.find((f) => f.id === viewing.batchId)?.batchNo || "-" },
                  { label: "零件编号", value: viewing.partNo },
                  { label: "马氏体级别", value: viewing.martensiteLevel, highlight: "text-purple-600" },
                  { label: "碳化物级别", value: viewing.carbideLevel || "-" },
                  { label: "珠光体", value: viewing.pearliteLevel || "-" },
                  { label: "铁素体含量", value: viewing.ferriteContent || "-" },
                  { label: "残余奥氏体", value: viewing.retainedAustenite || "-" },
                  { label: "组织级别判定", value: viewing.structureLevel || "-", highlight: viewing.structureLevel === "合格" ? "text-green-600 font-bold" : "text-amber-600" },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                    <div className="text-[10px] text-slate-400 mb-1">{item.label}</div>
                    <div className={cn("text-sm font-semibold text-slate-700", item.highlight)}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50">
                {viewing.result === "pass" ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-8 h-8" />
                    <div>
                      <div className="font-bold text-lg">检测合格</div>
                      <div className="text-xs text-slate-500">组织符合技术要求</div>
                    </div>
                  </div>
                ) : viewing.result === "fail" ? (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-8 h-8" />
                    <div>
                      <div className="font-bold text-lg">检测不合格</div>
                      <div className="text-xs text-slate-500">组织不符合技术要求</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500">
                    <AlertCircle className="w-8 h-8" />
                    <div>
                      <div className="font-bold text-lg">待判定</div>
                      <div className="text-xs text-slate-500">等待最终判定</div>
                    </div>
                  </div>
                )}
                <div className="ml-auto text-right">
                  <div className="text-xs text-slate-400">检测员</div>
                  <div className="text-sm font-semibold text-slate-700">{viewing.inspector}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">检测时间</div>
                  <div className="text-sm text-slate-600">{formatDateTime(viewing.recordTime)}</div>
                </div>
              </div>

              {viewing.remark && (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="text-xs font-semibold text-amber-800 mb-1">备注说明</div>
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
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Microscope className="w-4 h-5" />
                </div>
                <h3 className="font-bold text-sm">新增金相检测</h3>
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
                    <option value="">请选择批次</option>
                    {furnaceBatches.map((b) => (
                      <option key={b.id} value={b.id}>{b.batchNo} - {b.processCardName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">试样编号 *</label>
                  <input value={form.sampleNo} onChange={(e) => setForm({ ...form, sampleNo: e.target.value })} className="input-base" placeholder="SY-2024001" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">零件编号 *</label>
                  <input value={form.partNo} onChange={(e) => setForm({ ...form, partNo: e.target.value })} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">马氏体级别 *</label>
                  <select value={form.martensiteLevel} onChange={(e) => setForm({ ...form, martensiteLevel: e.target.value })} className="input-base">
                    {["1级", "2级", "3级", "4级", "5级"].map((v) => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">碳化物级别</label>
                  <select value={form.carbideLevel} onChange={(e) => setForm({ ...form, carbideLevel: e.target.value })} className="input-base">
                    <option value="">-</option>
                    {["1级", "2级", "3级", "4级", "5级"].map((v) => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">残余奥氏体</label>
                  <input value={form.retainedAustenite} onChange={(e) => setForm({ ...form, retainedAustenite: e.target.value })} className="input-base" placeholder="如: 15%" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">组织级别判定</label>
                  <select value={form.structureLevel} onChange={(e) => setForm({ ...form, structureLevel: e.target.value })} className="input-base">
                    <option value="">请选择</option>
                    <option>合格</option>
                    <option>不合格</option>
                    <option>待复核</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">检测结果</label>
                  <select value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value as any })} className="input-base">
                    <option value="pending">待判定</option>
                    <option value="pass">合格</option>
                    <option value="fail">不合格</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">检测员 *</label>
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
