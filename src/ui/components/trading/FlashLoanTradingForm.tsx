import React, { useState } from 'react';
import {
  Box, Typography, Alert,
} from '@mui/material';

export const FlashLoanTradingForm: React.FC = () => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        闪电贷交易模式
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        利用闪电贷执行清算，赚取平台的清算奖励 (5-10%)
      </Typography>
      <Alert severity="info">
        <strong>闪电贷清算说明:</strong><br />
        • 基于Injective Exchange模块实现真实的清算机制<br />
        • 使用闪电贷资金执行清算，赚取平台清算奖励(5-10%)<br />
        • 所有操作在同一区块内完成，确保原子性<br />
        • 系统实时扫描Injective衍生品市场的可清算仓位<br />
        • 支持多市场并发监控和智能清算执行
      </Alert>
    </Box>
  );
};
