import { 
  Molecule, SimulationTask, SpectrumData, ApprovalRecord, 
  Report, Recommendation, DashboardStats, TrendData, SpectrumType
} from '../types';

const generateId = () => Math.random().toString(36).substring(2, 10);

export const mockMolecules: Molecule[] = [
  {
    id: 'mol-001',
    name: '苯',
    formula: 'C6H6',
    smiles: 'c1ccccc1',
    molecularWeight: 78.11,
    conformers: [
      { id: 'conf-001', energy: -230.72, xyzData: '6\nBenzene\nC 0.0 1.4 0.0\nC 1.2 0.7 0.0\nC 1.2 -0.7 0.0\nC 0.0 -1.4 0.0\nC -1.2 -0.7 0.0\nC -1.2 0.7 0.0', isOptimized: true }
    ],
    createdAt: '2026-01-15T10:30:00Z',
    createdBy: '张研究员',
    isPaused: false,
    lowMatchCount: 0,
  },
  {
    id: 'mol-002',
    name: '乙醇',
    formula: 'C2H6O',
    smiles: 'CCO',
    molecularWeight: 46.07,
    conformers: [
      { id: 'conf-002', energy: -154.12, xyzData: '9\nEthanol\nC -0.7 0.0 0.0\nC 0.8 0.0 0.0\nO 1.5 1.2 0.0\nH -1.1 0.9 0.5\nH -1.1 0.0 -1.0\nH -1.1 -0.9 0.5\nH 1.1 -0.9 0.5\nH 1.1 0.0 -1.0\nH 2.4 1.1 0.0', isOptimized: true }
    ],
    createdAt: '2026-01-16T14:20:00Z',
    createdBy: '李研究员',
    isPaused: false,
    lowMatchCount: 1,
  },
  {
    id: 'mol-003',
    name: '乙酸',
    formula: 'C2H4O2',
    smiles: 'CC(=O)O',
    molecularWeight: 60.05,
    conformers: [
      { id: 'conf-003', energy: -227.58, xyzData: '8\nAcetic acid\nC -0.6 0.0 0.0\nC 0.9 0.0 0.0\nO 1.5 1.0 0.0\nO 1.5 -1.1 0.0\nH -1.0 0.9 0.5\nH -1.0 0.0 -1.0\nH -1.0 -0.9 0.5\nH 2.3 -1.0 0.0', isOptimized: true }
    ],
    createdAt: '2026-01-17T09:15:00Z',
    createdBy: '王研究员',
    isPaused: false,
    lowMatchCount: 0,
  },
  {
    id: 'mol-004',
    name: '苯胺',
    formula: 'C6H7N',
    smiles: 'c1ccc(N)cc1',
    molecularWeight: 93.13,
    conformers: [
      { id: 'conf-004', energy: -287.34, xyzData: '14\nAniline\nC 0.0 1.4 0.0\nC 1.2 0.7 0.0\nC 1.2 -0.7 0.0\nC 0.0 -1.4 0.0\nC -1.2 -0.7 0.0\nC -1.2 0.7 0.0\nN -2.4 1.4 0.0\nH 0.0 2.5 0.0\nH 2.1 1.2 0.0\nH 2.1 -1.2 0.0\nH 0.0 -2.5 0.0\nH -2.1 -1.2 0.0\nH -2.4 2.0 0.8\nH -2.4 2.0 -0.8', isOptimized: true }
    ],
    createdAt: '2026-01-18T16:45:00Z',
    createdBy: '赵研究员',
    isPaused: true,
    lowMatchCount: 3,
  },
  {
    id: 'mol-005',
    name: '苯酚',
    formula: 'C6H6O',
    smiles: 'c1ccc(O)cc1',
    molecularWeight: 94.11,
    conformers: [
      { id: 'conf-005', energy: -303.89, xyzData: '13\nPhenol\nC 0.0 1.4 0.0\nC 1.2 0.7 0.0\nC 1.2 -0.7 0.0\nC 0.0 -1.4 0.0\nC -1.2 -0.7 0.0\nC -1.2 0.7 0.0\nO -2.4 1.4 0.0\nH 0.0 2.5 0.0\nH 2.1 1.2 0.0\nH 2.1 -1.2 0.0\nH 0.0 -2.5 0.0\nH -2.1 -1.2 0.0\nH -3.2 1.0 0.0', isOptimized: true }
    ],
    createdAt: '2026-01-19T11:00:00Z',
    createdBy: '张研究员',
    isPaused: false,
    lowMatchCount: 0,
  },
];

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();

export const mockTasks: SimulationTask[] = [
  {
    id: 'task-001',
    moleculeId: 'mol-001',
    moleculeName: '苯',
    formula: 'C6H6',
    status: 'completed',
    statusHistory: [
      { status: 'pending', timestamp: hoursAgo(48) },
      { status: 'submitted', timestamp: hoursAgo(47) },
      { status: 'optimizing', timestamp: hoursAgo(46) },
      { status: 'calculating', timestamp: hoursAgo(30) },
      { status: 'comparing', timestamp: hoursAgo(6) },
      { status: 'completed', timestamp: hoursAgo(4) },
    ],
    parameters: { functional: 'B3LYP', basisSet: '6-31G(d)', conformerId: 'conf-001' },
    spectrumTypes: ['IR', 'Raman', 'UV-Vis'],
    progress: 100,
    energyConvergence: Array.from({ length: 20 }, (_, i) => ({
      step: i + 1,
      energy: -230.72 - Math.exp(-i * 0.3) * 0.5,
      converged: i >= 15,
    })),
    matchScore: 89.5,
    warnings: [],
    adjustmentLogs: [],
    createdAt: hoursAgo(48),
    createdBy: '张研究员',
    completedAt: hoursAgo(4),
  },
  {
    id: 'task-002',
    moleculeId: 'mol-002',
    moleculeName: '乙醇',
    formula: 'C2H6O',
    status: 'calculating',
    statusHistory: [
      { status: 'pending', timestamp: hoursAgo(12) },
      { status: 'submitted', timestamp: hoursAgo(11) },
      { status: 'optimizing', timestamp: hoursAgo(10) },
      { status: 'calculating', timestamp: hoursAgo(5) },
    ],
    parameters: { functional: 'PBE0', basisSet: 'def2-SVP', solventModel: 'PCM(water)', conformerId: 'conf-002' },
    spectrumTypes: ['IR', 'NMR'],
    progress: 65,
    energyConvergence: Array.from({ length: 12 }, (_, i) => ({
      step: i + 1,
      energy: -154.12 - Math.exp(-i * 0.25) * 0.3,
      converged: i >= 10,
    })),
    warnings: [
      { id: 'warn-001', type: 'convergence_issue', severity: 'low', message: '能量收敛速度较慢，建议增大收敛阈值', reviewed: false }
    ],
    adjustmentLogs: [],
    createdAt: hoursAgo(12),
    createdBy: '李研究员',
  },
  {
    id: 'task-003',
    moleculeId: 'mol-003',
    moleculeName: '乙酸',
    formula: 'C2H4O2',
    status: 'comparing',
    statusHistory: [
      { status: 'pending', timestamp: hoursAgo(8) },
      { status: 'submitted', timestamp: hoursAgo(7.5) },
      { status: 'optimizing', timestamp: hoursAgo(7) },
      { status: 'calculating', timestamp: hoursAgo(4) },
      { status: 'comparing', timestamp: hoursAgo(1) },
    ],
    parameters: { functional: 'M06-2X', basisSet: '6-311G(d,p)', conformerId: 'conf-003' },
    spectrumTypes: ['IR', 'Raman'],
    progress: 90,
    energyConvergence: Array.from({ length: 18 }, (_, i) => ({
      step: i + 1,
      energy: -227.58 - Math.exp(-i * 0.28) * 0.4,
      converged: i >= 14,
    })),
    warnings: [],
    adjustmentLogs: [],
    createdAt: hoursAgo(8),
    createdBy: '王研究员',
  },
  {
    id: 'task-004',
    moleculeId: 'mol-004',
    moleculeName: '苯胺',
    formula: 'C6H7N',
    status: 'rollback',
    statusHistory: [
      { status: 'pending', timestamp: hoursAgo(24) },
      { status: 'submitted', timestamp: hoursAgo(23) },
      { status: 'optimizing', timestamp: hoursAgo(22) },
      { status: 'calculating', timestamp: hoursAgo(15) },
      { status: 'comparing', timestamp: hoursAgo(8) },
      { status: 'rollback', timestamp: hoursAgo(6) },
    ],
    parameters: { functional: 'B3LYP', basisSet: '6-31G(d)', conformerId: 'conf-004' },
    spectrumTypes: ['IR', 'UV-Vis', 'NMR'],
    progress: 85,
    energyConvergence: Array.from({ length: 16 }, (_, i) => ({
      step: i + 1,
      energy: -287.34 - Math.exp(-i * 0.2) * 0.6,
      converged: i >= 12,
    })),
    matchScore: 72.3,
    warnings: [
      { id: 'warn-002', type: 'low_match', severity: 'high', message: '光谱匹配度仅72.3%，低于阈值80%', reviewed: false },
      { id: 'warn-003', type: 'abnormal_mode', severity: 'medium', message: '检测到3个异常振动模式，可能存在虚频', reviewed: false },
    ],
    adjustmentLogs: [
      {
        id: 'adj-001',
        timestamp: hoursAgo(6),
        adjustedBy: '光谱分析师-陈',
        oldParameters: { functional: 'B3LYP', basisSet: '6-31G(d)', conformerId: 'conf-004' },
        newParameters: { functional: 'ωB97XD', basisSet: 'def2-TZVP', conformerId: 'conf-004' },
        reason: '匹配度过低，提升泛函和基组级别',
      }
    ],
    createdAt: hoursAgo(24),
    createdBy: '赵研究员',
  },
  {
    id: 'task-005',
    moleculeId: 'mol-001',
    moleculeName: '苯',
    formula: 'C6H6',
    status: 'optimizing',
    statusHistory: [
      { status: 'pending', timestamp: hoursAgo(3) },
      { status: 'submitted', timestamp: hoursAgo(2.5) },
      { status: 'optimizing', timestamp: hoursAgo(2) },
    ],
    parameters: { functional: 'ωB97XD', basisSet: 'def2-TZVP', conformerId: 'conf-001' },
    spectrumTypes: ['IR', 'Raman'],
    progress: 35,
    energyConvergence: Array.from({ length: 8 }, (_, i) => ({
      step: i + 1,
      energy: -230.72 - Math.exp(-i * 0.3) * 0.5,
      converged: false,
    })),
    warnings: [],
    adjustmentLogs: [],
    createdAt: hoursAgo(3),
    createdBy: '张研究员',
  },
  {
    id: 'task-006',
    moleculeId: 'mol-005',
    moleculeName: '苯酚',
    formula: 'C6H6O',
    status: 'pending',
    statusHistory: [
      { status: 'pending', timestamp: hoursAgo(1) },
    ],
    parameters: { functional: 'B3LYP', basisSet: '6-31G(d)', conformerId: 'conf-005' },
    spectrumTypes: ['IR'],
    progress: 0,
    energyConvergence: [],
    warnings: [],
    adjustmentLogs: [],
    createdAt: hoursAgo(1),
    createdBy: '张研究员',
  },
];

const generateSpectrum = (type: SpectrumType, hasExperimental = true): SpectrumData => {
  let xMin: number, xMax: number, peakCount: number;
  
  switch (type) {
    case 'IR':
      xMin = 400; xMax = 4000; peakCount = 15;
      break;
    case 'Raman':
      xMin = 100; xMax = 3500; peakCount = 12;
      break;
    case 'UV-Vis':
      xMin = 200; xMax = 800; peakCount = 8;
      break;
    case 'NMR':
      xMin = 0; xMax = 12; peakCount = 6;
      break;
  }

  const xAxis: number[] = [];
  const yAxis: number[] = [];
  const step = (xMax - xMin) / 200;
  
  for (let x = xMin; x <= xMax; x += step) {
    xAxis.push(Math.round(x * 10) / 10);
    let y = 0.05 + Math.random() * 0.05;
    
    for (let p = 0; p < peakCount; p++) {
      const center = xMin + (xMax - xMin) * (p + 0.5 + (Math.random() - 0.5) * 0.3) / peakCount;
      const width = (xMax - xMin) / peakCount * (0.2 + Math.random() * 0.1);
      const height = 0.3 + Math.random() * 0.7;
      y += height * Math.exp(-Math.pow((x - center) / width, 2));
    }
    
    yAxis.push(Math.round(y * 1000) / 1000);
  }

  const peaks = Array.from({ length: Math.floor(peakCount * 0.7) }, (_, i) => ({
    position: xMin + (xMax - xMin) * (i + 0.5) / peakCount + (Math.random() - 0.5) * 20,
    intensity: 0.4 + Math.random() * 0.6,
    assignment: `Mode ${i + 1}`,
    isAbnormal: Math.random() > 0.9,
  }));

  const experimentalData = hasExperimental ? {
    xAxis: xAxis.map(x => x + (Math.random() - 0.5) * 5),
    yAxis: yAxis.map(y => Math.max(0, y + (Math.random() - 0.5) * 0.1)),
  } : undefined;

  return {
    taskId: 'task-001',
    type,
    xAxis,
    yAxis,
    peaks,
    experimentalData,
    matchScore: hasExperimental ? 75 + Math.random() * 20 : undefined,
    vibrationalModes: type === 'IR' ? peaks.map((p, i) => ({
      frequency: p.position,
      intensity: p.intensity,
      symmetry: ['A1g', 'B1u', 'E2g', 'A2u'][i % 4],
      displacementVectors: Array.from({ length: 6 }, () => 
        Array.from({ length: 3 }, () => (Math.random() - 0.5) * 0.5)
      ),
    })) : undefined,
    molecularOrbitals: type === 'UV-Vis' ? Array.from({ length: 10 }, (_, i) => ({
      index: i + 1,
      energy: -10 + i * 0.8,
      symmetry: ['a1', 'b1', 'a2', 'b2'][i % 4],
      occupancy: i < 5 ? 2 : 0,
      contribution: [
        { atom: 'C', percentage: 40 + Math.random() * 30 },
        { atom: 'H', percentage: 20 + Math.random() * 20 },
        { atom: 'O', percentage: 10 + Math.random() * 20 },
      ],
    })) : undefined,
  };
};

export const mockSpectra: Record<string, SpectrumData> = {
  'task-001-IR': generateSpectrum('IR'),
  'task-001-Raman': generateSpectrum('Raman'),
  'task-001-UV-Vis': generateSpectrum('UV-Vis'),
  'task-002-IR': generateSpectrum('IR'),
  'task-002-NMR': generateSpectrum('NMR'),
  'task-003-IR': generateSpectrum('IR', false),
  'task-003-Raman': generateSpectrum('Raman'),
  'task-004-IR': generateSpectrum('IR'),
};

export const mockApprovals: ApprovalRecord[] = [
  {
    id: 'appr-001',
    taskId: 'task-001',
    level: 'primary',
    status: 'approved',
    reviewer: '初级研究员-刘',
    comments: '谱峰归属正确，匹配度良好',
    createdAt: hoursAgo(3.5),
    reviewedAt: hoursAgo(3),
  },
  {
    id: 'appr-002',
    taskId: 'task-001',
    level: 'final',
    status: 'approved',
    reviewer: '项目负责人-周',
    comments: '结构确认合理，可以推送合成小组',
    createdAt: hoursAgo(2.5),
    reviewedAt: hoursAgo(2),
  },
  {
    id: 'appr-003',
    taskId: 'task-003',
    level: 'primary',
    status: 'pending',
    reviewer: '',
    comments: '',
    createdAt: hoursAgo(0.5),
  },
];

export const mockReports: Report[] = [
  {
    id: 'report-001',
    taskId: 'task-001',
    moleculeName: '苯',
    formula: 'C6H6',
    createdAt: hoursAgo(1.5),
    createdBy: '张研究员',
    includeSections: ['spectrum', 'vibration', 'orbital', 'parameters'],
  },
];

export const mockRecommendations: Recommendation[] = [
  { functional: 'B3LYP', basisSet: '6-31G(d)', confidence: 92, historicalAccuracy: 87.5, sampleCount: 156 },
  { functional: 'ωB97XD', basisSet: 'def2-TZVP', solventModel: 'SMD(water)', confidence: 88, historicalAccuracy: 91.2, sampleCount: 89 },
  { functional: 'PBE0', basisSet: '6-311G(d,p)', confidence: 85, historicalAccuracy: 84.3, sampleCount: 67 },
];

export const mockDashboardStats: DashboardStats = {
  totalTasks: 24,
  completedToday: 5,
  pendingApproval: 3,
  activeWarnings: 4,
  completionRate: 78.5,
  averageAccuracy: 86.2,
  totalResources: 1250,
  pausedMolecules: 1,
};

export const mockTrendData: TrendData[] = [
  { month: '2026-01', completed: 28, accuracy: 84.2, resourceUsage: 1120 },
  { month: '2026-02', completed: 35, accuracy: 85.8, resourceUsage: 1350 },
  { month: '2026-03', completed: 42, accuracy: 87.1, resourceUsage: 1580 },
  { month: '2026-04', completed: 38, accuracy: 86.5, resourceUsage: 1420 },
  { month: '2026-05', completed: 45, accuracy: 88.3, resourceUsage: 1680 },
  { month: '2026-06', completed: 24, accuracy: 86.2, resourceUsage: 1250 },
];
