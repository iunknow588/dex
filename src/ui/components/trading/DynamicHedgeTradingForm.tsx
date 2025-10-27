import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  useTheme,
  useMediaQuery,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
} from '@mui/icons-material';

interface HedgeConfig {
  riskLockPrice: number;
  profitLockPrice: number;
  quantity: number;
  enabled: boolean;
}

export const DynamicHedgeTradingForm: React.FC = () => {
  const [config, setConfig] = useState<HedgeConfig>({
    riskLockPrice: 25.0,
    profitLockPrice: 26.0,
    quantity: 100,
    enabled: false,
  });

  const [isRunning, setIsRunning] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(25.42);
  const [pnl, setPnl] = useState(0);
  const [trades, setTrades] = useState<Array<{
    id: string;
    timestamp: number;
    type: 'buy' | 'sell';
    price: number;
    quantity: number;
    reason: string;
  }>>([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 模拟价格更新
  React.useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const change = (Math.random() - 0.5) * 0.1;
      setCurrentPrice(prev => {
        const newPrice = prev + change;

        // 自动交易逻辑
        if (newPrice <= config.riskLockPrice && config.enabled) {
          // 止损买入
          const trade = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: Date.now(),
            type: 'buy' as const,
            price: newPrice,
            quantity: config.quantity,
            reason: '风险锁定',
          };
          setTrades(prev => [trade, ...prev.slice(0, 9)]); // 保留最近10条
          setPnl(prev => prev - (newPrice * config.quantity)); // 简化PNL计算
        } else if (newPrice >= config.profitLockPrice && config.enabled) {
          // 止盈卖出
          const trade = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: Date.now(),
            type: 'sell' as const,
            price: newPrice,
            quantity: config.quantity,
            reason: '利润锁定',
          };
          setTrades(prev => [trade, ...prev.slice(0, 9)]);
          setPnl(prev => prev + (newPrice * config.quantity));
        }

        return newPrice;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isRunning, config]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleConfigChange = (field: keyof HedgeConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const getPriceStatus = () => {
    if (currentPrice <= config.riskLockPrice) return { status: 'risk', color: 'error' };
    if (currentPrice >= config.profitLockPrice) return { status: 'profit', color: 'success' };
    return { status: 'neutral', color: 'warning' };
  };

  const priceStatus = getPriceStatus();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        低风险合约对冲交易
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        自动对冲策略：当价格触及风险线时买入锁定，当价格触及利润线时卖出获利。
      </Alert>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
        {/* 配置面板 */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            对冲配置
          </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="风险锁定价格"
                type="number"
                value={config.riskLockPrice}
                onChange={(e) => handleConfigChange('riskLockPrice', parseFloat(e.target.value))}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: '$',
                }}
              />

              <TextField
                label="利润锁定价格"
                type="number"
                value={config.profitLockPrice}
                onChange={(e) => handleConfigChange('profitLockPrice', parseFloat(e.target.value))}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: '$',
                }}
              />

              <TextField
                label="单次交易数量"
                type="number"
                value={config.quantity}
                onChange={(e) => handleConfigChange('quantity', parseFloat(e.target.value))}
                fullWidth
                size="small"
              />

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PlayIcon />}
                  onClick={handleStart}
                  disabled={isRunning}
                  fullWidth
                >
                  开始对冲
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<StopIcon />}
                  onClick={handleStop}
                  disabled={!isRunning}
                  fullWidth
                >
                  停止
                </Button>
              </Box>
            </Box>
          </Paper>

        {/* 状态面板 */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            实时状态
          </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">当前价格:</Typography>
                <Chip
                  label={`$${currentPrice.toFixed(2)}`}
                  color={priceStatus.color as any}
                  size="small"
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">累计盈亏:</Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: pnl >= 0 ? 'success.main' : 'error.main',
                    fontWeight: 'bold'
                  }}
                >
                  {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">运行状态:</Typography>
                <Chip
                  label={isRunning ? '运行中' : '已停止'}
                  color={isRunning ? 'success' : 'default'}
                  size="small"
                />
              </Box>

              {isRunning && (
                <LinearProgress sx={{ mt: 1 }} />
              )}
            </Box>

            {/* 价格区间指示器 */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" gutterBottom>
                价格区间状态:
              </Typography>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                borderRadius: 1,
                bgcolor: theme.palette.grey[100],
              }}>
                <Box sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  bgcolor: priceStatus.color === 'error' ? 'error.main' :
                          priceStatus.color === 'success' ? 'success.main' : 'warning.main',
                }} />
                <Typography variant="body2">
                  {priceStatus.status === 'risk' && '⚠️ 风险区 - 已触发买入'}
                  {priceStatus.status === 'profit' && '💰 利润区 - 已触发卖出'}
                  {priceStatus.status === 'neutral' && '⏳ 中性区 - 等待信号'}
                </Typography>
              </Box>
            </Box>
          </Paper>

        {/* 交易记录 */}
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              最新交易记录
            </Typography>

            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              {trades.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  暂无交易记录
                </Typography>
              ) : (
                trades.map((trade) => (
                  <Box
                    key={trade.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {trade.type === 'buy' ? (
                        <TrendingUpIcon color="success" fontSize="small" />
                      ) : (
                        <TrendingDownIcon color="error" fontSize="small" />
                      )}
                      <Typography variant="body2">
                        {trade.type === 'buy' ? '买入' : '卖出'} {trade.quantity} INJ
                      </Typography>
                      <Chip label={trade.reason} size="small" variant="outlined" />
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2">
                        ${trade.price.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(trade.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};
