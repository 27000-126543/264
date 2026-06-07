import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface Molecule {
  id: string;
  name: string;
  formula: string;
  smiles: string;
  molecularWeight: number;
  xyzData?: string;
  conformers?: string;
  createdAt: string;
  createdBy: string;
  isPaused: boolean;
  lowMatchCount: number;
}

export interface EnergyPoint {
  id: number;
  step: number;
  energy: number;
  converged: boolean;
  taskId: string;
}

export interface AdjustmentLog {
  id: string;
  timestamp: string;
  adjustedBy: string;
  oldParameters: string;
  newParameters: string;
  reason: string;
  taskId: string;
}

export interface Warning {
  id: string;
  type: 'low_match' | 'abnormal_mode' | 'convergence_issue';
  severity: 'low' | 'medium' | 'high';
  message: string;
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  taskId: string;
}

export interface SimulationTask {
  id: string;
  moleculeId: string;
  moleculeName: string;
  formula: string;
  status: 'pending' | 'submitted' | 'optimizing' | 'calculating' | 'comparing' | 'completed' | 'error' | 'rollback';
  statusHistory?: string;
  parameters: string;
  spectrumTypes: string;
  progress: number;
  matchScore?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  createdBy: string;
  retryCount: number;
}

export interface SpectrumData {
  id: string;
  taskId: string;
  type: 'IR' | 'Raman' | 'UV-Vis' | 'NMR';
  xAxis: string;
  yAxis: string;
  peaks?: string;
  experimentalData?: string;
  matchScore?: number;
  vibrationalModes?: string;
  molecularOrbitals?: string;
  createdAt: string;
}

export interface ApprovalRecord {
  id: string;
  taskId: string;
  level: 'primary' | 'final';
  status: 'pending' | 'approved' | 'rejected';
  reviewer: string;
  comments: string;
  createdAt: string;
  reviewedAt?: string;
  nextApprover?: string;
}

interface Database {
  molecules: Molecule[];
  tasks: SimulationTask[];
  energyPoints: EnergyPoint[];
  adjustmentLogs: AdjustmentLog[];
  warnings: Warning[];
  spectrumData: SpectrumData[];
  approvalRecords: ApprovalRecord[];
}

const DB_PATH = path.resolve(__dirname, '../../data/db.json');
let db: Database;
let energyPointCounter = 1;

const defaultDB: Database = {
  molecules: [],
  tasks: [],
  energyPoints: [],
  adjustmentLogs: [],
  warnings: [],
  spectrumData: [],
  approvalRecords: [],
};

export const initDataStore = async (): Promise<void> => {
  try {
    const dbDir = path.dirname(DB_PATH);
    await fs.ensureDir(dbDir);
    
    if (await fs.pathExists(DB_PATH)) {
      const data = await fs.readJSON(DB_PATH);
      db = { ...defaultDB, ...data };
    } else {
      db = { ...defaultDB };
      await saveDB();
    }
    
    if (db.energyPoints.length > 0) {
      energyPointCounter = Math.max(...db.energyPoints.map(p => p.id)) + 1;
    }
    
    console.log('✅ 数据存储初始化成功');
  } catch (error) {
    console.error('❌ 数据存储初始化失败:', error);
    db = { ...defaultDB };
  }
};

const saveDB = async (): Promise<void> => {
  await fs.writeJSON(DB_PATH, db, { spaces: 2 });
};

export const getMoleculeRepository = () => ({
  find: async (options?: { where?: any; order?: any }): Promise<Molecule[]> => {
    let result = [...db.molecules];
    if (options?.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        result = result.filter(m => (m as any)[key] === value);
      });
    }
    if (options?.order) {
      const [sortKey, sortDir] = Object.entries(options.order)[0];
      result.sort((a, b) => {
        const aVal = (a as any)[sortKey];
        const bVal = (b as any)[sortKey];
        return sortDir === 'DESC' ? bVal.localeCompare?.(aVal) || bVal - aVal : aVal.localeCompare?.(bVal) || aVal - bVal;
      });
    }
    return result;
  },
  findOne: async (options: { where: any }): Promise<Molecule | null> => {
    return db.molecules.find(m => {
      return Object.entries(options.where).every(([key, value]) => (m as any)[key] === value);
    }) || null;
  },
  save: async (molecule: Molecule): Promise<Molecule> => {
    const idx = db.molecules.findIndex(m => m.id === molecule.id);
    if (idx >= 0) {
      db.molecules[idx] = molecule;
    } else {
      db.molecules.push(molecule);
    }
    await saveDB();
    return molecule;
  },
  delete: async (id: string): Promise<{ affected: number }> => {
    const idx = db.molecules.findIndex(m => m.id === id);
    if (idx >= 0) {
      db.molecules.splice(idx, 1);
      await saveDB();
      return { affected: 1 };
    }
    return { affected: 0 };
  },
  count: async (options?: { where?: any }): Promise<number> => {
    let result = [...db.molecules];
    if (options?.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        result = result.filter(m => (m as any)[key] === value);
      });
    }
    return result.length;
  },
  createQueryBuilder: () => createQueryBuilder<Molecule>('molecule', db.molecules),
});

export const getTaskRepository = () => ({
  find: async (options?: { where?: any; order?: any; relations?: string[] }): Promise<SimulationTask[]> => {
    let result = [...db.tasks];
    if (options?.where) {
      if (Array.isArray(options.where)) {
        result = result.filter(t => options.where!.some((w: any) => 
          Object.entries(w).every(([key, value]) => (t as any)[key] === value)
        ));
      } else {
        Object.entries(options.where).forEach(([key, value]) => {
          result = result.filter(m => (m as any)[key] === value);
        });
      }
    }
    if (options?.order) {
      const [sortKey, sortDir] = Object.entries(options.order)[0];
      result.sort((a, b) => {
        const aVal = (a as any)[sortKey];
        const bVal = (b as any)[sortKey];
        return sortDir === 'DESC' ? bVal.localeCompare?.(aVal) || bVal - aVal : aVal.localeCompare?.(bVal) || aVal - bVal;
      });
    }
    return result;
  },
  findOne: async (options: { where: any; relations?: string[] }): Promise<SimulationTask | null> => {
    return db.tasks.find(t => {
      return Object.entries(options.where).every(([key, value]) => (t as any)[key] === value);
    }) || null;
  },
  save: async (task: SimulationTask): Promise<SimulationTask> => {
    task.updatedAt = new Date().toISOString();
    const idx = db.tasks.findIndex(t => t.id === task.id);
    if (idx >= 0) {
      db.tasks[idx] = task;
    } else {
      db.tasks.push(task);
    }
    await saveDB();
    return task;
  },
  delete: async (id: string): Promise<{ affected: number }> => {
    const idx = db.tasks.findIndex(t => t.id === id);
    if (idx >= 0) {
      db.tasks.splice(idx, 1);
      db.energyPoints = db.energyPoints.filter(p => p.taskId !== id);
      db.warnings = db.warnings.filter(w => w.taskId !== id);
      db.adjustmentLogs = db.adjustmentLogs.filter(l => l.taskId !== id);
      db.spectrumData = db.spectrumData.filter(s => s.taskId !== id);
      db.approvalRecords = db.approvalRecords.filter(a => a.taskId !== id);
      await saveDB();
      return { affected: 1 };
    }
    return { affected: 0 };
  },
  count: async (options?: { where?: any }): Promise<number> => {
    let result = [...db.tasks];
    if (options?.where) {
      if (Array.isArray(options.where)) {
        result = result.filter(t => options.where!.some((w: any) => 
          Object.entries(w).every(([key, value]) => (t as any)[key] === value)
        ));
      } else {
        Object.entries(options.where).forEach(([key, value]) => {
          result = result.filter(m => (m as any)[key] === value);
        });
      }
    }
    return result.length;
  },
  createQueryBuilder: () => createQueryBuilder<SimulationTask>('task', db.tasks),
});

export const getEnergyPointRepository = () => ({
  find: async (options?: { where?: any; order?: any }): Promise<EnergyPoint[]> => {
    let result = [...db.energyPoints];
    if (options?.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        result = result.filter(m => (m as any)[key] === value);
      });
    }
    if (options?.order) {
      const [sortKey, sortDir] = Object.entries(options.order)[0];
      result.sort((a, b) => {
        const aVal = (a as any)[sortKey];
        const bVal = (b as any)[sortKey];
        return sortDir === 'DESC' ? bVal - aVal : aVal - bVal;
      });
    }
    return result;
  },
  save: async (point: EnergyPoint): Promise<EnergyPoint> => {
    if (!point.id) {
      point.id = energyPointCounter++;
    }
    const idx = db.energyPoints.findIndex(p => p.id === point.id);
    if (idx >= 0) {
      db.energyPoints[idx] = point;
    } else {
      db.energyPoints.push(point);
    }
    await saveDB();
    return point;
  },
  count: async (options?: { where?: any }): Promise<number> => {
    let result = [...db.energyPoints];
    if (options?.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        result = result.filter(m => (m as any)[key] === value);
      });
    }
    return result.length;
  },
});

export const getWarningRepository = () => ({
  find: async (options?: { where?: any; order?: any; take?: number }): Promise<Warning[]> => {
    let result = [...db.warnings];
    if (options?.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        result = result.filter(m => (m as any)[key] === value);
      });
    }
    if (options?.order) {
      const [sortKey, sortDir] = Object.entries(options.order)[0];
      result.sort((a, b) => {
        const aVal = (a as any)[sortKey];
        const bVal = (b as any)[sortKey];
        return sortDir === 'DESC' ? bVal.localeCompare?.(aVal) : aVal.localeCompare?.(bVal);
      });
    }
    if (options?.take) {
      result = result.slice(0, options.take);
    }
    return result;
  },
  findOne: async (options: { where: any }): Promise<Warning | null> => {
    return db.warnings.find(w => {
      return Object.entries(options.where).every(([key, value]) => (w as any)[key] === value);
    }) || null;
  },
  save: async (warning: Warning): Promise<Warning> => {
    const idx = db.warnings.findIndex(w => w.id === warning.id);
    if (idx >= 0) {
      db.warnings[idx] = warning;
    } else {
      db.warnings.push(warning);
    }
    await saveDB();
    return warning;
  },
  count: async (options?: { where?: any }): Promise<number> => {
    let result = [...db.warnings];
    if (options?.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        result = result.filter(m => (m as any)[key] === value);
      });
    }
    return result.length;
  },
});

export const getAdjustmentLogRepository = () => ({
  find: async (options?: { where?: any; order?: any }): Promise<AdjustmentLog[]> => {
    let result = [...db.adjustmentLogs];
    if (options?.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        result = result.filter(m => (m as any)[key] === value);
      });
    }
    if (options?.order) {
      const [sortKey, sortDir] = Object.entries(options.order)[0];
      result.sort((a, b) => {
        const aVal = (a as any)[sortKey];
        const bVal = (b as any)[sortKey];
        return sortDir === 'DESC' ? bVal.localeCompare?.(aVal) || bVal - aVal : aVal.localeCompare?.(bVal) || aVal - bVal;
      });
    }
    return result;
  },
  save: async (log: AdjustmentLog): Promise<AdjustmentLog> => {
    const idx = db.adjustmentLogs.findIndex(l => l.id === log.id);
    if (idx >= 0) {
      db.adjustmentLogs[idx] = log;
    } else {
      db.adjustmentLogs.push(log);
    }
    await saveDB();
    return log;
  },
});

export const getSpectrumRepository = () => ({
  find: async (options?: { where?: any }): Promise<SpectrumData[]> => {
    let result = [...db.spectrumData];
    if (options?.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        result = result.filter(m => (m as any)[key] === value);
      });
    }
    return result;
  },
  findOne: async (options: { where: any }): Promise<SpectrumData | null> => {
    return db.spectrumData.find(s => {
      return Object.entries(options.where).every(([key, value]) => (s as any)[key] === value);
    }) || null;
  },
  save: async (spectrum: SpectrumData): Promise<SpectrumData> => {
    const idx = db.spectrumData.findIndex(s => s.id === spectrum.id);
    if (idx >= 0) {
      db.spectrumData[idx] = spectrum;
    } else {
      db.spectrumData.push(spectrum);
    }
    await saveDB();
    return spectrum;
  },
  count: async (options?: { where?: any }): Promise<number> => {
    let result = [...db.spectrumData];
    if (options?.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        result = result.filter(m => (m as any)[key] === value);
      });
    }
    return result.length;
  },
  createQueryBuilder: () => createQueryBuilder<SpectrumData>('spectrum', db.spectrumData),
});

export const getApprovalRepository = () => ({
  find: async (options?: { where?: any; order?: any }): Promise<ApprovalRecord[]> => {
    let result = [...db.approvalRecords];
    if (options?.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        result = result.filter(m => (m as any)[key] === value);
      });
    }
    if (options?.order) {
      const [sortKey, sortDir] = Object.entries(options.order)[0];
      result.sort((a, b) => {
        const aVal = (a as any)[sortKey];
        const bVal = (b as any)[sortKey];
        return sortDir === 'DESC' ? bVal.localeCompare?.(aVal) : aVal.localeCompare?.(bVal);
      });
    }
    return result;
  },
  findOne: async (options: { where: any }): Promise<ApprovalRecord | null> => {
    return db.approvalRecords.find(a => {
      return Object.entries(options.where).every(([key, value]) => (a as any)[key] === value);
    }) || null;
  },
  save: async (approval: ApprovalRecord): Promise<ApprovalRecord> => {
    const idx = db.approvalRecords.findIndex(a => a.id === approval.id);
    if (idx >= 0) {
      db.approvalRecords[idx] = approval;
    } else {
      db.approvalRecords.push(approval);
    }
    await saveDB();
    return approval;
  },
});

function createQueryBuilder<T>(alias: string, data: T[]) {
  let queryData = [...data];
  return {
    where: (condition: string, params?: Record<string, any>) => {
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          const field = condition.split('.')[1]?.split(' ')[0] || key;
          queryData = queryData.filter(item => {
            if (condition.includes('LIKE')) {
              const searchValue = String(value).replace(/%/g, '');
              return String((item as any)[field]).toLowerCase().includes(searchValue.toLowerCase());
            }
            if (condition.includes('BETWEEN')) {
              return true;
            }
            return (item as any)[field] === value;
          });
        });
      }
      return createQueryBuilder(alias, queryData);
    },
    andWhere: (condition: string, params?: Record<string, any>) => {
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          const field = condition.split('.')[1]?.split(' ')[0] || key;
          queryData = queryData.filter(item => {
            if (condition.includes('LIKE')) {
              const searchValue = String(value).replace(/%/g, '');
              return String((item as any)[field]).toLowerCase().includes(searchValue.toLowerCase());
            }
            if (condition.includes('IS NOT NULL')) {
              return (item as any)[field] !== null && (item as any)[field] !== undefined;
            }
            return (item as any)[field] === value;
          });
        });
      }
      return createQueryBuilder(alias, queryData);
    },
    orderBy: (field: string, dir: 'ASC' | 'DESC') => {
      const sortField = field.split('.')[1];
      queryData.sort((a, b) => {
        const aVal = (a as any)[sortField];
        const bVal = (b as any)[sortField];
        if (typeof aVal === 'string') {
          return dir === 'DESC' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
        }
        return dir === 'DESC' ? bVal - aVal : aVal - bVal;
      });
      return createQueryBuilder(alias, queryData);
    },
    leftJoinAndSelect: () => createQueryBuilder(alias, queryData),
    select: (expr: string) => createQueryBuilder(alias, queryData),
    getMany: async () => queryData,
    getRawOne: async () => {
      if (queryData.length === 0) return null;
      return queryData[0];
    },
    getCount: async () => queryData.length,
  };
}

export { uuidv4 };
