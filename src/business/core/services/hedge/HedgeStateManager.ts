import {
  HedgeState,
  PriceZone,
  HedgeConfig,
  NextAction,
  Order,
  OrderStatus
} from '../../../data/types';

export class HedgeStateManager {
  private currentState: HedgeState = HedgeState.MAIN_ONLY;
  private config: HedgeConfig | null = null;
  private mainOrder: Order | null = null;
  private hedgeOrders: Order[] = [];
  private onOrderStateUpdateCallback?: (order: Order) => void;

  constructor(private onStateChange?: (state: HedgeState) => void) {}

  // 设置订单状态更新回调
  setOrderStateUpdateCallback(callback: (order: Order) => void): void {
    this.onOrderStateUpdateCallback = callback;
  }

  // 初始化对冲配置
  initialize(config: HedgeConfig): void {
    this.config = config;
    this.currentState = HedgeState.MAIN_ONLY;
    this.mainOrder = null;
    this.hedgeOrders = [];
  }

  // 更新价格并检查是否需要触发对冲
  updatePrice(currentPrice: number): NextAction | null | undefined {
    if (!this.config || !this.mainOrder) return null;

    const riskLockPrice = parseFloat(this.config.riskLockPrice);
    const profitLockPrice = parseFloat(this.config.profitLockPrice);

    const currentZone = this.getCurrentPriceZone(currentPrice, riskLockPrice, profitLockPrice);

    switch (this.currentState) {
      case HedgeState.MAIN_ONLY:
        return this.handleMainOnlyState(currentZone);

      case HedgeState.HEDGE_RISK_LOCK:
        return this.handleRiskLockState(currentZone);

      case HedgeState.HEDGE_PROFIT_LOCK:
        return this.handleProfitLockState(currentZone);

      default:
        return null;
    }
  }

  // 处理主订单状态
  private handleMainOnlyState(zone: PriceZone): NextAction | null {
    switch (zone) {
      case PriceZone.RISK_LOCK:
        this.currentState = HedgeState.HEDGE_RISK_LOCK;
        this.notifyStateChange();
        return {
          type: 'CREATE_RISK_LOCK',
          description: '价格触及风险锁定线，创建反向风险锁定订单',
          countdown: 3
        };

      case PriceZone.PROFIT_LOCK:
        this.currentState = HedgeState.HEDGE_PROFIT_LOCK;
        this.notifyStateChange();
        return {
          type: 'CREATE_PROFIT_LOCK',
          description: '价格触及利润锁定线，创建正向利润锁定订单',
          countdown: 3
        };

      default:
        return null;
    }
  }

  // 处理风险锁定状态
  private handleRiskLockState(zone: PriceZone): NextAction | null {
    switch (zone) {
      case PriceZone.PROFIT_LOCK:
        this.currentState = HedgeState.HEDGE_PROFIT_LOCK;
        this.notifyStateChange();
        return {
          type: 'CANCEL_RISK_LOCK',
          description: '价格回升至利润锁定线，取消风险锁定，创建利润锁定',
          countdown: 3
        };

      case PriceZone.NEUTRAL:
        // 价格回到安全区间，保持当前状态
        return null;

      default:
        return null;
    }
  }

  // 处理利润锁定状态
  private handleProfitLockState(zone: PriceZone): NextAction | null {
    switch (zone) {
      case PriceZone.RISK_LOCK:
        this.currentState = HedgeState.HEDGE_RISK_LOCK;
        this.notifyStateChange();
        return {
          type: 'CANCEL_PROFIT_LOCK',
          description: '价格回落至风险锁定线，取消利润锁定，创建风险锁定',
          countdown: 3
        };

      case PriceZone.NEUTRAL:
        // 价格回到安全区间，保持当前状态
        return null;

      default:
        return null;
    }
  }

  // 获取当前价格区间
  private getCurrentPriceZone(currentPrice: number, riskLockPrice: number, profitLockPrice: number): PriceZone {
    if (currentPrice <= riskLockPrice) {
      return PriceZone.RISK_LOCK;
    } else if (currentPrice >= profitLockPrice) {
      return PriceZone.PROFIT_LOCK;
    } else {
      return PriceZone.NEUTRAL;
    }
  }

  // 创建对冲订单
  createHedgeOrder(type: 'risk' | 'profit'): Order {
    if (!this.config || !this.mainOrder) {
      throw new Error('对冲配置或主订单不存在');
    }

    const hedgeOrder: Order = {
      id: Math.random().toString(36).substring(2, 15),
      marketId: this.mainOrder.marketId,
      side: this.mainOrder.side === 'buy' ? 'sell' : 'buy', // 反向操作
      type: 'limit',
      price: type === 'risk' ? this.config.riskLockPrice : this.config.profitLockPrice,
      quantity: this.config.quantity,
      filledQuantity: '0',
      remainingQuantity: this.config.quantity,
      status: 'pending',
      orderState: type === 'risk' ? OrderStatus.RISK_LOCKING : OrderStatus.PROFIT_LOCKING,
      timeInForce: 'GTC',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.hedgeOrders.push(hedgeOrder);

    // 通知订单状态更新
    if (this.onOrderStateUpdateCallback) {
      this.onOrderStateUpdateCallback(hedgeOrder);
    }

    return hedgeOrder;
  }

  // 取消对冲订单
  cancelHedgeOrder(type: 'risk' | 'profit'): void {
    const orderType = type === 'risk' ? OrderStatus.RISK_LOCKING : OrderStatus.PROFIT_LOCKING;
    const index = this.hedgeOrders.findIndex(order => order.orderState === orderType);

    if (index !== -1) {
      const order = this.hedgeOrders[index];
      order.status = 'cancelled';
      order.updatedAt = Date.now();

      // 通知订单状态更新
      if (this.onOrderStateUpdateCallback) {
        this.onOrderStateUpdateCallback(order);
      }

      this.hedgeOrders.splice(index, 1);
    }
  }

  // 设置主订单
  setMainOrder(order: Order): void {
    this.mainOrder = order;
    if (this.onOrderStateUpdateCallback) {
      this.onOrderStateUpdateCallback(order);
    }
  }

  // 获取当前状态
  getCurrentState(): HedgeState {
    return this.currentState;
  }

  // 获取状态信息
  getStateInfo(): { state: HedgeState; description: string; nextAction?: NextAction } {
    const stateInfo = {
      [HedgeState.MAIN_ONLY]: {
        description: '仅持有主订单，等待价格触发对冲条件'
      },
      [HedgeState.HEDGE_RISK_LOCK]: {
        description: '已建立反向风险锁定，正在监控价格变化'
      },
      [HedgeState.HEDGE_PROFIT_LOCK]: {
        description: '已建立正向利润锁定，正在监控价格变化'
      },
      [HedgeState.CYCLING]: {
        description: '对冲循环模式，自动管理风险和利润'
      }
    };

    return {
      state: this.currentState,
      description: stateInfo[this.currentState].description,
      nextAction: null // 可以根据当前状态计算下一步动作
    };
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.currentState);
    }
  }
}
