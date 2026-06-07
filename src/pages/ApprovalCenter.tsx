import { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import { useStore } from '../store/useStore';
import StatusBadge from '../components/StatusBadge';
import { cn } from '../lib/utils';
import { ApprovalLevel } from '../types';

export default function ApprovalCenter() {
  const { approvals, tasks, approveTask, rejectTask } = useStore();
  const [activeTab, setActiveTab] = useState<ApprovalLevel>('primary');
  const [selectedApproval, setSelectedApproval] = useState<string | null>(null);
  const [comments, setComments] = useState('');

  const filteredApprovals = approvals.filter(a => a.level === activeTab);

  const handleApprove = (approvalId: string) => {
    const approval = approvals.find(a => a.id === approvalId);
    if (!approval) return;
    approveTask(approval.taskId, activeTab, '当前用户', comments || '已审核通过');
    setComments('');
    setSelectedApproval(null);
  };

  const handleReject = (approvalId: string) => {
    const approval = approvals.find(a => a.id === approvalId);
    if (!approval) return;
    rejectTask(approval.taskId, activeTab, '当前用户', comments || '审核未通过');
    setComments('');
    setSelectedApproval(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white mb-1">审批中心</h1>
        <p className="text-dark-400">管理光谱鉴定结果的两级审批流程</p>
      </div>

      <div className="flex gap-2 p-1 bg-dark-800/50 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('primary')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
            activeTab === 'primary'
              ? "bg-gradient-to-r from-accent-500 to-primary-500 text-white"
              : "text-dark-300 hover:text-white"
          )}
        >
          <Clock className="w-4 h-4" />
          初级验证
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">
            {approvals.filter(a => a.level === 'primary' && a.status === 'pending').length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('final')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
            activeTab === 'final'
              ? "bg-gradient-to-r from-accent-500 to-primary-500 text-white"
              : "text-dark-300 hover:text-white"
          )}
        >
          <CheckCircle2 className="w-4 h-4" />
          负责人确认
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">
            {approvals.filter(a => a.level === 'final' && a.status === 'pending').length}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-5 gap-5">
        <div className="col-span-2 space-y-3">
          {filteredApprovals.map((approval) => {
            const task = tasks.find(t => t.id === approval.taskId);
            return (
              <div
                key={approval.id}
                onClick={() => setSelectedApproval(approval.id)}
                className={cn(
                  "glass-card rounded-xl p-4 cursor-pointer transition-all",
                  selectedApproval === approval.id
                    ? "border-accent-500/50 ring-2 ring-accent-500/20"
                    : "hover:border-accent-500/30"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-white">{task?.moleculeName}</h4>
                    <p className="text-xs text-dark-400">{task?.formula}</p>
                  </div>
                  {approval.status === 'approved' && (
                    <span className="px-2 py-1 rounded-full bg-success-500/20 text-success-400 text-xs font-medium">
                      已通过
                    </span>
                  )}
                  {approval.status === 'rejected' && (
                    <span className="px-2 py-1 rounded-full bg-danger-500/20 text-danger-400 text-xs font-medium">
                      已驳回
                    </span>
                  )}
                  {approval.status === 'pending' && (
                    <span className="px-2 py-1 rounded-full bg-warning-500/20 text-warning-400 text-xs font-medium">
                      待审批
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-dark-400 mb-3">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {task?.createdBy}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(approval.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>

                {task && <StatusBadge status={task.status} />}
              </div>
            );
          })}
        </div>

        <div className="col-span-3">
          {selectedApproval ? (
            (() => {
              const approval = approvals.find(a => a.id === selectedApproval);
              const task = tasks.find(t => t.id === approval?.taskId);
              if (!approval || !task) return null;

              return (
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-display font-bold text-white">
                        {task.moleculeName} ({task.formula})
                      </h3>
                      <p className="text-dark-400">
                        {activeTab === 'primary' ? '初级研究员验证' : '项目负责人确认'}
                      </p>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-dark-800/30">
                      <p className="text-xs text-dark-400 mb-1">计算参数</p>
                      <p className="text-sm text-white font-medium">
                        {task.parameters.functional} / {task.parameters.basisSet}
                      </p>
                      {task.parameters.solventModel && (
                        <p className="text-xs text-dark-400 mt-1">溶剂: {task.parameters.solventModel}</p>
                      )}
                    </div>
                    <div className="p-4 rounded-xl bg-dark-800/30">
                      <p className="text-xs text-dark-400 mb-1">光谱类型</p>
                      <div className="flex gap-1">
                        {task.spectrumTypes.map(type => (
                          <span key={type} className="text-xs px-2 py-0.5 rounded-full bg-dark-700 text-dark-300">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-dark-800/30">
                      <p className="text-xs text-dark-400 mb-1">匹配度</p>
                      <p className={cn(
                        "text-xl font-bold",
                        (task.matchScore || 0) >= 80 ? "text-success-400" : "text-warning-400"
                      )}>
                        {task.matchScore || '-'}%
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-dark-800/30">
                      <p className="text-xs text-dark-400 mb-1">预警数</p>
                      <p className="text-xl font-bold text-warning-400">
                        {task.warnings.length}
                      </p>
                    </div>
                  </div>

                  {task.warnings.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-warning-400" />
                        预警信息
                      </h4>
                      <div className="space-y-2">
                        {task.warnings.map((warning) => (
                          <div 
                            key={warning.id}
                            className={cn(
                              "p-3 rounded-xl border-l-4",
                              warning.severity === 'high' 
                                ? "bg-danger-500/10 border-danger-500" 
                                : warning.severity === 'medium'
                                ? "bg-warning-500/10 border-warning-500"
                                : "bg-dark-800/30 border-dark-500"
                            )}
                          >
                            <p className="text-sm text-white">{warning.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {approval.status === 'pending' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">审批意见</label>
                        <textarea
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder="请输入审批意见..."
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl bg-dark-800/50 border border-accent-500/10 text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-500/30 transition-colors resize-none"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleReject(approval.id)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-dark-800/50 border border-danger-500/30 text-danger-400 font-medium hover:bg-danger-500/10 transition-all"
                        >
                          <XCircle className="w-5 h-5" />
                          驳回
                        </button>
                        <button
                          onClick={() => handleApprove(approval.id)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-success-500 to-primary-500 text-white font-medium hover:shadow-lg hover:shadow-success-500/30 transition-all"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          通过
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-dark-800/30">
                      <div className="flex items-center gap-3 mb-2">
                        {approval.status === 'approved' ? (
                          <CheckCircle2 className="w-5 h-5 text-success-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-danger-400" />
                        )}
                        <span className="font-medium text-white">
                          {approval.status === 'approved' ? '已通过' : '已驳回'}
                        </span>
                      </div>
                      <p className="text-sm text-dark-300 mb-2">{approval.comments}</p>
                      <p className="text-xs text-dark-500">
                        审批人: {approval.reviewer} · {new Date(approval.reviewedAt || '').toLocaleString('zh-CN')}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-dark-800/50 flex items-center justify-center">
                <ChevronRight className="w-10 h-10 text-dark-500" />
              </div>
              <p className="text-dark-400">请选择左侧列表中的审批项查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
