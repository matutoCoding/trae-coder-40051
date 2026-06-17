import { useState } from "react";
import { useStore } from "@/store";
import { cn, formatDateTime, statusMap, resultMap, safeAvg } from "@/utils";
import {
  Search,
  FileSearch,
  Package,
  Flame,
  Thermometer,
  Microscope,
  Gauge,
  Ruler,
  ChevronRight,
  FileText,
  CheckCircle2,
  Clock,
  User,
  CalendarClock,
  Download,
  AlertTriangle,
  XCircle,
  History,
  Share2,
  BarChart2,
  List,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
  AlertCircle,
} from "lucide-react";


export default function Traceability() {
  const { furnaceBatches, partItems, carburizingRecords, temperingRecords, metallographyRecords, hardnessRecords, deformationRecords, processCards } = useStore();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(furnaceBatches[0]?.id || null);
  const [viewMode, setViewMode] = useState<"detail" | "compare">("detail");
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const filtered = furnaceBatches.filter(
    (b) =>
      !search ||
      b.batchNo.toLowerCase().includes(search.toLowerCase()) ||
      b.furnaceNo.toLowerCase().includes(search.toLowerCase()) ||
      partItems.some((p) => p.batchId === b.id && (p.partNo.includes(search) || p.partName.includes(search)))
  );

  const selected = furnaceBatches.find((b) => b.id === selectedId);
  const parts = partItems.filter((p) => p.batchId === selectedId);
  const processCard = processCards.find((p) => p.id === selected?.processCardId);
  const carburizing = carburizingRecords.find((r) => r.batchId === selectedId);
  const tempering = temperingRecords.find((r) => r.batchId === selectedId);
  const metallography = metallographyRecords.filter((r) => r.batchId === selectedId);
  const hardness = hardnessRecords.filter((r) => r.batchId === selectedId);
  const deformation = deformationRecords.filter((r) => r.batchId === selectedId);

  const stepStatus = (key: string) => {
    if (!selected) return "pending";
    const order = ["pending", "loading", "carburizing", "quenching", "tempering", "inspecting", "correcting", "completed"];
    const currentIdx = order.indexOf(selected.status);
    const stepMap: Record<string, number> = {
      plan: 0,
      load: 1,
      carburize: 2,
      quench: 3,
      temper: 4,
      inspect: 5,
      correct: 6,
      finish: 7,
    };
    const stepIdx = stepMap[key];
    if (stepIdx < currentIdx || selected.status === "completed") return "done";
    if (stepIdx === currentIdx) return "active";
    return "pending";
  };

  const dataStatus = (key: string): { status: "complete" | "partial" | "missing" | "na"; desc: string } => {
    if (!selected) return { status: "missing", desc: "未开始" };
    switch (key) {
      case "plan":
        return processCard ? { status: "complete", desc: "工艺卡已绑定" } : { status: "missing", desc: "未绑定工艺卡" };
      case "load":
        const totalQty = parts.reduce((a, p) => a + p.quantity, 0);
        return parts.length > 0
          ? { status: "complete", desc: `已装入 ${parts.length} 种零件 / ${totalQty} 件` }
          : { status: "missing", desc: "未装入零件" };
      case "carburize":
        return carburizing
          ? { status: "complete", desc: "记录 1 条渗碳记录" }
          : { status: "missing", desc: "暂无渗碳记录" };
      case "quench":
        return carburizing
          ? { status: "complete", desc: "冷却数据已记录" }
          : { status: "missing", desc: "暂无淬火冷却记录" };
      case "temper":
        return tempering
          ? { status: "complete", desc: "回火记录已录入" }
          : { status: "missing", desc: "暂无回火记录" };
      case "inspect":
        const hasMeta = metallography.length > 0;
        const hasHard = hardness.length > 0;
        if (hasMeta && hasHard) return { status: "complete", desc: `金相 ${metallography.length} 条 / 硬度 ${hardness.length} 条` };
        if (hasMeta || hasHard) return { status: "partial", desc: "检测数据不完整" };
        return { status: "missing", desc: "暂无检测记录" };
      case "correct":
        return deformation.length > 0
          ? { status: "complete", desc: `${deformation.length} 条矫正记录` }
          : { status: "na", desc: "无变形矫正" };
      case "finish":
        return selected.status === "completed"
          ? { status: "complete", desc: "已完成入库" }
          : { status: "missing", desc: "未完成" };
      default:
        return { status: "missing", desc: "" };
    }
  };

  const steps = [
    { key: "plan", label: "工艺制定", icon: FileText },
    { key: "load", label: "装炉排产", icon: CalendarClock },
    { key: "carburize", label: "渗碳淬火", icon: Flame },
    { key: "quench", label: "淬火冷却", icon: Thermometer },
    { key: "temper", label: "回火处理", icon: Thermometer },
    { key: "inspect", label: "质量检测", icon: Microscope },
    { key: "correct", label: "变形矫正", icon: Ruler },
    { key: "finish", label: "完成入库", icon: CheckCircle2 },
  ];

  const missingSteps = steps
    .map((s) => ({ ...s, data: dataStatus(s.key) }))
    .filter((s) => s.data.status === "missing" && s.key !== "finish");

  const completenessScore = () => {
    let total = 0;
    let done = 0;
    steps.forEach((s) => {
      if (s.key === "correct") return;
      total++;
      const ds = dataStatus(s.key).status;
      if (ds === "complete") done++;
      else if (ds === "partial") done += 0.5;
    });
    return Math.round((done / total) * 100);
  };

  const exportQualityArchive = () => {
    if (!selected) return;
    const totalParts = parts.reduce((a, p) => a + p.quantity, 0);
    const avgSurface = hardness.length > 0 ? safeAvg(hardness.map((h) => h.surfaceAvg)).toFixed(2) : "-";
    const avgCore = hardness.length > 0 ? safeAvg(hardness.map((h) => h.coreAvg)).toFixed(2) : "-";
    const carburizeAvg = carburizing ? safeAvg(carburizing.layerDepths).toFixed(3) : "-";

    let content = "============================================================\n";
    content += "            热 处 理 炉 次 质 量 档 案\n";
    content += "============================================================\n\n";
    content += `档案编号: QA-${selected.batchNo}-${new Date().toISOString().slice(0, 10)}\n`;
    content += `生成时间: ${new Date().toLocaleString()}\n\n`;
    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    content += "一、炉次基本信息\n";
    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    content += `  炉次编号: ${selected.batchNo}\n`;
    content += `  设备炉号: ${selected.furnaceNo}\n`;
    content += `  当前状态: ${statusMap[selected.status].label}\n`;
    content += `  开工时间: ${selected.startTime || "-"}\n`;
    content += `  操作员: ${selected.operator || "-"}\n`;
    content += `  零件总数: ${totalParts} 件 (${parts.length} 种)\n`;
    content += `  数据完整度: ${completenessScore()}%\n\n`;

    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    content += "二、工艺参数信息\n";
    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    if (processCard) {
      content += `  工艺编号: ${processCard.code}\n`;
      content += `  工艺名称: ${processCard.name}\n`;
      content += `  材料牌号: ${processCard.material}\n`;
      content += `  渗碳温度: ${processCard.carburizingTemp}℃ / ${processCard.carburizingTime}min\n`;
      content += `  淬火温度: ${processCard.quenchingTemp}℃\n`;
      content += `  冷却介质: ${processCard.quenchingMedium}\n`;
      content += `  回火温度: ${processCard.temperingTemp}℃ / ${processCard.temperingTime}min\n`;
      content += `  渗碳层深度: ${processCard.layerDepthMin}-${processCard.layerDepthMax}mm\n`;
      content += `  表面硬度: HRC ${processCard.hardnessMin}-${processCard.hardnessMax}\n`;
    } else {
      content += "  [缺失] 未绑定工艺卡片\n";
    }
    content += "\n";

    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    content += "三、装炉零件清单\n";
    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    if (parts.length > 0) {
      parts.forEach((p, i) => {
        content += `  ${i + 1}. ${p.partNo} - ${p.partName}\n`;
        content += `      数量: ${p.quantity}件 | 图号: ${p.drawingNo || "-"} | 位置: ${p.position}\n`;
        content += `      客户: ${p.customer || "-"}\n`;
      });
    } else {
      content += "  [缺失] 暂无装炉零件\n";
    }
    content += "\n";

    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    content += "四、渗碳淬火记录\n";
    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    if (carburizing) {
      content += `  记录时间: ${carburizing.recordTime}\n`;
      content += `  设备炉号: ${carburizing.furnaceNo}\n`;
      content += `  目标温度: ${carburizing.targetTemp}℃\n`;
      content += `  淬火介质温度: ${carburizing.quenchingMediumTemp}℃\n`;
      content += `  油槽温度: ${carburizing.oilTankStartTemp}℃ → ${carburizing.oilTankEndTemp}℃\n`;
      content += `  冷却时长: ${carburizing.coolingDuration}min\n`;
      content += `  操作员: ${carburizing.operator} | 记录员: ${carburizing.recorder || "-"}\n`;
      content += `  渗碳层深度测量 (mm):\n`;
      carburizing.layerDepths.forEach((d, i) => {
        content += `    #${i + 1}: ${d.toFixed(3)}\n`;
      });
      content += `    平均值: ${carburizeAvg}mm\n`;
    } else {
      content += "  [缺失] 暂无渗碳淬火记录\n";
    }
    content += "\n";

    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    content += "五、回火处理记录\n";
    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    if (tempering) {
      content += `  记录时间: ${tempering.recordTime}\n`;
      content += `  回火炉号: ${tempering.furnaceNo}\n`;
      content += `  目标温度: ${tempering.targetTemp}℃\n`;
      content += `  保温时长: ${tempering.holdingTime}min\n`;
      content += `  操作员: ${tempering.operator}\n`;
    } else {
      content += "  [缺失] 暂无回火记录\n";
    }
    content += "\n";

    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    content += "六、金相检测记录\n";
    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    if (metallography.length > 0) {
      metallography.forEach((m, i) => {
        content += `  ${i + 1}. 试样号: ${m.sampleNo} | 零件: ${m.partNo}\n`;
        content += `     马氏体: ${m.martensiteLevel} | 碳化物: ${m.carbideLevel || "-"}\n`;
        content += `     残余奥氏体: ${m.retainedAustenite || "-"}\n`;
        content += `     判定结果: ${resultMap[m.result].label}\n`;
        content += `     检测员: ${m.inspector} | 时间: ${m.recordTime}\n`;
      });
    } else {
      content += "  [缺失] 暂无金相检测记录\n";
    }
    content += "\n";

    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    content += "七、硬度检验记录\n";
    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    if (hardness.length > 0) {
      hardness.forEach((h, i) => {
        content += `  ${i + 1}. 试样号: ${h.sampleNo} | 类型: ${h.testType === "rockwell" ? "洛氏硬度" : "心部硬度"}\n`;
        content += `     表面硬度: ${h.surfaceValues.join(" / ")} HRC\n`;
        content += `     表面均值: ${h.surfaceAvg} HRC\n`;
        content += `     心部硬度: ${h.coreValues.join(" / ")} HRC\n`;
        content += `     心部均值: ${h.coreAvg} HRC\n`;
        content += `     判定结果: ${resultMap[h.result].label}\n`;
        content += `     检验员: ${h.inspector}\n`;
      });
      content += `\n  批次平均表面硬度: ${avgSurface} HRC\n`;
      content += `  批次平均心部硬度: ${avgCore} HRC\n`;
    } else {
      content += "  [缺失] 暂无硬度检验记录\n";
    }
    content += "\n";

    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    content += "八、变形矫正记录\n";
    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    if (deformation.length > 0) {
      deformation.forEach((d, i) => {
        content += `  ${i + 1}. 零件: ${d.partNo} | 测量点: ${d.measurementPoint}\n`;
        content += `     矫正前: ${d.beforeValue}mm → 矫正后: ${d.afterValue ?? "-"}mm\n`;
        content += `     矫正方式: ${d.correctionMethod} × ${d.correctionTimes}次\n`;
        content += `     复检验: ${d.recheckValue ?? "-"}mm\n`;
        content += `     结果: ${resultMap[d.result].label}\n`;
      });
    } else {
      content += "  - 无变形矫正记录\n";
    }
    content += "\n";

    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    content += "九、数据完整性评估\n";
    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    content += `  完整度评分: ${completenessScore()}%\n`;
    if (missingSteps.length > 0) {
      content += `  缺失环节:\n`;
      missingSteps.forEach((s) => {
        content += `    - ${s.label}: ${s.data.desc}\n`;
      });
    } else {
      content += "  所有环节数据完整\n";
    }
    content += "\n";

    const abnormalItems: string[] = [];
    const failMetallography = metallography.filter((m) => m.result === "fail");
    const failHardness = hardness.filter((h) => h.result === "fail");
    const failDeformation = deformation.filter((d) => d.result === "fail");

    if (processCard && carburizing) {
      const avgDepth = safeAvg(carburizing.layerDepths);
      if (avgDepth < processCard.layerDepthMin) {
        abnormalItems.push(`[渗碳层深偏低] 平均值 ${avgDepth.toFixed(3)}mm < 下限 ${processCard.layerDepthMin}mm`);
      }
      if (avgDepth > processCard.layerDepthMax) {
        abnormalItems.push(`[渗碳层深偏高] 平均值 ${avgDepth.toFixed(3)}mm > 上限 ${processCard.layerDepthMax}mm`);
      }
      carburizing.layerDepths.forEach((d, i) => {
        if (d < processCard.layerDepthMin) {
          abnormalItems.push(`[渗碳层深偏低] 测点#${i + 1}: ${d.toFixed(3)}mm < 下限`);
        }
        if (d > processCard.layerDepthMax) {
          abnormalItems.push(`[渗碳层深偏高] 测点#${i + 1}: ${d.toFixed(3)}mm > 上限`);
        }
      });
    }

    if (processCard && hardness.length > 0) {
      hardness.forEach((h, i) => {
        if (h.surfaceAvg < processCard.hardnessMin) {
          abnormalItems.push(`[表面硬度偏低] 试样${h.sampleNo}: ${h.surfaceAvg}HRC < 下限 ${processCard.hardnessMin}HRC`);
        }
        if (h.surfaceAvg > processCard.hardnessMax) {
          abnormalItems.push(`[表面硬度偏高] 试样${h.sampleNo}: ${h.surfaceAvg}HRC > 上限 ${processCard.hardnessMax}HRC`);
        }
      });
    }

    failMetallography.forEach((m) => {
      abnormalItems.push(`[金相不合格] 试样${m.sampleNo} (${m.partNo}) - 马氏体${m.martensiteLevel}`);
    });
    failHardness.forEach((h) => {
      abnormalItems.push(`[硬度不合格] 试样${h.sampleNo} - 表面${h.surfaceAvg}HRC / 心部${h.coreAvg}HRC`);
    });
    failDeformation.forEach((d) => {
      abnormalItems.push(`[变形矫正不合格] 零件${d.partNo} ${d.measurementPoint} - 复检${d.recheckValue}mm`);
    });

    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    content += "十、异常汇总\n";
    content += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

    if (missingSteps.length > 0) {
      content += `  缺失环节 (${missingSteps.length}项):\n`;
      missingSteps.forEach((s) => {
        content += `    ⚠ ${s.label}: ${s.data.desc}\n`;
      });
      content += "\n";
    }

    if (abnormalItems.length > 0) {
      content += `  检测异常 (${abnormalItems.length}项):\n`;
      abnormalItems.forEach((item, i) => {
        content += `    ✗ ${item}\n`;
      });
    } else {
      content += "  ✓ 未发现异常项\n";
    }

    if (missingSteps.length === 0 && abnormalItems.length === 0) {
      content += "\n  ★ 该炉次数据完整，质量合格，无异常\n";
    }

    content += "\n";
    content += "============================================================\n";
    content += "                   档案结束\n";
    content += "============================================================\n";

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `质量档案_${selected.batchNo}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="card-base">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="输入炉号、批次号、零件编号或零件名称进行追溯查询..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:outline-none text-sm bg-slate-50 focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("detail")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all",
                viewMode === "detail"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <List className="w-4 h-4" />
              详情追溯
            </button>
            <button
              onClick={() => setViewMode("compare")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all",
                viewMode === "compare"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <BarChart2 className="w-4 h-4" />
              批次对比
              {compareIds.length > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] flex items-center justify-center">
                  {compareIds.length}
                </span>
              )}
            </button>
          </div>
          <button className="btn-primary !py-3 !px-6">
            <FileSearch className="w-5 h-5" />
            追溯查询
          </button>
        </div>
        {viewMode === "compare" && compareIds.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              已选择 <span className="font-bold text-primary-600">{compareIds.length}</span> 个炉次进行对比
              {compareIds.length < 2 && <span className="text-amber-600 text-xs ml-2">（至少选择 2 个炉次才有对比意义）</span>}
            </div>
            <button
              onClick={() => setCompareIds([])}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              清空选择
            </button>
          </div>
        )}
        {search && viewMode === "detail" && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600">
            找到 <span className="font-bold text-primary-600">{filtered.length}</span> 条匹配的炉次记录
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className={cn(viewMode === "compare" ? "col-span-4" : "col-span-4")}>
          <div className="card-base h-[calc(100vh-280px)] overflow-hidden flex flex-col">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary-600" />
              {viewMode === "compare" ? "选择对比炉次" : "炉次列表"}
              {viewMode === "compare" && (
                <span className="ml-auto text-xs text-slate-400 font-normal">
                  已选 {compareIds.length}
                </span>
              )}
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 -mx-2 px-2">
              {filtered.map((b) => {
                const st = statusMap[b.status];
                const isSelected = b.id === selectedId;
                const isCompareSelected = compareIds.includes(b.id);

                const handleClick = () => {
                  if (viewMode === "compare") {
                    if (isCompareSelected) {
                      setCompareIds(compareIds.filter((id) => id !== b.id));
                    } else {
                      setCompareIds([...compareIds, b.id]);
                    }
                  } else {
                    setSelectedId(b.id);
                  }
                };

                return (
                  <div
                    key={b.id}
                    onClick={handleClick}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      viewMode === "compare"
                        ? isCompareSelected
                          ? "border-primary-500 bg-primary-50 shadow-sm ring-2 ring-primary-200"
                          : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                        : isSelected
                          ? "border-primary-500 bg-primary-50 shadow-sm"
                          : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-start gap-2.5 mb-1.5">
                      {viewMode === "compare" && (
                        <div className={cn(
                          "w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                          isCompareSelected
                            ? "bg-primary-500 border-primary-500"
                            : "border-slate-300 bg-white"
                        )}>
                          {isCompareSelected && (
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-mono font-semibold text-sm text-primary-600 truncate">{b.batchNo}</div>
                          <span className={cn("badge !text-[10px] !px-2 shrink-0", st.bgColor, st.color)}>
                            {st.label}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mb-1.5 truncate">{b.furnaceNo} | {b.processCardName}</div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{b.totalQuantity} 件</span>
                          <span>{formatDateTime(b.startTime)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-sm">
                  <FileSearch className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  无匹配记录
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-8 space-y-5">
          {viewMode === "detail" && selected ? (
            <>
              <div className="card-base">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-slate-800">
                        批次 {selected.batchNo}
                      </h3>
                      <span className={cn("badge", statusMap[selected.status].bgColor, statusMap[selected.status].color)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full mr-1", statusMap[selected.status].dotColor)} />
                        {statusMap[selected.status].label}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{selected.startTime}</span>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{selected.operator}</span>
                      <span>{selected.totalQuantity} 件零件</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {processCard && (
                      <div className="px-4 py-2 rounded-lg bg-primary-50 border border-primary-100">
                        <div className="text-[10px] text-primary-500">关联工艺卡片</div>
                        <div className="text-sm font-semibold text-primary-700">{processCard.code}</div>
                      </div>
                    )}
                    <div className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-50">
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <History className="w-3 h-3" />数据完整度
                      </div>
                      <div className="text-sm font-bold text-slate-700">{completenessScore()}%</div>
                    </div>
                    <button
                      onClick={exportQualityArchive}
                      className="btn-primary !py-2.5 !px-4 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      导出档案
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="flex items-center gap-1 overflow-x-auto pb-2">
                    {steps.map((step, i) => {
                      const ss = stepStatus(step.key);
                      const Icon = step.icon;
                      return (
                        <div key={step.key} className="flex items-center flex-1 min-w-[90px]">
                          <div className="flex flex-col items-center flex-1">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all",
                                ss === "done" ? "bg-green-500 text-white shadow-lg shadow-green-200" :
                                ss === "active" ? "bg-primary-500 text-white shadow-lg shadow-primary-200 animate-pulse" :
                                "bg-slate-100 text-slate-400"
                              )}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className={cn("text-[11px] font-medium text-center whitespace-nowrap",
                              ss === "done" ? "text-green-600" : ss === "active" ? "text-primary-600" : "text-slate-400"
                            )}>
                              {step.label}
                            </div>
                          </div>
                          {i < steps.length - 1 && (
                            <div className={cn(
                              "flex-1 h-1 mx-1 rounded-full mb-5",
                              ss === "done" ? "bg-green-400" : "bg-slate-100"
                            )} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500 mb-2 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    各环节数据状态
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {steps.filter((s) => s.key !== "finish").map((step) => {
                      const ds = dataStatus(step.key);
                      const Icon = step.icon;
                      const statusColors: Record<string, string> = {
                        complete: "border-green-200 bg-green-50 text-green-700",
                        partial: "border-amber-200 bg-amber-50 text-amber-700",
                        missing: "border-slate-200 bg-slate-50 text-slate-400",
                        na: "border-slate-200 bg-slate-50/50 text-slate-300",
                      };
                      const StatusIcon = ds.status === "complete" ? CheckCircle2 : ds.status === "partial" ? AlertTriangle : ds.status === "missing" ? XCircle : Clock;
                      return (
                        <div key={step.key} className={cn("p-2 rounded-lg border flex items-start gap-2", statusColors[ds.status])}>
                          <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-[11px] font-medium flex items-center gap-1">
                              {step.label}
                              <StatusIcon className="w-3 h-3" />
                            </div>
                            <div className="text-[10px] opacity-80 truncate">{ds.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {missingSteps.length > 0 && (
                <div className="card-base border-amber-200 bg-amber-50/30">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-amber-800 mb-2">数据缺失提醒</h4>
                      <div className="text-xs text-amber-700 mb-2">
                        该炉次尚有 <span className="font-bold">{missingSteps.length}</span> 个环节缺少记录数据，请及时补录以保证追溯完整性。
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {missingSteps.map((s) => {
                          const Icon = s.icon;
                          return (
                            <span key={s.key} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 border border-amber-200 text-amber-700 text-[11px]">
                              <Icon className="w-3 h-3" />
                              {s.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {processCard && (
                <TraceSection
                  title="工艺卡片信息"
                  icon={FileText}
                  color="primary"
                >
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "工艺编号", value: processCard.code },
                      { label: "工艺名称", value: processCard.name },
                      { label: "材料牌号", value: processCard.material },
                      { label: "渗碳温度", value: `${processCard.carburizingTemp}℃ / ${processCard.carburizingTime}min` },
                      { label: "淬火温度", value: `${processCard.quenchingTemp}℃` },
                      { label: "冷却介质", value: processCard.quenchingMedium },
                      { label: "回火温度", value: `${processCard.temperingTemp}℃ / ${processCard.temperingTime}min` },
                      { label: "渗碳层深", value: `${processCard.layerDepthMin}-${processCard.layerDepthMax}mm` },
                      { label: "表面硬度", value: `HRC ${processCard.hardnessMin}-${processCard.hardnessMax}` },
                    ].map((it, i) => (
                      <div key={i} className="p-2 rounded bg-slate-50">
                        <div className="text-[10px] text-slate-400">{it.label}</div>
                        <div className="text-sm font-medium text-slate-700">{it.value}</div>
                      </div>
                    ))}
                  </div>
                </TraceSection>
              )}

              <TraceSection
                title={`装炉零件清单 (${parts.length} 种 / ${parts.reduce((a, p) => a + p.quantity, 0)} 件)`}
                icon={Package}
                color="blue"
              >
                <div className="overflow-x-auto rounded-lg border border-slate-100">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="table-header-cell">零件编号</th>
                        <th className="table-header-cell">名称</th>
                        <th className="table-header-cell">图号</th>
                        <th className="table-header-cell">客户</th>
                        <th className="table-header-cell">数量</th>
                        <th className="table-header-cell">位置</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parts.map((p) => (
                        <tr key={p.id}>
                          <td className="table-cell font-mono text-xs text-primary-600">{p.partNo}</td>
                          <td className="table-cell text-sm">{p.partName}</td>
                          <td className="table-cell text-xs text-slate-500 font-mono">{p.drawingNo || "-"}</td>
                          <td className="table-cell text-xs">{p.customer || "-"}</td>
                          <td className="table-cell"><span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">{p.quantity}件</span></td>
                          <td className="table-cell text-xs text-slate-500">{p.position}</td>
                        </tr>
                      ))}
                      {parts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">暂无零件记录</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TraceSection>

              {carburizing && (
                <TraceSection
                  title="渗碳淬火记录"
                  icon={Flame}
                  color="orange"
                  badge={
                    <span className="text-xs text-slate-500">
                      操作员: {carburizing.operator} | {formatDateTime(carburizing.recordTime)}
                    </span>
                  }
                >
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "目标温度", value: `${carburizing.targetTemp}℃` },
                      { label: "淬火介质温度", value: `${carburizing.quenchingMediumTemp}℃` },
                      { label: "油槽冷却", value: `${carburizing.oilTankStartTemp}→${carburizing.oilTankEndTemp}℃` },
                      { label: "冷却时长", value: `${carburizing.coolingDuration}min` },
                    ].map((i, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-orange-50 border border-orange-100">
                        <div className="text-[10px] text-orange-600">{i.label}</div>
                        <div className="text-base font-bold text-orange-700">{i.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-purple-50 border border-purple-100">
                    <div className="text-[11px] text-purple-600 font-medium mb-2">渗碳层深度测量 (mm)</div>
                    <div className="flex gap-2 flex-wrap">
                      {carburizing.layerDepths.map((d, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-md bg-white border border-purple-200 font-mono text-sm text-purple-700">
                          #{i + 1}: {d.toFixed(2)}
                        </span>
                      ))}
                      <span className="px-2.5 py-1 rounded-md bg-green-100 text-green-700 font-mono text-sm font-bold">
                        均值: {safeAvg(carburizing.layerDepths).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </TraceSection>
              )}

              {tempering && (
                <TraceSection
                  title="回火处理记录"
                  icon={Thermometer}
                  color="amber"
                  badge={
                    <span className="text-xs text-slate-500">
                      操作员: {tempering.operator} | {formatDateTime(tempering.recordTime)}
                    </span>
                  }
                >
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <div className="text-[10px] text-amber-600">回火炉号</div>
                      <div className="text-base font-bold text-amber-700">{tempering.furnaceNo}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <div className="text-[10px] text-amber-600">目标温度</div>
                      <div className="text-base font-bold text-amber-700">{tempering.targetTemp}℃</div>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <div className="text-[10px] text-amber-600">保温时长</div>
                      <div className="text-base font-bold text-amber-700">{tempering.holdingTime} min</div>
                    </div>
                  </div>
                </TraceSection>
              )}

              {metallography.length > 0 && (
                <TraceSection
                  title={`金相检测记录 (${metallography.length}条)`}
                  icon={Microscope}
                  color="purple"
                >
                  <div className="overflow-x-auto rounded-lg border border-slate-100">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="table-header-cell">试样号</th>
                          <th className="table-header-cell">零件号</th>
                          <th className="table-header-cell">马氏体</th>
                          <th className="table-header-cell">碳化物</th>
                          <th className="table-header-cell">残余奥氏体</th>
                          <th className="table-header-cell">判定</th>
                          <th className="table-header-cell">检测员</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metallography.map((m) => {
                          const rm = resultMap[m.result];
                          return (
                            <tr key={m.id}>
                              <td className="table-cell font-mono text-xs text-primary-600">{m.sampleNo}</td>
                              <td className="table-cell text-xs">{m.partNo}</td>
                              <td className="table-cell text-xs">{m.martensiteLevel}</td>
                              <td className="table-cell text-xs">{m.carbideLevel || "-"}</td>
                              <td className="table-cell text-xs">{m.retainedAustenite || "-"}</td>
                              <td className="table-cell"><span className={cn("badge", rm.bgColor, rm.color)}>{rm.label}</span></td>
                              <td className="table-cell text-xs">{m.inspector}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </TraceSection>
              )}

              {hardness.length > 0 && (
                <TraceSection
                  title={`硬度检验记录 (${hardness.length}条)`}
                  icon={Gauge}
                  color="emerald"
                >
                  <div className="overflow-x-auto rounded-lg border border-slate-100">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="table-header-cell">试样号</th>
                          <th className="table-header-cell">类型</th>
                          <th className="table-header-cell">表面硬度(HRC)</th>
                          <th className="table-header-cell">均值</th>
                          <th className="table-header-cell">心部硬度</th>
                          <th className="table-header-cell">均值</th>
                          <th className="table-header-cell">结果</th>
                          <th className="table-header-cell">检验员</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hardness.map((h) => {
                          const rm = resultMap[h.result];
                          return (
                            <tr key={h.id}>
                              <td className="table-cell font-mono text-xs text-primary-600">{h.sampleNo}</td>
                              <td className="table-cell"><span className={cn("badge text-[10px]", h.testType === "rockwell" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600")}>{h.testType === "rockwell" ? "洛氏" : "心部"}</span></td>
                              <td className="table-cell text-xs font-mono">{h.surfaceValues.join("/")}</td>
                              <td className="table-cell font-bold text-emerald-600">{h.surfaceAvg}</td>
                              <td className="table-cell text-xs font-mono">{h.coreValues.join("/")}</td>
                              <td className="table-cell font-bold text-amber-600">{h.coreAvg}</td>
                              <td className="table-cell"><span className={cn("badge", rm.bgColor, rm.color)}>{rm.label}</span></td>
                              <td className="table-cell text-xs">{h.inspector}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </TraceSection>
              )}

              {deformation.length > 0 && (
                <TraceSection
                  title={`变形矫正记录 (${deformation.length}条)`}
                  icon={Ruler}
                  color="pink"
                >
                  <div className="overflow-x-auto rounded-lg border border-slate-100">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="table-header-cell">零件号</th>
                          <th className="table-header-cell">测量点</th>
                          <th className="table-header-cell">矫正前(mm)</th>
                          <th className="table-header-cell">矫正方式</th>
                          <th className="table-header-cell">矫正后(mm)</th>
                          <th className="table-header-cell">复检(mm)</th>
                          <th className="table-header-cell">结果</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deformation.map((d) => {
                          const rm = resultMap[d.result];
                          return (
                            <tr key={d.id}>
                              <td className="table-cell font-mono text-xs text-primary-600">{d.partNo}</td>
                              <td className="table-cell text-xs">{d.measurementPoint}</td>
                              <td className="table-cell text-red-600 font-semibold">{d.beforeValue}</td>
                              <td className="table-cell text-xs">{d.correctionMethod}x{d.correctionTimes}</td>
                              <td className="table-cell text-purple-600 font-semibold">{d.afterValue ?? "-"}</td>
                              <td className={cn("table-cell font-semibold", d.recheckValue !== undefined && d.recheckValue <= d.standardValue + d.tolerance ? "text-green-600" : "text-slate-600")}>
                                {d.recheckValue ?? "-"}
                              </td>
                              <td className="table-cell"><span className={cn("badge", rm.bgColor, rm.color)}>{rm.label}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </TraceSection>
              )}

              {!carburizing && !tempering && metallography.length === 0 && hardness.length === 0 && deformation.length === 0 && (
                <div className="card-base text-center py-12 text-slate-400">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <div className="text-sm">该炉次正在进行中，暂无检测与记录数据</div>
                </div>
              )}
            </>
          ) : viewMode === "detail" && !selected ? (
            <div className="card-base h-[calc(100vh-280px)] flex flex-col items-center justify-center text-slate-400">
              <FileSearch className="w-20 h-20 mb-4 opacity-20" />
              <div className="text-lg font-medium">请从左侧选择炉次查看追溯详情</div>
              <div className="text-sm mt-1">支持按批次号、零件号搜索筛选</div>
            </div>
          ) : (
            compareIds.length > 0 ? (
              <BatchCompareView compareIds={compareIds} />
            ) : (
              <div className="card-base h-[calc(100vh-280px)] flex flex-col items-center justify-center text-slate-400">
                <BarChart2 className="w-20 h-20 mb-4 opacity-20" />
                <div className="text-lg font-medium">请从左侧选择至少2个炉次进行对比</div>
                <div className="text-sm mt-1">勾选左侧炉次列表中的复选框</div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function TraceSection({
  title,
  icon: Icon,
  color,
  children,
  badge,
}: {
  title: string;
  icon: any;
  color: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    primary: "text-primary-600 bg-primary-50 border-primary-100",
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    orange: "text-orange-600 bg-orange-50 border-orange-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    purple: "text-purple-600 bg-purple-50 border-purple-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    pink: "text-pink-600 bg-pink-50 border-pink-100",
  };
  return (
    <div className="card-base">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-8 h-8 rounded-lg border flex items-center justify-center", colors[color])}>
            <Icon className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

function BatchCompareView({ compareIds }: { compareIds: string[] }) {
  const {
    furnaceBatches,
    processCards,
    partItems,
    carburizingRecords,
    temperingRecords,
    metallographyRecords,
    hardnessRecords,
  } = useStore();

  const batches = furnaceBatches.filter((b) => compareIds.includes(b.id));

  const batchData = batches.map((batch) => {
    const parts = partItems.filter((p) => p.batchId === batch.id);
    const processCard = processCards.find((c) => c.id === batch.processCardId);
    const carburizing = carburizingRecords.find((r) => r.batchId === batch.id);
    const tempering = temperingRecords.find((r) => r.batchId === batch.id);
    const metallography = metallographyRecords.filter((r) => r.batchId === batch.id);
    const hardness = hardnessRecords.filter((r) => r.batchId === batch.id);

    const totalQty = parts.reduce((sum, p) => sum + p.quantity, 0);
    const avgLayerDepth = carburizing ? safeAvg(carburizing.layerDepths).toFixed(2) : "-";
    const avgSurfaceHardness = hardness.length > 0
      ? safeAvg(hardness.map((h) => h.surfaceAvg)).toFixed(1)
      : "-";
    const avgCoreHardness = hardness.length > 0
      ? safeAvg(hardness.map((h) => h.coreAvg)).toFixed(1)
      : "-";

    const passCount = metallography.filter((m) => m.result === "pass").length +
      hardness.filter((h) => h.result === "pass").length;
    const totalCount = metallography.length + hardness.length;
    const passRate = totalCount > 0 ? ((passCount / totalCount) * 100).toFixed(1) : "-";

    let isAbnormal = false;
    const abnormalReasons: string[] = [];

    if (processCard && carburizing) {
      const avgDepth = safeAvg(carburizing.layerDepths);
      if (avgDepth < processCard.layerDepthMin || avgDepth > processCard.layerDepthMax) {
        isAbnormal = true;
        abnormalReasons.push("渗碳层深超范围");
      }
    }

    if (processCard && hardness.length > 0) {
      const avgSurf = safeAvg(hardness.map((h) => h.surfaceAvg));
      if (avgSurf < processCard.hardnessMin || avgSurf > processCard.hardnessMax) {
        isAbnormal = true;
        abnormalReasons.push("表面硬度超范围");
      }
    }

    if (metallography.some((m) => m.result === "fail") || hardness.some((h) => h.result === "fail")) {
      isAbnormal = true;
      abnormalReasons.push("有不合格项");
    }

    return {
      batch,
      parts,
      processCard,
      carburizing,
      tempering,
      metallography,
      hardness,
      totalQty,
      partCount: parts.length,
      avgLayerDepth,
      avgSurfaceHardness,
      avgCoreHardness,
      passRate,
      isAbnormal,
      abnormalReasons,
    };
  });

  return (
    <div className="space-y-5">
      <div className="card-base">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg border flex items-center justify-center text-primary-600 bg-primary-50 border-primary-100">
              <BarChart2 className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">批次对比分析</h4>
            <span className="text-xs text-slate-400">共 {batches.length} 个炉次</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded bg-red-100 border border-red-300" />
            <span className="text-slate-500">异常批次</span>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b-2 border-slate-100">
                <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 sticky left-0 bg-white">批次号</th>
                <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500">状态</th>
                <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500">工艺编号</th>
                <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500">零件种类</th>
                <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500">装炉数量</th>
                <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500">渗碳层深(mm)</th>
                <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500">表面硬度(HRC)</th>
                <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500">心部硬度(HRC)</th>
                <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500">合格率</th>
                <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500">异常</th>
              </tr>
            </thead>
            <tbody>
              {batchData.map((bd) => (
                <tr
                  key={bd.batch.id}
                  className={cn(
                    "border-b border-slate-50 transition-colors",
                    bd.isAbnormal ? "bg-red-50/50 hover:bg-red-50" : "hover:bg-slate-50"
                  )}
                >
                  <td className="py-3 px-3 sticky left-0 bg-inherit">
                    <div className="font-mono text-sm font-semibold text-primary-600">{bd.batch.batchNo}</div>
                    <div className="text-[10px] text-slate-400">{bd.batch.startTime}</div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={cn(
                      "inline-block px-2 py-0.5 rounded-full text-[10px] font-medium",
                      statusMap[bd.batch.status].bgColor,
                      statusMap[bd.batch.status].color
                    )}>
                      {statusMap[bd.batch.status].label}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center text-xs font-mono text-slate-600">
                    {bd.processCard?.code || "-"}
                  </td>
                  <td className="py-3 px-3 text-center text-sm font-medium text-slate-700">
                    {bd.partCount}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-sm font-bold text-blue-600">{bd.totalQty}</span>
                    <span className="text-[10px] text-slate-400 ml-1">件</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={cn(
                      "text-sm font-mono font-semibold",
                      bd.abnormalReasons.includes("渗碳层深超范围") ? "text-red-600" : "text-purple-600"
                    )}>
                      {bd.avgLayerDepth}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={cn(
                      "text-sm font-mono font-semibold",
                      bd.abnormalReasons.includes("表面硬度超范围") ? "text-red-600" : "text-emerald-600"
                    )}>
                      {bd.avgSurfaceHardness}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center text-sm font-mono text-amber-600 font-semibold">
                    {bd.avgCoreHardness}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={cn(
                      "text-sm font-bold",
                      bd.passRate !== "-" && Number(bd.passRate) < 80 ? "text-red-600" :
                      bd.passRate !== "-" && Number(bd.passRate) < 95 ? "text-amber-600" : "text-green-600"
                    )}>
                      {bd.passRate}{bd.passRate !== "-" && "%"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {bd.isAbnormal ? (
                      <div className="flex items-center justify-center gap-1 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">{bd.abnormalReasons.length}项</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 text-green-500">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs font-medium">正常</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {batchData.some((bd) => bd.isAbnormal) && (
        <div className="card-base border-red-200 bg-red-50/30">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-red-800 mb-3">异常批次汇总</h4>
              <div className="space-y-3">
                {batchData.filter((bd) => bd.isAbnormal).map((bd) => (
                  <div key={bd.batch.id} className="p-3 rounded-lg bg-white/70 border border-red-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-sm font-semibold text-red-600">{bd.batch.batchNo}</span>
                      <span className="text-xs text-slate-400">{bd.batch.startTime}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {bd.abnormalReasons.map((reason, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-medium">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card-base">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg border flex items-center justify-center text-blue-600 bg-blue-50 border-blue-100">
            <Flame className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">工艺参数对比</h4>
        </div>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b-2 border-slate-100">
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 sticky left-0 bg-white w-32">参数</th>
                {batchData.map((bd) => (
                  <th
                    key={bd.batch.id}
                    className={cn(
                      "text-center py-2.5 px-3 text-xs font-semibold",
                      bd.isAbnormal ? "text-red-600" : "text-slate-500"
                    )}
                  >
                    {bd.batch.batchNo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "材料牌号", key: "material", get: (bd: any) => bd.processCard?.material || "-" },
                { label: "渗碳温度", key: "carbTemp", get: (bd: any) => bd.processCard ? `${bd.processCard.carburizingTemp}℃` : "-" },
                { label: "渗碳时间", key: "carbTime", get: (bd: any) => bd.processCard ? `${bd.processCard.carburizingTime}min` : "-" },
                { label: "淬火温度", key: "quenchTemp", get: (bd: any) => bd.processCard ? `${bd.processCard.quenchingTemp}℃` : "-" },
                { label: "冷却介质", key: "medium", get: (bd: any) => bd.processCard?.quenchingMedium || "-" },
                { label: "回火温度", key: "tempTemp", get: (bd: any) => bd.processCard ? `${bd.processCard.temperingTemp}℃` : "-" },
                { label: "回火时间", key: "tempTime", get: (bd: any) => bd.processCard ? `${bd.processCard.temperingTime}min` : "-" },
                { label: "层深范围", key: "depthRange", get: (bd: any) => bd.processCard ? `${bd.processCard.layerDepthMin}-${bd.processCard.layerDepthMax}mm` : "-" },
                { label: "硬度范围", key: "hardRange", get: (bd: any) => bd.processCard ? `HRC ${bd.processCard.hardnessMin}-${bd.processCard.hardnessMax}` : "-" },
              ].map((row) => (
                <tr key={row.key} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-xs text-slate-500 font-medium sticky left-0 bg-inherit">{row.label}</td>
                  {batchData.map((bd) => (
                    <td key={bd.batch.id} className="py-2.5 px-3 text-center text-sm text-slate-700 font-mono">
                      {row.get(bd)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
