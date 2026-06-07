import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal,
  GitBranch,
  Zap
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { useStore } from '../store/useStore';
import { TaskStatus, TASK_STATUS_LABELS } from '../types';
import { cn } from '../lib/utils';

const statusColumns: TaskStatus[] = ['pending', 'submitted', 'optimizing', 'calculating', 'comparing', 'completed', 'rollback'];

export default function Tasks() {
  const navigate = useNavigate();
  const { tasks } = useStore();
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTasks = tasks.filter(task => 
    task.moleculeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.formula.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTasksByStatus = (status: TaskStatus) => 
    filteredTasks.filter(t => t.status === status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white mb-1">模拟任务</h1>
          <p className="text-dark-400">管理所有光谱模拟任务，实时监控计算进度</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-dark-800/50 rounded-xl">
            <button
              onClick={() => setViewMode('board')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                viewMode === 'board' ? "bg-accent-500/20 text-accent-400" : "text-dark-400 hover:text-white"
              )}
            >
              看板视图
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                viewMode === 'list' ? "bg-accent-500/20 text-accent-400" : "text-dark-400 hover:text-white"
              )}
            >
              列表视图
            </button>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-500 to-primary-500 text-white font-medium hover:shadow-lg hover:shadow-accent-500/30 transition-all duration-300 hover:scale-[1.02]">
            <Plus className="w-5 h-5" />
            新建任务
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="搜索任务..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-dark-800/50 border border-accent-500/10 text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-500/30 transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-3 rounded-xl bg-dark-800/50 border border-accent-500/10 text-dark-300 hover:bg-dark-800 hover:border-accent-500/20 transition-all">
          <Filter className="w-5 h-5" />
          筛选
        </button>
      </div>

      {viewMode === 'board' ? (
        <div className="grid grid-cols-7 gap-4 overflow-x-auto pb-4">
          {statusColumns.map((status) => (
            <div key={status} className="min-w-[220px">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-dark-300">{TASK_STATUS_LABELS[status]}</span>
                  <span className="text-xs text-dark-500 bg-dark-800 px-2 py-0.5 rounded-full">
                    {getTasksByStatus(status).length}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                {getTasksByStatus(status).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    className="glass-card rounded-xl p-4 cursor-pointer hover:border-accent-500/30 transition-all hover:scale-[1.02]"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-500/20 to-primary-500/20 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-accent-400" />
                      </div>
                      <button className="p-1 rounded hover:bg-dark-700 text-dark-400 hover:text-white transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <h4 className="font-medium text-white mb-1">{task.moleculeName}</h4>
                    <p className="text-xs text-dark-400 mb-3">{task.formula}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {task.spectrumTypes.map((type) => (
                        <span key={type} className="text-xs px-2 py-0.5 rounded-full bg-dark-800 text-dark-300">
                        {type}
                      </span>
                      ))}
                    </div>
                    
                    {task.status !== 'pending' && task.status !== 'completed' && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-dark-400">进度</span>
                          <span className="text-dark-300">{task.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-dark-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-accent-500 to-primary-500 rounded-full transition-all duration-500"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {task.matchScore !== undefined && (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-accent-500/10">
                        <span className="text-xs text-dark-400">匹配度</span>
                        <span className={cn(
                          "text-xs font-medium",
                          task.matchScore >= 80 ? "text-success-400" : "text-warning-400"
                        )}>
                          {task.matchScore}%
                        </span>
                      </div>
                    )}
                    
                    <div className="mt-3 pt-3 border-t border-accent-500/10">
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-accent-500/10">
                <th className="text-left px-6 py-4 text-sm font-medium text-dark-400">任务</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-dark-400">光谱类型</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-dark-400">计算参数</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-dark-400">进度</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-dark-400">匹配度</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-dark-400">状态</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-dark-400">创建人</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr 
                key={task.id}
                onClick={() => navigate(`/tasks/${task.id}`)}
                className="border-b border-accent-500/5 hover:bg-dark-800/30 transition-colors cursor-pointer">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500/20 to-primary-500/20 flex items-center justify-center">
                      <GitBranch className="w-5 h-5 text-accent-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{task.moleculeName}</p>
                      <p className="text-xs text-dark-400">{task.formula}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    {task.spectrumTypes.map(type => (
                      <span key={type} className="text-xs px-2 py-1 rounded-full bg-dark-800 text-dark-300">
                        {type}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-dark-300">
                  {task.parameters.functional} / {task.parameters.basisSet}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-accent-500 to-primary-500 rounded-full"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-dark-400">{task.progress}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {task.matchScore !== undefined ? (
                  <span className={cn(
                    "font-medium",
                    task.matchScore >= 80 ? "text-success-400" : "text-warning-400"
                  )}>
                    {task.matchScore}%
                  </span>
                ) : (
                  <span className="text-dark-500">-</span>
                )}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={task.status} />
                </td>
                <td className="px-6 py-4 text-sm text-dark-300">{task.createdBy}</td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
