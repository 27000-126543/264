import { create } from 'zustand';
import { 
  Molecule, SimulationTask, SpectrumData, ApprovalRecord, 
  Report, DashboardStats, TrendData, Recommendation,
  TaskStatus, CalculationParameters, SpectrumType, EnergyPoint
} from '../types';
import { 
  mockMolecules, mockTasks, mockSpectra, mockApprovals, 
  mockReports, mockDashboardStats, mockTrendData, mockRecommendations 
} from '../data/mockData';

interface AppState {
  molecules: Molecule[];
  tasks: SimulationTask[];
  spectra: Record<string, SpectrumData>;
  approvals: ApprovalRecord[];
  reports: Report[];
  recommendations: Recommendation[];
  dashboardStats: DashboardStats;
  trendData: TrendData[];
  selectedTaskId: string | null;
  selectedMoleculeId: string | null;
  
  setSelectedTaskId: (id: string | null) => void;
  setSelectedMoleculeId: (id: string | null) => void;
  
  addMolecule: (mol: Omit<Molecule, 'id' | 'createdAt' | 'lowMatchCount' | 'isPaused'>) => void;
  submitTask: (moleculeId: string, params: CalculationParameters, types: SpectrumType[]) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus, progress?: number) => void;
  addEnergyPoint: (taskId: string, point: Omit<EnergyPoint, 'step'>) => void;
  addTaskWarning: (taskId: string, warning: Omit<SimulationTask['warnings'][0], 'id'>) => void;
  reviewWarning: (taskId: string, warningId: string, reviewer: string) => void;
  approveTask: (taskId: string, level: 'primary' | 'final', reviewer: string, comments: string) => void;
  rejectTask: (taskId: string, level: 'primary' | 'final', reviewer: string, comments: string) => void;
  adjustParameters: (taskId: string, newParams: CalculationParameters, reason: string, adjustedBy: string) => void;
  generateReport: (taskId: string, sections: string[], createdBy: string) => void;
  toggleMoleculePause: (moleculeId: string) => void;
  checkAndPauseMolecule: (moleculeId: string) => void;
  completeTask: (taskId: string, matchScore: number) => void;
}

export const useStore = create<AppState>((set, get) => ({
  molecules: mockMolecules,
  tasks: mockTasks,
  spectra: mockSpectra,
  approvals: mockApprovals,
  reports: mockReports,
  recommendations: mockRecommendations,
  dashboardStats: mockDashboardStats,
  trendData: mockTrendData,
  selectedTaskId: null,
  selectedMoleculeId: null,

  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
  setSelectedMoleculeId: (id) => set({ selectedMoleculeId: id }),

  addMolecule: (mol) => {
    const newMolecule: Molecule = {
      ...mol,
      id: `mol-${Date.now()}`,
      createdAt: new Date().toISOString(),
      lowMatchCount: 0,
      isPaused: false,
    };
    set((state) => ({ molecules: [...state.molecules, newMolecule] }));
  },

  submitTask: (moleculeId, params, types) => {
    const molecule = get().molecules.find(m => m.id === moleculeId);
    if (!molecule || molecule.isPaused) return;

    const newTask: SimulationTask = {
      id: `task-${Date.now()}`,
      moleculeId,
      moleculeName: molecule.name,
      formula: molecule.formula,
      status: 'submitted',
      statusHistory: [
        { status: 'pending', timestamp: new Date().toISOString() },
        { status: 'submitted', timestamp: new Date().toISOString() }
      ],
      parameters: params,
      spectrumTypes: types,
      progress: 5,
      energyConvergence: [],
      warnings: [],
      adjustmentLogs: [],
      createdAt: new Date().toISOString(),
      createdBy: '当前用户',
    };
    set((state) => ({ tasks: [...state.tasks, newTask] }));
  },

  updateTaskStatus: (taskId, status, progress) => {
    set((state) => ({
      tasks: state.tasks.map(task => {
        if (task.id !== taskId) return task;
        const newProgress = progress !== undefined ? progress : task.progress;
        const newHistory = task.statusHistory.some(h => h.status === status) 
          ? task.statusHistory 
          : [...task.statusHistory, { status, timestamp: new Date().toISOString() }];
        
        return {
          ...task,
          status,
          progress: newProgress,
          statusHistory: newHistory,
          completedAt: status === 'completed' ? new Date().toISOString() : task.completedAt,
        };
      })
    }));
  },

  addTaskWarning: (taskId, warning) => {
    set((state) => ({
      tasks: state.tasks.map(task => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          warnings: [...task.warnings, { ...warning, id: `warn-${Date.now()}` }],
        };
      })
    }));
  },

  reviewWarning: (taskId, warningId, reviewer) => {
    set((state) => ({
      tasks: state.tasks.map(task => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          warnings: task.warnings.map(w => 
            w.id === warningId 
              ? { ...w, reviewed: true, reviewedBy: reviewer, reviewedAt: new Date().toISOString() }
              : w
          ),
        };
      })
    }));
  },

  approveTask: (taskId, level, reviewer, comments) => {
    const newApproval: ApprovalRecord = {
      id: `appr-${Date.now()}`,
      taskId,
      level,
      status: 'approved',
      reviewer,
      comments,
      createdAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
    };
    set((state) => ({ approvals: [...state.approvals, newApproval] }));
  },

  rejectTask: (taskId, level, reviewer, comments) => {
    const newApproval: ApprovalRecord = {
      id: `appr-${Date.now()}`,
      taskId,
      level,
      status: 'rejected',
      reviewer,
      comments,
      createdAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
    };
    set((state) => ({ 
      approvals: [...state.approvals, newApproval],
      tasks: state.tasks.map(t => 
        t.id === taskId ? { ...t, status: 'rollback' as TaskStatus } : t
      ),
    }));
  },

  adjustParameters: (taskId, newParams, reason, adjustedBy) => {
    set((state) => ({
      tasks: state.tasks.map(task => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          parameters: newParams,
          status: 'optimizing',
          progress: 0,
          adjustmentLogs: [...task.adjustmentLogs, {
            id: `adj-${Date.now()}`,
            timestamp: new Date().toISOString(),
            adjustedBy,
            oldParameters: task.parameters,
            newParameters: newParams,
            reason,
          }],
        };
      })
    }));
  },

  generateReport: (taskId, sections, createdBy) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;

    const newReport: Report = {
      id: `report-${Date.now()}`,
      taskId,
      moleculeName: task.moleculeName,
      formula: task.formula,
      createdAt: new Date().toISOString(),
      createdBy,
      includeSections: sections,
    };
    set((state) => ({ reports: [...state.reports, newReport] }));
  },

  toggleMoleculePause: (moleculeId) => {
    set((state) => ({
      molecules: state.molecules.map(mol => 
        mol.id === moleculeId 
          ? { ...mol, isPaused: !mol.isPaused }
          : mol
      )
    }));
  },

  addEnergyPoint: (taskId, point) => {
    set((state) => ({
      tasks: state.tasks.map(task => {
        if (task.id !== taskId) return task;
        const newStep = task.energyConvergence.length + 1;
        const newPoint: EnergyPoint = { ...point, step: newStep };
        return {
          ...task,
          energyConvergence: [...task.energyConvergence, newPoint],
        };
      })
    }));
  },

  checkAndPauseMolecule: (moleculeId) => {
    const state = get();
    const molecule = state.molecules.find(m => m.id === moleculeId);
    if (!molecule) return;

    const moleculeTasks = state.tasks.filter(t => t.moleculeId === moleculeId && t.status === 'completed');
    const lowMatchCount = moleculeTasks.filter(t => (t.matchScore || 0) < 80).length;

    if (lowMatchCount >= 3) {
      set((state) => ({
        molecules: state.molecules.map(mol => 
          mol.id === moleculeId 
            ? { ...mol, isPaused: true, lowMatchCount }
            : mol
        )
      }));
    }
  },

  completeTask: (taskId, matchScore) => {
    const state = get();
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    set((state) => ({
      tasks: state.tasks.map(t => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          status: 'completed',
          progress: 100,
          matchScore,
          completedAt: new Date().toISOString(),
          statusHistory: [
            ...t.statusHistory,
            { status: 'completed', timestamp: new Date().toISOString() }
          ],
        };
      })
    }));

    if (matchScore < 80) {
      get().checkAndPauseMolecule(task.moleculeId);
    }
  },
}));
