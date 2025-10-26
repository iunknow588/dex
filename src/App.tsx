import React from 'react';
import { Box, Typography, Paper, Alert } from '@mui/material';

function App() {
  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2
    }}>
      <Paper sx={{
        p: 4,
        maxWidth: 600,
        width: '100%',
        textAlign: 'center',
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          🚀 智运通交易系统
        </Typography>
        <Typography variant="h5" gutterBottom sx={{ color: 'text.secondary', mb: 3 }}>
          LuckEngine - 去中心化交易平台
        </Typography>

        <Alert severity="success" sx={{ mb: 3 }}>
          ✅ 系统已成功部署到 Vercel！
        </Alert>

        <Box sx={{ textAlign: 'left', mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🎯 核心功能特性:
          </Typography>
          <Typography component="div" sx={{ mb: 2 }}>
            • <strong>三大交易模式:</strong> 低风险合约交易、无风险套利交易、低风险闪电贷模式<br />
            • <strong>动态对冲机制:</strong> 智能价格区间切换，互斥对冲单<br />
            • <strong>闪电贷清算:</strong> 基于Injective Exchange模块的清算套利<br />
            • <strong>实时市场数据:</strong> WebSocket连接，实时价格和订单簿更新<br />
            • <strong>多钱包集成:</strong> 支持Keplr、MetaMask等多种Web3钱包
          </Typography>

          <Typography variant="h6" gutterBottom>
            🏗️ 技术架构:
          </Typography>
          <Typography component="div" sx={{ mb: 2 }}>
            • <strong>前端:</strong> React 19 + TypeScript + Material-UI + Vite<br />
            • <strong>状态管理:</strong> Zustand + React Query<br />
            • <strong>区块链:</strong> Injective Protocol 原生集成<br />
            • <strong>智能合约:</strong> Solidity + Hardhat<br />
            • <strong>部署:</strong> Vercel (自动CI/CD)
          </Typography>

          <Typography variant="h6" gutterBottom>
            🔒 安全特性:
          </Typography>
          <Typography component="div" sx={{ mb: 2 }}>
            • 前端安全防护 (XSS/CSRF防护)<br />
            • 私钥本地签名保护<br />
            • HTTPS传输加密<br />
            • 内容安全策略 (CSP)
          </Typography>
        </Box>

        <Alert severity="info">
          <Typography variant="body2">
            💡 <strong>开发中:</strong> 完整功能正在开发中，敬请期待正式版本发布！
          </Typography>
        </Alert>

        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          📧 技术支持: 项目已在 GitHub 开源
        </Typography>
      </Paper>
    </Box>
  );
}

export default App;
