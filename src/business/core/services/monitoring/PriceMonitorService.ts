import { MarketData, OrderBook, WSMessage } from '../../../data/types';
import { errorHandler, createNetworkError, createTimeoutError } from '../../../data/utils/errorHandler';

export class PriceMonitorService {
  private wsConnection: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private subscribers: Set<(message: WSMessage) => void> = new Set();

  constructor(marketId: string) {}

  // 连接到Injective WebSocket
  async connect(): Promise<void> {
    try {
      this.wsConnection = await this.connectToInjectiveWS();
      this.setupEventListeners();
      this.reconnectAttempts = 0;
    } catch (error) {
      const appError = errorHandler.handleError(error);
      this.notifySubscribers({
        type: 'error',
        data: appError,
        timestamp: Date.now()
      });
      this.handleReconnect();
    }
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
  static getMockPrice(): MarketData {
    const basePrice = 25 + Math.random() * 10; // INJ价格在25-35之间波动
    const changePercent = (Math.random() - 0.5) * 0.1; // ±5%波动
    const price = basePrice * (1 + changePercent);

    return {
      symbol: 'INJ/USDT',
      price: price.toFixed(4),
      change24h: (changePercent * 100).toFixed(2) + '%',
      volume24h: (Math.random() * 1000000 + 500000).toFixed(0),
      high24h: (basePrice * 1.05).toFixed(4),
      low24h: (basePrice * 0.95).toFixed(4),
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

  private async connectToInjectiveWS(): Promise<WebSocket> {
    // 模拟WebSocket连接
    return new Promise((resolve, reject) => {
      const ws = new WebSocket('ws://localhost:8080'); // 模拟地址

      ws.onopen = () => {
        console.log('WebSocket连接成功');
        resolve(ws);
      };

      ws.onerror = (error) => {
        console.error('WebSocket连接错误:', error);
        reject(error);
      };

      ws.onclose = () => {
        console.log('WebSocket连接关闭');
        this.handleReconnect();
      };
    });
  }

  private setupEventListeners(): void {
    if (!this.wsConnection) return;

    this.wsConnection.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        this.notifySubscribers(message);
      } catch (error) {
        console.error('解析WebSocket消息失败:', error);
      }
    };

    this.wsConnection.onclose = () => {
      this.handleReconnect();
    };

    this.wsConnection.onerror = (error) => {
      console.error('WebSocket错误:', error);
      this.handleReconnect();
    };
  }

  private notifySubscribers(message: WSMessage): void {
    this.subscribers.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('通知订阅者失败:', error);
      }
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('达到最大重连次数，停止重连');
      return;
    }

    this.reconnectAttempts++;
    console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('重连失败:', error);
      });
    }, this.reconnectInterval);
  }
}
