export type SpectrumType = 'IR' | 'Raman' | 'UV-Vis' | 'NMR';

export type TaskStatus = 
  | 'pending' 
  | 'submitted' 
  | 'optimizing' 
  | 'calculating' 
  | 'comparing' 
  | 'completed' 
  | 'error' 
  | 'rollback';

export type WarningType = 'low_match' | 'abnormal_mode' | 'convergence_issue';
export type WarningSeverity = 'low' | 'medium' | 'high';

export type ApprovalLevel = 'primary' | 'final';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Conformer {
  id: string;
  energy: number;
  xyzData: string;
  isOptimized: boolean;
}

export interface Molecule {
  id: string;
  name: string;
  formula: string;
  smiles: string;
  molecularWeight: number;
  xyzData?: string;
  conformers: Conformer[];
  createdAt: string;
  createdBy: string;
  isPaused: boolean;
  lowMatchCount: number;
}

export interface CalculationParameters {
  functional: string;
  basisSet: string;
  solventModel?: string;
  conformerId: string;
}

export interface StatusRecord {
  status: TaskStatus;
  timestamp: string;
  note?: string;
}

export interface EnergyPoint {
  step: number;
  energy: number;
  converged: boolean;
}

export interface Warning {
  id: string;
  type: WarningType;
  severity: WarningSeverity;
  message: string;
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface AdjustmentLog {
  id: string;
  timestamp: string;
  adjustedBy: string;
  oldParameters: CalculationParameters;
  newParameters: CalculationParameters;
  reason: string;
}

export interface SimulationTask {
  id: string;
  moleculeId: string;
  moleculeName: string;
  formula: string;
  status: TaskStatus;
  statusHistory: StatusRecord[];
  parameters: CalculationParameters;
  spectrumTypes: SpectrumType[];
  progress: number;
  energyConvergence: EnergyPoint[];
  matchScore?: number;
  warnings: Warning[];
  adjustmentLogs: AdjustmentLog[];
  createdAt: string;
  createdBy: string;
  completedAt?: string;
}

export interface SpectrumPeak {
  position: number;
  intensity: number;
  assignment: string;
  isAbnormal?: boolean;
}

export interface VibrationalMode {
  frequency: number;
  intensity: number;
  symmetry: string;
  displacementVectors: number[][];
}

export interface MolecularOrbital {
  index: number;
  energy: number;
  symmetry: string;
  occupancy: number;
  contribution: { atom: string; percentage: number }[];
}

export interface SpectrumData {
  taskId: string;
  type: SpectrumType;
  xAxis: number[];
  yAxis: number[];
  peaks: SpectrumPeak[];
  experimentalData?: { xAxis: number[]; yAxis: number[] };
  matchScore?: number;
  vibrationalModes?: VibrationalMode[];
  molecularOrbitals?: MolecularOrbital[];
}

export interface ApprovalRecord {
  id: string;
  taskId: string;
  level: ApprovalLevel;
  status: ApprovalStatus;
  reviewer: string;
  comments: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface Report {
  id: string;
  taskId: string;
  moleculeName: string;
  formula: string;
  createdAt: string;
  createdBy: string;
  pdfUrl?: string;
  includeSections: string[];
}

export interface Recommendation {
  functional: string;
  basisSet: string;
  solventModel?: string;
  confidence: number;
  historicalAccuracy: number;
  sampleCount: number;
}

export interface DashboardStats {
  totalTasks: number;
  completedToday: number;
  pendingApproval: number;
  activeWarnings: number;
  completionRate: number;
  averageAccuracy: number;
  totalResources: number;
  pausedMolecules: number;
}

export interface TrendData {
  month: string;
  completed: number;
  accuracy: number;
  resourceUsage: number;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: '待提交',
  submitted: '已提交',
  optimizing: '结构优化',
  calculating: '光谱计算',
  comparing: '谱图比对',
  completed: '已完成',
  error: '异常',
  rollback: '异常回退',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'bg-dark-600',
  submitted: 'bg-primary-500',
  optimizing: 'bg-accent-500',
  calculating: 'bg-warning-500',
  comparing: 'bg-blue-500',
  completed: 'bg-success-500',
  error: 'bg-danger-500',
  rollback: 'bg-orange-500',
};

export const SPECTRUM_TYPE_LABELS: Record<SpectrumType, string> = {
  'IR': '红外光谱',
  'Raman': '拉曼光谱',
  'UV-Vis': '紫外-可见光谱',
  'NMR': '核磁共振谱',
};

export const FUNCTIONAL_OPTIONS = [
  'B3LYP', 'PBE0', 'M06-2X', 'ωB97XD', 'TPSS', 'SCAN',
];

export const BASIS_SET_OPTIONS = [
  '6-31G(d)', '6-311G(d,p)', 'def2-SVP', 'def2-TZVP', 'cc-pVDZ', 'cc-pVTZ',
];

export const SOLVENT_MODEL_OPTIONS = [
  { value: '', label: '气相' },
  { value: 'PCM(water)', label: '水 (PCM)' },
  { value: 'PCM(methanol)', label: '甲醇 (PCM)' },
  { value: 'SMD(water)', label: '水 (SMD)' },
  { value: 'SMD(ethanol)', label: '乙醇 (SMD)' },
];
