# 闪电贷清算服务

## 概述

本模块提供了完整的闪电贷清算功能，包括：

- **InjectiveService**: 与 Injective 区块链的交互服务
- **LiquidationScanner**: 实时清算机会扫描器
- **FlashLoanService**: 闪电贷执行服务
- **ErrorHandler**: 错误处理和重试机制
- **NetworkUtils**: 网络请求工具

## 主要改进

### 1. 环境配置管理

```typescript
import { appConfig } from '../data/config/appConfig';

// 使用配置
const service = new InjectiveService({
  rpcUrl: appConfig.injective.rpcUrl,
  restUrl: appConfig.injective.restUrl,
  chainId: appConfig.injective.chainId,
});
```

### 2. 真实的 Injective 链集成

```typescript
// 获取市场数据
const marketData = await injectiveService.getMarketData('INJ/USDT');

// 验证清算机会
const validation = await injectiveService.validateLiquidationOpportunity(
  'INJ/USDT',
  'inj1...'
);

// 执行清算
const result = await injectiveService.executeLiquidation(params);
```

### 3. 实时清算机会扫描

```typescript
// 创建扫描器
const scanner = new LiquidationScanner(injectiveService, {
  scanInterval: 10000, // 10秒扫描一次
  maxConcurrentScans: 5,
  minProfitThreshold: 10, // 最小10美元收益
});

// 设置回调
scanner.setCallbacks(
  (opportunity) => {
    console.log('发现新机会:', opportunity);
  },
  (result) => {
    console.log('扫描完成:', result.opportunities.length, '个机会');
  }
);

// 开始扫描
scanner.startScanning();
```

### 4. 完善的错误处理

```typescript
import { errorHandler, ErrorType } from '../utils/ErrorHandler';

try {
  await someOperation();
} catch (error) {
  const appError = errorHandler.wrapError(error, '操作失败');
  console.error(errorHandler.getUserFriendlyMessage(appError));
}
```

### 5. 带重试的网络请求

```typescript
import { networkUtils } from '../utils/NetworkUtils';

// 自动重试的请求
const result = await networkUtils.get('/api/data', {
  retries: 3,
  timeout: 10000,
});
```

## 使用示例

### 基本使用

```typescript
import { InjectiveService } from './injective/InjectiveService';
import { LiquidationScanner } from './liquidation/LiquidationScanner';
import { FlashLoanService } from './liquidation/FlashLoanService';

// 1. 初始化服务
const injectiveService = new InjectiveService();
const flashLoanService = new FlashLoanService({
  providerUrl: 'https://api.injective.network',
  privateKey: '', // 从钱包获取
  flashLoanContractAddress: '0x...',
  maxLoanAmount: '1000000',
  supportedAssets: ['USDT', 'USDC', 'INJ'],
  feeRate: '0.0009',
  timeout: 30000
});

// 2. 创建扫描器
const scanner = new LiquidationScanner(injectiveService);

// 3. 设置回调
scanner.setCallbacks(
  (opportunity) => {
    console.log('发现清算机会:', opportunity);
  },
  (result) => {
    console.log('扫描结果:', result);
  }
);

// 4. 开始扫描
scanner.startScanning();

// 5. 执行闪电贷
const result = await flashLoanService.executeFlashLiquidation({
  marketId: 'INJ/USDT',
  subaccountId: 'inj1...',
  liquidationAmount: '1000',
  collateralAsset: 'USDT',
  debtAsset: 'USDT',
  slippageTolerance: 0.01,
  deadline: Math.floor(Date.now() / 1000) + 300
});
```

### 高级配置

```typescript
// 自定义扫描配置
const scanner = new LiquidationScanner(injectiveService, {
  scanInterval: 5000, // 5秒扫描一次
  maxConcurrentScans: 10,
  enabledMarkets: ['INJ/USDT', 'ATOM/USDT'], // 只扫描指定市场
  minProfitThreshold: 50, // 最小50美元收益
});

// 自定义错误处理
errorHandler.updateRetryConfig({
  maxAttempts: 5,
  baseDelay: 2000,
  maxDelay: 30000,
  retryableErrors: [ErrorType.NETWORK_ERROR, ErrorType.TIMEOUT_ERROR],
});
```

## 注意事项

1. **私钥安全**: 不要在代码中硬编码私钥，应该从钱包获取
2. **网络配置**: 确保正确配置 Injective 网络的 RPC 和 REST 端点
3. **错误处理**: 始终使用 ErrorHandler 处理错误，提供用户友好的错误信息
4. **资源清理**: 在组件卸载时停止扫描器，避免内存泄漏
5. **性能优化**: 根据实际需求调整扫描间隔和并发数

## 故障排除

### 常见问题

1. **连接失败**: 检查网络配置和 RPC 端点
2. **扫描无结果**: 检查市场配置和最小收益阈值
3. **交易失败**: 检查私钥配置和 Gas 费用
4. **内存泄漏**: 确保正确停止扫描器

### 调试模式

```typescript
// 启用调试模式
const config = { ...appConfig, app: { ...appConfig.app, debugMode: true } };

// 查看配置摘要
console.log(getConfigSummary());
```
