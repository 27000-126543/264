import ReactECharts from 'echarts-for-react';
import { 
  TrendingUp, 
  Target, 
  Cpu, 
  Activity,
  Calendar
} from 'lucide-react';
import { useStore } from '../store/useStore';
import StatCard from '../components/StatCard';

export default function StatisticsDashboard() {
  const { dashboardStats, trendData, tasks, molecules } = useStore();

  const trendChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(16, 42, 67, 0.95)',
      borderColor: 'rgba(108, 92, 231, 0.3)',
      textStyle: { color: '#D9E2EC' },
    },
    legend: {
      data: ['完成任务数', '平均准确度', '资源消耗'],
      textStyle: { color: '#D9E2EC' },
      top: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: trendData.map(d => d.month),
      axisLine: { lineStyle: { color: 'rgba(108, 92, 231, 0.2)' } },
      axisLabel: { color: '#627D98', fontSize: 11 },
    },
    yAxis: [
      {
        type: 'value',
        name: '任务数/核时',
        axisLine: { lineStyle: { color: 'rgba(108, 92, 231, 0.2)' } },
        axisLabel: { color: '#627D98', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(108, 92, 231, 0.08)' } },
        nameTextStyle: { color: '#829AB1', fontSize: 12 },
      },
      {
        type: 'value',
        name: '准确度 (%)',
        min: 70,
        max: 100,
        axisLine: { lineStyle: { color: 'rgba(108, 92, 231, 0.2)' } },
        axisLabel: { color: '#627D98', fontSize: 11 },
        splitLine: { show: false },
        nameTextStyle: { color: '#829AB1', fontSize: 12 },
      },
    ],
    series: [
      {
        name: '完成任务数',
        type: 'bar',
        data: trendData.map(d => d.completed),
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: '#6C5CE7' }, { offset: 1, color: '#2C3EFF' }],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: '资源消耗',
        type: 'line',
        data: trendData.map(d => d.resourceUsage),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#FDCB6E', width: 2 },
        itemStyle: { color: '#FDCB6E' },
      },
      {
        name: '平均准确度',
        type: 'line',
        yAxisIndex: 1,
        data: trendData.map(d => d.accuracy),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#00B894', width: 2 },
        itemStyle: { color: '#00B894' },
      },
    ],
  };

  const boxPlotOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(16, 42, 67, 0.95)',
      borderColor: 'rgba(108, 92, 231, 0.3)',
      textStyle: { color: '#D9E2EC' },
    },
    grid: {
      left: '10%',
      right: '10%',
      top: '15%',
      bottom: '10%',
    },
    xAxis: {
      type: 'category',
      data: ['IR', 'Raman', 'UV-Vis', 'NMR'],
      axisLine: { lineStyle: { color: 'rgba(108, 92, 231, 0.2)' } },
      axisLabel: { color: '#627D98', fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      name: '匹配度 (%)',
      min: 60,
      max: 100,
      axisLine: { lineStyle: { color: 'rgba(108, 92, 231, 0.2)' } },
      axisLabel: { color: '#627D98', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(108, 92, 231, 0.08)' } },
      nameTextStyle: { color: '#829AB1', fontSize: 12 },
    },
    series: [{
      type: 'boxplot',
      data: [
        [72, 78, 85, 89, 95],
        [70, 76, 82, 87, 93],
        [68, 74, 80, 85, 92],
        [75, 80, 86, 90, 96],
      ],
      itemStyle: {
        color: 'rgba(108, 92, 231, 0.3)',
        borderColor: '#6C5CE7',
        borderWidth: 2,
      },
    }],
  };

  const taskDistributionOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(16, 42, 67, 0.95)',
      borderColor: 'rgba(108, 92, 231, 0.3)',
      textStyle: { color: '#D9E2EC' },
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: '#D9E2EC' },
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#0A2540',
        borderWidth: 3,
      },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#fff' },
      },
      labelLine: { show: false },
      data: [
        { value: tasks.filter(t => t.status === 'completed').length, name: '已完成', itemStyle: { color: '#00B894' } },
        { value: tasks.filter(t => t.status === 'calculating' || t.status === 'optimizing').length, name: '计算中', itemStyle: { color: '#6C5CE7' } },
        { value: tasks.filter(t => t.status === 'pending' || t.status === 'submitted').length, name: '等待中', itemStyle: { color: '#FDCB6E' } },
        { value: tasks.filter(t => t.status === 'rollback' || t.status === 'error').length, name: '异常', itemStyle: { color: '#FF7675' } },
        { value: tasks.filter(t => t.status === 'comparing').length, name: '比对中', itemStyle: { color: '#3B82F6' } },
      ],
    }],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white mb-1">统计看板</h1>
        <p className="text-dark-400">系统运行状态与性能指标监控</p>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <StatCard
          title="模拟完成率"
          value={`${dashboardStats.completionRate}%`}
          icon={Target}
          trend={5.2}
          trendLabel="较上月提升"
          gradient="bg-accent-500"
        />
        <StatCard
          title="预测准确度"
          value={`${dashboardStats.averageAccuracy}%`}
          icon={TrendingUp}
          trend={2.1}
          trendLabel="较上月提升"
          gradient="bg-success-500"
        />
        <StatCard
          title="资源消耗"
          value={`${dashboardStats.totalResources} 核时`}
          icon={Cpu}
          gradient="bg-warning-500"
        />
        <StatCard
          title="活跃分子"
          value={molecules.filter(m => !m.isPaused).length}
          icon={Activity}
          gradient="bg-primary-500"
        />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 glass-card rounded-2xl p-6">
          <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent-400" />
            月度性能趋势
          </h3>
          <div className="h-80">
            <ReactECharts option={trendChartOption} style={{ height: '100%' }} />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display font-semibold text-white mb-4">任务状态分布</h3>
          <div className="h-80">
            <ReactECharts option={taskDistributionOption} style={{ height: '100%' }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display font-semibold text-white mb-4">光谱类型准确度对比</h3>
          <div className="h-72">
            <ReactECharts option={boxPlotOption} style={{ height: '100%' }} />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display font-semibold text-white mb-4">计算资源使用排行</h3>
          <div className="space-y-4">
            {[
              { name: '苯胺', usage: 320, percent: 85 },
              { name: '苯酚', usage: 280, percent: 75 },
              { name: '苯', usage: 240, percent: 64 },
              { name: '乙酸', usage: 180, percent: 48 },
              { name: '乙醇', usage: 150, percent: 40 },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-16 text-sm text-white font-medium">{item.name}</span>
                <div className="flex-1">
                  <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-accent-500 to-primary-500 rounded-full transition-all duration-1000"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
                <span className="w-20 text-right text-sm text-dark-300">{item.usage} 核时</span>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t border-accent-500/10">
            <h4 className="text-sm font-medium text-white mb-3">最近7天资源趋势</h4>
            <div className="flex items-end gap-1 h-24">
              {[40, 65, 55, 80, 70, 90, 75].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-accent-500/50 to-primary-500/50 rounded-t-md transition-all hover:from-accent-500 hover:to-primary-500"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-dark-500">
              <span>周一</span>
              <span>周二</span>
              <span>周三</span>
              <span>周四</span>
              <span>周五</span>
              <span>周六</span>
              <span>周日</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
