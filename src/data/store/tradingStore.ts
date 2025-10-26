import { create } from 'zustand';
import { Order, Trade, OrderBook, MarketData } from '../types';

interface TradingState {
  // 状态
  currentMarket: string;
  orders: Order[];
  trades: Trade[];
  orderBook: OrderBook | null;
  marketData: MarketData | null;

  // 操作
  setCurrentMarket: (marketId: string) => void;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  removeOrder: (orderId: string) => void;
  addTrade: (trade: Trade) => void;
  updateOrderBook: (orderBook: OrderBook) => void;
  updateMarketData: (marketData: MarketData) => void;
  clearOrders: () => void;
  clearTrades: () => void;
}

export const useTradingStore = create<TradingState>((set) => ({
  // 初始状态
  currentMarket: 'INJ/USDT',
  orders: [],
  trades: [],
  orderBook: null,
  marketData: null,

  // 操作方法
  setCurrentMarket: (marketId: string) => set({ currentMarket: marketId }),

  addOrder: (order: Order) => set((state) => ({
    orders: [...state.orders, order]
  })),

  updateOrder: (orderId: string, updates: Partial<Order>) => set((state) => ({
    orders: state.orders.map(order =>
      order.id === orderId ? { ...order, ...updates } : order
    )
  })),

  removeOrder: (orderId: string) => set((state) => ({
    orders: state.orders.filter(order => order.id !== orderId)
  })),

  addTrade: (trade: Trade) => set((state) => ({
    trades: [...state.trades, trade]
  })),

  updateOrderBook: (orderBook: OrderBook) => set({ orderBook }),

  updateMarketData: (marketData: MarketData) => set({ marketData }),

  clearOrders: () => set({ orders: [] }),

  clearTrades: () => set({ trades: [] })
}));
