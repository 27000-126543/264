import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  FileUp, 
  Play, 
  Pause, 
  Eye, 
  Trash2,
  FlaskConical,
  Upload,
  X
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

export default function Molecules() {
  const navigate = useNavigate();
  const { molecules, toggleMoleculePause, addMolecule } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'smiles' | 'xyz'>('smiles');
  const [smilesInput, setSmilesInput] = useState('');
  const [moleculeName, setMoleculeName] = useState('');

  const filteredMolecules = molecules.filter(mol => 
    mol.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mol.formula.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mol.smiles.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpload = () => {
    if (!smilesInput || !moleculeName) return;
    
    addMolecule({
      name: moleculeName,
      formula: 'C?H?O?',
      smiles: smilesInput,
      molecularWeight: 100 + Math.random() * 50,
      conformers: [{
        id: `conf-${Date.now()}`,
        energy: -100 - Math.random() * 200,
        xyzData: '',
        isOptimized: false
      }],
      createdBy: '当前用户'
    });
    
    setShowUploadModal(false);
    setSmilesInput('');
    setMoleculeName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white mb-1">分子管理</h1>
          <p className="text-dark-400">管理分子库，上传结构文件，查看3D模型</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-500 to-primary-500 text-white font-medium hover:shadow-lg hover:shadow-accent-500/30 transition-all duration-300 hover:scale-[1.02]"
        >
          <Plus className="w-5 h-5" />
          上传分子
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="搜索分子名称、分子式或SMILES..."
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

      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-accent-500/10">
              <th className="text-left px-6 py-4 text-sm font-medium text-dark-400">分子名称</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-dark-400">分子式</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-dark-400">分子量</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-dark-400">SMILES</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-dark-400">构象数</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-dark-400">状态</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-dark-400">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredMolecules.map((mol) => (
              <tr key={mol.id} className="border-b border-accent-500/5 hover:bg-dark-800/30 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500/20 to-primary-500/20 flex items-center justify-center">
                    <FlaskConical className="w-5 h-5 text-accent-400" />
                  </div>
                  <span className="font-medium text-white">{mol.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-dark-200">{mol.formula}</td>
              <td className="px-6 py-4 text-dark-200">{mol.molecularWeight.toFixed(2)} g/mol</td>
              <td className="px-6 py-4">
                <code className="text-xs text-dark-400 bg-dark-800 px-2 py-1 rounded font-mono max-w-[150px truncate inline-block">
                  {mol.smiles}
                </code>
              </td>
              <td className="px-6 py-4 text-dark-200">{mol.conformers.length}</td>
              <td className="px-6 py-4">
                {mol.isPaused ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-danger-500/20 text-danger-400 text-xs font-medium">
                  <Pause className="w-3 h-3" />
                  已暂停
                </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success-500/20 text-success-400 text-xs font-medium">
                    <Play className="w-3 h-3" />
                    正常
                  </span>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => navigate(`/molecules/${mol.id}`)}
                    className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
                    title="查看详情"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleMoleculePause(mol.id)}
                    className={cn(
                      "p-2 rounded-lg hover:bg-dark-700 transition-colors",
                      mol.isPaused ? "text-success-400" : "text-warning-400"
                    )}
                    title={mol.isPaused ? "恢复" : "暂停"}
                  >
                    {mol.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>
                  <button
                    className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-danger-400 transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold text-white">上传分子结构</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="flex gap-2 p-1 bg-dark-800/50 rounded-xl p-1">
                <button
                  onClick={() => setUploadType('smiles')}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                    uploadType === 'smiles'
                      ? "bg-gradient-to-r from-accent-500 to-primary-500 text-white"
                      : "text-dark-400 hover:text-white"
                  )}
                >
                  SMILES 文本
                </button>
                <button
                  onClick={() => setUploadType('xyz')}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                    uploadType === 'xyz'
                      ? "bg-gradient-to-r from-accent-500 to-primary-500 text-white"
                      : "text-dark-400 hover:text-white"
                  )}
                >
                  XYZ 文件
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">分子名称</label>
                <input
                  type="text"
                  placeholder="例如：苯、乙醇..."
                  value={moleculeName}
                  onChange={(e) => setMoleculeName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-dark-800/50 border border-accent-500/10 text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-500/30 transition-colors"
                />
              </div>

              {uploadType === 'smiles' ? (
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">SMILES 字符串</label>
                  <textarea
                    placeholder="例如：c1ccccc1"
                    value={smilesInput}
                    onChange={(e) => setSmilesInput(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-dark-800/50 border border-accent-500/10 text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-500/30 transition-colors font-mono text-sm resize-none"
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-accent-500/20 rounded-xl p-8 text-center hover:border-accent-500/40 transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 text-accent-400/50 mx-auto mb-3" />
                  <p className="text-dark-300 mb-1">点击或拖拽上传 XYZ 文件</p>
                  <p className="text-xs text-dark-500">支持 .xyz 格式文件</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-3 rounded-xl bg-dark-800/50 border border-accent-500/10 text-dark-300 hover:bg-dark-800 font-medium transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!smilesInput || !moleculeName}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-accent-500 to-primary-500 text-white font-medium hover:shadow-lg hover:shadow-accent-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileUp className="w-4 h-4 inline mr-2" />
                  确认上传
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
