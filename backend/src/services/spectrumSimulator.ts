type SpectrumType = 'IR' | 'Raman' | 'UV-Vis' | 'NMR';

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

export interface GeneratedSpectrum {
  xAxis: number[];
  yAxis: number[];
  peaks: SpectrumPeak[];
  vibrationalModes?: VibrationalMode[];
  molecularOrbitals?: MolecularOrbital[];
  matchScore: number;
}

const gaussian = (x: number, center: number, width: number, height: number): number => {
  return height * Math.exp(-Math.pow((x - center) / width, 2));
};

const generateIRPeaks = (): SpectrumPeak[] => [
  { position: 3060, intensity: 0.45, assignment: '芳环 C-H 伸缩' },
  { position: 3030, intensity: 0.38, assignment: '芳环 C-H 伸缩' },
  { position: 2950, intensity: 0.25, assignment: '烷基 C-H 伸缩' },
  { position: 1600, intensity: 0.95, assignment: '芳环 C=C 伸缩' },
  { position: 1500, intensity: 0.72, assignment: '芳环 C=C 伸缩' },
  { position: 1450, intensity: 0.55, assignment: 'C-H 弯曲' },
  { position: 1280, intensity: 0.42, assignment: 'C-O 伸缩' },
  { position: 1180, intensity: 0.38, assignment: 'C-H 面内弯曲' },
  { position: 1050, intensity: 0.32, assignment: 'C-H 面内弯曲' },
  { position: 750, intensity: 0.68, assignment: '芳环 C-H 面外弯曲' },
  { position: 690, intensity: 0.85, assignment: '芳环骨架振动' },
];

const generateRamanPeaks = (): SpectrumPeak[] => [
  { position: 3070, intensity: 0.35, assignment: '芳环 C-H 伸缩' },
  { position: 3040, intensity: 0.28, assignment: '芳环 C-H 伸缩' },
  { position: 1590, intensity: 0.88, assignment: '芳环 C=C 伸缩' },
  { position: 1480, intensity: 0.65, assignment: '芳环 C=C 伸缩' },
  { position: 1250, intensity: 0.42, assignment: 'C-H 弯曲' },
  { position: 1020, intensity: 0.92, assignment: '芳环呼吸振动' },
  { position: 980, intensity: 0.38, assignment: '环变形振动' },
  { position: 620, intensity: 0.45, assignment: '环弯曲振动' },
];

const generateUVVisPeaks = (): SpectrumPeak[] => [
  { position: 205, intensity: 0.95, assignment: 'π→π* 跃迁 (E2带)' },
  { position: 255, intensity: 0.72, assignment: 'π→π* 跃迁 (B带)' },
  { position: 265, intensity: 0.55, assignment: 'π→π* 跃迁 (精细结构)' },
  { position: 275, intensity: 0.38, assignment: 'n→π* 跃迁' },
];

const generateNMRPeaks = (): SpectrumPeak[] => [
  { position: 7.2, intensity: 0.95, assignment: '芳环 H (邻位)' },
  { position: 7.3, intensity: 1.0, assignment: '芳环 H (间位)' },
  { position: 7.15, intensity: 0.9, assignment: '芳环 H (对位)' },
  { position: 2.3, intensity: 0.45, assignment: '甲基 H' },
  { position: 4.7, intensity: 0.15, assignment: '溶剂峰 (水)' },
];

export const generateSpectrum = (
  type: SpectrumType,
  formula: string
): GeneratedSpectrum => {
  const getPeaks = (): SpectrumPeak[] => {
    switch (type) {
      case 'IR': return generateIRPeaks();
      case 'Raman': return generateRamanPeaks();
      case 'UV-Vis': return generateUVVisPeaks();
      case 'NMR': return generateNMRPeaks();
    }
  };
  const peaks = getPeaks();

  const randomFactor = 0.9 + Math.random() * 0.2;
  const shiftedPeaks = peaks.map(peak => ({
    ...peak,
    position: peak.position * (0.98 + Math.random() * 0.04),
    intensity: peak.intensity * randomFactor * (0.9 + Math.random() * 0.2),
    isAbnormal: Math.random() < 0.05,
  }));

  const getRange = () => {
    switch (type) {
      case 'IR': return { minPos: 400, maxPos: 4000, numPoints: 361 };
      case 'Raman': return { minPos: 100, maxPos: 3500, numPoints: 341 };
      case 'UV-Vis': return { minPos: 190, maxPos: 400, numPoints: 211 };
      case 'NMR': return { minPos: 0, maxPos: 12, numPoints: 121 };
    }
  };
  const { minPos, maxPos, numPoints } = getRange();

  const step = (maxPos - minPos) / (numPoints - 1);
  const xAxis = Array.from({ length: numPoints }, (_, i) => minPos + i * step);
  const yAxis = xAxis.map(x => {
    let intensity = 0;
    shiftedPeaks.forEach(peak => {
      const width = type === 'NMR' ? 0.1 : type === 'UV-Vis' ? 15 : 30;
      intensity += gaussian(x, peak.position, width, peak.intensity);
    });
    intensity += (Math.random() - 0.5) * 0.02;
    return Math.max(0, intensity);
  });

  const vibrationalModes = (type === 'IR' || type === 'Raman') ? (
    shiftedPeaks.slice(0, 8).map((peak, i) => ({
      frequency: peak.position,
      intensity: peak.intensity,
      symmetry: ['A1', 'B1', 'B2', 'E1', 'E2', 'A2'][i % 6],
      displacementVectors: Array.from({ length: 12 }, () => 
        Array.from({ length: 3 }, () => (Math.random() - 0.5) * 0.5)
      ),
    }))
  ) : undefined;

  const molecularOrbitals = type === 'UV-Vis' ? (
    Array.from({ length: 10 }, (_, i) => ({
      index: i + 1,
      energy: -15 + i * 1.5 + (Math.random() - 0.5) * 0.5,
      symmetry: ['A1', 'B1', 'B2', 'E'][i % 4],
      occupancy: i < 5 ? 2 : 0,
      contribution: [
        { atom: 'C', percentage: 60 + Math.random() * 25 },
        { atom: 'H', percentage: 10 + Math.random() * 15 },
        { atom: 'O', percentage: Math.random() * 10 },
      ],
    }))
  ) : undefined;

  const matchScore = Math.round(75 + Math.random() * 20);

  return {
    xAxis,
    yAxis,
    peaks: shiftedPeaks,
    vibrationalModes,
    molecularOrbitals,
    matchScore,
  };
};

export const generateEnergyConvergence = (
  startEnergy: number,
  numSteps: number
): { energy: number; converged: boolean }[] => {
  const points: { energy: number; converged: boolean }[] = [];
  let currentEnergy = startEnergy;

  for (let i = 0; i < numSteps; i++) {
    const progress = i / numSteps;
    const convergenceFactor = Math.max(0, 1 - progress * 3);
    const energyChange = (Math.random() - 0.3) * convergenceFactor * 0.5;
    currentEnergy += energyChange;
    
    const converged = progress > 0.7 && Math.abs(energyChange) < 0.01;
    points.push({ energy: currentEnergy, converged });
  }

  return points;
};
