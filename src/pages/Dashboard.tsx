import { useNavigate } from 'react-router-dom';
import { 
  GitBranch, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Target, 
  Zap, 
  Cpu, 
  PauseCircle,
  Plus,
  FileUp,
  FileBarChart,
  ChevronRight,
  Activity
} from 'lucide-react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const { tasks, dashboardStats, molecules } = useStore();

  const recentTasks = tasks.slice(0, 5);
  const activeWarnings = tasks.flatMap(t => t.warnings.filter(w => !w.reviewed)).slice(0, 4);

  const quickActions = [
    { icon: Plus, label: '新建任务', color: 'from-accent-500 to-primary-500', action: () => navigate('/tasks') },
    { icon: FileUp, label: '上传分子', color: 'from-success-500 to-primary-500', action: () => navigate('/molecules') },
    { icon: FileBarChart, label: '查看报告', color: 'from-warning-500 to-orange-500', action: () => navigate('/reports') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white mb-1">工作台</h1>
          <p className="text-dark-400">欢迎回来，今天是进行光谱模拟的好日子</p>
        </div>
        <div className="flex items-center gap-3">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={i}
                onClick={action.action}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-dark-800 to-dark-900 border border-accent-500/20 hover:border-accent-500/40 transition-all duration-300 group"
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center",
                  action.color
                )}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-white">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <StatCard
          title="总任务数"
          value={dashboardStats.totalTasks}
          icon={GitBranch}
          trend={12.5}
          trendLabel="较上月增长"
          gradient="bg-accent-500"
        />
        <StatCard
          title="今日完成"
          value={dashboardStats.completedToday}
          icon={CheckCircle2}
          trend={8.2}
          trendLabel="较昨日增长"
          gradient="bg-success-500"
        />
        <StatCard
          title="待审批"
          value={dashboardStats.pendingApproval}
          icon={Clock}
          trend={-5.1}
          trendLabel="较昨日减少"
          gradient="bg-warning-500"
        />
        <StatCard
          title="活跃预警"
          value={dashboardStats.activeWarnings}
          icon={AlertTriangle}
          gradient="bg-danger-500"
        />
      </div>

      <div className="grid grid-cols-4 gap-5">
        <StatCard
          title="模拟完成率"
          value={`${dashboardStats.completionRate}%`}
          icon={Target}
          gradient="bg-primary-500"
        />
        <StatCard
          title="平均准确度"
          value={`${dashboardStats.averageAccuracy}%`}
          icon={Activity}
          trend={2.1}
          trendLabel="较上月提升"
          gradient="bg-accent-500"
        />
        <StatCard
          title="资源消耗(核时)"
          value={dashboardStats.totalResources}
          icon={Cpu}
          gradient="bg-blue-500"
        />
        <StatCard
          title="暂停分子"
          value={dashboardStats.pausedMolecules}
          icon={PauseCircle}
          gradient="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-semibold text-white">近期任务</h3>
            <button 
              onClick={() => navigate('/tasks')}
              className="text-sm text-accent-400 hover:text-accent-300 flex items-center gap-1 transition-colors"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div 
                key={task.id}
                onClick={() => navigate(`/tasks/${task.id}`)}
                className="flex items-center justify-between p-4 rounded-xl bg-dark-800/30 hover:bg-dark-800/50 border border-transparent hover:border-accent-500/20 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500/20 to-primary-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-accent-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white group-hover:text-accent-300 transition-colors">
                      {task.moleculeName} ({task.formula})
                    </p>
                    <p className="text-xs text-dark-400">
                      {task.spectrumTypes.join(' · ')} · {task.createdBy}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="w-24 h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-accent-500 to-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-dark-400 mt-1">{task.progress}%</p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-semibold text-white">实时预警</h3>
            <span className="px-2 py-1 rounded-full bg-danger-500/20 text-danger-400 text-xs font-medium">
              {activeWarnings.length} 条
            </span>
          </div>
          
          <div className="space-y-3">
            {activeWarnings.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-success-500/50 mx-auto mb-3" />
                <p className="text-dark-400 text-sm">暂无待处理预警</p>
              </div>
            ) : (
              activeWarnings.map((warning) => (
                <div 
                  key={warning.id}
                  className={cn(
                    "p-4 rounded-xl border-l-4 transition-all duration-200 cursor-pointer hover:scale-[1.02]",
                    warning.severity === 'high' 
                      ? "bg-danger-500/10 border-danger-500" 
                      : warning.severity === 'medium'
                      ? "bg-warning-500/10 border-warning-500"
                      : "bg-dark-700/50 border-dark-500"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={cn(
                      "w-5 h-5 flex-shrink-0 mt-0.5",
                      warning.severity === 'high' ? 'text-danger-400' : 
                      warning.severity === 'medium' ? 'text-warning-400' : 'text-dark-400'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">{warning.message}</p>
                      <p className="text-xs text-dark-400 mt-1">
                        {warning.type === 'low_match' ? '匹配度预警' : 
                         warning.type === 'abnormal_mode' ? '振动模式异常' : '收敛问题'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display font-semibold text-white mb-5">智能参数推荐</h3>
          <div className="space-y-3">
            {useStore.getState().recommendations.map((rec, i) => (
              <div key={i} className="p-4 rounded-xl bg-dark-800/30 border border-accent-500/10 hover:border-accent-500/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{i + 1}</span>
                    </div>
                    <span className="font-medium text-white">
                      {rec.functional} / {rec.basisSet}
                    </span>
                  </div>
                  <span className="px-2 py-1 rounded-full bg-success-500/20 text-success-400 text-xs font-medium">
                    置信度 {rec.confidence}%
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-dark-400">
                  <span>历史准确度: {rec.historicalAccuracy}%</span>
                  <span>样本数: {rec.sampleCount}</span>
                  {rec.solventModel && <span>溶剂: {rec.solventModel}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display font-semibold text-white mb-5">分子库概览</h3>
          <div className="space-y-3">
            {molecules.slice(0, 4).map((mol) => (
              <div key={mol.id} className="flex items-center justify-between p-3 rounded-xl bg-dark-800/30 hover:bg-dark-800/50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-accent-400">{mol.formula.slice(0, 2)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{mol.name}</p>
                    <p className="text-xs text-dark-400">{mol.formula} · {mol.molecularWeight} g/mol</p>
                  </div>
                </div>
                {mol.isPaused && (
                  <span className="px-2 py-1 rounded-full bg-danger-500/20 text-danger-400 text-xs">
                    已暂停
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
