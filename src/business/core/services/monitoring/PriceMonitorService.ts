import { MarketData, OrderBook, WSMessage } from '../../../../data/types';

export class PriceMonitorService {
  private wsConnection: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private subscribers: Set<(message: WSMessage) => void> = new Set();

  constructor(marketId: string) {}

  // 连接到Injective WebSocket
  async connect(): Promise<void> {
    // 模拟WebSocket连接（实际项目中需要连接到真实的Injective WebSocket）
    return new Promise((resolve) => {
      // 模拟连接成功
      setTimeout(() => {
        console.log('PriceMonitorService: 模拟WebSocket连接成功');
        resolve();
      }, 100);
    });
  }

  // 断开连接
  disconnect(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  // 订阅消息
  subscribe(callback: (message: WSMessage) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // 取消订阅
  unsubscribe(callback: (message: WSMessage) => void): void {
    this.subscribers.delete(callback);
  }

  // 获取模拟价格数据
  static getMockPrice(basePrice?: number, volatility?: number): MarketData {
    const price = basePrice || (25 + Math.random() * 10); // INJ价格在25-35之间波动
    const changePercent = volatility || ((Math.random() - 0.5) * 0.1); // ±5%波动
    const finalPrice = price * (1 + changePercent);

    return {
      symbol: 'INJ/USDT',
      price: finalPrice.toFixed(4),
      change24h: (changePercent * 100).toFixed(2) + '%',
      change24hPercent: changePercent * 100,
      volume24h: (Math.random() * 1000000 + 500000).toFixed(0),
      high24h: (price * 1.05).toFixed(4),
      low24h: (price * 0.95).toFixed(4),
      timestamp: Date.now()
    };
  }

  // 获取模拟订单簿
  static getMockOrderBook(): OrderBook {
    const basePrice = 30;
    const bids: Array<[string, string]> = [];
    const asks: Array<[string, string]> = [];

    // 生成买单
    for (let i = 0; i < 10; i++) {
      const price = basePrice - (i + 1) * 0.01;
      const quantity = Math.random() * 100 + 10;
      bids.push([price.toFixed(4), quantity.toFixed(2)]);
    }

    // 生成卖单
    for (let i = 0; i < 10; i++) {
      const price = basePrice + (i + 1) * 0.01;
      const quantity = Math.random() * 100 + 10;
      asks.push([price.toFixed(4), quantity.toFixed(2)]);
    }

    return {
      bids,
      asks,
      timestamp: Date.now()
    };
  }
}
