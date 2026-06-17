import { Bell, Search, User, Settings, Menu } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button className="lg:hidden p-2 rounded-md hover:bg-slate-100 text-slate-500">
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-800">{title}</h1>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索炉号、批次号、零件号..."
            className="w-72 pl-9 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-100 text-sm focus:outline-none focus:bg-white focus:border-primary-200 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
          />
        </div>

        <button className="relative p-2 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        </button>

        <button className="p-2 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors">
          <Settings className="w-5 h-5" />
        </button>

        <div className="w-px h-8 bg-slate-100 mx-2" />

        <div className="flex items-center gap-3 pr-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-sm">
            <User className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-semibold text-slate-700">工艺管理员</div>
            <div className="text-[10px] text-slate-400">热处理车间</div>
          </div>
        </div>
      </div>
    </header>
  );
}
