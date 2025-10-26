/**
 * 动态对冲面板组件
 * 显示当前对冲状态和下一步操作
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AutoAwesome as AutoIcon,
} from '@mui/icons-material';
import { HedgeStateManager } from '../core/services/hedge/HedgeStateManager';
import { HedgeState, NextAction } from '../core/types';
import { PriceMonitorService } from '../core/services/monitoring/PriceMonitorService';

interface DynamicHedgePanelProps {
  manager: HedgeStateManager;
  monitor: PriceMonitorService;
  marketId: string;
  onExecuteAction?: (action: NextAction) => void;
}

export const DynamicHedgePanel: React.FC<DynamicHedgePanelProps> = ({
  manager,
  monitor,
  marketId,
  onExecuteAction,
}) => {
  const [currentState, setCurrentState] = useState<HedgeState>(HedgeState.MAIN_ONLY);
  const [nextAction, setNextAction] = useState<NextAction | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [expanded, setExpanded] = useState(true);
  const [autoExecuteEnabled, setAutoExecuteEnabled] = useState(true);
  
  useEffect(() => {
    // 注册状态变化回调
    manager.onStateChangeCallback((newState) => {
      setCurrentState(newState);
    });
    
    // 注册下一步操作变化回调
    manager.onNextActionCallback((action) => {
      setNextAction(action);
      
      // 如果有倒计时，启动倒计时
      if (action.countdown && action.autoExecute && autoExecuteEnabled) {
        setCountdown(action.countdown);
      }
    });
    
    // 清理函数
    return () => {
      monitor.unsubscribe(marketId);
    };
  }, [manager, monitor, marketId, autoExecuteEnabled]);
  
  // 倒计时处理
  useEffect(() => {
    if (countdown > 0 && nextAction?.autoExecute && autoExecuteEnabled) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
        
        if (countdown === 1) {
          // 倒计时结束，自动执行
          handleAutoExecute();
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [countdown, nextAction, autoExecuteEnabled]);
  
  // 自动执行操作
  const handleAutoExecute = () => {
    if (nextAction && onExecuteAction) {
      onExecuteAction(nextAction);
      setCountdown(0);
    }
  };
  
  // 手动执行操作
  const handleManualExecute = () => {
    if (nextAction && onExecuteAction) {
      onExecuteAction(nextAction);
      setCountdown(0);
    }
  };
  
  // 取消自动执行
  const handleCancelAutoExecute = () => {
    setCountdown(0);
    setAutoExecuteEnabled(false);
  };
  
  // 重新启用自动执行
  const handleEnableAutoExecute = () => {
    setAutoExecuteEnabled(true);
  };
  
  // 获取状态显示信息
  const getStateInfo = () => {
    switch (currentState) {
      case HedgeState.MAIN_ONLY:
        return {
          icon: <InfoIcon />,
          color: 'info' as const,
          title: '当前状态：仅主订单',
          description: '价格在交易区间，等待市场机会',
        };
      
      case HedgeState.HEDGE_RISK_LOCK:
        return {
          icon: <WarningIcon />,
          color: 'error' as const,
          title: '当前状态：反向风险锁定',
          description: '已创建风险锁定对冲单保护资金',
        };

      case HedgeState.HEDGE_PROFIT_LOCK:
        return {
          icon: <CheckIcon />,
          color: 'success' as const,
          title: '当前状态：正向利润锁定',
          description: '已创建利润锁定对冲单锁定盈利',
        };
      
      case HedgeState.CYCLING:
        return {
          icon: <AutoIcon />,
          color: 'warning' as const,
          title: '当前状态：循环对冲中',
          description: '自动执行循环对冲流程',
        };
      
      default:
        return {
          icon: <InfoIcon />,
          color: 'info' as const,
          title: '当前状态：未知',
          description: '',
        };
    }
  };
  
  const stateInfo = getStateInfo();
  
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      {/* 头部 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          动态对冲监控
        </Typography>
        <IconButton onClick={() => setExpanded(!expanded)} size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      
      <Collapse in={expanded}>
        {/* 当前状态 */}
        <Alert severity={stateInfo.color} icon={stateInfo.icon} sx={{ mb: 2 }}>
          <Typography variant="subtitle2">{stateInfo.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {stateInfo.description}
          </Typography>
        </Alert>
        
        {/* 下一步操作 */}
        {nextAction && (
          <Alert 
            severity={nextAction.type === 'create_hedge' ? 'warning' : 'info'}
            icon={<AutoIcon />}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                下一步操作
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {nextAction.description}
              </Typography>
              
              {/* 倒计时显示 */}
              {countdown > 0 && nextAction.autoExecute && autoExecuteEnabled && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {countdown} 秒后自动执行
                    </Typography>
                    <Chip 
                      label="自动执行" 
                      color="warning" 
                      size="small"
                      icon={<AutoIcon />}
                    />
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(countdown / (nextAction.countdown || 3)) * 100} 
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
              )}
              
              {/* 手动操作按钮 */}
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                {nextAction.type === 'create_hedge' && (
                  <>
                    <Button
                      variant="contained"
                      color="warning"
                      size="small"
                      onClick={handleManualExecute}
                      disabled={countdown === 0}
                    >
                      立即执行
                    </Button>
                    {countdown > 0 && autoExecuteEnabled && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleCancelAutoExecute}
                      >
                        取消自动
                      </Button>
                    )}
                    {!autoExecuteEnabled && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleEnableAutoExecute}
                      >
                        启用自动
                      </Button>
                    )}
                  </>
                )}
              </Box>
            </Box>
          </Alert>
        )}
        
        {/* 重要提示 */}
        <Alert severity="info" icon={<InfoIcon />}>
          <Typography variant="body2">
            <strong>动态对冲机制：</strong>智能风险管理系统
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            • 风险锁定和利润锁定对冲单互斥（同时只激活一个）
          </Typography>
          <Typography variant="body2">
            • 系统根据价格区间自动切换对冲策略
          </Typography>
          <Typography variant="body2">
            • 支持手动干预和3秒倒计时自动执行
          </Typography>
        </Alert>
        
        {/* 操作历史 */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            最后更新: {new Date().toLocaleTimeString()}
          </Typography>
        </Box>
      </Collapse>
    </Paper>
  );
};

