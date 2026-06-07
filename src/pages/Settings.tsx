import { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Save,
  Bell,
  Palette,
  Cpu,
  Shield,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: '通用设置', icon: SettingsIcon },
    { id: 'notifications', label: '通知设置', icon: Bell },
    { id: 'appearance', label: '外观设置', icon: Palette },
    { id: 'compute', label: '计算配置', icon: Cpu },
    { id: 'security', label: '安全设置', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white mb-1">系统设置</h1>
        <p className="text-dark-400">配置平台参数和个人偏好</p>
      </div>

      <div className="grid grid-cols-5 gap-5">
        <div className="glass-card rounded-2xl p-4">
          <nav className="space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-accent-500/20 to-primary-500/10 text-white border-l-2 border-accent-500"
                      : "text-dark-300 hover:text-white hover:bg-dark-800/50"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="col-span-4 glass-card rounded-2xl p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-display font-semibold text-white">通用设置</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-dark-800/30">
                  <div>
                    <p className="text-white font-medium">语言</p>
                    <p className="text-sm text-dark-400">选择界面显示语言</p>
                  </div>
                  <select className="px-4 py-2 rounded-lg bg-dark-700 border border-accent-500/20 text-white focus:outline-none">
                    <option>简体中文</option>
                    <option>English</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-dark-800/30">
                  <div>
                    <p className="text-white font-medium">匹配度阈值</p>
                    <p className="text-sm text-dark-400">低于此值触发预警</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="number" defaultValue={80} className="w-20 px-4 py-2 rounded-lg bg-dark-700 border border-accent-500/20 text-white text-center focus:outline-none" />
                    <span className="text-dark-400">%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-dark-800/30">
                  <div>
                    <p className="text-white font-medium">默认泛函</p>
                    <p className="text-sm text-dark-400">新建任务时的默认选择</p>
                  </div>
                  <select className="px-4 py-2 rounded-lg bg-dark-700 border border-accent-500/20 text-white focus:outline-none">
                    <option>B3LYP</option>
                    <option>PBE0</option>
                    <option>M06-2X</option>
                    <option>ωB97XD</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-dark-800/30">
                  <div>
                    <p className="text-white font-medium">默认基组</p>
                    <p className="text-sm text-dark-400">新建任务时的默认选择</p>
                  </div>
                  <select className="px-4 py-2 rounded-lg bg-dark-700 border border-accent-500/20 text-white focus:outline-none">
                    <option>6-31G(d)</option>
                    <option>6-311G(d,p)</option>
                    <option>def2-SVP</option>
                    <option>def2-TZVP</option>
                  </select>
                </div>
              </div>

              <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-accent-500 to-primary-500 text-white font-medium hover:shadow-lg hover:shadow-accent-500/30 transition-all">
                <Save className="w-4 h-4" />
                保存设置
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-display font-semibold text-white">通知设置</h3>
              
              <div className="space-y-4">
                {[
                  { label: '任务完成通知', desc: '模拟任务完成时发送通知', default: true },
                  { label: '预警推送', desc: '匹配度低或异常时推送通知', default: true },
                  { label: '审批提醒', desc: '有待审批项时提醒', default: true },
                  { label: '每日统计报告', desc: '每日自动发送统计摘要', default: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-dark-800/30">
                    <div>
                      <p className="text-white font-medium">{item.label}</p>
                      <p className="text-sm text-dark-400">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={item.default} className="sr-only peer" />
                      <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'compute' && (
            <div className="space-y-6">
              <h3 className="text-lg font-display font-semibold text-white">计算配置</h3>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-dark-800/30">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white font-medium">计算资源配额</p>
                    <span className="text-sm text-accent-400">1000 核时 / 月</span>
                  </div>
                  <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-gradient-to-r from-accent-500 to-primary-500 rounded-full" />
                  </div>
                  <p className="text-xs text-dark-400 mt-2">已使用 750 核时，剩余 250 核时</p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-dark-800/30">
                  <div>
                    <p className="text-white font-medium">最大并行任务数</p>
                    <p className="text-sm text-dark-400">同时运行的最大任务数量</p>
                  </div>
                  <input type="number" defaultValue={4} className="w-20 px-4 py-2 rounded-lg bg-dark-700 border border-accent-500/20 text-white text-center focus:outline-none" />
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-r from-accent-500/10 to-primary-500/10 border border-accent-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-accent-500/20">
                      <Cpu className="w-5 h-5 text-accent-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">智能推荐引擎</p>
                      <p className="text-sm text-dark-400">基于历史数据自动优化计算参数</p>
                    </div>
                  </div>
                  <p className="text-xs text-dark-300 pl-14">
                    推荐引擎已学习 312 条历史记录，当前推荐置信度 92.3%
                  </p>
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'appearance' || activeTab === 'security') && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-dark-800/50 flex items-center justify-center">
                <ChevronRight className="w-10 h-10 text-dark-500" />
              </div>
              <p className="text-dark-400">该模块正在开发中</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
