import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

export interface WebSocketMessage {
  type: 'warning' | 'approval' | 'task_update' | 'notification';
  data: unknown;
  timestamp: string;
}

export const initWebSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`✅ WebSocket 客户端已连接: ${socket.id}`);

    socket.on('join_room', (room: string) => {
      socket.join(room);
      console.log(`📡 客户端 ${socket.id} 加入房间: ${room}`);
    });

    socket.on('leave_room', (room: string) => {
      socket.leave(room);
      console.log(`📡 客户端 ${socket.id} 离开房间: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ WebSocket 客户端已断开: ${socket.id}`);
    });
  });

  console.log('🔌 WebSocket 服务已初始化');
  return io;
};

export const sendWarning = (warningData: {
  taskId: string;
  moleculeName: string;
  type: string;
  severity: string;
  message: string;
}): void => {
  if (!io) return;
  
  const message: WebSocketMessage = {
    type: 'warning',
    data: warningData,
    timestamp: new Date().toISOString(),
  };

  io.to('warnings').emit('message', message);
  io.emit('warning', warningData);
  console.log(`⚠️  预警推送: ${warningData.message} [任务: ${warningData.taskId}]`);
};

export const sendTaskUpdate = (taskData: {
  taskId: string;
  status: string;
  progress: number;
  moleculeName: string;
}): void => {
  if (!io) return;

  const message: WebSocketMessage = {
    type: 'task_update',
    data: taskData,
    timestamp: new Date().toISOString(),
  };

  io.to(`task:${taskData.taskId}`).emit('message', message);
  io.emit('task_update', taskData);
};

export const sendApprovalNotification = (approvalData: {
  taskId: string;
  moleculeName: string;
  level: string;
  status: string;
  reviewer: string;
  comments?: string;
}): void => {
  if (!io) return;

  const message: WebSocketMessage = {
    type: 'approval',
    data: approvalData,
    timestamp: new Date().toISOString(),
  };

  io.to('approvals').emit('message', message);
  io.emit('approval_update', approvalData);
  console.log(`📝 审批通知: ${approvalData.moleculeName} ${approvalData.status} [${approvalData.level}]`);
};

export const sendSynthesisGroupNotification = (notificationData: {
  taskId: string;
  moleculeName: string;
  formula: string;
  matchScore: number;
  approvedBy: string;
}): void => {
  if (!io) return;

  const message: WebSocketMessage = {
    type: 'notification',
    data: {
      ...notificationData,
      target: 'synthesis_group',
      title: '结构鉴定通过，可开始合成',
    },
    timestamp: new Date().toISOString(),
  };

  io.to('synthesis_group').emit('message', message);
  io.emit('synthesis_notification', notificationData);
  console.log(`🔬 合成小组通知: ${notificationData.moleculeName} 结构鉴定通过`);
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('WebSocket 未初始化');
  }
  return io;
};
