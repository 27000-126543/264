import { Recommendation, CalculationParameters } from '../types';

interface HistoricalRecord {
  functional: string;
  basisSet: string;
  solventModel?: string;
  matchScore: number;
  formula: string;
}

const MOCK_HISTORICAL_DATA: HistoricalRecord[] = [
  { functional: 'B3LYP', basisSet: '6-31G(d)', solventModel: '', matchScore: 85, formula: 'C6H6' },
  { functional: 'B3LYP', basisSet: '6-311G(d,p)', solventModel: '', matchScore: 91, formula: 'C6H6' },
  { functional: 'M06-2X', basisSet: 'def2-TZVP', solventModel: 'PCM(water)', matchScore: 94, formula: 'C2H6O' },
  { functional: 'PBE0', basisSet: 'def2-SVP', solventModel: '', matchScore: 88, formula: 'C2H4O2' },
  { functional: 'ωB97XD', basisSet: '6-311G(d,p)', solventModel: 'SMD(water)', matchScore: 93, formula: 'C6H7N' },
  { functional: 'B3LYP', basisSet: 'def2-TZVP', solventModel: '', matchScore: 89, formula: 'C6H6O' },
  { functional: 'M06-2X', basisSet: '6-31G(d)', solventModel: 'PCM(methanol)', matchScore: 87, formula: 'C2H6O' },
  { functional: 'B3LYP', basisSet: '6-31G(d)', solventModel: '', matchScore: 82, formula: 'C6H6' },
  { functional: 'B3LYP', basisSet: '6-311G(d,p)', solventModel: '', matchScore: 90, formula: 'C6H6' },
  { functional: 'ωB97XD', basisSet: 'def2-TZVP', solventModel: '', matchScore: 95, formula: 'C6H6' },
];

export const getRecommendations = (formula?: string): Recommendation[] => {
  const relevantData = formula 
    ? MOCK_HISTORICAL_DATA.filter(r => r.formula === formula)
    : MOCK_HISTORICAL_DATA;

  if (relevantData.length === 0) {
    return [
      { functional: 'B3LYP', basisSet: '6-31G(d)', confidence: 80, historicalAccuracy: 85, sampleCount: 156 },
      { functional: 'M06-2X', basisSet: 'def2-TZVP', confidence: 75, historicalAccuracy: 90, sampleCount: 89 },
    ];
  }

  const grouped: Record<string, { scores: number[]; solvent?: string }> = {};
  
  relevantData.forEach(record => {
    const key = `${record.functional}/${record.basisSet}`;
    if (!grouped[key]) {
      grouped[key] = { scores: [], solvent: record.solventModel };
    }
    grouped[key].scores.push(record.matchScore);
  });

  const recommendations = Object.entries(grouped).map(([key, data]) => {
    const [functional, basisSet] = key.split('/');
    const avgAccuracy = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
    const confidence = Math.min(95, 70 + data.scores.length * 5);
    
    return {
      functional,
      basisSet,
      solventModel: data.solvent,
      confidence: Math.round(confidence),
      historicalAccuracy: Math.round(avgAccuracy),
      sampleCount: data.scores.length,
    };
  });

  return recommendations
    .sort((a, b) => b.historicalAccuracy - a.historicalAccuracy)
    .slice(0, 5);
};

export const getOptimalParameters = (
  currentParams: CalculationParameters,
  targetAccuracy: number = 85
): CalculationParameters => {
  const BASIS_SET_ORDER = ['6-31G(d)', '6-311G(d,p)', 'def2-SVP', 'def2-TZVP', 'cc-pVDZ', 'cc-pVTZ'];
  const FUNCTIONAL_ORDER = ['B3LYP', 'PBE0', 'TPSS', 'M06-2X', 'ωB97XD', 'SCAN'];

  const currentBasisIndex = BASIS_SET_ORDER.indexOf(currentParams.basisSet);
  const currentFunctionalIndex = FUNCTIONAL_ORDER.indexOf(currentParams.functional);

  let newBasisSet = currentParams.basisSet;
  let newFunctional = currentParams.functional;

  if (currentBasisIndex < BASIS_SET_ORDER.length - 1) {
    newBasisSet = BASIS_SET_ORDER[currentBasisIndex + 1];
  } else if (currentFunctionalIndex < FUNCTIONAL_ORDER.length - 1) {
    newFunctional = FUNCTIONAL_ORDER[currentFunctionalIndex + 1];
  }

  return {
    ...currentParams,
    functional: newFunctional,
    basisSet: newBasisSet,
  };
};

export const estimateComputationTime = (params: CalculationParameters, atomCount: number): number => {
  const BASIS_SET_FACTORS: Record<string, number> = {
    '6-31G(d)': 1,
    '6-311G(d,p)': 1.8,
    'def2-SVP': 1.5,
    'def2-TZVP': 3,
    'cc-pVDZ': 2,
    'cc-pVTZ': 4,
  };

  const FUNCTIONAL_FACTORS: Record<string, number> = {
    'B3LYP': 1,
    'PBE0': 1.1,
    'TPSS': 0.9,
    'M06-2X': 1.5,
    'ωB97XD': 1.8,
    'SCAN': 2,
  };

  const basisFactor = BASIS_SET_FACTORS[params.basisSet] || 1;
  const functionalFactor = FUNCTIONAL_FACTORS[params.functional] || 1;
  const baseTime = Math.pow(atomCount, 2.5) * 0.1;

  return Math.round(baseTime * basisFactor * functionalFactor);
};
