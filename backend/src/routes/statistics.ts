import { Router, Request, Response } from 'express';
import {
  getTaskRepository,
  getMoleculeRepository,
  getWarningRepository,
  getSpectrumRepository,
  SimulationTask,
} from '../services/dataStore';
import { Parser } from 'json2csv';

const router = Router();

router.get('/overview', async (req: Request, res: Response) => {
  try {
    const taskRepo = getTaskRepository();
    const moleculeRepo = getMoleculeRepository();
    const warningRepo = getWarningRepository();

    const allTasks = await taskRepo.find();
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const activeTasks = allTasks.filter(t =>
      ['optimizing', 'calculating', 'comparing', 'submitted'].includes(t.status)
    ).length;
    const errorTasks = allTasks.filter(t => t.status === 'error').length;

    const allMolecules = await moleculeRepo.find();
    const totalMolecules = allMolecules.length;
    const pausedMolecules = allMolecules.filter(m => m.isPaused).length;

    const allWarnings = await warningRepo.find();
    const pendingWarnings = allWarnings.filter(w => !w.reviewed).length;

    const completedWithScore = allTasks.filter(
      t => t.status === 'completed' && t.matchScore !== null && t.matchScore !== undefined
    );
    const avgMatchScore = completedWithScore.length > 0
      ? completedWithScore.reduce((sum, t) => sum + (t.matchScore || 0), 0) / completedWithScore.length
      : 0;

    res.json({
      totalTasks,
      completedTasks,
      activeTasks,
      errorTasks,
      totalMolecules,
      pausedMolecules,
      pendingWarnings,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      averageMatchScore: Math.round(avgMatchScore),
    });
  } catch (error) {
    console.error('获取统计概览失败:', error);
    res.status(500).json({ error: '获取统计概览失败' });
  }
});

router.get('/trends', async (req: Request, res: Response) => {
  try {
    const taskRepo = getTaskRepository();
    const allTasks = await taskRepo.find();

    const months: string[] = [];
    const completionRates: number[] = [];
    const matchScores: number[] = [];
    const taskCounts: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const monthLabel = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const monthTasks = allTasks.filter(t =>
        t.createdAt >= monthStart && t.createdAt <= monthEnd
      );

      const completed = monthTasks.filter(t => t.status === 'completed').length;
      const scoredTasks = monthTasks.filter(t => t.matchScore !== null && t.matchScore !== undefined);
      const avgScore = scoredTasks.length > 0
        ? scoredTasks.reduce((sum, t) => sum + (t.matchScore || 0), 0) / scoredTasks.length
        : 0;

      months.push(monthLabel);
      taskCounts.push(monthTasks.length);
      completionRates.push(monthTasks.length > 0 ? Math.round((completed / monthTasks.length) * 100) : 0);
      matchScores.push(Math.round(avgScore));
    }

    res.json({
      months,
      completionRates,
      matchScores,
      taskCounts,
    });
  } catch (error) {
    console.error('获取趋势数据失败:', error);
    res.status(500).json({ error: '获取趋势数据失败' });
  }
});

router.get('/task-distribution', async (req: Request, res: Response) => {
  try {
    const taskRepo = getTaskRepository();
    const allTasks = await taskRepo.find();

    const statuses: Record<string, string> = {
      pending: '待提交',
      submitted: '已提交',
      optimizing: '结构优化',
      calculating: '光谱计算',
      comparing: '谱图比对',
      completed: '已完成',
      error: '异常',
      rollback: '回退中',
    };

    const distribution: { status: string; label: string; count: number }[] = [];

    for (const [status, label] of Object.entries(statuses)) {
      const count = allTasks.filter(t => t.status === status).length;
      distribution.push({ status, label, count });
    }

    res.json(distribution);
  } catch (error) {
    console.error('获取任务分布失败:', error);
    res.status(500).json({ error: '获取任务分布失败' });
  }
});

router.get('/spectrum-accuracy', async (req: Request, res: Response) => {
  try {
    const spectrumRepo = getSpectrumRepository();
    const allSpectra = await spectrumRepo.find();

    const spectrumTypes = ['IR', 'Raman', 'UV-Vis', 'NMR'];
    const result: { type: string; label: string; scores: number[]; average: number }[] = [];

    for (const type of spectrumTypes) {
      const spectra = allSpectra.filter(
        s => s.type === type && s.matchScore !== null && s.matchScore !== undefined
      );

      const scores = spectra.map(s => s.matchScore!);
      const average = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

      const labels: Record<string, string> = {
        'IR': '红外光谱',
        'Raman': '拉曼光谱',
        'UV-Vis': '紫外-可见',
        'NMR': '核磁共振',
      };

      result.push({
        type,
        label: labels[type] || type,
        scores: scores.slice(0, 20),
        average,
      });
    }

    res.json(result);
  } catch (error) {
    console.error('获取光谱准确度失败:', error);
    res.status(500).json({ error: '获取光谱准确度失败' });
  }
});

router.get('/export/monthly/:month', async (req: Request, res: Response) => {
  try {
    const taskRepo = getTaskRepository();
    const { month } = req.params;
    const { format = 'csv' } = req.query;

    const [year, monthNum] = month.split('-').map(Number);
    const monthStart = new Date(year, monthNum - 1, 1).toISOString();
    const monthEnd = new Date(year, monthNum, 0, 23, 59, 59).toISOString();

    const allTasks = await taskRepo.find();
    const tasks = allTasks.filter(t =>
      t.createdAt >= monthStart && t.createdAt <= monthEnd
    );

    const exportData = tasks.map(task => ({
      任务ID: task.id,
      分子名称: task.moleculeName,
      分子式: task.formula,
      状态: task.status,
      进度: `${task.progress}%`,
      匹配度: task.matchScore ? `${task.matchScore}%` : '-',
      创建时间: task.createdAt,
      完成时间: task.completedAt || '-',
      重试次数: task.retryCount,
      创建人: task.createdBy,
    }));

    if (format === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(exportData);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="monthly_report_${month}.csv"`);
      res.send('\ufeff' + csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="monthly_report_${month}.json"`);
      res.json(exportData);
    }
  } catch (error) {
    console.error('导出月度报告失败:', error);
    res.status(500).json({ error: '导出月度报告失败' });
  }
});

router.get('/warnings', async (req: Request, res: Response) => {
  try {
    const warningRepo = getWarningRepository();

    const allWarnings = await warningRepo.find({
      order: { createdAt: 'DESC' },
    } as any);

    const warnings = allWarnings.slice(0, 20);

    const stats = {
      total: allWarnings.length,
      low: allWarnings.filter(w => w.severity === 'low').length,
      medium: allWarnings.filter(w => w.severity === 'medium').length,
      high: allWarnings.filter(w => w.severity === 'high').length,
      reviewed: allWarnings.filter(w => w.reviewed).length,
      unreviewed: allWarnings.filter(w => !w.reviewed).length,
    };

    res.json({ warnings, stats });
  } catch (error) {
    console.error('获取预警统计失败:', error);
    res.status(500).json({ error: '获取预警统计失败' });
  }
});

export default router;
