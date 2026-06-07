import { Router, Request, Response } from 'express';
import { getMoleculeRepository, Molecule, uuidv4 } from '../services/dataStore';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const repo = getMoleculeRepository();
    const { search, isPaused } = req.query;
    
    let molecules = await repo.find();
    
    if (search) {
      const searchStr = String(search).toLowerCase();
      molecules = molecules.filter(m => 
        m.name.toLowerCase().includes(searchStr) ||
        m.formula.toLowerCase().includes(searchStr) ||
        m.smiles.toLowerCase().includes(searchStr)
      );
    }
    
    if (isPaused !== undefined) {
      molecules = molecules.filter(m => m.isPaused === (isPaused === 'true'));
    }
    
    molecules.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json(molecules);
  } catch (error) {
    console.error('获取分子列表失败:', error);
    res.status(500).json({ error: '获取分子列表失败' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const repo = getMoleculeRepository();
    const molecule = await repo.findOne({ where: { id: req.params.id } });
    
    if (!molecule) {
      return res.status(404).json({ error: '分子不存在' });
    }
    
    res.json(molecule);
  } catch (error) {
    console.error('获取分子详情失败:', error);
    res.status(500).json({ error: '获取分子详情失败' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const repo = getMoleculeRepository();
    const { name, formula, smiles, molecularWeight, xyzData, conformers, createdBy } = req.body;
    
    if (!name || !formula || !smiles || !molecularWeight) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const molecule: Molecule = {
      id: `mol-${uuidv4()}`,
      name,
      formula,
      smiles,
      molecularWeight,
      xyzData,
      conformers: conformers ? JSON.stringify(conformers) : undefined,
      createdAt: new Date().toISOString(),
      createdBy: createdBy || 'system',
      isPaused: false,
      lowMatchCount: 0,
    };
    
    await repo.save(molecule);
    res.status(201).json(molecule);
  } catch (error) {
    console.error('创建分子失败:', error);
    res.status(500).json({ error: '创建分子失败' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const repo = getMoleculeRepository();
    const molecule = await repo.findOne({ where: { id: req.params.id } });
    
    if (!molecule) {
      return res.status(404).json({ error: '分子不存在' });
    }
    
    const { name, formula, smiles, molecularWeight, xyzData, conformers, isPaused } = req.body;
    
    if (name !== undefined) molecule.name = name;
    if (formula !== undefined) molecule.formula = formula;
    if (smiles !== undefined) molecule.smiles = smiles;
    if (molecularWeight !== undefined) molecule.molecularWeight = molecularWeight;
    if (xyzData !== undefined) molecule.xyzData = xyzData;
    if (conformers !== undefined) molecule.conformers = JSON.stringify(conformers);
    if (isPaused !== undefined) molecule.isPaused = isPaused;
    
    await repo.save(molecule);
    res.json(molecule);
  } catch (error) {
    console.error('更新分子失败:', error);
    res.status(500).json({ error: '更新分子失败' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const repo = getMoleculeRepository();
    const result = await repo.delete(req.params.id);
    
    if (result.affected === 0) {
      return res.status(404).json({ error: '分子不存在' });
    }
    
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除分子失败:', error);
    res.status(500).json({ error: '删除分子失败' });
  }
});

router.post('/:id/toggle-pause', async (req: Request, res: Response) => {
  try {
    const repo = getMoleculeRepository();
    const molecule = await repo.findOne({ where: { id: req.params.id } });
    
    if (!molecule) {
      return res.status(404).json({ error: '分子不存在' });
    }
    
    molecule.isPaused = !molecule.isPaused;
    await repo.save(molecule);
    
    res.json({ id: molecule.id, isPaused: molecule.isPaused });
  } catch (error) {
    console.error('切换分子暂停状态失败:', error);
    res.status(500).json({ error: '切换分子暂停状态失败' });
  }
});

export default router;
