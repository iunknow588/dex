# 智运通闪电贷清算合约

基于Injective区块链的闪电贷清算智能合约，实现无本金清算套利功能。

## 📋 功能特性

### 🚀 核心功能
- **闪电贷**: 支持多资产闪电贷，无需抵押
- **清算套利**: 自动检测并执行清算机会
- **风险控制**: 多层次安全检查和滑点保护
- **Injective集成**: 与Injective Exchange模块深度集成

### 🛡️ 安全特性
- **重入保护**: 使用OpenZeppelin的ReentrancyGuard
- **暂停机制**: 支持紧急暂停功能
- **访问控制**: 严格的权限管理系统
- **参数验证**: 完整的输入验证和边界检查

## 🏗️ 合约架构

```
contracts/
├── interfaces/           # 合约接口定义
│   ├── IFlashLoan.sol    # 闪电贷接口
│   └── ILiquidation.sol  # 清算接口
├── libraries/            # 工具库
│   └── RiskControl.sol   # 风险控制库
├── src/                  # 主要合约
│   └── LuckeeFlashLiquidation.sol  # 主合约
├── scripts/              # 部署脚本
│   └── deploy.ts         # 部署脚本
├── test/                 # 测试文件
│   ├── LuckeeFlashLiquidation.test.ts
│   └── TestERC20.sol     # 测试代币
└── README.md            # 文档
```

## 🔧 安装和设置

### 环境要求
- Node.js 18+
- npm 或 yarn
- Hardhat

### 安装依赖
```bash
cd contracts
npm install
```

### 编译合约
```bash
npm run compile
```

### 运行测试
```bash
npm run test
```

### 生成测试覆盖率
```bash
npm run test:coverage
```

## 🚀 部署

### 本地部署
```bash
npm run deploy
```

### Injective测试网部署
```bash
npm run deploy:injective
```

### 自定义网络部署
```bash
npx hardhat run scripts/deploy.ts --network <network-name>
```

## 📋 合约接口

### 闪电贷功能

#### flashLoan
```solidity
function flashLoan(
    address asset,
    uint256 amount,
    bytes calldata params
) external
```
执行闪电贷操作，支持在同一交易中借贷和还款。

**参数:**
- `asset`: 借贷资产地址 (address(0) 表示ETH)
- `amount`: 借贷金额
- `params`: 包含清算参数的编码数据

#### executeOperation
```solidity
function executeOperation(
    address asset,
    uint256 amount,
    uint256 premium,
    address initiator,
    bytes calldata params
) external returns (bool)
```
闪电贷回调函数，执行清算逻辑。

### 清算功能

#### executeLiquidation
```solidity
function executeLiquidation(
    LiquidationParams calldata params
) external returns (bool success, uint256 reward, uint256 gasCost)
```
执行清算操作。

**参数:**
- `params`: 清算参数结构体

**返回:**
- `success`: 是否执行成功
- `reward`: 清算奖励金额
- `gasCost`: 预估Gas费用

#### validateLiquidationOpportunity
```solidity
function validateLiquidationOpportunity(
    bytes32 marketId,
    address subaccountId
) external view returns (bool isValid, uint256 healthFactor, uint256 maxLiquidationAmount)
```
验证清算机会的有效性。

## 🔐 安全机制

### 风险控制
- **滑点保护**: 最大5%滑点容忍度
- **截止时间**: 防止交易过期执行
- **流动性检查**: 确保有足够的可用资金
- **健康因子验证**: 只清算健康因子<1的仓位

### 访问控制
- **所有者权限**: 只有合约所有者可以添加资产、设置参数
- **清算者授权**: 只有授权的清算者可以执行清算
- **暂停机制**: 紧急情况下可以暂停所有操作

### 费用机制
- **闪电贷费用**: 0.09% (9基点)
- **清算奖励**: 5-10% (可配置)
- **Gas费用**: 动态估算

## 🧪 测试

### 运行完整测试套件
```bash
npm run test
```

### 运行特定测试
```bash
npx hardhat test test/LuckeeFlashLiquidation.test.ts
```

### Gas使用分析
```bash
npm run test:gas
```

## 📊 参数配置

### 默认参数
```solidity
FLASHLOAN_PREMIUM = 9;        // 0.09% 闪电贷费用
LIQUIDATION_THRESHOLD = 10000; // 100% 健康因子阈值
MAX_SLIPPAGE = 500;           // 5% 最大滑点
GRACE_PERIOD = 300;           // 5分钟宽限期
```

### 可配置参数
- 支持的资产列表
- 市场清算奖励比例
- 授权清算者列表
- 风险参数阈值

## 🔗 与前端集成

### 合约调用示例
```typescript
// 执行闪电贷清算
const flashLoanParams = {
  asset: '0x...',           // 资产地址
  amount: ethers.parseEther('100'), // 借贷金额
  liquidationParams: {      // 清算参数
    marketId: marketId,
    subaccountId: subaccountId,
    liquidationAmount: amount,
    // ... 其他参数
  }
};

// 编码参数
const params = ethers.AbiCoder.defaultAbiCoder().encode([...], [flashLoanParams]);

// 调用合约
await flashLiquidation.flashLoan(asset, amount, params);
```

## 📈 监控和维护

### 事件监控
合约发出以下关键事件：
- `FlashLoanExecuted`: 闪电贷执行完成
- `LiquidationExecuted`: 清算执行完成
- `LiquidationFailed`: 清算执行失败
- `AssetAdded/Removed`: 资产添加/移除

### 紧急操作
- **暂停**: `pause()` - 暂停所有操作
- **恢复**: `unpause()` - 恢复正常操作
- **资金提取**: `withdraw()` - 提取合约资金

## 🚨 风险提示

1. **智能合约风险**: 尽管经过审计，但仍存在未知漏洞风险
2. **网络风险**: Injective网络可能出现拥堵或异常
3. **预言机风险**: 价格数据依赖外部预言机
4. **清算风险**: 清算时机和奖励可能因市场波动而变化
5. **Gas费用**: 高并发时Gas费用可能大幅增加

## 🔧 开发指南

### 添加新功能
1. 在接口中定义新方法
2. 在主合约中实现逻辑
3. 添加相应的测试用例
4. 更新文档

### 修改参数
1. 评估影响范围
2. 更新相关验证逻辑
3. 运行完整测试套件
4. 部署前进行模拟测试

### 升级合约
考虑使用代理模式支持合约升级，保护用户资金安全。

---

**注意**: 这是一个复杂的DeFi合约，在生产环境使用前请务必进行专业安全审计。
