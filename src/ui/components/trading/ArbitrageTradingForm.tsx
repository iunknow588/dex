import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  useTheme,
  useMediaQuery,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Search as SearchIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

interface ArbitrageOpportunity {
  id: string;
  symbol: string;
  exchanges: string[];
  priceDiff: number;
  expectedProfit: number;
  confidence: number;
  timestamp: number;
}

export const ArbitrageTradingForm: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [isAutoTrading, setIsAutoTrading] = useState(false);
  const [scanResults, setScanResults] = useState<ArbitrageOpportunity[]>([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 模拟套利机会扫描
  const handleScan = async () => {
    setIsScanning(true);

    // 模拟扫描过程
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 生成模拟的套利机会
    const mockOpportunities: ArbitrageOpportunity[] = [
      {
        id: '1',
        symbol: 'INJ/USDT',
        exchanges: ['Injective', 'Binance'],
        priceDiff: 0.85,
        expectedProfit: 127.5,
        confidence: 92,
        timestamp: Date.now(),
      },
      {
        id: '2',
        symbol: 'INJ/USDT',
        exchanges: ['Injective', 'Coinbase'],
        priceDiff: 0.62,
        expectedProfit: 93.0,
        confidence: 78,
        timestamp: Date.now(),
      },
      {
        id: '3',
        symbol: 'INJ/USDT',
        exchanges: ['Injective', 'Kraken'],
        priceDiff: 0.34,
        expectedProfit: 51.0,
        confidence: 65,
        timestamp: Date.now(),
      },
    ];

    setScanResults(mockOpportunities);
    setIsScanning(false);
  };

  const handleAutoTrade = () => {
    setIsAutoTrading(!isAutoTrading);

    if (!isAutoTrading) {
      // 开始自动套利
      const interval = setInterval(() => {
        if (scanResults.length > 0) {
          // 模拟执行套利交易
          const opportunity = scanResults[0];
          const trade = {
            ...opportunity,
            executed: true,
            profit: opportunity.expectedProfit * 0.95, // 考虑滑点
            timestamp: Date.now(),
          };

          setOpportunities(prev => [trade, ...prev.slice(0, 9)]); // 保留最近10条
        }
      }, 5000);

      // 存储interval ID以便清理
      (window as any).arbitrageInterval = interval;
    } else {
      // 停止自动套利
      if ((window as any).arbitrageInterval) {
        clearInterval((window as any).arbitrageInterval);
        (window as any).arbitrageInterval = undefined;
      }
    }
  };

  const handleManualTrade = (opportunity: ArbitrageOpportunity) => {
    const trade = {
      ...opportunity,
      executed: true,
      profit: opportunity.expectedProfit * 0.98, // 手动交易考虑更多滑点
      timestamp: Date.now(),
    };

    setOpportunities(prev => [trade, ...prev.slice(0, 9)]);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'success';
    if (confidence >= 60) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        无风险套利交易
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        跨平台价格差异套利：在不同交易所间发现价格差异并进行无风险套利。
      </Alert>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
        {/* 控制面板 */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            套利控制
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleScan}
              disabled={isScanning}
              fullWidth
            >
              {isScanning ? '扫描中...' : '扫描套利机会'}
            </Button>

            {isScanning && (
              <LinearProgress sx={{ mt: 1 }} />
            )}

            <Button
              variant={isAutoTrading ? 'outlined' : 'contained'}
              color={isAutoTrading ? 'error' : 'success'}
              startIcon={isAutoTrading ? <StopIcon /> : <PlayIcon />}
              onClick={handleAutoTrade}
              disabled={scanResults.length === 0}
              fullWidth
            >
              {isAutoTrading ? '停止自动套利' : '开始自动套利'}
            </Button>

            <Alert severity="warning" sx={{ mt: 1 }}>
              自动套利将自动执行发现的套利机会，请谨慎使用。
            </Alert>
          </Box>
        </Paper>

        {/* 套利机会列表 */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            套利机会 ({scanResults.length})
          </Typography>

            {scanResults.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  {isScanning ? '正在扫描套利机会...' : '暂无套利机会，点击扫描按钮开始'}
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>交易对</TableCell>
                      <TableCell>交易所</TableCell>
                      <TableCell align="right">价差</TableCell>
                      <TableCell align="right">预期利润</TableCell>
                      <TableCell align="center">置信度</TableCell>
                      <TableCell align="center">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scanResults.map((opportunity) => (
                      <TableRow key={opportunity.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {opportunity.symbol}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {opportunity.exchanges.join(' ↔ ')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="success.main">
                            +{opportunity.priceDiff.toFixed(2)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            ${opportunity.expectedProfit.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${opportunity.confidence}%`}
                            color={getConfidenceColor(opportunity.confidence) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleManualTrade(opportunity)}
                            disabled={isAutoTrading}
                          >
                            执行
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

        {/* 交易记录 */}
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              套利交易记录
            </Typography>

            {opportunities.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  暂无交易记录
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>时间</TableCell>
                      <TableCell>交易对</TableCell>
                      <TableCell>交易所</TableCell>
                      <TableCell align="right">价差</TableCell>
                      <TableCell align="right">实际利润</TableCell>
                      <TableCell align="center">状态</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {opportunities.map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(trade.timestamp).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {trade.symbol}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {trade.exchanges.join(' → ')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="success.main">
                            +{trade.priceDiff.toFixed(2)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                            +${(trade as any).profit?.toFixed(2) || '0.00'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label="已完成"
                            color="success"
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
      </Box>

      {/* 统计信息 */}
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
          套利统计
        </Typography>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: 2
        }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              发现机会
            </Typography>
            <Typography variant="h6">
              {scanResults.length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              执行交易
            </Typography>
            <Typography variant="h6">
              {opportunities.length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              总利润
            </Typography>
            <Typography variant="h6" sx={{ color: 'success.main' }}>
              ${opportunities.reduce((sum, trade) => sum + ((trade as any).profit || 0), 0).toFixed(2)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              成功率
            </Typography>
            <Typography variant="h6">
              {opportunities.length > 0 ? '100%' : '0%'}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
