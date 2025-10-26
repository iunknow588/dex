// 基础类型定义

// 错误类型定义
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  BLOCKCHAIN_ERROR = 'BLOCKCHAIN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface AppError {
  type: ErrorType;
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  recoverable: boolean;
}

// 订单相关类型
export interface Order {
  id: string;
  marketId: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market';
  price: string;
  quantity: string;
  filledQuantity: string;
  remainingQuantity: string;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
  orderState: OrderStatus;
  timeInForce: 'GTC' | 'IOC' | 'FOK';
  createdAt: number;
  updatedAt: number;
}

// 订单状态枚举
export enum OrderStatus {
  NORMAL_RUNNING = 'NORMAL_RUNNING',
  PREPARING_RISK_LOCK = 'PREPARING_RISK_LOCK',
  RISK_LOCKING = 'RISK_LOCKING',
  PREPARING_PROFIT_LOCK = 'PREPARING_PROFIT_LOCK',
  PROFIT_LOCKING = 'PROFIT_LOCKING'
}

// 交易记录类型
export interface Trade {
  id: string;
  orderId: string;
  marketId: string;
  side: 'buy' | 'sell';
  price: string;
  quantity: string;
  fee: string;
  timestamp: number;
}

// 订单簿类型
export interface OrderBook {
  bids: Array<[string, string]>; // [price, quantity]
  asks: Array<[string, string]>; // [price, quantity]
  timestamp: number;
}

// 市场数据类型
export interface MarketData {
  symbol: string;
  price: string;
  change24h: string;
  volume24h: string;
  high24h: string;
  low24h: string;
  timestamp: number;
}

// 对冲配置类型
export interface HedgeConfig {
  riskLockPrice: string;
  profitLockPrice: string;
  quantity: string;
  enabled: boolean;
}

// 对冲状态类型
export enum HedgeState {
  MAIN_ONLY = 'MAIN_ONLY',
  HEDGE_RISK_LOCK = 'HEDGE_RISK_LOCK',
  HEDGE_PROFIT_LOCK = 'HEDGE_PROFIT_LOCK',
  CYCLING = 'CYCLING'
}

// 价格区间类型
export enum PriceZone {
  RISK_LOCK = 'RISK_LOCK',
  PROFIT_LOCK = 'PROFIT_LOCK',
  NEUTRAL = 'NEUTRAL'
}

// 对冲下一步动作类型
export interface NextAction {
  type: 'CREATE_RISK_LOCK' | 'CREATE_PROFIT_LOCK' | 'CANCEL_RISK_LOCK' | 'CANCEL_PROFIT_LOCK' | 'WAIT';
  description: string;
  countdown?: number;
}

// 套利机会类型
export interface ArbitrageOpportunity {
  id: string;
  symbol: string;
  exchanges: string[];
  priceDiff: string;
  expectedProfit: string;
  confidence: number;
  timestamp: number;
}

// 闪电贷配置类型
export interface FlashLoanConfig {
  maxLoanAmount: string;
  supportedAssets: string[];
  feeRate: string;
  timeout: number;
}

// 清算机会类型 (基于Injective Exchange模块)
export interface LiquidationOpportunity {
  id: string;
  marketId: string; // Injective市场ID
  subaccountId: string; // 子账户ID
  position: {
    positionSize: string;
    entryPrice: string;
    margin: string;
    liquidationPrice: string;
    markPrice: string;
    unrealizedPnl: string;
  };
  collateralAsset: string;
  debtAsset: string;
  collateralAmount: number;
  debtAmount: number;
  liquidationBonus: number; // 清算奖励比例 (0.05-0.10)
  healthFactor: number; // 健康因子 (<1表示可清算)
  maxLiquidationAmount: number; // 最大清算金额
  estimatedProfit: number; // 预估利润 (USDT)
  timestamp?: number;
  protocol?: string; // 借贷协议名称
  liquidationThreshold?: number; // 清算阈值
  maintenanceMarginRatio?: number; // 维持保证金比例
}

// 清算执行结果
export interface LiquidationResult {
  success: boolean;
  txHash?: string;
  liquidatedAmount: number;
  reward: number;
  gasCost: number;
  netProfit: number;
  error?: string;
}

// 闪电贷清算参数
export interface FlashLiquidationParams {
  marketId: string;
  subaccountId: string;
  liquidationAmount: string;
  collateralAsset: string;
  debtAsset: string;
  slippageTolerance: number; // 滑点容忍度
  deadline: number; // 截止时间
}

// WebSocket消息类型
export interface WSMessage {
  type: 'price_update' | 'orderbook_update' | 'trade_update' | 'error';
  data: any;
  timestamp: number;
}

// 钱包类型
export type WalletType = 'keplr' | 'metamask' | 'injective';

// UI状态类型
export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  language: string;
}

// 表单数据类型
export interface TradingFormData {
  side: 'buy' | 'sell';
  type: 'limit' | 'market';
  price: string;
  quantity: string;
  timeInForce: 'GTC' | 'IOC' | 'FOK';
}

export interface FormErrors {
  [key: string]: string;
}
