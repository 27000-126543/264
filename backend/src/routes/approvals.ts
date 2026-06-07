import { Router, Request, Response } from 'express';
import {
  getApprovalRepository,
  getTaskRepository,
  ApprovalRecord,
  uuidv4,
} from '../services/dataStore';
import { sendApprovalNotification, sendSynthesisGroupNotification } from '../services/websocketService';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const approvalRepo = getApprovalRepository();
    const { level, status, taskId } = req.query;

    let approvals = await approvalRepo.find({
      order: { createdAt: 'DESC' },
    });

    if (level) {
      approvals = approvals.filter(a => a.level === level);
    }

    if (status) {
      approvals = approvals.filter(a => a.status === status);
    }

    if (taskId) {
      approvals = approvals.filter(a => a.taskId === taskId);
    }

    res.json(approvals);
  } catch (error) {
    console.error('获取审批记录失败:', error);
    res.status(500).json({ error: '获取审批记录失败' });
  }
});

router.get('/pending', async (req: Request, res: Response) => {
  try {
    const approvalRepo = getApprovalRepository();
    const taskRepo = getTaskRepository();
    const { level } = req.query;

    let approvals = await approvalRepo.find({
      order: { createdAt: 'ASC' },
    });

    approvals = approvals.filter(a => a.status === 'pending');

    if (level) {
      approvals = approvals.filter(a => a.level === level);
    }

    const result = [];
    for (const approval of approvals) {
      const task = await taskRepo.findOne({
        where: { id: approval.taskId },
      });
      result.push({
        ...approval,
        task,
      });
    }

    res.json(result);
  } catch (error) {
    console.error('获取待审批列表失败:', error);
    res.status(500).json({ error: '获取待审批列表失败' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const approvalRepo = getApprovalRepository();
    const taskRepo = getTaskRepository();
    const { taskId, level, reviewer, comments } = req.body;

    if (!taskId || !level || !reviewer) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const task = await taskRepo.findOne({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    const approval: ApprovalRecord = {
      id: `appr-${uuidv4()}`,
      taskId,
      level: level as any,
      status: 'pending',
      reviewer,
      comments: comments || '',
      createdAt: new Date().toISOString(),
      nextApprover: level === 'primary' ? '项目负责人' : undefined,
    };

    await approvalRepo.save(approval);

    res.status(201).json(approval);
  } catch (error) {
    console.error('创建审批记录失败:', error);
    res.status(500).json({ error: '创建审批记录失败' });
  }
});

router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const approvalRepo = getApprovalRepository();
    const taskRepo = getTaskRepository();
    const approval = await approvalRepo.findOne({ where: { id: req.params.id } });

    if (!approval) {
      return res.status(404).json({ error: '审批记录不存在' });
    }

    const { reviewer, comments } = req.body;

    approval.status = 'approved';
    approval.reviewedAt = new Date().toISOString();
    if (comments) {
      approval.comments = approval.comments
        ? `${approval.comments}\n${comments}`
        : comments;
    }

    await approvalRepo.save(approval);

    const task = await taskRepo.findOne({
      where: { id: approval.taskId },
    });

    sendApprovalNotification({
      taskId: approval.taskId,
      moleculeName: task?.moleculeName || '未知分子',
      level: approval.level,
      status: 'approved',
      reviewer: reviewer || approval.reviewer,
      comments,
    });

    if (approval.level === 'final') {
      if (task) {
        sendSynthesisGroupNotification({
          taskId: task.id,
          moleculeName: task.moleculeName,
          formula: task.formula,
          matchScore: task.matchScore || 0,
          approvedBy: reviewer || approval.reviewer,
        });
      }
    }

    if (approval.level === 'primary') {
      const nextApproval: ApprovalRecord = {
        id: `appr-${uuidv4()}`,
        taskId: approval.taskId,
        level: 'final',
        status: 'pending',
        reviewer: '项目负责人',
        comments: '初级审批已通过，等待最终确认',
        createdAt: new Date().toISOString(),
        nextApprover: '首席科学家',
      };
      await approvalRepo.save(nextApproval);
    }

    res.json(approval);
  } catch (error) {
    console.error('审批通过失败:', error);
    res.status(500).json({ error: '审批通过失败' });
  }
});

router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const approvalRepo = getApprovalRepository();
    const taskRepo = getTaskRepository();
    const approval = await approvalRepo.findOne({ where: { id: req.params.id } });

    if (!approval) {
      return res.status(404).json({ error: '审批记录不存在' });
    }

    const { reviewer, comments } = req.body;

    approval.status = 'rejected';
    approval.reviewedAt = new Date().toISOString();
    approval.comments = approval.comments
      ? `${approval.comments}\n驳回原因: ${comments || '未说明'}`
      : `驳回原因: ${comments || '未说明'}`;

    await approvalRepo.save(approval);

    const task = await taskRepo.findOne({
      where: { id: approval.taskId },
    });

    sendApprovalNotification({
      taskId: approval.taskId,
      moleculeName: task?.moleculeName || '未知分子',
      level: approval.level,
      status: 'rejected',
      reviewer: reviewer || approval.reviewer,
      comments,
    });

    if (task) {
      task.status = 'rollback';
      task.progress = 0;
      await taskRepo.save(task);
    }

    res.json(approval);
  } catch (error) {
    console.error('审批驳回失败:', error);
    res.status(500).json({ error: '审批驳回失败' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const approvalRepo = getApprovalRepository();
    const approval = await approvalRepo.findOne({ where: { id: req.params.id } });

    if (!approval) {
      return res.status(404).json({ error: '审批记录不存在' });
    }

    res.json(approval);
  } catch (error) {
    console.error('获取审批详情失败:', error);
    res.status(500).json({ error: '获取审批详情失败' });
  }
});

export default router;
