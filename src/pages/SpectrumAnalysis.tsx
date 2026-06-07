import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Download, 
  ChevronRight,
  Layers,
  Activity,
  X,
  FileSpreadsheet,
  FileJson
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { SpectrumType, SPECTRUM_TYPE_LABELS } from '../types';
import { exportSpectrumData } from '../services/pdfExporter';

export default function SpectrumAnalysis() {
  const { spectra, tasks } = useStore();
  const task = tasks.find(t => t.id === 'task-001');
  const [selectedType, setSelectedType] = useState<SpectrumType>('IR');
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedMode, setSelectedMode] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exportRange, setExportRange] = useState<{ min: string; max: string }>({ min: '', max: '' });

  const spectrumKey = `task-001-${selectedType}`;
  const spectrum = spectra[spectrumKey];

  const handleExport = () => {
    if (!spectrum) return;
    
    const range = exportRange.min || exportRange.max
      ? { min: parseFloat(exportRange.min) || 0, max: parseFloat(exportRange.max) || Infinity }
      : undefined;
    
    exportSpectrumData(spectrum, exportFormat, range);
    setShowExportModal(false);
    setExportRange({ min: '', max: '' });
  };

  const chartOption = spectrum ? {
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
      data: spectrum.xAxis,
      axisLine: { lineStyle: { color: 'rgba(108, 92, 231, 0.2)' } },
      axisLabel: { color: '#627D98', fontSize: 11 },
      name: selectedType === 'NMR' ? '化学位移 (ppm)' : selectedType === 'UV-Vis' ? '波长 (nm)' : '波数 (cm⁻¹)',
      nameTextStyle: { color: '#829AB1', fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(108, 92, 231, 0.2)' } },
      axisLabel: { color: '#627D98', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(108, 92, 231, 0.08)' } },
      name: '强度',
      nameTextStyle: { color: '#829AB1', fontSize: 12 },
    },
    series: [
      {
        name: '计算谱',
        type: 'line',
        data: spectrum.yAxis,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#6C5CE7', width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(108, 92, 231, 0.3)' },
              { offset: 1, color: 'rgba(108, 92, 231, 0.02)' },
            ],
          },
        },
      },
      ...(spectrum.experimentalData ? [{
        name: '实验谱',
        type: 'line',
        data: spectrum.experimentalData.yAxis,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#00B894', width: 2, type: 'dashed' as const },
      }] : []),
    ],
    legend: {
      data: spectrum.experimentalData ? ['计算谱', '实验谱'] : ['计算谱'],
      textStyle: { color: '#D9E2EC' },
      top: 0,
    },
  } : {};

  const orbitalOption = spectrum?.molecularOrbitals ? {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(16, 42, 67, 0.95)',
      borderColor: 'rgba(108, 92, 231, 0.3)',
      textStyle: { color: '#D9E2EC' },
    },
    grid: {
      left: '15%',
      right: '10%',
      top: '10%',
      bottom: '10%',
    },
    xAxis: {
      type: 'category',
      data: spectrum.molecularOrbitals.map((_, i) => `MO ${i + 1}`),
      axisLine: { lineStyle: { color: 'rgba(108, 92, 231, 0.2)' } },
      axisLabel: { color: '#627D98', fontSize: 10, rotate: 45 },
    },
    yAxis: {
      type: 'value',
      name: '能量 (eV)',
      axisLine: { lineStyle: { color: 'rgba(108, 92, 231, 0.2)' } },
      axisLabel: { color: '#627D98', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(108, 92, 231, 0.08)' } },
      nameTextStyle: { color: '#829AB1', fontSize: 12 },
    },
    series: [{
      type: 'bar',
      data: spectrum.molecularOrbitals.map((mo, i) => ({
        value: mo.energy,
        itemStyle: {
          color: mo.occupancy > 0 
            ? { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#6C5CE7' }, { offset: 1, color: '#2C3EFF' }] }
            : { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#FDCB6E' }, { offset: 1, color: '#FF7675' }] },
        },
      })),
      barWidth: '60%',
    }],
  } : {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white mb-1">光谱分析</h1>
          <p className="text-dark-400">
            {task?.moleculeName} ({task?.formula}) - 谱图叠加与振动模式分析
          </p>
        </div>
        <button 
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent-500 to-primary-500 text-white font-medium hover:shadow-lg hover:shadow-accent-500/30 transition-all"
        >
          <Download className="w-4 h-4" />
          导出数据
        </button>
      </div>

      <div className="flex gap-2 p-1 bg-dark-800/50 rounded-xl w-fit">
        {(['IR', 'Raman', 'UV-Vis', 'NMR'] as SpectrumType[]).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={cn(
              "px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
              selectedType === type
                ? "bg-gradient-to-r from-accent-500 to-primary-500 text-white shadow-lg shadow-accent-500/30"
                : "text-dark-300 hover:text-white"
            )}
          >
            {SPECTRUM_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white">
              {SPECTRUM_TYPE_LABELS[selectedType]} - 谱图叠加
            </h3>
            {spectrum?.matchScore !== undefined && (
              <div className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium",
                spectrum.matchScore >= 80 
                  ? "bg-success-500/20 text-success-400" 
                  : "bg-warning-500/20 text-warning-400"
              )}>
                匹配度: {spectrum.matchScore}%
              </div>
            )}
          </div>
          <div className="h-80">
            {spectrum && <ReactECharts option={chartOption} style={{ height: '100%' }} />}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display font-semibold text-white mb-4">峰位归属</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin pr-2">
            {spectrum?.peaks.map((peak, i) => (
              <div 
                key={i}
                className={cn(
                  "p-3 rounded-xl border transition-all",
                  peak.isAbnormal 
                    ? "bg-danger-500/10 border-danger-500/30" 
                    : "bg-dark-800/30 border-accent-500/10 hover:border-accent-500/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{peak.position.toFixed(1)}</span>
                  <span className="text-xs text-dark-400">
                    {selectedType === 'NMR' ? 'ppm' : selectedType === 'UV-Vis' ? 'nm' : 'cm⁻¹'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-dark-400">{peak.assignment}</span>
                  <span className="text-xs text-accent-400">强度: {(peak.intensity * 100).toFixed(0)}%</span>
                </div>
                {peak.isAbnormal && (
                  <span className="inline-block mt-2 text-xs text-danger-400">
                    ⚠️ 异常振动模式
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {spectrum?.vibrationalModes && spectrum.vibrationalModes.length > 0 && (
        <div className="grid grid-cols-3 gap-5">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-display font-semibold text-white mb-4">振动模式动画</h3>
            <div className="aspect-square rounded-xl bg-dark-800/50 flex items-center justify-center mb-4">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent-500/20 to-primary-500/20 flex items-center justify-center animate-pulse-slow">
                  <Activity className="w-16 h-16 text-accent-400" />
                </div>
                <p className="text-dark-400 text-sm">3D 振动模式预览</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button className="p-2 rounded-lg bg-dark-800 text-dark-300 hover:text-white transition-colors">
                <SkipBack className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-3 rounded-xl bg-gradient-to-r from-accent-500 to-primary-500 text-white hover:shadow-lg hover:shadow-accent-500/30 transition-all"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              <button className="p-2 rounded-lg bg-dark-800 text-dark-300 hover:text-white transition-colors">
                <SkipForward className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="col-span-2 glass-card rounded-2xl p-6">
            <h3 className="font-display font-semibold text-white mb-4">振动模式列表</h3>
            <div className="grid grid-cols-2 gap-3">
              {spectrum.vibrationalModes.map((mode, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedMode(i)}
                  className={cn(
                    "p-4 rounded-xl cursor-pointer transition-all",
                    selectedMode === i
                      ? "bg-gradient-to-r from-accent-500/20 to-primary-500/20 border border-accent-500/50"
                      : "bg-dark-800/30 border border-transparent hover:border-accent-500/20"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">模式 {i + 1}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-dark-700 text-dark-300">
                      {mode.symmetry}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-dark-300">{mode.frequency.toFixed(1)} cm⁻¹</span>
                    <span className="text-accent-400">强度: {(mode.intensity * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {spectrum?.molecularOrbitals && spectrum.molecularOrbitals.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display font-semibold text-white mb-4">分子轨道贡献分析</h3>
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2 h-72">
              <ReactECharts option={orbitalOption} style={{ height: '100%' }} />
            </div>
            <div className="space-y-3">
              <p className="text-sm text-dark-400 mb-3">轨道组成分析</p>
              {spectrum.molecularOrbitals.slice(0, 5).map((mo, i) => (
                <div key={i} className="p-3 rounded-xl bg-dark-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">MO {mo.index}</span>
                    <span className="text-xs text-dark-400">{mo.energy.toFixed(2)} eV</span>
                  </div>
                  <div className="space-y-1">
                    {mo.contribution.map((c, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <span className="text-xs text-dark-400 w-8">{c.atom}</span>
                        <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-accent-500 to-primary-500 rounded-full"
                            style={{ width: `${c.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-dark-300 w-10 text-right">{c.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold text-white">导出光谱数据</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-3">导出格式</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setExportFormat('csv')}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all",
                      exportFormat === 'csv'
                        ? "bg-accent-500/20 border-accent-500/50"
                        : "bg-dark-800/30 border-transparent hover:border-accent-500/20"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        exportFormat === 'csv' ? "bg-accent-500/30" : "bg-dark-700"
                      )}>
                        <FileSpreadsheet className={cn(
                          "w-5 h-5",
                          exportFormat === 'csv' ? "text-accent-400" : "text-dark-400"
                        )} />
                      </div>
                      <div>
                        <p className={cn(
                          "text-sm font-medium",
                          exportFormat === 'csv' ? "text-white" : "text-dark-300"
                        )}>
                          CSV 格式
                        </p>
                        <p className="text-xs text-dark-500">适用于Excel等表格软件</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setExportFormat('json')}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all",
                      exportFormat === 'json'
                        ? "bg-accent-500/20 border-accent-500/50"
                        : "bg-dark-800/30 border-transparent hover:border-accent-500/20"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        exportFormat === 'json' ? "bg-accent-500/30" : "bg-dark-700"
                      )}>
                        <FileJson className={cn(
                          "w-5 h-5",
                          exportFormat === 'json' ? "text-accent-400" : "text-dark-400"
                        )} />
                      </div>
                      <div>
                        <p className={cn(
                          "text-sm font-medium",
                          exportFormat === 'json' ? "text-white" : "text-dark-300"
                        )}>
                          JSON 格式
                        </p>
                        <p className="text-xs text-dark-500">适用于程序读取和处理</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">波长范围（可选）</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-dark-400 mb-1 block">最小值</label>
                    <input
                      type="number"
                      value={exportRange.min}
                      onChange={(e) => setExportRange(prev => ({ ...prev, min: e.target.value }))}
                      placeholder="最小波数/波长"
                      className="w-full px-4 py-2.5 rounded-xl bg-dark-800/50 border border-accent-500/10 text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-500/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-dark-400 mb-1 block">最大值</label>
                    <input
                      type="number"
                      value={exportRange.max}
                      onChange={(e) => setExportRange(prev => ({ ...prev, max: e.target.value }))}
                      placeholder="最大波数/波长"
                      className="w-full px-4 py-2.5 rounded-xl bg-dark-800/50 border border-accent-500/10 text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-500/30 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 py-3 rounded-xl bg-dark-800/50 border border-accent-500/10 text-dark-300 hover:bg-dark-800 font-medium transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleExport}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-accent-500 to-primary-500 text-white font-medium hover:shadow-lg hover:shadow-accent-500/30 transition-all"
                >
                  确认导出
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
