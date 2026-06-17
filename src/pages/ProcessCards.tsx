import { useState } from "react";
import { useStore } from "@/store";
import { processStatusMap, cn, formatDateTime } from "@/utils";
import {
  Plus,
  Search,
  FileText,
  Edit2,
  Trash2,
  Eye,
  X,
  Save,
  Thermometer,
  Clock,
  Droplets,
  Target,
  ChevronRight,
} from "lucide-react";

export default function ProcessCards() {
  const { processCards, addProcessCard, updateProcessCard, deleteProcessCard } = useStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [viewingCard, setViewingCard] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    material: "",
    carburizingTemp: 920,
    carburizingTime: 360,
    quenchingTemp: 840,
    quenchingMedium: "快速淬火油",
    temperingTemp: 180,
    temperingTime: 240,
    layerDepthMin: 0.8,
    layerDepthMax: 1.2,
    hardnessMin: 58,
    hardnessMax: 62,
    coreHardnessMin: 30,
    coreHardnessMax: 45,
    version: "V1.0",
    status: "draft" as "active" | "draft" | "obsolete",
    createdBy: "工艺员",
    remark: "",
  });

  const filtered = processCards.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.material.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCreate = () => {
    setEditingCard(null);
    setFormData({
      code: `GYK-${new Date().getFullYear()}-${String(processCards.length + 1).padStart(3, "0")}`,
      name: "",
      material: "",
      carburizingTemp: 920,
      carburizingTime: 360,
      quenchingTemp: 840,
      quenchingMedium: "快速淬火油",
      temperingTemp: 180,
      temperingTime: 240,
      layerDepthMin: 0.8,
      layerDepthMax: 1.2,
      hardnessMin: 58,
      hardnessMax: 62,
      coreHardnessMin: 30,
      coreHardnessMax: 45,
      version: "V1.0",
      status: "draft",
      createdBy: "工艺员",
      remark: "",
    });
    setShowModal(true);
  };

  const openEdit = (card: any) => {
    setEditingCard(card);
    setFormData({ ...card });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.material) {
      alert("请填写工艺名称和材料牌号");
      return;
    }
    if (editingCard) {
      updateProcessCard(editingCard.id, formData);
    } else {
      addProcessCard(formData as any);
    }
    setShowModal(false);
  };

  const stats = [
    { label: "生效工艺", value: processCards.filter((c) => c.status === "active").length, color: "text-green-600", bg: "bg-green-50" },
    { label: "草稿工艺", value: processCards.filter((c) => c.status === "draft").length, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "已废止", value: processCards.filter((c) => c.status === "obsolete").length, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s, idx) => (
          <div key={idx} className={cn("card-base flex items-center gap-4", s.bg)}>
            <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
              <FileText className={cn("w-6 h-6", s.color)} />
            </div>
            <div>
              <div className="text-xs text-slate-500">{s.label}</div>
              <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card-base">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索工艺编号、名称、材料..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-72 pl-9 input-base"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-base w-36"
            >
              <option value="all">全部状态</option>
              <option value="active">生效中</option>
              <option value="draft">草稿</option>
              <option value="obsolete">已废止</option>
            </select>
          </div>
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" />
            新增工艺卡
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-100">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header-cell">工艺编号</th>
                <th className="table-header-cell">工艺名称</th>
                <th className="table-header-cell">材料牌号</th>
                <th className="table-header-cell">渗碳参数</th>
                <th className="table-header-cell">淬火参数</th>
                <th className="table-header-cell">回火参数</th>
                <th className="table-header-cell">技术要求</th>
                <th className="table-header-cell">版本</th>
                <th className="table-header-cell">状态</th>
                <th className="table-header-cell">更新时间</th>
                <th className="table-header-cell text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((card) => {
                const st = processStatusMap[card.status];
                return (
                  <tr key={card.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="table-cell font-mono font-semibold text-primary-600">{card.code}</td>
                    <td className="table-cell font-medium text-slate-800">{card.name}</td>
                    <td className="table-cell">
                      <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                        {card.material}
                      </span>
                    </td>
                    <td className="table-cell text-xs">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Thermometer className="w-3 h-3 text-orange-500" />
                        {card.carburizingTemp}℃ / {card.carburizingTime}min
                      </div>
                    </td>
                    <td className="table-cell text-xs">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Droplets className="w-3 h-3 text-cyan-500" />
                        {card.quenchingTemp}℃
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{card.quenchingMedium}</div>
                    </td>
                    <td className="table-cell text-xs">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Clock className="w-3 h-3 text-amber-500" />
                        {card.temperingTemp}℃ / {card.temperingTime}min
                      </div>
                    </td>
                    <td className="table-cell text-xs">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Target className="w-3 h-3 text-purple-500" />
                        层深 {card.layerDepthMin}-{card.layerDepthMax}mm
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        硬度 HRC {card.hardnessMin}-{card.hardnessMax}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">{card.version}</span>
                    </td>
                    <td className="table-cell">
                      <span className={cn("badge", st.bgColor, st.color)}>{st.label}</span>
                    </td>
                    <td className="table-cell text-slate-500 text-xs">{formatDateTime(card.updatedAt)}</td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setViewingCard(card)}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-primary-600 transition-colors"
                          title="查看"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(card)}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-primary-600 transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`确定删除工艺卡 ${card.code}?`)) deleteProcessCard(card.id);
                          }}
                          className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <div>暂无工艺卡片数据</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(showModal || viewingCard) && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-primary-800 to-primary-700 text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {viewingCard ? "工艺卡片详情" : editingCard ? "编辑工艺卡片" : "新增工艺卡片"}
                  </h3>
                  <p className="text-xs text-white/70">热处理工艺参数定义</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setViewingCard(null);
                }}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {viewingCard ? (
                <CardDetailView card={viewingCard} />
              ) : (
                <CardForm formData={formData} setFormData={setFormData as any} />
              )}
            </div>

            {!viewingCard && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button onClick={handleSave} className="btn-primary">
                  <Save className="w-4 h-4" />
                  保存
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CardDetailView({ card }: { card: any }) {
  const sections = [
    {
      title: "基本信息",
      icon: FileText,
      items: [
        { label: "工艺编号", value: card.code },
        { label: "工艺名称", value: card.name },
        { label: "材料牌号", value: card.material },
        { label: "版本号", value: card.version },
        { label: "创建人", value: card.createdBy },
        { label: "创建时间", value: formatDateTime(card.createdAt) },
      ],
    },
    {
      title: "渗碳工艺",
      icon: Thermometer,
      items: [
        { label: "渗碳温度", value: `${card.carburizingTemp} ℃` },
        { label: "保温时间", value: `${card.carburizingTime} min` },
      ],
    },
    {
      title: "淬火工艺",
      icon: Droplets,
      items: [
        { label: "淬火温度", value: `${card.quenchingTemp} ℃` },
        { label: "冷却介质", value: card.quenchingMedium },
      ],
    },
    {
      title: "回火工艺",
      icon: Clock,
      items: [
        { label: "回火温度", value: `${card.temperingTemp} ℃` },
        { label: "保温时间", value: `${card.temperingTime} min` },
      ],
    },
    {
      title: "技术要求",
      icon: Target,
      items: [
        { label: "渗碳层深度", value: `${card.layerDepthMin} - ${card.layerDepthMax} mm` },
        { label: "表面硬度", value: `HRC ${card.hardnessMin} - ${card.hardnessMax}` },
        { label: "心部硬度", value: `HRC ${card.coreHardnessMin} - ${card.coreHardnessMax}` },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {card.remark && (
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 text-sm text-amber-800">
          <div className="font-semibold mb-1">备注说明</div>
          {card.remark}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((sec, i) => {
          const Icon = sec.icon;
          return (
            <div key={i} className="p-4 rounded-lg border border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                <Icon className="w-4 h-4 text-primary-600" />
                <span className="font-semibold text-sm text-slate-700">{sec.title}</span>
              </div>
              <div className="space-y-2">
                {sec.items.map((item, j) => (
                  <div key={j} className="flex items-start justify-between gap-4">
                    <span className="text-xs text-slate-500 flex-shrink-0">{item.label}</span>
                    <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-700 text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CardForm({
  formData,
  setFormData,
}: {
  formData: any;
  setFormData: (d: any) => void;
}) {
  const update = (key: string, val: any) => setFormData({ ...formData, [key]: val });

  const InputField = ({ label, field, type = "text", suffix }: any) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={formData[field]}
          onChange={(e) => update(field, type === "number" ? Number(e.target.value) : e.target.value)}
          className={cn("input-base", suffix && "pr-10")}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{suffix}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-lg border border-primary-100 bg-primary-50/30">
        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary-600" />
          基本信息
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <InputField label="工艺编号 *" field="code" />
          <InputField label="版本号" field="version" />
          <div className="col-span-2">
            <InputField label="工艺名称 *" field="name" />
          </div>
          <InputField label="材料牌号 *" field="material" />
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">状态</label>
            <select
              value={formData.status}
              onChange={(e) => update("status", e.target.value)}
              className="input-base"
            >
              <option value="draft">草稿</option>
              <option value="active">生效中</option>
              <option value="obsolete">已废止</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-orange-100 bg-orange-50/30">
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-orange-600" />
            渗碳工艺
          </h4>
          <div className="space-y-3">
            <InputField label="渗碳温度" field="carburizingTemp" type="number" suffix="℃" />
            <InputField label="保温时间" field="carburizingTime" type="number" suffix="min" />
          </div>
        </div>

        <div className="p-4 rounded-lg border border-cyan-100 bg-cyan-50/30">
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-cyan-600" />
            淬火工艺
          </h4>
          <div className="space-y-3">
            <InputField label="淬火温度" field="quenchingTemp" type="number" suffix="℃" />
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">冷却介质</label>
              <select
                value={formData.quenchingMedium}
                onChange={(e) => update("quenchingMedium", e.target.value)}
                className="input-base"
              >
                <option>快速淬火油</option>
                <option>分级淬火油</option>
                <option>等温淬火油</option>
                <option>清水</option>
                <option>聚合物淬火剂</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-amber-100 bg-amber-50/30">
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            回火工艺
          </h4>
          <div className="space-y-3">
            <InputField label="回火温度" field="temperingTemp" type="number" suffix="℃" />
            <InputField label="保温时间" field="temperingTime" type="number" suffix="min" />
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg border border-purple-100 bg-purple-50/30">
        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-600" />
          技术要求
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">渗碳层深度范围 (mm)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                value={formData.layerDepthMin}
                onChange={(e) => update("layerDepthMin", Number(e.target.value))}
                className="input-base"
              />
              <span className="text-slate-400">~</span>
              <input
                type="number"
                step="0.1"
                value={formData.layerDepthMax}
                onChange={(e) => update("layerDepthMax", Number(e.target.value))}
                className="input-base"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">表面硬度 HRC</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={formData.hardnessMin}
                onChange={(e) => update("hardnessMin", Number(e.target.value))}
                className="input-base"
              />
              <span className="text-slate-400">~</span>
              <input
                type="number"
                value={formData.hardnessMax}
                onChange={(e) => update("hardnessMax", Number(e.target.value))}
                className="input-base"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">心部硬度 HRC</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={formData.coreHardnessMin}
                onChange={(e) => update("coreHardnessMin", Number(e.target.value))}
                className="input-base"
              />
              <span className="text-slate-400">~</span>
              <input
                type="number"
                value={formData.coreHardnessMax}
                onChange={(e) => update("coreHardnessMax", Number(e.target.value))}
                className="input-base"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">备注说明</label>
        <textarea
          value={formData.remark || ""}
          onChange={(e) => update("remark", e.target.value)}
          rows={3}
          className="input-base resize-none"
          placeholder="输入工艺备注、特殊要求等说明..."
        />
      </div>
    </div>
  );
}
