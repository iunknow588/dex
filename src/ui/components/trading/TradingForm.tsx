import React, { useState } from 'react';
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
} from '@mui/material';
import { useWalletStore } from '../../data/store/walletStore';
import { useTradingStore } from '../../data/store/tradingStore';
import { TradingFormData, FormErrors, OrderStatus } from '../../data/types';

export const TradingForm: React.FC = () => {
  const { wallet } = useWalletStore();
  const { addOrder } = useTradingStore();
  
  const [formData, setFormData] = useState<TradingFormData>({
    side: 'buy',
    type: 'limit',
    price: '',
    quantity: '',
    timeInForce: 'GTC',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSideChange = (
    _event: React.MouseEvent<HTMLElement>,
    newSide: 'buy' | 'sell' | null
  ) => {
    if (newSide !== null) {
      setFormData(prev => ({ ...prev, side: newSide }));
    }
  };

  const handleTypeChange = (event: any) => {
    setFormData(prev => ({ ...prev, type: event.target.value as 'limit' | 'market' }));
  };

  const handleInputChange = (field: keyof TradingFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
    // 清除相关错误
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = '请输入有效的数量';
    }
    
    if (formData.type === 'limit' && (!formData.price || parseFloat(formData.price) <= 0)) {
      newErrors.price = '请输入有效的价格';
    }
    
    if (!wallet.isConnected) {
      newErrors.general = '请先连接钱包';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    // 创建订单
    const order = {
      id: Math.random().toString(36).substring(2, 15),
      marketId: 'INJ/USDT',
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
    
    addOrder(order);
    
    // 重置表单
    setFormData({
      side: 'buy',
      type: 'limit',
      price: '',
      quantity: '',
      timeInForce: 'GTC',
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        交易表单
      </Typography>
      
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
            onChange={handleTypeChange}
            label="订单类型"
          >
            <MenuItem value="limit">限价单</MenuItem>
            <MenuItem value="market">市价单</MenuItem>
          </Select>
        </FormControl>
        
        {formData.type === 'limit' && (
          <TextField
            fullWidth
            label="价格"
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
        
        <FormControl fullWidth>
          <InputLabel>有效期</InputLabel>
          <Select
            value={formData.timeInForce}
            onChange={(e) => setFormData(prev => ({ ...prev, timeInForce: e.target.value as 'GTC' | 'IOC' | 'FOK' }))}
            label="有效期"
          >
            <MenuItem value="GTC">撤销前有效</MenuItem>
            <MenuItem value="IOC">立即成交或撤销</MenuItem>
            <MenuItem value="FOK">全部成交或撤销</MenuItem>
          </Select>
        </FormControl>
        
        {errors.general && (
          <Typography color="error" variant="body2">
            {errors.general}
          </Typography>
        )}
        
        <Button
          variant="contained"
          fullWidth
          onClick={handleSubmit}
          disabled={!wallet.isConnected}
          color={formData.side === 'buy' ? 'success' : 'error'}
        >
          {formData.side === 'buy' ? '买入' : '卖出'} {formData.type === 'limit' ? '限价单' : '市价单'}
        </Button>
      </Box>
    </Box>
  );
};
