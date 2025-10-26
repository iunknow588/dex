/**
 * 动态对冲机制交易表单
 * 实现智能对冲：创建主订单，根据价格动态创建互斥的对冲单（最多只有两单）
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Snackbar,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Info as InfoIcon,
  TrendingUp as TrendUpIcon,
  TrendingDown as TrendDownIcon,
} from '@mui/icons-material';
import { useWalletStore } from '../../data/store/walletStore';
import { useTradingStore } from '../../data/store/tradingStore';
import { HedgeStateManager } from '../../business/core/services/hedge/HedgeStateManager';
import { HedgeConfig, OrderStatus } from '../../data/types';
import { PriceMonitorService } from '../../business/core/services/monitoring/PriceMonitorService';
import { DynamicHedgePanel } from '../hedge/DynamicHedgePanel';
import { TradingFormData, FormErrors } from '../../data/types';
import { ErrorHandler } from '../../data/utils/errorHandler';

interface DynamicHedgeTradingFormProps {
  marketId?: string;
}

export const DynamicHedgeTradingForm: React.FC<DynamicHedgeTradingFormProps> = ({ 
  marketId = 'INJ/USDT' 
}) => {
  const { wallet } = useWalletStore();
  const { addOrder } = useTradingStore();
  
  // 服务实例
  const hedgeManagerRef = useRef<HedgeStateManager>(new HedgeStateManager());
  const priceMonitorRef = useRef<PriceMonitorService>(new PriceMonitorService());
  
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
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [hedgeMechanismEnabled, setHedgeMechanismEnabled] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning' });

  // const accountBalance = wallet.balance?.[0]?.amount || '0'; // 暂时未使用

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

  // 订阅价格更新
  useEffect(() => {
    if (monitoringEnabled && formData.price) {
      const handlePriceUpdate = (price: number) => {
        setCurrentPrice(price);
        hedgeManagerRef.current.handlePriceChange(price);
      };
      
      priceMonitorRef.current.subscribe(marketId, handlePriceUpdate).catch((error) => {
        const appError = ErrorHandler.getInstance().handleError(error);
        console.error('Failed to subscribe to price updates:', appError.message);
        // 如果真实连接失败，使用模拟价格
        const mockPrice = parseFloat(formData.price);
        const mockInterval = setInterval(() => {
          const newPrice = PriceMonitorService.getMockPrice(mockPrice, 0.02);
          handlePriceUpdate(newPrice);
        }, 2000);
        
        return () => clearInterval(mockInterval);
      });
    }
    
    return () => {
      if (monitoringEnabled) {
        priceMonitorRef.current.unsubscribe(marketId);
      }
    };
  }, [monitoringEnabled, marketId, formData.price]);

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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
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
      
      // 添加到订单列表
      addOrder(mainOrder);
      
      // 初始化对冲策略管理器
      const config: HedgeConfig = {
      mainOrderId: mainOrder.id,
      entryPrice: parseFloat(formData.price),
      riskLockPrice: parseFloat(stopLossPrice),
      profitLockPrice: parseFloat(takeProfitPrice),
      quantity: formData.quantity,
      side: formData.side,
      currentPrice: parseFloat(formData.price),
      };
      
      hedgeManagerRef.current.initialize(config);

      // 注册订单状态更新回调
      hedgeManagerRef.current.onOrderStateUpdateCallback((orderId, newState) => {
        // 这里可以触发订单状态更新
        console.log(`Order ${orderId} state updated to ${newState}`);
        // 可以通过全局状态管理或其他方式更新订单状态
      });

      // 启用价格监控
      setMonitoringEnabled(true);
      
      setSnackbar({
        open: true,
        message: '主订单已创建，动态对冲监控已启动',
        severity: 'success',
      });
      
      // 重置表单
      setFormData({
        side: 'buy',
        type: 'limit',
        price: '',
        quantity: '',
        timeInForce: 'GTC',
      });
      
    } catch (error) {
      console.error('Failed to create order:', error);
      setSnackbar({
        open: true,
        message: '创建订单失败',
        severity: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理下一步操作
  const handleExecuteAction = async (action: any) => {
    if (!action) return;
    
    const config = hedgeManagerRef.current.getConfig();
    const zone = action.type === 'create_hedge' && action.price === config?.riskLockPrice
      ? 'RISK_LOCK'
      : 'PROFIT_LOCK';

    const hedgeOrderId = hedgeManagerRef.current.createHedgeOrder(zone as any);
    
    // 创建对冲订单
    const hedgeOrder = {
      id: hedgeOrderId,
      marketId,
      side: action.side,
      type: 'limit' as const,
      price: action.price.toString(),
      quantity: hedgeManagerRef.current.getConfig()?.quantity || formData.quantity,
      filledQuantity: '0',
      remainingQuantity: hedgeManagerRef.current.getConfig()?.quantity || formData.quantity,
      status: 'pending' as const,
      orderState: zone === 'RISK_LOCK' ? OrderStatus.RISK_LOCKING : OrderStatus.PROFIT_LOCKING,
      timeInForce: 'GTC' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    addOrder(hedgeOrder);
    
    setSnackbar({
      open: true,
      message: `对冲单已创建: ${action.side === 'buy' ? '买入' : '卖出'} @ ${action.price}`,
      severity: 'info',
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          智能对冲机制
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={hedgeMechanismEnabled}
              onChange={(e) => setHedgeMechanismEnabled(e.target.checked)}
              color="primary"
            />
          }
          label={hedgeMechanismEnabled ? "已开启" : "已关闭"}
        />
      </Box>

      {/* 说明提示 */}
      <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>智能对冲机制：</strong>
        </Typography>
        <Typography variant="body2" component="div">
          • 第1步：创建主订单
        </Typography>
        <Typography variant="body2" component="div">
          • 第2步：根据价格自动创建互斥的对冲单（风险锁定或利润锁定）
        </Typography>
        <Typography variant="body2" component="div">
          • 第3步：价格变化时智能切换对冲策略
        </Typography>
      </Alert>
      
      {/* 动态对冲监控面板 */}
      {monitoringEnabled && (
        <DynamicHedgePanel
          manager={hedgeManagerRef.current}
          monitor={priceMonitorRef.current}
          marketId={marketId}
          onExecuteAction={handleExecuteAction}
        />
      )}
      
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
          label="数量"
          type="number"
          value={formData.quantity}
          onChange={handleInputChange('quantity')}
          error={!!errors.quantity}
          helperText={errors.quantity}
          inputProps={{ min: 0, step: 0.01 }}
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
        
        <Button
          variant="contained"
          fullWidth
          onClick={handleSubmit}
          disabled={!wallet.isConnected || isSubmitting || monitoringEnabled}
          color={formData.side === 'buy' ? 'success' : 'error'}
          size="large"
        >
          {isSubmitting ? '创建中...' : '创建主订单并启动动态对冲'}
        </Button>
        
        {/* 当前价格显示 */}
        {currentPrice && (
          <Alert severity="info">
            <Typography variant="body2">
              当前价格: <strong>{currentPrice.toFixed(8)}</strong>
            </Typography>
          </Alert>
        )}
      </Box>
      
      {/* Snackbar通知 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
};

