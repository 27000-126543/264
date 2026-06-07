import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FlaskConical, 
  GitBranch, 
  LineChart, 
  CheckSquare, 
  FileBarChart, 
  BarChart3,
  Settings,
  Atom
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '工作台' },
  { path: '/molecules', icon: FlaskConical, label: '分子管理' },
  { path: '/tasks', icon: GitBranch, label: '模拟任务' },
  { path: '/spectrum/task-001', icon: LineChart, label: '光谱分析' },
  { path: '/approval', icon: CheckSquare, label: '审批中心' },
  { path: '/reports', icon: FileBarChart, label: '报告中心' },
  { path: '/dashboard', icon: BarChart3, label: '统计看板' },
  { path: '/settings', icon: Settings, label: '系统设置' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 z-40 flex flex-col">
      <div className="h-20 flex items-center px-6 border-b border-accent-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center shadow-lg shadow-accent-500/30">
            <Atom className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-white">SpectraAI</h1>
            <p className="text-xs text-dark-400">分子光谱智能平台</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
        <div className="px-4 mb-2">
          <p className="text-xs font-medium text-dark-500 uppercase tracking-wider px-3 mb-2">主菜单</p>
        </div>
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path.split('/').slice(0, 2).join('/')));
            
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-gradient-to-r from-accent-500/20 to-primary-500/10 text-white border-l-2 border-accent-500" 
                      : "text-dark-300 hover:text-white hover:bg-dark-800/50"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-accent-400" : "")} />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-accent-500/10">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-success-500 to-primary-500 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">研</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">张研究员</p>
              <p className="text-xs text-dark-400 truncate">光谱分析师</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
