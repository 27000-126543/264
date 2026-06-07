import { Router, Request, Response } from 'express';
import {
  getTaskRepository,
  getEnergyPointRepository,
  getAdjustmentLogRepository,
  getWarningRepository,
  getMoleculeRepository,
  SimulationTask,
  EnergyPoint,
  AdjustmentLog,
  Warning,
  uuidv4,
} from '../services/dataStore';
import { sendTaskUpdate } from '../services/websocketService';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const taskRepo = getTaskRepository();
    const warningRepo = getWarningRepository();
    const { status, moleculeId, search } = req.query;

    let tasks = await taskRepo.find({
      order: { createdAt: 'DESC' },
    });

    if (status) {
      tasks = tasks.filter(t => t.status === status);
    }

    if (moleculeId) {
      tasks = tasks.filter(t => t.moleculeId === moleculeId);
    }

    if (search) {
      const searchLower = String(search).toLowerCase();
      tasks = tasks.filter(t =>
        t.moleculeName.toLowerCase().includes(searchLower) ||
        t.formula.toLowerCase().includes(searchLower)
      );
    }

    const tasksWithWarnings = [];
    for (const task of tasks) {
      const warnings = await warningRepo.find({ where: { taskId: task.id } });
      tasksWithWarnings.push({ ...task, warnings });
    }

    res.json(tasksWithWarnings);
  } catch (error) {
    console.error('获取任务列表失败:', error);
    res.status(500).json({ error: '获取任务列表失败' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const taskRepo = getTaskRepository();
    const warningRepo = getWarningRepository();
    const adjustmentRepo = getAdjustmentLogRepository();
    const energyRepo = getEnergyPointRepository();

    const task = await taskRepo.findOne({ where: { id: req.params.id } });

    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    const warnings = await warningRepo.find({ where: { taskId: task.id } });
    const adjustmentLogs = await adjustmentRepo.find({ where: { taskId: task.id } });
    const energyPoints = await energyRepo.find({ where: { taskId: task.id }, order: { step: 'ASC' } });

    res.json({
      ...task,
      warnings,
      adjustmentLogs,
      energyPoints,
    });
  } catch (error) {
    console.error('获取任务详情失败:', error);
    res.status(500).json({ error: '获取任务详情失败' });
  }
});

router.get('/:id/energy-points', async (req: Request, res: Response) => {
  try {
    const energyRepo = getEnergyPointRepository();
    const points = await energyRepo.find({
      where: { taskId: req.params.id },
      order: { step: 'ASC' },
    });

    res.json(points);
  } catch (error) {
    console.error('获取能量收敛数据失败:', error);
    res.status(500).json({ error: '获取能量收敛数据失败' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const taskRepo = getTaskRepository();
    const moleculeRepo = getMoleculeRepository();

    const { moleculeId, parameters, spectrumTypes, createdBy } = req.body;

    if (!moleculeId || !parameters || !spectrumTypes) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const molecule = await moleculeRepo.findOne({ where: { id: moleculeId } });
    if (!molecule) {
      return res.status(404).json({ error: '分子不存在' });
    }

    if (molecule.isPaused) {
      return res.status(400).json({ error: '该分子已被暂停，无法提交新任务' });
    }

    const task: SimulationTask = {
      id: `task-${uuidv4()}`,
      moleculeId,
      moleculeName: molecule.name,
      formula: molecule.formula,
      status: 'submitted',
      progress: 5,
      parameters: JSON.stringify(parameters),
      spectrumTypes: JSON.stringify(spectrumTypes),
      createdBy: createdBy || 'system',
      retryCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: JSON.stringify([
        { status: 'pending', timestamp: new Date().toISOString() },
        { status: 'submitted', timestamp: new Date().toISOString() },
      ]),
    };

    await taskRepo.save(task);

    sendTaskUpdate({
      taskId: task.id,
      status: task.status,
      progress: task.progress,
      moleculeName: task.moleculeName,
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('创建任务失败:', error);
    res.status(500).json({ error: '创建任务失败' });
  }
});

router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const taskRepo = getTaskRepository();
    const task = await taskRepo.findOne({ where: { id: req.params.id } });

    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    const { status, progress } = req.body;

    if (status) {
      task.status = status;

      const statusHistory = task.statusHistory ? JSON.parse(task.statusHistory) : [];
      if (!statusHistory.some((s: any) => s.status === status)) {
        statusHistory.push({ status, timestamp: new Date().toISOString() });
        task.statusHistory = JSON.stringify(statusHistory);
      }

      if (status === 'completed') {
        task.completedAt = new Date().toISOString();
        task.progress = 100;
      }
    }

    if (progress !== undefined) {
      task.progress = progress;
    }

    await taskRepo.save(task);

    sendTaskUpdate({
      taskId: task.id,
      status: task.status,
      progress: task.progress,
      moleculeName: task.moleculeName,
    });

    res.json(task);
  } catch (error) {
    console.error('更新任务状态失败:', error);
    res.status(500).json({ error: '更新任务状态失败' });
  }
});

router.post('/:id/adjust-parameters', async (req: Request, res: Response) => {
  try {
    const taskRepo = getTaskRepository();
    const adjustmentRepo = getAdjustmentLogRepository();

    const task = await taskRepo.findOne({ where: { id: req.params.id } });
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    const { newParameters, reason, adjustedBy } = req.body;
    if (!newParameters || !reason) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const oldParameters = task.parameters;
    task.parameters = JSON.stringify(newParameters);
    task.status = 'optimizing';
    task.progress = 0;
    task.retryCount += 1;

    const statusHistory = task.statusHistory ? JSON.parse(task.statusHistory) : [];
    statusHistory.push({ status: 'rollback', timestamp: new Date().toISOString() });
    statusHistory.push({ status: 'optimizing', timestamp: new Date().toISOString() });
    task.statusHistory = JSON.stringify(statusHistory);

    await taskRepo.save(task);

    const adjustmentLog: AdjustmentLog = {
      id: `adj-${uuidv4()}`,
      taskId: task.id,
      adjustedBy: adjustedBy || 'system',
      oldParameters,
      newParameters: JSON.stringify(newParameters),
      reason,
      timestamp: new Date().toISOString(),
    };
    await adjustmentRepo.save(adjustmentLog);

    sendTaskUpdate({
      taskId: task.id,
      status: task.status,
      progress: task.progress,
      moleculeName: task.moleculeName,
    });

    res.json({ task, adjustmentLog });
  } catch (error) {
    console.error('调整参数失败:', error);
    res.status(500).json({ error: '调整参数失败' });
  }
});

router.post('/:id/warnings/:warningId/review', async (req: Request, res: Response) => {
  try {
    const warningRepo = getWarningRepository();
    const warning = await warningRepo.findOne({ where: { id: req.params.warningId } });

    if (!warning) {
      return res.status(404).json({ error: '预警不存在' });
    }

    const { reviewedBy } = req.body;
    warning.reviewed = true;
    warning.reviewedBy = reviewedBy || 'system';
    warning.reviewedAt = new Date().toISOString();

    await warningRepo.save(warning);
    res.json(warning);
  } catch (error) {
    console.error('复核预警失败:', error);
    res.status(500).json({ error: '复核预警失败' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const taskRepo = getTaskRepository();
    const result = await taskRepo.delete(req.params.id);

    if (result.affected === 0) {
      return res.status(404).json({ error: '任务不存在' });
    }

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除任务失败:', error);
    res.status(500).json({ error: '删除任务失败' });
  }
});

export default router;
