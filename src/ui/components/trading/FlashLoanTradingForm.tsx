/**
 * 闪电贷交易表单
 * 利用闪电贷执行清算赚取平台清算奖励
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
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import { useWalletStore } from '../../data/store/walletStore';
import { useTradingStore } from '../../data/store/tradingStore';
import { TradingFormData, FormErrors, OrderStatus, LiquidationOpportunity, FlashLiquidationParams } from '../../data/types';
import { LiquidationScanner } from '../../business/core/services/liquidation/LiquidationScanner';
import { LiquidationExecutor } from '../../business/core/services/liquidation/LiquidationExecutor';
import { FlashLoanService } from '../../business/core/services/liquidation/FlashLoanService';
import { ErrorHandler } from '../../data/utils/errorHandler';

interface FlashLoanStrategy {
  id: string;
  name: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
  estimatedProfit: number;
  requiredLiquidity: number;
  successRate: number;
}

export const FlashLoanTradingForm: React.FC = () => {
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
  const [selectedOpportunity, setSelectedOpportunity] = useState<LiquidationOpportunity | null>(null);
  const [liquidationOpportunities, setLiquidationOpportunities] = useState<LiquidationOpportunity[]>([]);
  const [liquidationScanner] = useState(() => LiquidationScanner.getInstance());
  const [liquidationExecutor] = useState(() => LiquidationExecutor.getInstance());
  const [flashLoanService] = useState(() => new FlashLoanService({
    providerUrl: 'https://api.injective.network', // Injective EVM RPC
    flashLoanContractAddress: '0x0000000000000000000000000000000000000000', // 闪电贷合约地址
    privateKey: '0x' + '0'.repeat(64), // 实际使用时需要真实的私钥
    maxLoanAmount: '1000000', // 最大贷款金额
    supportedAssets: ['INJ', 'USDT', 'USDC', 'ATOM']
  }));
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!selectedOpportunity) {
      newErrors.quantity = '请选择清算机会';
      return false;
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = '请输入有效的清算金额';
    }

    const liquidationAmount = parseFloat(formData.quantity || '0');
    if (liquidationAmount < 100) {
      newErrors.quantity = '最小清算金额为100 USDT';
    }

    if (liquidationAmount > selectedOpportunity.maxLiquidationAmount) {
      newErrors.quantity = `最大清算金额为${selectedOpportunity.maxLiquidationAmount.toFixed(2)} USDT`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 扫描清算机会
  const scanLiquidationOpportunities = async () => {
    try {
      const opportunities = await liquidationScanner.scanLiquidationOpportunities();
      setLiquidationOpportunities(opportunities);
    } catch (error) {
      const appError = ErrorHandler.getInstance().handleError(error);
      console.error('扫描清算机会失败:', appError.message);
      // 发生错误时显示空列表
      setLiquidationOpportunities([]);
    }
  };

  // 初始化时扫描一次并设置定期扫描
  React.useEffect(() => {
    // 立即扫描一次
    scanLiquidationOpportunities();

    // 设置监听器接收实时更新
    const handleOpportunitiesUpdate = (opportunities: LiquidationOpportunity[]) => {
      setLiquidationOpportunities(opportunities);
    };

    liquidationScanner.addListener(handleOpportunitiesUpdate);

    // 开始定期扫描（每30秒）
    liquidationScanner.startScanning(30000);

    // 清理函数
    return () => {
      liquidationScanner.removeListener(handleOpportunitiesUpdate);
      liquidationScanner.stopScanning();
    };
  }, [liquidationScanner]);

  const handleSubmit = async () => {
    if (!validateForm() || !selectedOpportunity) return;

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      // 准备闪电贷清算参数
      const flashParams: FlashLiquidationParams = {
        marketId: selectedOpportunity.marketId,
        subaccountId: selectedOpportunity.subaccountId,
        liquidationAmount: formData.quantity || '0',
        collateralAsset: selectedOpportunity.collateralAsset,
        debtAsset: selectedOpportunity.debtAsset,
        slippageTolerance: 0.005, // 0.5%滑点容忍度
        deadline: Math.floor(Date.now() / 1000) + 300 // 5分钟截止时间
      };

      // 执行闪电贷清算
      const result = await liquidationExecutor.executeFlashLiquidation(selectedOpportunity, flashParams);

      // 记录执行结果
      setExecutionResult(result);

      // 如果执行成功，添加到订单历史
      if (result.success) {
        const flashLoanOrder = {
          id: Math.random().toString(36).substring(2, 15),
          marketId: selectedOpportunity.marketId,
          side: 'liquidation' as const,
          type: 'market' as const,
          price: selectedOpportunity.position.markPrice,
          quantity: formData.quantity || '0',
          filledQuantity: formData.quantity || '0',
          remainingQuantity: '0',
          status: 'filled' as const,
          orderState: OrderStatus.NORMAL_RUNNING,
          timeInForce: 'IOC' as const,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          liquidationDetails: {
            opportunity: selectedOpportunity,
            liquidationBonus: selectedOpportunity.liquidationBonus,
            estimatedProfit: selectedOpportunity.estimatedProfit,
            executionResult: result
          },
        };

        addOrder(flashLoanOrder);
      }

      // 重置表单
      setFormData({
        side: 'buy',
        type: 'market',
        price: '',
        quantity: '',
        timeInForce: 'GTC',
      });
      setSelectedOpportunity(null);

      // 重新扫描机会
      setTimeout(() => {
        scanLiquidationOpportunities();
      }, 2000);

    } catch (error) {
      const appError = ErrorHandler.getInstance().handleError(error);
      console.error('闪电贷清算执行失败:', appError.message);

      setExecutionResult({
        success: false,
        error: appError.message
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  const getRiskText = (risk: string) => {
    switch (risk) {
      case 'low': return '低风险';
      case 'medium': return '中等风险';
      case 'high': return '高风险';
      default: return '未知风险';
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        闪电贷交易模式
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        利用闪电贷执行清算，赚取平台的清算奖励 (5-10%)
      </Typography>

      {/* 扫描控制 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          系统自动扫描可清算机会，每30秒更新一次
        </Typography>
      </Box>

      {/* 清算机会列表 */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1">
            可清算机会 (健康因子 &lt; 1.0)
          </Typography>
          <Button variant="outlined" size="small" onClick={scanLiquidationOpportunities}>
            重新扫描
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 400, overflow: 'auto' }}>
          {liquidationOpportunities.map((opportunity) => (
            <Card
              key={opportunity.id}
              sx={{
                cursor: 'pointer',
                border: selectedOpportunity?.id === opportunity.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: 2,
                },
              }}
              onClick={() => setSelectedOpportunity(opportunity)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">
                    {opportunity.collateralAsset}/{opportunity.debtAsset}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={`奖励 ${(opportunity.liquidationBonus * 100).toFixed(1)}%`}
                      color="success"
                      size="small"
                    />
                    <Chip
                      label={`利润 $${opportunity.estimatedProfit.toFixed(2)}`}
                      color="primary"
                      size="small"
                    />
                    </Box>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        抵押资产
                      </Typography>
                      <Typography variant="body1">
                        {opportunity.collateralAmount.toLocaleString()} {opportunity.collateralAsset}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        债务资产
                      </Typography>
                      <Typography variant="body1">
                        {opportunity.debtAmount.toLocaleString()} {opportunity.debtAsset}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        健康因子
                      </Typography>
                      <Typography variant="body1" color={opportunity.healthFactor < 0.9 ? 'error.main' : 'warning.main'}>
                        {opportunity.healthFactor.toFixed(3)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        最大清算
                      </Typography>
                      <Typography variant="body1">
                        {opportunity.maxLiquidationAmount.toLocaleString()} USDT
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      </Box>

      {/* 清算参数设置 */}
      {selectedOpportunity && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            清算参数设置
          </Typography>

          <Typography variant="body2" color="primary" gutterBottom>
            已选择清算机会: {selectedOpportunity.collateralAsset}/{selectedOpportunity.debtAsset}
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            清算奖励: {(selectedOpportunity.liquidationBonus * 100).toFixed(1)}% |
            预估利润: ${selectedOpportunity.estimatedProfit.toFixed(2)}
          </Alert>

          <Box sx={{ mt: 1 }}>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="清算金额 (USDT)"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                error={!!errors.quantity}
                helperText={errors.quantity || `最大清算金额: ${selectedOpportunity.maxLiquidationAmount.toFixed(2)} USDT`}
                placeholder="输入要清算的债务金额"
                type="number"
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>执行时间限制</InputLabel>
                <Select
                  value={formData.timeInForce}
                  onChange={(e) => setFormData({ ...formData, timeInForce: e.target.value })}
                >
                  <MenuItem value="IOC">立即完成 (IOC)</MenuItem>
                  <MenuItem value="FOK">全部完成或取消 (FOK)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" gutterBottom>
              <strong>清算预估:</strong>
            </Typography>
            <Typography variant="body2">
              • 清算金额: ${formData.quantity || '0'} USDT
            </Typography>
            <Typography variant="body2" color="success.main">
              • 清算奖励: ${(parseFloat(formData.quantity || '0') * selectedOpportunity.liquidationBonus).toFixed(2)} USDT
            </Typography>
            <Typography variant="body2">
              • 闪电贷手续费: ${(parseFloat(formData.quantity || '0') * 0.0009).toFixed(2)} USDT
            </Typography>
            <Typography variant="body2">
              • Gas费用: $3.50 USDT
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" color="primary.main" fontWeight="bold">
              {`• 净收益: ${(
                parseFloat(formData.quantity || '0') * selectedOpportunity.liquidationBonus -
                parseFloat(formData.quantity || '0') * 0.0009 -
                3.50
              ).toFixed(2)} USDT`}
            </Typography>
          </Box>

          <Alert severity="warning" sx={{ my: 2 }}>
            <strong>风险提示:</strong> 清算操作具有一定风险性。清算奖励可能因市场波动而变化。建议及时监控市场状况并控制清算金额。
          </Alert>

          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSubmit}
            sx={{ mt: 2 }}
            disabled={!wallet?.isConnected || isExecuting}
          >
            {isExecuting ? '执行中...' : '执行闪电贷清算'}
          </Button>

          {!wallet?.isConnected && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              请先连接钱包以执行清算操作
            </Alert>
          )}
        </Paper>
      )}

      {/* 执行状态显示 */}
      {isExecuting && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'warning.light' }}>
          <Typography variant="h6" color="warning.contrastText" gutterBottom>
            执行中...
          </Typography>
          <Typography variant="body2" color="warning.contrastText">
            正在执行闪电贷清算操作，请稍候...
          </Typography>
        </Paper>
      )}

      {/* 执行结果显示 */}
      {executionResult && (
        <Paper sx={{
          p: 2,
          mb: 3,
          bgcolor: executionResult.success ? 'success.light' : 'error.light'
        }}>
          <Typography variant="h6" gutterBottom color={executionResult.success ? 'success.contrastText' : 'error.contrastText'}>
            {executionResult.success ? '执行成功' : '执行失败'}
          </Typography>

          {executionResult.success ? (
            <Box>
              <Typography variant="body2" color="success.contrastText">
                • 交易哈希: {executionResult.txHash || 'N/A'}
              </Typography>
              <Typography variant="body2" color="success.contrastText">
                • 清算金额: {executionResult.liquidatedAmount.toFixed(4)} USDT
              </Typography>
              <Typography variant="body2" color="success.contrastText">
                • 清算奖励: ${executionResult.reward.toFixed(4)}
              </Typography>
              <Typography variant="body2" color="success.contrastText">
                • Gas费用: ${executionResult.gasCost.toFixed(4)}
              </Typography>
              <Typography variant="body2" color="success.contrastText" fontWeight="bold">
                • 净收益: ${executionResult.netProfit.toFixed(4)}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="error.contrastText">
              错误信息: {executionResult.error || '未知错误'}
            </Typography>
          )}
        </Paper>
      )}

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
