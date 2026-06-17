import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const titleMap: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "生产概览", subtitle: "实时掌握热处理车间生产动态" },
  "/process-cards": { title: "工艺卡片管理", subtitle: "热处理工艺参数定义与版本管理" },
  "/furnace-planning": { title: "装炉排产", subtitle: "炉次计划与零件装炉排布管理" },
  "/carburizing": { title: "渗碳淬火记录", subtitle: "渗碳层深度、淬火介质与冷却记录" },
  "/tempering": { title: "回火处理记录", subtitle: "回火炉温曲线与参数记录" },
  "/metallography": { title: "金相检测", subtitle: "金相组织分析与判定记录" },
  "/hardness": { title: "硬度检验", subtitle: "洛氏硬度与心部硬度抽检记录" },
  "/deformation": { title: "变形矫正", subtitle: "零件变形测量与校直矫正记录" },
  "/traceability": { title: "质量追溯", subtitle: "炉次全流程质量档案追溯查询" },
};

export default function Layout() {
  const location = useLocation();
  const pageInfo =
    titleMap[location.pathname] || {
      title: "热处理管理系统",
      subtitle: "",
    };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-industrial-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={pageInfo.title} subtitle={pageInfo.subtitle} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
