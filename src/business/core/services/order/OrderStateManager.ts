import { Order, OrderStatus } from '../../../data/types';
import { errorHandler, createValidationError } from '../../../data/utils/errorHandler';

export class OrderStateManager {
  private orders: Order[] = [];

  // 添加订单
  addOrder(order: Order): void {
    this.orders.push(order);
  }

  // 更新订单
  updateOrder(orderId: string, updates: Partial<Order>): void {
    const index = this.orders.findIndex(order => order.id === orderId);
    if (index !== -1) {
      this.orders[index] = { ...this.orders[index], ...updates, updatedAt: Date.now() };
    }
  }

  // 删除订单
  removeOrder(orderId: string): void {
    this.orders = this.orders.filter(order => order.id !== orderId);
  }

  // 获取所有订单
  getAllOrders(): Order[] {
    return [...this.orders];
  }

  // 根据状态获取订单
  getOrdersByState(state: OrderStatus): Order[] {
    return this.orders.filter(order => order.orderState === state);
  }

  // 获取状态统计
  getStateStats(): Record<OrderStatus, number> {
    const stats: Record<OrderStatus, number> = {
      [OrderStatus.NORMAL_RUNNING]: 0,
      [OrderStatus.PREPARING_RISK_LOCK]: 0,
      [OrderStatus.RISK_LOCKING]: 0,
      [OrderStatus.PREPARING_PROFIT_LOCK]: 0,
      [OrderStatus.PROFIT_LOCKING]: 0
    };

    this.orders.forEach(order => {
      stats[order.orderState]++;
    });

    return stats;
  }

  // 获取活跃订单（未完成）
  getActiveOrders(): Order[] {
    return this.orders.filter(order =>
      order.status === 'pending' ||
      (order.status === 'filled' && order.remainingQuantity !== '0')
    );
  }

  // 获取已完成订单
  getCompletedOrders(): Order[] {
    return this.orders.filter(order =>
      order.status === 'filled' && order.remainingQuantity === '0'
    );
  }

  // 清空所有订单
  clearAllOrders(): void {
    this.orders = [];
  }

  // 更新订单状态
  updateOrderState(orderId: string, newState: OrderStatus): void {
    this.updateOrder(orderId, { orderState: newState });
  }

  // 批量更新订单状态
  batchUpdateOrderStates(orderIds: string[], newState: OrderStatus): void {
    orderIds.forEach(orderId => {
      this.updateOrderState(orderId, newState);
    });
  }

  // 获取订单状态历史（模拟）
  getOrderStateHistory(orderId: string): Array<{ state: OrderStatus; timestamp: number }> {
    // 简化实现，实际应该从数据库或区块链获取
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return [];

    return [{
      state: order.orderState,
      timestamp: order.createdAt
    }];
  }

  // 验证状态转换是否合法
  isValidStateTransition(currentState: OrderStatus, newState: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.NORMAL_RUNNING]: [
        OrderStatus.PREPARING_RISK_LOCK,
        OrderStatus.PREPARING_PROFIT_LOCK
      ],
      [OrderStatus.PREPARING_RISK_LOCK]: [OrderStatus.RISK_LOCKING],
      [OrderStatus.RISK_LOCKING]: [OrderStatus.NORMAL_RUNNING],
      [OrderStatus.PREPARING_PROFIT_LOCK]: [OrderStatus.PROFIT_LOCKING],
      [OrderStatus.PROFIT_LOCKING]: [OrderStatus.NORMAL_RUNNING]
    };

    return validTransitions[currentState]?.includes(newState) ?? false;
  }

  // 执行状态转换（带验证）
  transitionOrderState(orderId: string, newState: OrderStatus): boolean {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return false;

    if (!this.isValidStateTransition(order.orderState, newState)) {
      const error = createValidationError(`无效的状态转换: ${order.orderState} -> ${newState}`);
      errorHandler.handleError(error);
      return false;
    }

    this.updateOrderState(orderId, newState);
    return true;
  }

  // 取消订单
  cancelOrder(orderId: string): boolean {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return false;

    // 只有特定状态的订单可以取消
    const cancellableStates = [
      OrderStatus.NORMAL_RUNNING,
      OrderStatus.PREPARING_RISK_LOCK,
      OrderStatus.PREPARING_PROFIT_LOCK
    ];

    if (!cancellableStates.includes(order.orderState)) {
      const error = createValidationError(`订单状态不允许取消: ${order.orderState}`);
      errorHandler.handleError(error);
      return false;
    }

    // 更新订单状态为已取消
    this.updateOrder(orderId, {
      status: 'cancelled',
      orderState: OrderStatus.NORMAL_RUNNING,
      updatedAt: Date.now()
    });

    return true;
  }

  // 批量取消订单
  batchCancelOrders(orderIds: string[]): { successful: string[], failed: string[] } {
    const successful: string[] = [];
    const failed: string[] = [];

    orderIds.forEach(orderId => {
      if (this.cancelOrder(orderId)) {
        successful.push(orderId);
      } else {
        failed.push(orderId);
      }
    });

    return { successful, failed };
  }

  // 获取可取消的订单
  getCancellableOrders(): Order[] {
    const cancellableStates = [
      OrderStatus.NORMAL_RUNNING,
      OrderStatus.PREPARING_RISK_LOCK,
      OrderStatus.PREPARING_PROFIT_LOCK
    ];

    return this.orders.filter(order =>
      order.status === 'pending' &&
      cancellableStates.includes(order.orderState)
    );
  }
}
