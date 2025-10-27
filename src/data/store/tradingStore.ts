import { create } from 'zustand';
import { MarketData, OrderBook } from '../types';

// 简化的交易状态，只保留闪电贷相关
export interface TradingState {
  // 市场数据
  marketData: MarketData | null;
  orderBook: OrderBook | null;

  // 闪电贷历史
  flashLoanHistory: FlashLoanRecord[];
  totalProfit: number;
  totalExecutions: number;
  successRate: number;
}

export interface FlashLoanRecord {
  id: string;
  timestamp: number;
  marketId: string;
  amount: number;
  profit: number;
  success: boolean;
  txHash?: string;
}

interface TradingActions {
  // 市场数据操作
  updateMarketData: (data: MarketData) => void;
  updateOrderBook: (data: OrderBook) => void;

  // 闪电贷操作
  addFlashLoanRecord: (record: Omit<FlashLoanRecord, 'id' | 'timestamp'>) => void;
  updateStats: () => void;
  clearHistory: () => void;
}

type TradingStore = TradingState & TradingActions;

export const useTradingStore = create<TradingStore>((set, get) => ({
  // 初始状态
  marketData: null,
  orderBook: null,
  flashLoanHistory: [],
  totalProfit: 0,
  totalExecutions: 0,
  successRate: 0,

  // 操作方法
  updateMarketData: (data) => set({ marketData: data }),

  updateOrderBook: (data) => set({ orderBook: data }),
  addFlashLoanRecord: (record) => {
    const newRecord: FlashLoanRecord = {
      ...record,
      id: Math.random().toString(36).substring(2, 15),
      timestamp: Date.now()
    };
    
    set((state) => ({
      flashLoanHistory: [...state.flashLoanHistory, newRecord]
    }));
    
    // 更新统计信息
    get().updateStats();
  },

  updateStats: () => {
    const { flashLoanHistory } = get();
    const totalExecutions = flashLoanHistory.length;
    const successfulExecutions = flashLoanHistory.filter(r => r.success).length;
    const totalProfit = flashLoanHistory.reduce((sum, r) => sum + (r.success ? r.profit : 0), 0);
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

    set({
      totalExecutions,
      totalProfit,
      successRate
    });
  },

  clearHistory: () => {
    set({
      flashLoanHistory: [],
      totalProfit: 0,
      totalExecutions: 0,
      successRate: 0
    });
  }
}));