import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RefreshCw, 
  Download, 
  AlertTriangle,
  Zap,
  Clock,
  User,
  Calendar,
  ChevronRight,
  Settings2,
  CheckCircle
} from 'lucide-react';
import { useStore } from '../store/useStore';
import StatusBadge from '../components/StatusBadge';
import { cn } from '../lib/utils';
import { FUNCTIONAL_OPTIONS, BASIS_SET_OPTIONS, SOLVENT_MODEL_OPTIONS } from '../types';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, updateTaskStatus, adjustParameters, recommendations, addEnergyPoint, addTaskWarning, completeTask } = useStore();
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [newFunctional, setNewFunctional] = useState('');
  const [newBasisSet, setNewBasisSet] = useState('');
  const [newSolvent, setNewSolvent] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [isSimulating, setIsSimulating] = useState(true);
  const lastEnergyRef = useRef(-760 + Math.random() * 10);

  const task = tasks.find(t => t.id === id);

  useEffect(() => {
    if (!task || !isSimulating) return;
    
    const interval = setInterval(() => {
      const currentTask = tasks.find(t => t.id === id);
      if (!currentTask) return;

      if (currentTask.status === 'optimizing' && currentTask.progress < 50) {
        const newProgress = Math.min(currentTask.progress + 3, 50);
        updateTaskStatus(currentTask.id, currentTask.status, newProgress);
        
        if (currentTask.energyConvergence.length < 15) {
          const converged = currentTask.progress > 35;
          const energyChange = (Math.random() - 0.5) * 0.5;
          lastEnergyRef.current = lastEnergyRef.current + energyChange * (converged ? 0.1 : 1);
          addEnergyPoint(currentTask.id, {
            energy: lastEnergyRef.current,
            converged
          });
        }
      } else if (currentTask.status === 'calculating' && currentTask.progress < 90) {
        const newProgress = Math.min(currentTask.progress + 2, 90);
        updateTaskStatus(currentTask.id, currentTask.status, newProgress);
      } else if (currentTask.status === 'optimizing' && currentTask.progress >= 50) {
        updateTaskStatus(currentTask.id, 'calculating', 55);
      } else if (currentTask.status === 'calculating' && currentTask.progress >= 90) {
        updateTaskStatus(currentTask.id, 'comparing', 95);
      } else if (currentTask.status === 'comparing' && currentTask.progress >= 95) {
        const matchScore = 75 + Math.floor(Math.random() * 20);
        completeTask(currentTask.id, matchScore);
        
        if (matchScore < 80) {
          addTaskWarning(currentTask.id, {
            type: 'low_match',
            severity: 'medium',
            message: `匹配度 ${matchScore}% 低于阈值80%`,
            reviewed: false
          });
        }
        
        setIsSimulating(false);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [task?.id, isSimulating, tasks, updateTaskStatus, addEnergyPoint, addTaskWarning, completeTask, id]);

  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-400">任务不存在</p>
      </div>
    );
  }

  const convergenceOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(16, 42, 67, 0.95)',
      borderColor: 'rgba(108, 92, 231, 0.3)',
      textStyle: { color: '#D9E2EC' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: task.energyConvergence.map(p => `Step ${p.step}`),
      axisLine: { lineStyle: { color: 'rgba(108, 92, 231, 0.2)' } },
      axisLabel: { color: '#627D98', fontSize: 10, rotate: 45 },
    },
    yAxis: {
      type: 'value',
      name: '能量 (Hartree)',
      axisLine: { lineStyle: { color: 'rgba(108, 92, 231, 0.2)' } },
      axisLabel: { color: '#627D98', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(108, 92, 231, 0.08)' } },
      nameTextStyle: { color: '#829AB1', fontSize: 12 },
    },
    series: [{
      type: 'line',
      data: task.energyConvergence.map(p => ({
        value: p.energy,
        itemStyle: { color: p.converged ? '#00B894' : '#6C5CE7' },
      })),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#6C5CE7', width: 2 },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(108, 92, 231, 0.2)' }, { offset: 1, color: 'rgba(108, 92, 231, 0.02)' }],
        },
      },
    }],
  };

  const handleAdjust = () => {
    if (!newFunctional || !newBasisSet || !adjustReason) return;
    adjustParameters(task.id, {
      functional: newFunctional,
      basisSet: newBasisSet,
      solventModel: newSolvent || undefined,
      conformerId: task.parameters.conformerId,
    }, adjustReason, '当前用户');
    setShowAdjustModal(false);
    setNewFunctional('');
    setNewBasisSet('');
    setNewSolvent('');
    setAdjustReason('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/tasks')}
          className="p-2 rounded-lg bg-dark-800/50 text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-display font-bold text-white">
              {task.moleculeName} ({task.formula})
            </h1>
            <StatusBadge status={task.status} />
          </div>
          <p className="text-dark-400">任务ID: {task.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/spectrum/${task.id}`)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent-500 to-primary-500 text-white font-medium hover:shadow-lg hover:shadow-accent-500/30 transition-all"
          >
            <Zap className="w-4 h-4" />
            查看光谱
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-800/50 border border-accent-500/20 text-dark-300 hover:bg-dark-800 hover:text-white transition-all">
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-accent-500/20">
              <Zap className="w-5 h-5 text-accent-400" />
            </div>
            <div>
              <p className="text-xs text-dark-400">当前进度</p>
              <p className="text-2xl font-bold text-white">{task.progress}%</p>
            </div>
          </div>
          <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-accent-500 to-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-success-500/20">
              <ChevronRight className="w-5 h-5 text-success-400" />
            </div>
            <div>
              <p className="text-xs text-dark-400">匹配度</p>
              <p className={cn(
                "text-2xl font-bold",
                (task.matchScore || 0) >= 80 ? "text-success-400" : "text-warning-400"
              )}>
                {task.matchScore ? `${task.matchScore}%` : '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-warning-500/20">
              <AlertTriangle className="w-5 h-5 text-warning-400" />
            </div>
            <div>
              <p className="text-xs text-dark-400">预警数</p>
              <p className="text-2xl font-bold text-warning-400">{task.warnings.length}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary-500/20">
              <Settings2 className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-xs text-dark-400">调整日志</p>
              <p className="text-2xl font-bold text-primary-400">{task.adjustmentLogs.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 glass-card rounded-2xl p-6">
          <h3 className="font-display font-semibold text-white mb-4">能量收敛曲线</h3>
          <div className="h-72">
            <ReactECharts option={convergenceOption} style={{ height: '100%' }} />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display font-semibold text-white mb-4">计算参数</h3>
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-dark-800/30">
              <p className="text-xs text-dark-400 mb-1">泛函</p>
              <p className="text-white font-medium">{task.parameters.functional}</p>
            </div>
            <div className="p-3 rounded-xl bg-dark-800/30">
              <p className="text-xs text-dark-400 mb-1">基组</p>
              <p className="text-white font-medium">{task.parameters.basisSet}</p>
            </div>
            <div className="p-3 rounded-xl bg-dark-800/30">
              <p className="text-xs text-dark-400 mb-1">溶剂模型</p>
              <p className="text-white font-medium">{task.parameters.solventModel || '气相'}</p>
            </div>
            <div className="p-3 rounded-xl bg-dark-800/30">
              <p className="text-xs text-dark-400 mb-1">光谱类型</p>
              <div className="flex flex-wrap gap-1">
                {task.spectrumTypes.map(type => (
                  <span key={type} className="text-xs px-2 py-0.5 rounded-full bg-dark-700 text-dark-300">
                    {type}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-dark-800/30">
              <p className="text-xs text-dark-400 mb-1">创建信息</p>
              <div className="flex items-center gap-2 text-sm text-dark-300">
                <User className="w-3 h-3" />
                {task.createdBy}
              </div>
              <div className="flex items-center gap-2 text-sm text-dark-300 mt-1">
                <Calendar className="w-3 h-3" />
                {new Date(task.createdAt).toLocaleString('zh-CN')}
              </div>
            </div>
          </div>
          
          {(task.status === 'rollback' || task.warnings.length > 0) && (
            <button
              onClick={() => setShowAdjustModal(true)}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-warning-500/20 to-orange-500/20 border border-warning-500/30 text-warning-400 font-medium hover:bg-warning-500/30 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              调整参数重算
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {task.warnings.length > 0 && (
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning-400" />
              预警信息
            </h3>
            <div className="space-y-3">
              {task.warnings.map((warning) => (
                <div 
                  key={warning.id}
                  className={cn(
                    "p-4 rounded-xl border-l-4",
                    warning.severity === 'high' 
                      ? "bg-danger-500/10 border-danger-500" 
                      : warning.severity === 'medium'
                      ? "bg-warning-500/10 border-warning-500"
                      : "bg-dark-800/30 border-dark-500"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{warning.message}</span>
                    {warning.reviewed ? (
                      <span className="text-xs text-success-400">已复核</span>
                    ) : (
                      <span className="text-xs text-warning-400">待复核</span>
                    )}
                  </div>
                  <p className="text-xs text-dark-400">
                    类型: {warning.type === 'low_match' ? '匹配度低' : 
                           warning.type === 'abnormal_mode' ? '振动模式异常' : '收敛问题'}
                    {warning.reviewedBy && ` · 复核人: ${warning.reviewedBy}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {task.adjustmentLogs.length > 0 && (
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-display font-semibold text-white mb-4">调整日志</h3>
            <div className="space-y-3">
              {task.adjustmentLogs.map((log) => (
                <div key={log.id} className="p-4 rounded-xl bg-dark-800/30 border border-accent-500/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">参数调整</span>
                    <span className="text-xs text-dark-400">
                      {new Date(log.timestamp).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div className="p-2 rounded-lg bg-dark-700/50">
                      <p className="text-dark-500">原参数</p>
                      <p className="text-dark-300">{log.oldParameters.functional} / {log.oldParameters.basisSet}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-success-500/10">
                      <p className="text-dark-500">新参数</p>
                      <p className="text-success-400">{log.newParameters.functional} / {log.newParameters.basisSet}</p>
                    </div>
                  </div>
                  <p className="text-xs text-dark-400">
                    调整人: {log.adjustedBy} · 原因: {log.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display font-semibold text-white mb-4">状态流转历史</h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {task.statusHistory.map((record, i) => (
            <div key={i} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  i === task.statusHistory.length - 1
                    ? "bg-gradient-to-br from-accent-500 to-primary-500"
                    : "bg-dark-700"
                )}>
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs text-white mt-2 font-medium text-center w-20 truncate">
                  {record.status}
                </p>
                <p className="text-xs text-dark-500">
                  {new Date(record.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {i < task.statusHistory.length - 1 && (
                <div className="w-8 h-0.5 bg-accent-500/30 mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-display font-bold text-white mb-6">调整计算参数</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">智能推荐</label>
                <div className="space-y-2">
                  {recommendations.slice(0, 2).map((rec, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setNewFunctional(rec.functional);
                        setNewBasisSet(rec.basisSet);
                        setNewSolvent(rec.solventModel || '');
                      }}
                      className="w-full p-3 rounded-xl bg-dark-800/30 border border-accent-500/10 hover:border-accent-500/30 transition-all text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">
                          {rec.functional} / {rec.basisSet}
                        </span>
                        <span className="text-xs text-success-400">置信度 {rec.confidence}%</span>
                      </div>
                      <p className="text-xs text-dark-400 mt-1">
                        历史准确度: {rec.historicalAccuracy}% · 样本数: {rec.sampleCount}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">泛函</label>
                <select
                  value={newFunctional}
                  onChange={(e) => setNewFunctional(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-dark-800/50 border border-accent-500/10 text-white focus:outline-none focus:border-accent-500/30 transition-colors"
                >
                  <option value="">选择泛函</option>
                  {FUNCTIONAL_OPTIONS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">基组</label>
                <select
                  value={newBasisSet}
                  onChange={(e) => setNewBasisSet(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-dark-800/50 border border-accent-500/10 text-white focus:outline-none focus:border-accent-500/30 transition-colors"
                >
                  <option value="">选择基组</option>
                  {BASIS_SET_OPTIONS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">溶剂模型</label>
                <select
                  value={newSolvent}
                  onChange={(e) => setNewSolvent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-dark-800/50 border border-accent-500/10 text-white focus:outline-none focus:border-accent-500/30 transition-colors"
                >
                  {SOLVENT_MODEL_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">调整原因</label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="请输入调整原因..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-dark-800/50 border border-accent-500/10 text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-500/30 transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 py-3 rounded-xl bg-dark-800/50 border border-accent-500/10 text-dark-300 hover:bg-dark-800 font-medium transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleAdjust}
                  disabled={!newFunctional || !newBasisSet || !adjustReason}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-accent-500 to-primary-500 text-white font-medium hover:shadow-lg hover:shadow-accent-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认调整并重算
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
