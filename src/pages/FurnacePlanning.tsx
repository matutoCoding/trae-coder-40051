import { useState } from "react";
import { useStore } from "@/store";
import { statusMap, cn, formatDateTime } from "@/utils";
import {
  Plus,
  Search,
  CalendarClock,
  Edit2,
  X,
  Save,
  Package,
  User,
  MapPin,
  Layers,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function FurnacePlanning() {
  const { furnaceBatches, partItems, processCards, addFurnaceBatch, addPartItem, deletePartItem, deleteFurnaceBatch, updatePartItem } = useStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPartModal, setShowPartModal] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [batchForm, setBatchForm] = useState({
    furnaceNo: "RC-01",
    batchNo: "",
    processCardId: "",
    status: "pending" as any,
    startTime: "",
    operator: "",
    totalQuantity: 0,
    remark: "",
  });
  const [partForm, setPartForm] = useState({
    partNo: "",
    partName: "",
    quantity: 0,
    position: "",
    customer: "",
    drawingNo: "",
  });

  const filtered = furnaceBatches.filter((b) => {
    const match =
      !search ||
      b.batchNo.toLowerCase().includes(search.toLowerCase()) ||
      b.furnaceNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return match && matchStatus;
  });

  const openCreate = () => {
    const now = new Date();
    const batchId = `LC${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(furnaceBatches.length + 1).padStart(3, "0")}`;
    setBatchForm({
      furnaceNo: "RC-01",
      batchNo: batchId,
      processCardId: processCards[0]?.id || "",
      status: "pending",
      startTime: new Date().toLocaleString(),
      operator: "",
      totalQuantity: 0,
      remark: "",
    });
    setShowModal(true);
  };

  const saveBatch = () => {
    if (!batchForm.operator) {
      alert("请填写操作员");
      return;
    }
    const pc = processCards.find((p) => p.id === batchForm.processCardId);
    addFurnaceBatch({
      ...batchForm,
      processCardName: pc?.name,
    });
    setShowModal(false);
  };

  const openAddPart = (batchId: string) => {
    setCurrentBatchId(batchId);
    setEditingPartId(null);
    setPartForm({ partNo: "", partName: "", quantity: 0, position: "", customer: "", drawingNo: "" });
    setShowPartModal(true);
  };

  const openEditPart = (part: any) => {
    setCurrentBatchId(part.batchId);
    setEditingPartId(part.id);
    setPartForm({
      partNo: part.partNo,
      partName: part.partName,
      quantity: part.quantity,
      position: part.position || "",
      customer: part.customer || "",
      drawingNo: part.drawingNo || "",
    });
    setShowPartModal(true);
  };

  const savePart = () => {
    if (!partForm.partNo || !partForm.partName || !partForm.quantity) {
      alert("请填写完整零件信息（零件号、名称、数量）");
      return;
    }
    const qty = Number(partForm.quantity);
    if (isNaN(qty) || qty <= 0) {
      alert("请输入有效的数量");
      return;
    }
    if (editingPartId) {
      updatePartItem(editingPartId, { ...partForm, quantity: qty });
    } else if (currentBatchId) {
      addPartItem({ ...partForm, batchId: currentBatchId, quantity: qty });
    }
    setShowPartModal(false);
    setEditingPartId(null);
  };

  const batchParts = (id: string) => partItems.filter((p) => p.batchId === id);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "待排产炉次", key: "pending", color: "bg-slate-500" },
          { label: "装炉中", key: "loading", color: "bg-blue-500" },
          { label: "进行中", key: "processing", color: "bg-orange-500" },
          { label: "已完成", key: "completed", color: "bg-green-500" },
        ].map((s) => {
          const count =
            s.key === "processing"
              ? furnaceBatches.filter(
                  (b) => ["carburizing", "quenching", "tempering", "inspecting", "correcting"].includes(b.status)
                ).length
              : furnaceBatches.filter((b) => b.status === s.key).length;
          return (
            <div key={s.key} className="card-base">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">{s.label}</span>
                <span className={cn("w-2.5 h-2.5 rounded-full", s.color)} />
              </div>
              <div className="text-2xl font-bold text-slate-800">{count}</div>
            </div>
          );
        })}
      </div>

      <div className="card-base">
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="搜索炉号、批次号..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-72 pl-9 input-base"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-base w-40"
            >
              <option value="all">全部状态</option>
              {Object.entries(statusMap).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" />
            新建炉次
          </button>
        </div>

        <div className="space-y-3">
          {filtered.map((batch) => {
            const st = statusMap[batch.status];
            const parts = batchParts(batch.id);
            const expanded = expandedId === batch.id;
            return (
              <div
                key={batch.id}
                className="rounded-xl border border-slate-100 bg-white overflow-hidden hover:shadow-card-hover transition-all"
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(expanded ? null : batch.id)}
                >
                  <div className="flex items-center gap-5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(expanded ? null : batch.id);
                      }}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400"
                    >
                      {expanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-2">
                        <div className="text-[10px] text-slate-400 mb-0.5">批次号</div>
                        <div className="font-mono font-semibold text-primary-600 text-sm">{batch.batchNo}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 mb-0.5">炉号</div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                          <span className="font-medium text-slate-700 text-sm">{batch.furnaceNo}</span>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <div className="text-[10px] text-slate-400 mb-0.5">工艺卡片</div>
                        <div className="text-sm text-slate-700 truncate">{batch.processCardName}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 mb-0.5">数量</div>
                        <div className="text-sm font-medium text-slate-700 flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                          {batch.totalQuantity} 件
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 mb-0.5">操作员</div>
                        <div className="text-sm text-slate-700 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {batch.operator}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 mb-0.5">开始时间</div>
                        <div className="text-xs text-slate-600">{formatDateTime(batch.startTime)}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400 mb-0.5">状态</div>
                          <span className={cn("badge", st.bgColor, st.color)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full mr-1", st.dotColor)} />
                            {st.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-primary-600" />
                          <span className="text-sm font-semibold text-slate-700">装炉零件清单</span>
                          <span className="text-xs text-slate-400">（共 {parts.length} 种零件，{parts.reduce((a, p) => a + p.quantity, 0)} 件）</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openAddPart(batch.id);
                          }}
                          className="text-xs btn-primary !py-1.5 !px-3"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          添加零件
                        </button>
                      </div>

                      <div className="overflow-x-auto rounded-lg border border-slate-100 bg-white">
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th className="table-header-cell">零件编号</th>
                              <th className="table-header-cell">零件名称</th>
                              <th className="table-header-cell">图号</th>
                              <th className="table-header-cell">客户</th>
                              <th className="table-header-cell">数量</th>
                              <th className="table-header-cell">装炉位置</th>
                              <th className="table-header-cell text-right">操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parts.map((p) => (
                              <tr key={p.id} className="hover:bg-slate-50/60">
                                <td className="table-cell font-mono text-xs text-primary-600">{p.partNo}</td>
                                <td className="table-cell text-sm">{p.partName}</td>
                                <td className="table-cell text-xs text-slate-500 font-mono">{p.drawingNo || "-"}</td>
                                <td className="table-cell text-xs text-slate-500">{p.customer || "-"}</td>
                                <td className="table-cell">
                                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                                    {p.quantity} 件
                                  </span>
                                </td>
                                <td className="table-cell text-xs flex items-center gap-1 text-slate-600">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  {p.position}
                                </td>
                                <td className="table-cell text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditPart(p);
                                      }}
                                      className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-500"
                                      title="编辑零件"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm("确定移除该零件?")) deletePartItem(p.id);
                                      }}
                                      className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                                      title="移除零件"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {parts.length === 0 && (
                              <tr>
                                <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                  暂无装炉零件，请点击"添加零件"
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {batch.status === "pending" && (
                        <div className="mt-4 flex items-center justify-end gap-3 pt-4 border-t border-slate-200/60">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`确定删除炉次 ${batch.batchNo}?`)) deleteFurnaceBatch(batch.id);
                            }}
                            className="btn-danger"
                          >
                            <Trash2 className="w-4 h-4" />
                            删除炉次
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <Modal
          title="新建炉次"
          icon={CalendarClock}
          onClose={() => setShowModal(false)}
          onSave={saveBatch}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">批次号</label>
              <input
                value={batchForm.batchNo}
                onChange={(e) => setBatchForm({ ...batchForm, batchNo: e.target.value })}
                className="input-base font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">炉号</label>
              <select
                value={batchForm.furnaceNo}
                onChange={(e) => setBatchForm({ ...batchForm, furnaceNo: e.target.value })}
                className="input-base"
              >
                <option>RC-01</option>
                <option>RC-02</option>
                <option>RC-03</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">工艺卡片</label>
              <select
                value={batchForm.processCardId}
                onChange={(e) => setBatchForm({ ...batchForm, processCardId: e.target.value })}
                className="input-base"
              >
                {processCards.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.name} - {p.material}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">操作员 *</label>
              <input
                value={batchForm.operator}
                onChange={(e) => setBatchForm({ ...batchForm, operator: e.target.value })}
                placeholder="输入操作员姓名"
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">开始时间</label>
              <input
                value={batchForm.startTime}
                onChange={(e) => setBatchForm({ ...batchForm, startTime: e.target.value })}
                className="input-base"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">备注</label>
              <textarea
                rows={2}
                value={batchForm.remark}
                onChange={(e) => setBatchForm({ ...batchForm, remark: e.target.value })}
                className="input-base resize-none"
              />
            </div>
          </div>
        </Modal>
      )}

      {showPartModal && (
        <Modal
          title={editingPartId ? "编辑装炉零件" : "添加装炉零件"}
          icon={Package}
          onClose={() => setShowPartModal(false)}
          onSave={savePart}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">零件编号 *</label>
              <input
                value={partForm.partNo}
                onChange={(e) => setPartForm({ ...partForm, partNo: e.target.value })}
                className="input-base"
                placeholder="如: CL-2024-001"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">零件名称 *</label>
              <input
                value={partForm.partName}
                onChange={(e) => setPartForm({ ...partForm, partName: e.target.value })}
                className="input-base"
                placeholder="如: 变速箱齿轮"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">图号</label>
              <input
                value={partForm.drawingNo}
                onChange={(e) => setPartForm({ ...partForm, drawingNo: e.target.value })}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">客户</label>
              <input
                value={partForm.customer}
                onChange={(e) => setPartForm({ ...partForm, customer: e.target.value })}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">数量(件) *</label>
              <input
                type="number"
                value={partForm.quantity}
                onChange={(e) => setPartForm({ ...partForm, quantity: Number(e.target.value) })}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">装炉位置</label>
              <input
                value={partForm.position}
                onChange={(e) => setPartForm({ ...partForm, position: e.target.value })}
                className="input-base"
                placeholder="如: A-01, B-02"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  icon: Icon,
  onClose,
  onSave,
  children,
}: {
  title: string;
  icon: any;
  onClose: () => void;
  onSave: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-primary-800 to-primary-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Icon className="w-4 h-5" />
            </div>
            <h3 className="font-bold text-sm">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button onClick={onSave} className="btn-primary">
            <Save className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
