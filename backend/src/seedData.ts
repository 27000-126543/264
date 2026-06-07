import 'dotenv/config';
import {
  initDataStore,
  getMoleculeRepository,
  getTaskRepository,
  Molecule,
  SimulationTask,
  uuidv4,
} from './services/dataStore';

const seedMolecules = [
  {
    id: 'mol-benzene',
    name: '苯',
    formula: 'C6H6',
    smiles: 'C1=CC=CC=C1',
    molecularWeight: 78.11,
    xyzData: '6\nBenzene\nC  0.000  1.396  0.000\nC  1.209  0.698  0.000\nC  1.209 -0.698  0.000\nC  0.000 -1.396  0.000\nC -1.209 -0.698  0.000\nC -1.209  0.698  0.000\nH  0.000  2.479  0.000\nH  2.148  1.240  0.000\nH  2.148 -1.240  0.000\nH  0.000 -2.479  0.000\nH -2.148 -1.240  0.000\nH -2.148  1.240  0.000',
  },
  {
    id: 'mol-ethanol',
    name: '乙醇',
    formula: 'C2H6O',
    smiles: 'CCO',
    molecularWeight: 46.07,
    xyzData: '9\nEthanol\nC -0.740  0.010  0.000\nC  0.750  0.020  0.000\nO  1.180  0.000  1.230\nH -1.140  0.980  0.000\nH -1.140 -0.480 -0.870\nH -1.140 -0.480  0.870\nH  1.160  0.990  0.000\nH  1.160 -0.480 -0.870\nH  2.120  0.000  1.230',
  },
  {
    id: 'mol-acetic',
    name: '乙酸',
    formula: 'C2H4O2',
    smiles: 'CC(=O)O',
    molecularWeight: 60.05,
  },
  {
    id: 'mol-aniline',
    name: '苯胺',
    formula: 'C6H7N',
    smiles: 'c1ccc(N)cc1',
    molecularWeight: 93.13,
  },
  {
    id: 'mol-phenol',
    name: '苯酚',
    formula: 'C6H6O',
    smiles: 'c1ccc(O)cc1',
    molecularWeight: 94.11,
  },
];

const seedTasks = [
  {
    id: 'task-001',
    moleculeId: 'mol-benzene',
    moleculeName: '苯',
    formula: 'C6H6',
    status: 'completed',
    progress: 100,
    matchScore: 92,
    parameters: JSON.stringify({ functional: 'B3LYP', basisSet: '6-311G(d,p)', solventModel: '' }),
    spectrumTypes: JSON.stringify(['IR', 'Raman', 'UV-Vis', 'NMR']),
  },
  {
    id: 'task-002',
    moleculeId: 'mol-ethanol',
    moleculeName: '乙醇',
    formula: 'C2H6O',
    status: 'completed',
    progress: 100,
    matchScore: 78,
    parameters: JSON.stringify({ functional: 'M06-2X', basisSet: 'def2-TZVP', solventModel: 'PCM(water)' }),
    spectrumTypes: JSON.stringify(['IR', 'NMR']),
  },
  {
    id: 'task-003',
    moleculeId: 'mol-acetic',
    moleculeName: '乙酸',
    formula: 'C2H4O2',
    status: 'optimizing',
    progress: 35,
    parameters: JSON.stringify({ functional: 'PBE0', basisSet: 'def2-SVP', solventModel: '' }),
    spectrumTypes: JSON.stringify(['IR', 'Raman']),
  },
  {
    id: 'task-004',
    moleculeId: 'mol-aniline',
    moleculeName: '苯胺',
    formula: 'C6H7N',
    status: 'calculating',
    progress: 72,
    parameters: JSON.stringify({ functional: 'ωB97XD', basisSet: '6-311G(d,p)', solventModel: 'SMD(water)' }),
    spectrumTypes: JSON.stringify(['IR', 'UV-Vis', 'NMR']),
  },
  {
    id: 'task-005',
    moleculeId: 'mol-phenol',
    moleculeName: '苯酚',
    formula: 'C6H6O',
    status: 'submitted',
    progress: 5,
    parameters: JSON.stringify({ functional: 'B3LYP', basisSet: 'def2-TZVP', solventModel: '' }),
    spectrumTypes: JSON.stringify(['IR', 'Raman', 'UV-Vis']),
  },
  {
    id: 'task-006',
    moleculeId: 'mol-benzene',
    moleculeName: '苯',
    formula: 'C6H6',
    status: 'pending',
    progress: 0,
    parameters: JSON.stringify({ functional: 'B3LYP', basisSet: '6-31G(d)', solventModel: '' }),
    spectrumTypes: JSON.stringify(['IR', 'NMR']),
  },
];

export const seedDatabase = async () => {
  try {
    await initDataStore();
    
    const moleculeRepo = getMoleculeRepository();
    const existingMolecules = await moleculeRepo.count();
    
    if (existingMolecules === 0) {
      console.log('🌱 正在初始化分子数据...');
      for (const mol of seedMolecules) {
        const molecule: Molecule = {
          ...mol,
          createdAt: new Date(Date.now() - 86400000 * Math.random() * 30).toISOString(),
          createdBy: 'system',
          isPaused: false,
          lowMatchCount: mol.formula === 'C2H6O' ? 1 : 0,
        };
        await moleculeRepo.save(molecule);
      }
      console.log('✅ 分子数据初始化完成');
    }
    
    const taskRepo = getTaskRepository();
    const existingTasks = await taskRepo.count();
    
    if (existingTasks === 0) {
      console.log('🌱 正在初始化任务数据...');
      for (let i = 0; i < seedTasks.length; i++) {
        const task = seedTasks[i];
        const simTask: SimulationTask = {
          ...task as any,
          createdBy: 'system',
          retryCount: 0,
          createdAt: new Date(Date.now() - 86400000 * (seedTasks.length - i)).toISOString(),
          updatedAt: new Date().toISOString(),
          statusHistory: JSON.stringify([
            { status: 'pending', timestamp: new Date(Date.now() - 86400000 * (seedTasks.length - i + 1)).toISOString() },
            { status: task.status, timestamp: new Date().toISOString() },
          ]),
          completedAt: task.status === 'completed' ? new Date().toISOString() : undefined,
        };
        await taskRepo.save(simTask);
      }
      console.log('✅ 任务数据初始化完成');
    }
    
    console.log('🎉 数据库初始化完成!');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  void seedDatabase().then(() => process.exit(0));
}
