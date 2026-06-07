import { Router, Request, Response } from 'express';
import {
  getSpectrumRepository,
  SpectrumData,
} from '../services/dataStore';
import { Parser } from 'json2csv';

const router = Router();

router.get('/task/:taskId', async (req: Request, res: Response) => {
  try {
    const spectrumRepo = getSpectrumRepository();
    const { type } = req.query;

    let spectra = await spectrumRepo.find({
      where: { taskId: req.params.taskId },
    } as any);

    if (type) {
      spectra = spectra.filter(s => s.type === type);
    }

    const parsedSpectra = spectra.map(spec => ({
      ...spec,
      xAxis: JSON.parse(spec.xAxis),
      yAxis: JSON.parse(spec.yAxis),
      peaks: spec.peaks ? JSON.parse(spec.peaks) : undefined,
      vibrationalModes: spec.vibrationalModes ? JSON.parse(spec.vibrationalModes) : undefined,
      molecularOrbitals: spec.molecularOrbitals ? JSON.parse(spec.molecularOrbitals) : undefined,
      experimentalData: spec.experimentalData ? JSON.parse(spec.experimentalData) : undefined,
    }));

    res.json(parsedSpectra);
  } catch (error) {
    console.error('获取光谱数据失败:', error);
    res.status(500).json({ error: '获取光谱数据失败' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const spectrumRepo = getSpectrumRepository();
    const spectrum = await spectrumRepo.findOne({ where: { id: req.params.id } });

    if (!spectrum) {
      return res.status(404).json({ error: '光谱数据不存在' });
    }

    const parsedSpectrum = {
      ...spectrum,
      xAxis: JSON.parse(spectrum.xAxis),
      yAxis: JSON.parse(spectrum.yAxis),
      peaks: spectrum.peaks ? JSON.parse(spectrum.peaks) : undefined,
      vibrationalModes: spectrum.vibrationalModes ? JSON.parse(spectrum.vibrationalModes) : undefined,
      molecularOrbitals: spectrum.molecularOrbitals ? JSON.parse(spectrum.molecularOrbitals) : undefined,
      experimentalData: spectrum.experimentalData ? JSON.parse(spectrum.experimentalData) : undefined,
    };

    res.json(parsedSpectrum);
  } catch (error) {
    console.error('获取光谱数据失败:', error);
    res.status(500).json({ error: '获取光谱数据失败' });
  }
});

router.get('/task/:taskId/export', async (req: Request, res: Response) => {
  try {
    const spectrumRepo = getSpectrumRepository();
    const { type, format = 'csv', minWavelength, maxWavelength } = req.query;

    let spectra = await spectrumRepo.find({
      where: { taskId: req.params.taskId },
    } as any);

    if (type) {
      spectra = spectra.filter(s => s.type === type);
    }

    if (spectra.length === 0) {
      return res.status(404).json({ error: '未找到光谱数据' });
    }

    const allData: Array<{
      波长_波数: number;
      计算强度: number;
      实验强度?: number;
      光谱类型: string;
    }> = [];

    for (const spec of spectra) {
      const xAxis = JSON.parse(spec.xAxis) as number[];
      const yAxis = JSON.parse(spec.yAxis) as number[];
      const expData = spec.experimentalData ? JSON.parse(spec.experimentalData) : null;

      for (let i = 0; i < xAxis.length; i++) {
        const x = xAxis[i];

        if (minWavelength && x < parseFloat(minWavelength as string)) continue;
        if (maxWavelength && x > parseFloat(maxWavelength as string)) continue;

        allData.push({
          波长_波数: x,
          计算强度: yAxis[i],
          实验强度: expData?.yAxis?.[i],
          光谱类型: spec.type,
        });
      }
    }

    if (format === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(allData);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="spectrum_data_${req.params.taskId}.csv"`);
      res.send('\ufeff' + csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="spectrum_data_${req.params.taskId}.json"`);
      res.json(allData);
    }
  } catch (error) {
    console.error('导出光谱数据失败:', error);
    res.status(500).json({ error: '导出光谱数据失败' });
  }
});

export default router;
