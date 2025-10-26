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
} from '@mui/icons-material';
import { useWalletStore } from '../../data/store/walletStore';
import { useTradingStore } from '../../data/store/tradingStore';
import { StrictHedgeCalculator } from '../../business/core/services/risk/StrictHedgeCalculator';
import { TradingFormData, FormErrors, OrderStatus } from '../../data/types';

interface StrictHedgeTradingFormProps {
  marketId?: string;
}

export const StrictHedgeTradingForm: React.FC<StrictHedgeTradingFormProps> = ({ 
  marketId = 'INJ/USDT' 
}) => {
  const { wallet } = useWalletStore();
  const { addOrder } = useTradingStore();
  const calculator = new StrictHedgeCalculator();
  
  const [formData, setFormData] = useState<TradingFormData>({
    side: 'buy',
    type: 'limit',
    price: '',
    quantity: '',
    timeInForce: 'GTC',
  });
  
  const [leverage, setLeverage] = useState(10);
  const [stopLossPercentage, setStopLossPercentage] = useState(5);
  const [riskPercentage, setRiskPercentage] = useState(2);
  const [errors, setErrors] = useState<FormErrors>({});
  const [hedgeAnalysis, setHedgeAnalysis] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // 计算账户余额
  const accountBalance = wallet.balance?.[0]?.amount || '0';

  // 计算止损价格
  const calculateStopLossPrice = (entryPrice: string, percentage: number): string => {
    if (!entryPrice) return '';
    const price = parseFloat(entryPrice);
    return (price * (1 - percentage / 100)).toFixed(8);
  };

  // 计算建议
  useEffect(() => {
    if (formData.price && accountBalance !== '0') {
      const stopLossPrice = calculateStopLossPrice(formData.price, stopLossPercentage);
      
      setIsCalculating(true);
      
      try {
        const analysis = calculator.generateStrictHedgeOrder({
          accountBalance,
          leverage,
          entryPrice: formData.price,
          stopLossPrice,
          riskPercentage: riskPercentage / 100,
        });
        
        setHedgeAnalysis(analysis);
        
        // 自动填充建议数量
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
  }, [formData.price, leverage, stopLossPercentage, riskPercentage, accountBalance]);

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
    
    if (hedgeAnalysis && !hedgeAnalysis.riskAnalysis.canAfford) {
      newErrors.general = '账户余额不足，无法支持双向对冲保证金';
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

    // 创建对冲订单（严格等量）
    const hedgeOrder = {
      id: Math.random().toString(36).substring(2, 15),
      marketId,
      side: (formData.side === 'buy' ? 'sell' : 'buy') as 'buy' | 'sell',
      type: 'limit' as const,
      price: calculateStopLossPrice(formData.price, stopLossPercentage),
      quantity: formData.quantity, // 完全相同的数量
      filledQuantity: '0',
      remainingQuantity: formData.quantity,
      status: 'pending' as const,
      orderState: OrderStatus.RISK_LOCKING, // 对冲单为风险锁定期
      timeInForce: 'GTC' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // 添加到订单列表
    addOrder(mainOrder);
    addOrder(hedgeOrder);

    // 重置表单
    setFormData({
      side: 'buy',
      type: 'limit',
      price: '',
      quantity: '',
      timeInForce: 'GTC',
    });
    
    alert('成功创建主订单和对冲订单！');
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        严格对冲交易（防爆仓）
      </Typography>
      
      {/* 风险参数设置 */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
        <Typography variant="subtitle2" gutterBottom>
          风险参数
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
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
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
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
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>风险百分比</InputLabel>
            <Select
              value={riskPercentage}
              onChange={(e) => setRiskPercentage(Number(e.target.value))}
              label="风险百分比"
            >
              <MenuItem value={1}>1%</MenuItem>
              <MenuItem value={2}>2%</MenuItem>
              <MenuItem value={5}>5%</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* 风险分析显示 */}
      {hedgeAnalysis && (
        <Alert 
          severity={hedgeAnalysis.riskAnalysis.canAfford ? 'success' : 'error'}
          icon={hedgeAnalysis.riskAnalysis.canAfford ? <CheckIcon /> : <WarningIcon />}
          sx={{ mb: 2 }}
        >
          <Typography variant="body2">
            <strong>最大可下单量:</strong> {hedgeAnalysis.riskAnalysis.maxQuantity}
          </Typography>
          <Typography variant="body2">
            <strong>所需保证金:</strong> {hedgeAnalysis.riskAnalysis.requiredMargin} USDT
          </Typography>
          <Typography variant="body2">
            <strong>安全边际:</strong> {hedgeAnalysis.riskAnalysis.safetyMargin} USDT
          </Typography>
          <Typography variant="body2">
            <strong>最大损失:</strong> {hedgeAnalysis.riskAnalysis.maxLoss} USDT
          </Typography>
        </Alert>
      )}

      {/* 关键提示 */}
      <Alert icon={<InfoIcon />} sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>严格对冲模式:</strong> 系统将自动创建等量的反向对冲单，
          确保极端行情下不会爆仓。买单和卖单数量完全一致。
        </Typography>
      </Alert>

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
          label="数量（与对冲单相同）"
          type="number"
          value={formData.quantity}
          onChange={handleInputChange('quantity')}
          error={!!errors.quantity}
          helperText={errors.quantity || (hedgeAnalysis ? `建议: ${hedgeAnalysis.riskAnalysis.maxQuantity}` : '')}
          inputProps={{ min: 0, step: 0.01 }}
          disabled={isCalculating}
        />
        
        {formData.price && (
          <TextField
            fullWidth
            label="止损价格（自动计算）"
            type="number"
            value={calculateStopLossPrice(formData.price, stopLossPercentage)}
            disabled
            helperText={`${stopLossPercentage}% 止损，将与对冲单价格相同`}
          />
        )}
        
        {errors.general && (
          <Alert severity="error">
            {errors.general}
          </Alert>
        )}
        
        {isCalculating && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        )}
        
        <Button
          variant="contained"
          fullWidth
          onClick={handleSubmit}
          disabled={!wallet.isConnected || isCalculating || (hedgeAnalysis && !hedgeAnalysis.riskAnalysis.canAfford)}
          color={formData.side === 'buy' ? 'success' : 'error'}
          size="large"
        >
          {isCalculating ? '计算中...' : `提交 ${formData.side === 'buy' ? '买入' : '卖出'} 及对冲订单`}
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">对冲订单:</Typography>
              <Typography variant="body2">
                {formData.side === 'buy' ? '卖出' : '买入'} {formData.quantity} @ {calculateStopLossPrice(formData.price, stopLossPercentage)}
              </Typography>
            </Box>
            <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
              <Chip 
                label={`数量完全一致: ${formData.quantity}`} 
                color="success" 
                size="small"
              />
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
};
