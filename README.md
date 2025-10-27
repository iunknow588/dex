# 智运通闪电贷系统

一个基于 Injective 协议的闪电贷清算系统，通过闪电贷技术实现无本金清算套利。

## 🚀 功能特性

### 核心功能
- **闪电贷清算**: 通过闪电贷借入资金执行清算操作
- **无本金套利**: 无需自有资金即可参与清算套利
- **实时监控**: 实时扫描可清算的仓位机会
- **风险控制**: 内置多重风险控制机制
- **收益优化**: 智能计算最优清算策略

### 技术特性
- **基于 Injective**: 完全兼容 Injective 协议
- **TypeScript**: 类型安全的开发体验
- **React + Material-UI**: 现代化的用户界面
- **智能合约**: 安全的闪电贷合约实现
- **实时数据**: 实时市场数据和价格更新

## 📋 系统架构

```
src/
├── business/                 # 业务逻辑层
│   └── core/
│       └── services/
│           └── liquidation/
│               └── FlashLoanService.ts    # 闪电贷服务
├── data/                     # 数据层
│   ├── store/
│   │   ├── walletStore.ts    # 钱包状态管理
│   │   └── tradingStore.ts   # 交易状态管理
│   └── types/
│       └── index.ts          # 类型定义
├── ui/                       # 用户界面层
│   ├── components/
│   │   ├── trading/
│   │   │   └── FlashLoanTradingForm.tsx  # 闪电贷交易表单
│   │   └── wallet/
│   │       └── WalletConnector.tsx       # 钱包连接器
└── contracts/                # 智能合约
    ├── src/
    │   └── LuckeeFlashLiquidation.sol   # 闪电贷清算合约
    └── interfaces/
        └── IFlashLoan.sol               # 闪电贷接口
```

## 🛠️ 技术栈

- **前端**: React 18 + TypeScript + Material-UI
- **状态管理**: Zustand
- **构建工具**: Vite
- **智能合约**: Solidity ^0.8.20
- **区块链**: Injective Protocol
- **开发工具**: ESLint + Prettier

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0
- Git

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 类型检查
```bash
npm run type-check
```

## 💡 使用说明

### 1. 连接钱包
- 点击右上角的"连接钱包"按钮
- 选择支持的钱包类型（Keplr、MetaMask、Injective、WalletConnect）
- 完成钱包连接

### 2. 查看清算机会
- 系统会自动扫描可清算的仓位
- 显示清算金额、预估收益、健康度等信息
- 选择最优的清算机会

### 3. 执行闪电贷
- 点击"执行闪电贷"按钮
- 系统自动执行以下流程：
  1. 通过闪电贷借入资金
  2. 执行清算操作
  3. 获得清算奖励
  4. 偿还闪电贷本金和费用
  5. 获得净收益

### 4. 查看结果
- 实时显示执行状态
- 查看交易哈希和收益详情
- 历史记录统计

## 🔧 配置说明

### 闪电贷配置
```typescript
const flashLoanConfig: FlashLoanConfig = {
  providerUrl: 'https://api.injective.network',
  privateKey: 'your-private-key', // 生产环境使用环境变量
  flashLoanContractAddress: '0x...', // 闪电贷合约地址
  maxLoanAmount: '1000000', // 最大借贷金额
  supportedAssets: ['USDT', 'USDC', 'INJ'], // 支持的资产
  feeRate: '0.0009', // 闪电贷费率 0.09%
  timeout: 30000 // 超时时间
};
```

### 环境变量
创建 `.env` 文件：
```env
VITE_INJECTIVE_RPC_URL=https://api.injective.network
VITE_FLASH_LOAN_CONTRACT_ADDRESS=0x...
VITE_PRIVATE_KEY=your-private-key
```

## 📊 清算机制

### 清算条件
- 仓位健康度低于清算阈值
- 有足够的流动性支持清算
- 清算收益大于闪电贷费用

### 清算流程
1. **扫描机会**: 实时扫描可清算仓位
2. **风险评估**: 计算清算风险和收益
3. **执行闪电贷**: 借入资金执行清算
4. **获得奖励**: 收取清算奖励
5. **偿还资金**: 偿还闪电贷本金和费用
6. **净收益**: 剩余部分为净收益

### 风险控制
- **滑点控制**: 设置最大滑点容忍度
- **时间限制**: 设置交易截止时间
- **金额限制**: 限制最大清算金额
- **资产验证**: 验证抵押资产类型

## 🔒 安全特性

- **智能合约审计**: 合约代码经过安全审计
- **多重验证**: 交易前进行多重参数验证
- **权限控制**: 严格的权限管理机制
- **异常处理**: 完善的错误处理机制

## 📈 收益计算

### 收益公式
```
净收益 = 清算奖励 - 闪电贷费用 - Gas费用
清算奖励 = 清算金额 × 清算奖励率
闪电贷费用 = 清算金额 × 闪电贷费率
```

### 示例计算
- 清算金额: $10,000
- 清算奖励率: 8%
- 闪电贷费率: 0.09%
- Gas费用: $5.5

```
清算奖励 = $10,000 × 8% = $800
闪电贷费用 = $10,000 × 0.09% = $9
净收益 = $800 - $9 - $5.5 = $785.5
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系我们

- 项目地址: [GitHub Repository]
- 问题反馈: [GitHub Issues]
- 邮箱: contact@luckee-dao.com

## ⚠️ 风险提示

闪电贷清算存在以下风险：
- **市场风险**: 价格波动可能导致损失
- **技术风险**: 智能合约可能存在漏洞
- **流动性风险**: 市场流动性不足可能影响执行
- **网络风险**: 网络拥堵可能导致交易失败

请确保充分了解相关风险后再进行操作。

## 📚 相关文档

- [项目需求文档](./docs/01-项目需求文档.md)
- [系统设计文档](./docs/02-系统设计文档.md)
- [技术规格文档](./docs/03-技术规格文档.md)
- [测试计划文档](./docs/05-测试计划文档.md)
- [开发指南文档](./docs/06-开发指南文档.md)