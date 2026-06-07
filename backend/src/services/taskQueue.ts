import cron from 'node-cron';
import {
  getTaskRepository,
  getEnergyPointRepository,
  getSpectrumRepository,
  getWarningRepository,
  getMoleculeRepository,
  getAdjustmentLogRepository,
  SimulationTask,
  EnergyPoint,
  Warning,
  SpectrumData,
} from './dataStore';
import { generateSpectrum, generateEnergyConvergence } from './spectrumSimulator';
import { sendWarning, sendTaskUpdate } from './websocketService';
import { v4 as uuidv4 } from 'uuid';

type TaskStatus = 'pending' | 'submitted' | 'optimizing' | 'calculating' | 'comparing' | 'completed' | 'error' | 'rollback';

const STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus> = {
  pending: 'submitted',
  submitted: 'optimizing',
  optimizing: 'calculating',
  calculating: 'comparing',
  comparing: 'completed',
  completed: 'completed',
  error: 'rollback',
  rollback: 'optimizing',
};

const PROGRESS_MAP: Record<TaskStatus, number> = {
  pending: 0,
  submitted: 5,
  optimizing: 50,
  calculating: 85,
  comparing: 95,
  completed: 100,
  error: 0,
  rollback: 10,
};

export const processTask = async (task: SimulationTask): Promise<void> => {
  const taskRepo = getTaskRepository();
  const energyRepo = getEnergyPointRepository();
  const spectrumRepo = getSpectrumRepository();
  const warningRepo = getWarningRepository();
  const moleculeRepo = getMoleculeRepository();

  const nextStatus = STATUS_TRANSITIONS[task.status];
  const nextProgress = PROGRESS_MAP[nextStatus];

  console.log(`🔄 处理任务: ${task.id} [${task.moleculeName}] ${task.status} -> ${nextStatus}`);

  if (task.status === 'optimizing') {
    const existingPoints = await energyRepo.count({ where: { taskId: task.id } });
    if (existingPoints === 0) {
      const startEnergy = -750 - Math.random() * 50;
      const energyPoints = generateEnergyConvergence(startEnergy, 15);
      
      for (let i = 0; i < energyPoints.length; i++) {
        const point: EnergyPoint = {
          id: 0,
          taskId: task.id,
          step: i + 1,
          energy: energyPoints[i].energy,
          converged: energyPoints[i].converged,
        };
        await energyRepo.save(point);
      }
      console.log(`⚡ 生成能量收敛数据: ${task.id} (15个点)`);
    }
  }

  if (task.status === 'calculating') {
    const existingSpectra = await spectrumRepo.count({ where: { taskId: task.id } });
    if (existingSpectra === 0) {
      const spectrumTypes: string[] = JSON.parse(task.spectrumTypes);
      let totalMatchScore = 0;

      for (const type of spectrumTypes) {
        const spectrum = generateSpectrum(type as any, task.formula);
        totalMatchScore += spectrum.matchScore;

        const spectrumData: SpectrumData = {
          id: `spec-${uuidv4()}`,
          taskId: task.id,
          type: type as any,
          xAxis: JSON.stringify(spectrum.xAxis),
          yAxis: JSON.stringify(spectrum.yAxis),
          peaks: JSON.stringify(spectrum.peaks),
          matchScore: spectrum.matchScore,
          vibrationalModes: spectrum.vibrationalModes ? JSON.stringify(spectrum.vibrationalModes) : undefined,
          molecularOrbitals: spectrum.molecularOrbitals ? JSON.stringify(spectrum.molecularOrbitals) : undefined,
          createdAt: new Date().toISOString(),
        };
        await spectrumRepo.save(spectrumData);

        const hasAbnormalMode = spectrum.peaks.some(p => (p as any).isAbnormal);
        if (hasAbnormalMode) {
          const warning: Warning = {
            id: `warn-${uuidv4()}`,
            taskId: task.id,
            type: 'abnormal_mode',
            severity: 'medium',
            message: `检测到异常振动模式 (${type})`,
            reviewed: false,
            createdAt: new Date().toISOString(),
          };
          await warningRepo.save(warning);

          sendWarning({
            taskId: task.id,
            moleculeName: task.moleculeName,
            type: 'abnormal_mode',
            severity: 'medium',
            message: `检测到异常振动模式 (${type})`,
          });
        }
      }

      const avgMatchScore = Math.round(totalMatchScore / spectrumTypes.length);
      task.matchScore = avgMatchScore;

      const threshold = parseInt(process.env.MATCH_SCORE_THRESHOLD || '80');
      if (avgMatchScore < threshold) {
        const warning: Warning = {
          id: `warn-${uuidv4()}`,
          taskId: task.id,
          type: 'low_match',
          severity: avgMatchScore < 70 ? 'high' : 'medium',
          message: `匹配度 ${avgMatchScore}% 低于阈值 ${threshold}%`,
          reviewed: false,
          createdAt: new Date().toISOString(),
        };
        await warningRepo.save(warning);

        sendWarning({
          taskId: task.id,
          moleculeName: task.moleculeName,
          type: 'low_match',
          severity: avgMatchScore < 70 ? 'high' : 'medium',
          message: `匹配度 ${avgMatchScore}% 低于阈值 ${threshold}%`,
        });

        const molecule = await moleculeRepo.findOne({ where: { id: task.moleculeId } });
        if (molecule) {
          molecule.lowMatchCount += 1;
          if (molecule.lowMatchCount >= 3) {
            molecule.isPaused = true;
            console.log(`⚠️  分子已暂停: ${molecule.name} (连续3次低匹配度)`);
          }
          await moleculeRepo.save(molecule);
        }
      }

      console.log(`📊 生成光谱数据: ${task.id} (${spectrumTypes.join(', ')}), 平均匹配度: ${avgMatchScore}%`);
    }
  }

  task.status = nextStatus;
  task.progress = nextProgress;
  
  const statusHistory = task.statusHistory ? JSON.parse(task.statusHistory) : [];
  statusHistory.push({ status: nextStatus, timestamp: new Date().toISOString() });
  task.statusHistory = JSON.stringify(statusHistory);

  if (nextStatus === 'completed') {
    task.completedAt = new Date().toISOString();
  }

  if (task.status === 'rollback' && nextStatus === 'optimizing') {
    task.retryCount += 1;
  }

  await taskRepo.save(task);

  sendTaskUpdate({
    taskId: task.id,
    status: nextStatus,
    progress: nextProgress,
    moleculeName: task.moleculeName,
  });
};

export const processPendingTasks = async (): Promise<void> => {
  try {
    const taskRepo = getTaskRepository();
    const moleculeRepo = getMoleculeRepository();
    
    const activeTasks = await taskRepo.find({
      where: [
        { status: 'pending' },
        { status: 'submitted' },
        { status: 'optimizing' },
        { status: 'calculating' },
        { status: 'comparing' },
        { status: 'rollback' },
      ],
      order: { createdAt: 'ASC' },
    });

    if (activeTasks.length === 0) {
      return;
    }

    console.log(`📋 待处理任务数: ${activeTasks.length}`);

    for (const task of activeTasks) {
      try {
        const molecule = await moleculeRepo.findOne({ where: { id: task.moleculeId } });

        if (molecule?.isPaused && task.status === 'pending') {
          console.log(`⏸️  跳过已暂停分子的任务: ${task.id} (${molecule.name})`);
          continue;
        }

        await processTask(task);
      } catch (error) {
        console.error(`❌ 处理任务失败 ${task.id}:`, error);
        task.status = 'error';
        await taskRepo.save(task);
      }
    }
  } catch (error) {
    console.error('❌ 任务队列处理失败:', error);
  }
};

export const startTaskScheduler = (): void => {
  const interval = process.env.TASK_PROCESS_INTERVAL || '30000';
  const seconds = Math.max(1, Math.round(parseInt(interval) / 1000));
  const cronExpression = `*/${seconds} * * * * *`;

  console.log(`⏰ 任务调度器已启动, 每 ${seconds} 秒执行一次`);

  cron.schedule(cronExpression, () => {
    void processPendingTasks();
  });
};
