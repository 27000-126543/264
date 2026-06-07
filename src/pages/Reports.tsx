import { useState } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  Calendar,
  Plus,
  Search,
  Filter,
  CheckSquare,
  FileBarChart,
  Loader2
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { generateSpectrumReport } from '../services/pdfExporter';

export default function Reports() {
  const { reports, tasks, spectra, generateReport } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState('');
  const [selectedSections, setSelectedSections] = useState<string[]>(['spectrum', 'vibration', 'parameters', 'peaks']);
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredReports = reports.filter(r => 
    r.moleculeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const completedTasks = tasks.filter(t => t.status === 'completed');

  const toggleSection = (section: string) => {
    setSelectedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleGenerate = async () => {
    if (!selectedTask) return;
    setIsGenerating(true);
    
    try {
      const task = tasks.find(t => t.id === selectedTask);
      const spectrumData = task ? spectra[task.id] : undefined;
      
      if (task) {
        await generateSpectrumReport(task, spectrumData, selectedSections);
        generateReport(selectedTask, selectedSections, '当前用户');
      }
    } catch (error) {
      console.error('生成报告失败:', error);
    } finally {
      setIsGenerating(false);
      setShowGenerateModal(false);
      setSelectedTask('');
      setSelectedSections(['spectrum', 'vibration', 'parameters', 'peaks']);
    }
  };

  const sections = [
    { id: 'spectrum', label: '谱图叠加图', icon: FileBarChart },
    { id: 'vibration', label: '振动模式分析', icon: CheckSquare },
    { id: 'orbital', label: '分子轨道贡献', icon: FileBarChart },
    { id: 'parameters', label: '计算参数', icon: FileText },
    { id: 'peaks', label: '峰位归属表', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white mb-1">报告中心</h1>
          <p className="text-dark-400">生成和管理光谱分析综合报告</p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-500 to-primary-500 text-white font-medium hover:shadow-lg hover:shadow-accent-500/30 transition-all duration-300 hover:scale-[1.02]"
        >
          <Plus className="w-5 h-5" />
          生成报告
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="搜索报告..."
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

      <div className="grid grid-cols-3 gap-5">
        {filteredReports.map((report) => {
          const task = tasks.find(t => t.id === report.taskId);
          return (
            <div key={report.id} className="glass-card rounded-2xl p-6 hover:border-accent-500/30 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-accent-500/20 to-primary-500/20">
                  <FileText className="w-6 h-6 text-accent-400" />
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-colors" title="预览">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-colors" title="下载">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-danger-400 transition-colors" title="删除">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="font-medium text-white mb-1">{report.moleculeName}</h3>
              <p className="text-sm text-dark-400 mb-4">{report.formula}</p>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {report.includeSections.map(section => (
                  <span key={section} className="text-xs px-2 py-0.5 rounded-full bg-dark-700 text-dark-300">
                    {sections.find(s => s.id === section)?.label || section}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center justify-between text-xs text-dark-500 pt-4 border-t border-accent-500/10">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(report.createdAt).toLocaleDateString('zh-CN')}
                </div>
                <span>{report.createdBy}</span>
              </div>
            </div>
          );
        })}
      </div>

      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-display font-bold text-white mb-6">生成综合报告</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">选择任务</label>
                <select
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-dark-800/50 border border-accent-500/10 text-white focus:outline-none focus:border-accent-500/30 transition-colors"
                >
                  <option value="">请选择已完成的模拟任务</option>
                  {completedTasks.map(task => (
                    <option key={task.id} value={task.id}>
                      {task.moleculeName} ({task.formula}) - 匹配度 {task.matchScore}%
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-3">报告内容</label>
                <div className="grid grid-cols-2 gap-3">
                  {sections.map(section => {
                    const Icon = section.icon;
                    const isSelected = selectedSections.includes(section.id);
                    return (
                      <button
                        key={section.id}
                        onClick={() => toggleSection(section.id)}
                        className={cn(
                          "p-4 rounded-xl border text-left transition-all",
                          isSelected
                            ? "bg-accent-500/20 border-accent-500/50"
                            : "bg-dark-800/30 border-transparent hover:border-accent-500/20"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            isSelected ? "bg-accent-500/30" : "bg-dark-700"
                          )}>
                            <Icon className={cn(
                              "w-4 h-4",
                              isSelected ? "text-accent-400" : "text-dark-400"
                            )} />
                          </div>
                          <span className={cn(
                            "text-sm font-medium",
                            isSelected ? "text-white" : "text-dark-300"
                          )}>
                            {section.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 py-3 rounded-xl bg-dark-800/50 border border-accent-500/10 text-dark-300 hover:bg-dark-800 font-medium transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!selectedTask || isGenerating}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-accent-500 to-primary-500 text-white font-medium hover:shadow-lg hover:shadow-accent-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    '生成报告'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
