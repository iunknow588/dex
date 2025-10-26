// 基础类型定义

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
  amount: string;
  token: string;
  strategy: FlashLoanStrategy;
  maxSlippage: string;
}

export enum FlashLoanStrategy {
  TRIANGULAR_ARBITRAGE = 'TRIANGULAR_ARBITRAGE',
  LIQUIDATION_ARBITRAGE = 'LIQUIDATION_ARBITRAGE',
  PRICE_MANIPULATION = 'PRICE_MANIPULATION',
  CUSTOM = 'CUSTOM'
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// WebSocket 消息类型
export interface WSMessage {
  type: string;
  data: any;
  timestamp: number;
}

// 表单验证错误类型
export interface ValidationErrors {
  [key: string]: string;
}

// 组件属性基础类型
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// 加载状态类型
export interface LoadingState {
  isLoading: boolean;
  error?: string;
  data?: any;
}
