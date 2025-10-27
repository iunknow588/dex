import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Divider,
  Stack,
} from '@mui/material';
import {
  FlashOn as FlashIcon,
  AccountBalance as BankIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useWalletStore } from '../../../data/store/walletStore';
import { FlashLoanService } from '../../../business/core/services/liquidation/FlashLoanService';
import { LiquidationScanner } from '../../../business/core/services/liquidation/LiquidationScanner';
import { InjectiveService } from '../../../business/core/services/injective/InjectiveService';
import { WhiteWhaleService } from '../../../business/core/services/whitewhale/WhiteWhaleService';

// 简化的类型定义
interface FlashLiquidationParams {
  marketId: string;
  subaccountId: string;
  liquidationAmount: string;
  collateralAsset: string;
  debtAsset: string;
  slippageTolerance: number;
  deadline: number;
}

interface LiquidationResult {
  success: boolean;
  txHash?: string;
  liquidatedAmount: number;
  reward: number;
  gasCost: number;
  netProfit: number;
  error?: string;
}

interface LiquidationOpportunity {
  id: string;
  marketId: string;
  subaccountId: string;
  liquidationAmount: string;
  collateralAsset: string;
  debtAsset: string;
  liquidationBonus: number;
  healthFactor: number;
  estimatedProfit: number;
  timestamp?: number;
  protocol?: string;
}

export const FlashLoanTradingForm: React.FC = () => {
  const { wallet } = useWalletStore();
  
  // 初始化服务
  const [injectiveService] = useState(() => new InjectiveService());
  const [whiteWhaleService] = useState(() => new WhiteWhaleService({
    rpcEndpoint: 'https://rpc.migaloo.whale-defi.io',
    contractAddress: 'migaloo1...', // White Whale 合约地址
    chainId: 'migaloo-1',
    gasPrice: '0.025',
    gasLimit: 200000
  }));
  const [flashLoanService] = useState(() => new FlashLoanService({
    providerUrl: 'https://grpc.injective.network',
    privateKey: '', // 从钱包获取，不存储私钥
    flashLoanContractAddress: '0x0000000000000000000000000000000000000000',
    maxLoanAmount: '1000000',
    supportedAssets: ['USDT', 'USDC', 'INJ'],
    feeRate: '0.0009',
    timeout: 30000
  }));
  const [liquidationScanner] = useState(() => new LiquidationScanner(injectiveService, {
    scanInterval: 10000, // 10秒扫描一次
    maxConcurrentScans: 5,
    enabledMarkets: [], // 扫描所有市场
    minProfitThreshold: 10, // 最小10美元收益
  }));

  // 设置服务之间的依赖关系
  useEffect(() => {
    flashLoanService.setInjectiveService(injectiveService);
    flashLoanService.setWhiteWhaleService(whiteWhaleService);
  }, [flashLoanService, injectiveService, whiteWhaleService]);
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<LiquidationResult | null>(null);
  const [availableOpportunities, setAvailableOpportunities] = useState<LiquidationOpportunity[]>([]);
  const [scanStatus, setScanStatus] = useState<{
    isScanning: boolean;
    lastScanTime: number;
    totalOpportunities: number;
  }>({
    isScanning: false,
    lastScanTime: 0,
    totalOpportunities: 0,
  });

  // 初始化扫描器回调
  useEffect(() => {
    liquidationScanner.setCallbacks(
      // 发现新机会时的回调
      (opportunity: LiquidationOpportunity) => {
        setAvailableOpportunities(prev => {
          const exists = prev.some(opp => opp.id === opportunity.id);
          if (!exists) {
            return [...prev, opportunity].sort((a, b) => b.estimatedProfit - a.estimatedProfit);
          }
          return prev;
        });
      },
      // 扫描完成时的回调
      (result) => {
        setScanStatus(prev => ({
          ...prev,
          isScanning: false,
          lastScanTime: Date.now(),
          totalOpportunities: result.opportunities.length,
        }));
        setAvailableOpportunities(result.opportunities);
      }
    );
  }, [liquidationScanner]);

  // 启动扫描
  useEffect(() => {
    if (wallet.isConnected) {
      liquidationScanner.startScanning();
      setScanStatus(prev => ({ ...prev, isScanning: true }));
    } else {
      liquidationScanner.stopScanning();
      setScanStatus(prev => ({ ...prev, isScanning: false }));
    }

    return () => {
      liquidationScanner.stopScanning();
    };
  }, [wallet.isConnected, liquidationScanner]);

  const handleExecuteFlashLoan = async (opportunity: LiquidationOpportunity) => {
    if (!wallet.isConnected) {
      alert('请先连接钱包');
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const params: FlashLiquidationParams = {
        marketId: opportunity.marketId,
        subaccountId: opportunity.subaccountId,
        liquidationAmount: opportunity.liquidationAmount,
        collateralAsset: opportunity.collateralAsset,
        debtAsset: opportunity.debtAsset,
        slippageTolerance: 0.01,
        deadline: Math.floor(Date.now() / 1000) + 300
      };

      const result = await flashLoanService.executeFlashLiquidation(params);
      setExecutionResult(result);
      
      // 如果执行成功，从机会列表中移除
      if (result.success) {
        setAvailableOpportunities(prev => 
          prev.filter(opp => opp.id !== opportunity.id)
        );
      }
    } catch (error) {
      console.error('闪电贷执行失败:', error);
      setExecutionResult({
        success: false,
        liquidatedAmount: parseFloat(opportunity.liquidationAmount),
        reward: 0,
        gasCost: 0,
        netProfit: 0,
        error: error instanceof Error ? error.message : '执行失败'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const getProfitColor = (profit: number) => {
    if (profit > 50) return 'success';
    if (profit > 20) return 'warning';
    return 'error';
  };

  const getHealthColor = (health: number) => {
    if (health < 0.9) return 'error';
    if (health < 0.95) return 'warning';
    return 'success';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FlashIcon color="primary" />
        闪电贷清算系统
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        通过闪电贷实现无本金清算套利，利用价格差异获取收益
      </Typography>

      {/* 系统状态卡片 */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 4 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <BankIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">可用流动性</Typography>
            </Box>
            <Typography variant="h4" color="primary">
              $2,450,000
            </Typography>
            <Typography variant="body2" color="text.secondary">
              支持 USDT, USDC, INJ
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TrendingUpIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">发现机会</Typography>
            </Box>
            <Typography variant="h4" color="success.main">
              {scanStatus.totalOpportunities}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {scanStatus.isScanning ? '正在扫描...' : '实时更新'}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <SecurityIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">扫描状态</Typography>
            </Box>
            <Typography variant="h4" color={scanStatus.isScanning ? "warning.main" : "info.main"}>
              {scanStatus.isScanning ? '扫描中' : '已就绪'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {scanStatus.lastScanTime > 0 ? 
                `上次扫描: ${new Date(scanStatus.lastScanTime).toLocaleTimeString()}` : 
                '等待扫描'
              }
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* 清算机会列表 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          可清算机会
        </Typography>
        
        {availableOpportunities.length === 0 ? (
          <Alert severity="info">
            {scanStatus.isScanning ? 
              '正在扫描清算机会，请稍候...' : 
              '当前没有可清算的机会，请稍后再试'
            }
          </Alert>
        ) : (
          <Stack spacing={2}>
            {availableOpportunities.map((opportunity) => (
              <Card key={opportunity.id} variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">{opportunity.marketId}</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={`健康度: ${(opportunity.healthFactor * 100).toFixed(1)}%`}
                        color={getHealthColor(opportunity.healthFactor)}
                        size="small"
                      />
                      <Chip
                        label={`预估收益: $${opportunity.estimatedProfit.toFixed(2)}`}
                        color={getProfitColor(opportunity.estimatedProfit)}
                        size="small"
                      />
                    </Box>
                  </Box>

                  <Stack direction="row" spacing={4} sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        清算金额
                      </Typography>
                      <Typography variant="body1">
                        ${parseFloat(opportunity.liquidationAmount).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        清算奖励
                      </Typography>
                      <Typography variant="body1">
                        {(opportunity.liquidationBonus * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        协议
                      </Typography>
                      <Typography variant="body1">
                        {opportunity.protocol || 'Injective'}
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      子账户: {opportunity.subaccountId}
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<FlashIcon />}
                      onClick={() => handleExecuteFlashLoan(opportunity)}
                      disabled={isExecuting || !wallet.isConnected}
                      color="primary"
                    >
                      执行闪电贷
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Paper>

      {/* 执行状态 */}
      {isExecuting && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            执行中...
          </Typography>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            正在执行闪电贷清算，请稍候...
          </Typography>
        </Paper>
      )}

      {/* 执行结果 */}
      {executionResult && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            执行结果
          </Typography>
          
          {executionResult.success ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              闪电贷执行成功！
            </Alert>
          ) : (
            <Alert severity="error" sx={{ mb: 2 }}>
              执行失败: {executionResult.error}
            </Alert>
          )}

          <Stack direction="row" spacing={4}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                交易哈希
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                {executionResult.txHash || 'N/A'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                清算金额
              </Typography>
              <Typography variant="body1">
                ${executionResult.liquidatedAmount.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                获得奖励
              </Typography>
              <Typography variant="body1" color="success.main">
                ${executionResult.reward.toFixed(2)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                净收益
              </Typography>
              <Typography variant="body1" color={executionResult.netProfit > 0 ? 'success.main' : 'error.main'}>
                ${executionResult.netProfit.toFixed(2)}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* 使用说明 */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          使用说明
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>闪电贷清算机制：</strong>
        </Typography>
        <Typography variant="body2" component="div">
          <ol>
            <li>系统自动扫描可清算的仓位</li>
            <li>通过闪电贷借入资金执行清算</li>
            <li>获得清算奖励后偿还闪电贷本金和费用</li>
            <li>剩余部分即为净收益</li>
          </ol>
        </Typography>
        <Alert severity="warning" sx={{ mt: 2 }}>
          <strong>风险提示：</strong>闪电贷清算存在市场风险，请确保充分了解相关风险后再进行操作。
        </Alert>
      </Paper>
    </Box>
  );
};