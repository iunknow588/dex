import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  TrendingUp as TrendUpIcon,
  TrendingDown as TrendDownIcon,
} from '@mui/icons-material';
import { useWalletStore } from '../../data/store/walletStore';
import { useTradingStore } from '../../data/store/tradingStore';
import { TripleHedgeCalculator } from '../../business/core/services/risk/TripleHedgeCalculator';
import { TradingFormData, FormErrors, OrderStatus } from '../../data/types';

interface TripleHedgeTradingFormProps {
  marketId?: string;
}

export const TripleHedgeTradingForm: React.FC<TripleHedgeTradingFormProps> = ({ 
  marketId = 'INJ/USDT' 
}) => {
  const { wallet } = useWalletStore();
  const { addOrder } = useTradingStore();
  const calculator = new TripleHedgeCalculator();
  
  const [formData, setFormData] = useState<TradingFormData>({
    side: 'buy',
    type: 'limit',
    price: '',
    quantity: '',
    timeInForce: 'GTC',
  });
  
  const [leverage, setLeverage] = useState(10);
  const [stopLossPercentage, setStopLossPercentage] = useState(5);
  const [takeProfitPercentage, setTakeProfitPercentage] = useState(10);
  const [riskPercentage] = useState(2);
  const [errors, setErrors] = useState<FormErrors>({});
  const [hedgeAnalysis, setHedgeAnalysis] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const accountBalance = wallet.balance?.[0]?.amount || '0';

  const calculateStopLossPrice = (entryPrice: string, percentage: number): string => {
    if (!entryPrice) return '';
    const price = parseFloat(entryPrice);
    return (price * (1 - percentage / 100)).toFixed(8);
  };

  const calculateTakeProfitPrice = (entryPrice: string, percentage: number): string => {
    if (!entryPrice) return '';
    const price = parseFloat(entryPrice);
    return (price * (1 + percentage / 100)).toFixed(8);
  };

  useEffect(() => {
    if (formData.price && accountBalance !== '0') {
      const stopLossPrice = calculateStopLossPrice(formData.price, stopLossPercentage);
      const takeProfitPrice = calculateTakeProfitPrice(formData.price, takeProfitPercentage);
      
      setIsCalculating(true);
      
      try {
        const analysis = calculator.generateTripleHedgeOrder({
          accountBalance,
          leverage,
          entryPrice: formData.price,
          stopLossPrice,
          takeProfitPrice,
          riskPercentage: riskPercentage / 100,
        });
        
        setHedgeAnalysis(analysis);
        
        if (!formData.quantity) {
          setFormData(prev => ({
            ...prev,
            quantity: analysis.riskAnalysis.maxQuantity,
          }));
        }
      } catch (error) {
        console.error('计算错误:', error);
      } finally {
        setIsCalculating(false);
      }
    }
  }, [formData.price, leverage, stopLossPercentage, takeProfitPercentage, riskPercentage, accountBalance]);

  const handleSideChange = (
    _event: React.MouseEvent<HTMLElement>,
    newSide: 'buy' | 'sell' | null
  ) => {
    if (newSide !== null) {
      setFormData(prev => ({ ...prev, side: newSide }));
    }
  };

  const handleInputChange = (field: keyof TradingFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = '请输入有效的价格';
    }
    
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = '请输入有效的数量';
    }
    
    if (!wallet.isConnected) {
      newErrors.general = '请先连接钱包';
    }
    
    if (hedgeAnalysis && parseFloat(hedgeAnalysis.riskAnalysis.activeMargin) > parseFloat(accountBalance) * 0.8) {
      newErrors.general = '账户余额不足，无法支持动态对冲保证金';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    if (!hedgeAnalysis) {
      setErrors({ general: '请等待风险分析完成' });
      return;
    }

    const stopLossPrice = calculateStopLossPrice(formData.price, stopLossPercentage);
    const takeProfitPrice = calculateTakeProfitPrice(formData.price, takeProfitPercentage);

    // 创建主订单
    const mainOrder = {
      id: Math.random().toString(36).substring(2, 15),
      marketId,
      side: formData.side,
      type: formData.type,
      price: formData.price,
      quantity: formData.quantity,
      filledQuantity: '0',
      remainingQuantity: formData.quantity,
      status: 'pending' as const,
      orderState: OrderStatus.NORMAL_RUNNING, // 初始状态为正常运行期
      timeInForce: formData.timeInForce,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // 创建止损对冲单
    const stopLossOrder = {
      id: Math.random().toString(36).substring(2, 15),
      marketId,
      side: (formData.side === 'buy' ? 'sell' : 'buy') as 'buy' | 'sell',
      type: 'limit' as const,
      price: stopLossPrice,
      quantity: formData.quantity,
      filledQuantity: '0',
      remainingQuantity: formData.quantity,
      status: 'pending' as const,
      orderState: OrderStatus.RISK_LOCKING, // 反向风险锁定
      timeInForce: 'GTC' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // 创建止盈对冲单
    const takeProfitOrder = {
      id: Math.random().toString(36).substring(2, 15),
      marketId,
      side: (formData.side === 'buy' ? 'sell' : 'buy') as 'buy' | 'sell',
      type: 'limit' as const,
      price: takeProfitPrice,
      quantity: formData.quantity,
      filledQuantity: '0',
      remainingQuantity: formData.quantity,
      status: 'pending' as const,
      orderState: OrderStatus.PROFIT_LOCKING, // 正向利润锁定
      timeInForce: 'GTC' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // 添加到订单列表
    addOrder(mainOrder);
    addOrder(stopLossOrder);
    addOrder(takeProfitOrder);

    setFormData({
      side: 'buy',
      type: 'limit',
      price: '',
      quantity: '',
      timeInForce: 'GTC',
    });
    
    alert('成功创建主订单、止损单和止盈单！');
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        动态对冲机制（风险+利润管理）
      </Typography>
      
      {/* 参数设置 */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
        <Typography variant="subtitle2" gutterBottom>
          风险参数
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>合约倍数</InputLabel>
            <Select
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              label="合约倍数"
            >
              <MenuItem value={5}>5倍</MenuItem>
              <MenuItem value={10}>10倍</MenuItem>
              <MenuItem value={15}>15倍</MenuItem>
              <MenuItem value={20}>20倍</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth size="small">
            <InputLabel>止损比例</InputLabel>
            <Select
              value={stopLossPercentage}
              onChange={(e) => setStopLossPercentage(Number(e.target.value))}
              label="止损比例"
            >
              <MenuItem value={3}>3%</MenuItem>
              <MenuItem value={5}>5%</MenuItem>
              <MenuItem value={10}>10%</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth size="small">
            <InputLabel>止盈比例</InputLabel>
            <Select
              value={takeProfitPercentage}
              onChange={(e) => setTakeProfitPercentage(Number(e.target.value))}
              label="止盈比例"
            >
              <MenuItem value={5}>5%</MenuItem>
              <MenuItem value={10}>10%</MenuItem>
              <MenuItem value={20}>20%</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* 智能策略提示 */}
      {hedgeAnalysis && (
        <Alert 
          severity="info"
          icon={<InfoIcon />}
          sx={{ mb: 2 }}
        >
          <Typography variant="body2">
            <strong>智能策略:</strong> {hedgeAnalysis.strategy.hedgeMode === 'stopLoss' ? '优先激活风险锁定' :
              hedgeAnalysis.strategy.hedgeMode === 'takeProfit' ? '优先激活利润锁定' : '智能对冲策略'}
          </Typography>
          <Typography variant="body2">
            <strong>节省保证金:</strong> {hedgeAnalysis.strategy.estimatedSavings} USDT
          </Typography>
        </Alert>
      )}

      {/* 风险分析 */}
      {hedgeAnalysis && (
        <Alert 
          severity={hedgeAnalysis.riskAnalysis.activeMargin < parseFloat(accountBalance) * 0.8 ? 'success' : 'error'}
          icon={hedgeAnalysis.riskAnalysis.activeMargin < parseFloat(accountBalance) * 0.8 ? <CheckIcon /> : <WarningIcon />}
          sx={{ mb: 2 }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="body2">
              <strong>最大可下单量:</strong> {hedgeAnalysis.riskAnalysis.maxQuantity}
            </Typography>
            <Typography variant="body2">
              <strong>实际保证金:</strong> {hedgeAnalysis.riskAnalysis.activeMargin} USDT
            </Typography>
            <Typography variant="body2">
              <strong>最大损失:</strong> {hedgeAnalysis.riskAnalysis.maxLoss} USDT
            </Typography>
            <Typography variant="body2">
              <strong>最大盈利:</strong> {hedgeAnalysis.riskAnalysis.maxProfit} USDT
            </Typography>
          </Box>
        </Alert>
      )}

      {/* 交易表单 */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <ToggleButtonGroup
          value={formData.side}
          exclusive
          onChange={handleSideChange}
          aria-label="交易方向"
          fullWidth
        >
          <ToggleButton value="buy" sx={{ color: 'success.main' }}>
            买入
          </ToggleButton>
          <ToggleButton value="sell" sx={{ color: 'error.main' }}>
            卖出
          </ToggleButton>
        </ToggleButtonGroup>
        
        <FormControl fullWidth>
          <InputLabel>订单类型</InputLabel>
          <Select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'limit' | 'market' }))}
            label="订单类型"
          >
            <MenuItem value="limit">限价单</MenuItem>
            <MenuItem value="market">市价单</MenuItem>
          </Select>
        </FormControl>
        
        {formData.type === 'limit' && (
          <TextField
            fullWidth
            label="入场价格"
            type="number"
            value={formData.price}
            onChange={handleInputChange('price')}
            error={!!errors.price}
            helperText={errors.price}
            inputProps={{ min: 0, step: 0.01 }}
          />
        )}
        
        <TextField
          fullWidth
          label="数量（主单+对冲单）"
          type="number"
          value={formData.quantity}
          onChange={handleInputChange('quantity')}
          error={!!errors.quantity}
          helperText={errors.quantity || (hedgeAnalysis ? `建议: ${hedgeAnalysis.riskAnalysis.maxQuantity}` : '')}
          inputProps={{ min: 0, step: 0.01 }}
          disabled={isCalculating}
        />
        
        {formData.price && (
          <>
            <TextField
              fullWidth
              label="止损价格"
              type="number"
              value={calculateStopLossPrice(formData.price, stopLossPercentage)}
              disabled
              InputProps={{
                startAdornment: <TrendDownIcon sx={{ color: 'error.main', mr: 1 }} />,
              }}
              helperText={`-${stopLossPercentage}% 下跌保护`}
            />
            
            <TextField
              fullWidth
              label="止盈价格"
              type="number"
              value={calculateTakeProfitPrice(formData.price, takeProfitPercentage)}
              disabled
              InputProps={{
                startAdornment: <TrendUpIcon sx={{ color: 'success.main', mr: 1 }} />,
              }}
              helperText={`+${takeProfitPercentage}% 盈利锁定`}
            />
          </>
        )}
        
        {errors.general && (
          <Alert severity="error">
            {errors.general}
          </Alert>
        )}
        
        {isCalculating && (
          <Box>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              正在计算风险分析...
            </Typography>
          </Box>
        )}
        
        <Button
          variant="contained"
          fullWidth
          onClick={handleSubmit}
          disabled={!wallet.isConnected || isCalculating || (hedgeAnalysis && parseFloat(hedgeAnalysis.riskAnalysis.activeMargin) > parseFloat(accountBalance) * 0.8)}
          color={formData.side === 'buy' ? 'success' : 'error'}
          size="large"
        >
          {isCalculating ? '计算中...' : `提交动态对冲订单`}
        </Button>
        
        {/* 订单摘要 */}
        {hedgeAnalysis && formData.price && formData.quantity && (
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" gutterBottom>
              订单摘要
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">主订单:</Typography>
              <Typography variant="body2">
                {formData.side === 'buy' ? '买入' : '卖出'} {formData.quantity} @ {formData.price}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">止损单:</Typography>
              <Typography variant="body2" color="error.main">
                卖出 {formData.quantity} @ {calculateStopLossPrice(formData.price, stopLossPercentage)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">止盈单:</Typography>
              <Typography variant="body2" color="success.main">
                卖出 {formData.quantity} @ {calculateTakeProfitPrice(formData.price, takeProfitPercentage)}
              </Typography>
            </Box>
            <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
              <Chip
                label={`对冲数量: ${formData.quantity}`}
                color="success"
                size="small"
                sx={{ mr: 1 }}
              />
              <Chip 
                label={`节省: ${hedgeAnalysis.strategy.estimatedSavings} USDT`} 
                color="info" 
                size="small"
              />
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
};
