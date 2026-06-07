import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import { initDataStore } from './services/dataStore';
import { initWebSocket } from './services/websocketService';
import { startTaskScheduler, processPendingTasks } from './services/taskQueue';

import moleculesRouter from './routes/molecules';
import tasksRouter from './routes/tasks';
import spectrumRouter from './routes/spectrum';
import approvalsRouter from './routes/approvals';
import statisticsRouter from './routes/statistics';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/api/molecules', moleculesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/spectrum', spectrumRouter);
app.use('/api/approvals', approvalsRouter);
app.use('/api/statistics', statisticsRouter);

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

const startServer = async () => {
  try {
    await initDataStore();
    
    initWebSocket(server);
    
    server.listen(PORT, () => {
      console.log(`🚀 服务器已启动: http://localhost:${PORT}`);
      console.log(`📊 API文档: http://localhost:${PORT}/api/health`);
      console.log(`🔌 WebSocket已启用`);
      
      startTaskScheduler();
      
      setTimeout(() => {
        void processPendingTasks();
      }, 3000);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

void startServer();

process.on('SIGINT', async () => {
  console.log('\n📢 正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n📢 正在关闭服务器...');
  process.exit(0);
});

export { app, server };
