/**
 * 无风险套利交易表单
 * 检测并执行跨交易所的价格差异套利机会
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert,
  Card,
  CardContent,
  Chip,
  LinearProgress,
} from '@mui/material';
import { useWalletStore } from '../../data/store/walletStore';
import { useTradingStore } from '../../data/store/tradingStore';
import { TradingFormData, FormErrors, OrderStatus } from '../../data/types';
import { ErrorHandler } from '../../data/utils/errorHandler';

interface ArbitrageOpportunity {
  id: string;
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  potentialProfit: number;
  volume: number;
  confidence: number;
}

export const ArbitrageTradingForm: React.FC = () => {
  const { wallet } = useWalletStore();
  const { addOrder } = useTradingStore();

  const [formData, setFormData] = useState<TradingFormData>({
    side: 'buy',
    type: 'market',
    price: '',
    quantity: '',
    timeInForce: 'GTC',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [scanning, setScanning] = useState(false);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<ArbitrageOpportunity | null>(null);

  // 模拟套利机会扫描
  const scanOpportunities = async () => {
    setScanning(true);
    // 模拟API调用
    setTimeout(() => {
      const mockOpportunities: ArbitrageOpportunity[] = [
        {
          id: '1',
          symbol: 'INJ/USDT',
          buyExchange: 'Injective',
          sellExchange: 'Binance',
          buyPrice: 15.20,
          sellPrice: 15.25,
          spread: 0.33,
          potentialProfit: 245.60,
          volume: 10000,
          confidence: 85,
        },
        {
          id: '2',
          symbol: 'ATOM/USDT',
          buyExchange: 'Injective',
          sellExchange: 'Coinbase',
          buyPrice: 8.45,
          sellPrice: 8.48,
          spread: 0.35,
          potentialProfit: 89.25,
          volume: 5000,
          confidence: 78,
        },
      ];
      setOpportunities(mockOpportunities);
      setScanning(false);
    }, 2000);
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = '请输入有效的数量';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !selectedOpportunity) return;

    try {
      // 创建买入订单
      const buyOrder = {
        id: Math.random().toString(36).substring(2, 15),
        marketId: selectedOpportunity.symbol,
        side: 'buy' as const,
        type: 'market' as const,
        price: selectedOpportunity.buyPrice.toString(),
        quantity: formData.quantity,
        filledQuantity: '0',
        remainingQuantity: formData.quantity,
        status: 'pending' as const,
        orderState: OrderStatus.NORMAL_RUNNING,
        timeInForce: 'GTC' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // 创建卖出订单
      const sellOrder = {
        id: Math.random().toString(36).substring(2, 15),
        marketId: selectedOpportunity.symbol,
        side: 'sell' as const,
        type: 'market' as const,
        price: selectedOpportunity.sellPrice.toString(),
        quantity: formData.quantity,
        filledQuantity: '0',
        remainingQuantity: formData.quantity,
        status: 'pending' as const,
        orderState: OrderStatus.NORMAL_RUNNING,
        timeInForce: 'GTC' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      addOrder(buyOrder);
      addOrder(sellOrder);

      // 重置表单
      setFormData({
        side: 'buy',
        type: 'market',
        price: '',
        quantity: '',
        timeInForce: 'GTC',
      });
      setSelectedOpportunity(null);

      alert('套利订单已创建！系统将在两个交易所同时执行买入和卖出操作。');

    } catch (error) {
      const appError = ErrorHandler.getInstance().handleError(error);
      console.error('创建套利订单失败:', appError.message);
      alert(`创建套利订单失败: ${appError.message}`);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'success';
    if (confidence >= 60) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        无风险套利模式
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        自动检测跨交易所价格差异，执行无风险套利交易
      </Typography>

      {/* 套利机会扫描 */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          onClick={scanOpportunities}
          disabled={scanning}
          fullWidth
          sx={{ mb: 2 }}
        >
          {scanning ? '扫描中...' : '扫描套利机会'}
        </Button>

        {scanning && <LinearProgress sx={{ mb: 2 }} />}

        {!scanning && opportunities.length === 0 && (
          <Alert severity="info">
            点击"扫描套利机会"按钮开始检测跨交易所价格差异
          </Alert>
        )}
      </Box>

      {/* 套利机会列表 */}
      {opportunities.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            发现的套利机会
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {opportunities.map((opportunity) => (
              <Box key={opportunity.id} sx={{ width: '100%' }}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedOpportunity?.id === opportunity.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                  }}
                  onClick={() => setSelectedOpportunity(opportunity)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6">{opportunity.symbol}</Typography>
                      <Chip
                        label={`${opportunity.confidence}% 置信度`}
                        color={getConfidenceColor(opportunity.confidence)}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                      <Typography variant="body2">
                        在 {opportunity.buyExchange} 买入: ${opportunity.buyPrice}
                      </Typography>
                      <Typography variant="body2">
                        在 {opportunity.sellExchange} 卖出: ${opportunity.sellPrice}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="success.main">
                        价差: {opportunity.spread.toFixed(2)}% | 预期利润: ${opportunity.potentialProfit.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        交易量: {opportunity.volume.toLocaleString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* 交易参数设置 */}
      {selectedOpportunity && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            交易参数设置
          </Typography>

          <Typography variant="body2" color="primary" gutterBottom>
            已选择套利机会: {selectedOpportunity.symbol} ({selectedOpportunity.buyExchange} ↔ {selectedOpportunity.sellExchange})
          </Typography>

          <Box sx={{ mt: 1 }}>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="交易数量"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                error={!!errors.quantity}
                helperText={errors.quantity}
                placeholder="输入要套利的数量"
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>时间有效期</InputLabel>
                <Select
                  value={formData.timeInForce}
                  onChange={(e) => setFormData({ ...formData, timeInForce: e.target.value })}
                >
                  <MenuItem value="GTC">成交为止 (GTC)</MenuItem>
                  <MenuItem value="IOC">立即成交否则取消 (IOC)</MenuItem>
                  <MenuItem value="FOK">全部成交否则取消 (FOK)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" gutterBottom>
              <strong>套利详情:</strong>
            </Typography>
            <Typography variant="body2">
              • 买入价格: ${selectedOpportunity.buyPrice}
            </Typography>
            <Typography variant="body2">
              • 卖出价格: ${selectedOpportunity.sellPrice}
            </Typography>
            <Typography variant="body2" color="success.main">
              • 预期利润: ${(selectedOpportunity.potentialProfit * (parseFloat(formData.quantity || '0') / selectedOpportunity.volume)).toFixed(2)}
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSubmit}
            sx={{ mt: 2 }}
            disabled={!wallet?.isConnected}
          >
            执行套利交易
          </Button>

          {!wallet?.isConnected && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              请先连接钱包以执行套利交易
            </Alert>
          )}
        </Paper>
      )}

      <Alert severity="info">
        <strong>无风险套利说明:</strong><br />
        • 系统自动检测跨交易所价格差异<br />
        • 同时在两个交易所执行买入和卖出操作<br />
        • 理论上无风险，但需考虑交易手续费和网络延迟<br />
        • 建议使用较小金额测试系统稳定性
      </Alert>
    </Box>
  );
};
