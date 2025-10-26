# 智运通交易系统 (LuckEngine)

智运通交易系统 (LuckEngine) 是一个基于 Injective 区块链构建的去中心化交易所（DEX），专注于合约交易，提供专业级的订单簿交易体验。

## 🚀 项目特色

- **去中心化**: 基于 Injective 链，无中心化风险
- **高性能**: 利用 Injective 链的高性能特性
- **专业交易**: 完整的订单簿模型
- **用户友好**: 简洁易用的界面设计
- **安全可靠**: 多层安全防护机制

## 🛠️ 技术栈

- **前端框架**: React 19.2.0 + TypeScript 5.9.3
- **构建工具**: Vite
- **UI 框架**: Material-UI
- **状态管理**: Zustand + React Query
- **路由管理**: React Router v6
- **区块链 SDK**: @injectivelabs/sdk-ts
- **部署平台**: Vercel

## 📦 安装和运行

### 环境要求

- Node.js 18+
- npm 8+

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

### 预览生产版本

```bash
npm run preview
```

## 🧪 代码质量

### 代码检查

```bash
npm run lint
```

### 代码格式化

```bash
npm run format
```

### 类型检查

```bash
npm run type-check
```

## 📁 项目结构

```
src/
├── components/           # 可复用组件
│   ├── layout/          # 布局组件
│   ├── trading/         # 交易组件
│   ├── charts/          # 图表组件
│   ├── wallet/          # 钱包组件
│   └── ui/              # 基础UI组件
├── pages/               # 页面组件
│   ├── Trading/         # 交易页面
│   ├── Portfolio/       # 资产页面
│   └── History/         # 历史页面
├── services/            # 服务层
│   ├── blockchain/      # 区块链服务
│   ├── market/          # 市场数据服务
│   └── wallet/          # 钱包服务
├── hooks/               # 自定义Hooks
├── store/               # 状态管理
├── utils/                # 工具函数
├── types/                # 类型定义
└── styles/               # 样式文件
```

## 🔧 功能模块

### 钱包连接
- 支持 Keplr、MetaMask、Injective 钱包
- 自动重连机制
- 网络切换功能

### 交易功能
- 限价单和市价单交易
- 订单管理
- 交易历史查询

### 市场数据
- 实时订单簿
- K线图表
- 成交记录

### 资产管理
- 余额查询
- 转账功能
- 历史记录

## 🔒 安全特性

- **前端安全**: XSS 防护、CSRF 防护
- **钱包安全**: 私钥本地处理、交易签名
- **网络安全**: HTTPS 传输、安全头设置

## 📱 响应式设计

- 支持桌面、平板、手机访问
- 移动端优化
- 触控友好

## 🚀 部署

项目使用 Vercel 进行部署，支持自动部署和全球 CDN。

### 环境变量

```env
VITE_INJECTIVE_NETWORK=mainnet
VITE_INJECTIVE_RPC_URL=https://api.injective.network
VITE_INJECTIVE_WEBSOCKET_URL=wss://api.injective.network/ws
```

## 📚 文档

详细的项目文档请查看 `docs/` 目录：

- [需求设计文档](docs/01-需求设计文档.md)
- [概要设计文档](docs/02-概要设计文档.md)
- [详细设计文档](docs/03-详细设计文档.md)
- [接口设计文档](docs/04-接口设计文档.md)
- [规格说明文档](docs/05-规格说明文档.md)
- [测试计划文档](docs/06-测试计划文档.md)
- [开发Checklist文档](docs/07-开发Checklist文档.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进项目。

## 📄 许可证

本项目采用 ISC 许可证。

## 🔗 相关链接

- [Injective 官方文档](https://docs.injective.network/)
- [Material-UI 组件库](https://mui.com/)
- [React 官方文档](https://react.dev/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
