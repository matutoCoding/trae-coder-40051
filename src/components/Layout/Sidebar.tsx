import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  CalendarClock,
  Flame,
  Thermometer,
  Microscope,
  Gauge,
  Ruler,
  Search,
  Factory,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/utils";

const menuItems = [
  { path: "/dashboard", label: "仪表板", icon: LayoutDashboard, group: "概览" },
  { path: "/process-cards", label: "工艺卡片", icon: FileText, group: "工艺管理" },
  { path: "/furnace-planning", label: "装炉排产", icon: CalendarClock, group: "生产管理" },
  { path: "/carburizing", label: "渗碳淬火", icon: Flame, group: "生产管理" },
  { path: "/tempering", label: "回火处理", icon: Thermometer, group: "生产管理" },
  { path: "/metallography", label: "金相检测", icon: Microscope, group: "质量检验" },
  { path: "/hardness", label: "硬度检验", icon: Gauge, group: "质量检验" },
  { path: "/deformation", label: "变形矫正", icon: Ruler, group: "质量检验" },
  { path: "/traceability", label: "质量追溯", icon: Search, group: "质量追溯" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const groups = [...new Set(menuItems.map((m) => m.group))];

  return (
    <aside
      className={cn(
        "relative flex flex-col bg-gradient-to-b from-industrial-900 to-industrial-800 text-slate-200 transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 h-16 px-4 border-b border-industrial-700/50",
          collapsed && "justify-center px-0"
        )}
      >
        <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-900/30">
          <Factory className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-base text-white whitespace-nowrap">
              热处理 MES
            </span>
            <span className="text-[10px] text-slate-400 whitespace-nowrap">
              渗碳淬火管理系统
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {groups.map((group) => (
          <div key={group} className="mb-1">
            {!collapsed && (
              <div className="px-4 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {group}
              </div>
            )}
            <div className="space-y-0.5 px-2">
              {menuItems
                .filter((m) => m.group === group)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group",
                          collapsed && "justify-center px-2",
                          isActive
                            ? "bg-primary-600/90 text-white shadow-md shadow-primary-900/30"
                            : "text-slate-300 hover:bg-industrial-700/50 hover:text-white"
                        )
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5 flex-shrink-0 transition-transform duration-200",
                          !collapsed && "group-hover:scale-110"
                        )}
                      />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-500 hover:text-primary-600 hover:shadow-lg transition-all z-10"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {!collapsed && (
        <div className="px-4 py-3 border-t border-industrial-700/50">
          <div className="text-[10px] text-slate-500">系统版本 v1.0.0</div>
        </div>
      )}
    </aside>
  );
}
