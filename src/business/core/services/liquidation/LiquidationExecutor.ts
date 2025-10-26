/**
 * 清算执行服务
 * 基于Injective Exchange模块实现清算逻辑
 */

import { LiquidationOpportunity, LiquidationResult, FlashLiquidationParams } from '../../../../data/types';
import { LiquidationScanner } from './LiquidationScanner';

export class LiquidationExecutor {
  private static instance: LiquidationExecutor;
  private liquidationScanner: LiquidationScanner;

  private constructor() {
    this.liquidationScanner = LiquidationScanner.getInstance();
  }

  static getInstance(): LiquidationExecutor {
    if (!LiquidationExecutor.instance) {
      LiquidationExecutor.instance = new LiquidationExecutor();
    }
    return LiquidationExecutor.instance;
  }

  /**
   * 执行闪电贷清算
   * 基于Injective Exchange模块的清算仓位功能
   */
  async executeFlashLiquidation(
    opportunity: LiquidationOpportunity,
    params: FlashLiquidationParams
  ): Promise<LiquidationResult> {
    try {
      // 验证清算机会的有效性
      if (!this.validateLiquidationOpportunity(opportunity)) {
        throw new Error('清算机会无效');
      }

      // 预执行验证
      await this.preExecutionValidation(params);

      // 执行闪电贷清算
      const result = await this.performFlashLiquidation(params);

      return {
        success: true,
        txHash: result.txHash,
        liquidatedAmount: parseFloat(params.liquidationAmount),
        reward: result.reward,
        gasCost: result.gasCost,
        netProfit: result.netProfit
      };

    } catch (error) {
      console.error('闪电贷清算执行失败:', error);
      return {
        success: false,
        liquidatedAmount: parseFloat(params.liquidationAmount),
        reward: 0,
        gasCost: 0,
        netProfit: 0,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 执行普通清算（非闪电贷）
   */
  async executeLiquidation(
    opportunity: LiquidationOpportunity,
    liquidationAmount: number
  ): Promise<LiquidationResult> {
    try {
      // 验证清算机会
      if (!this.validateLiquidationOpportunity(opportunity)) {
        throw new Error('清算机会无效');
      }

      // 检查是否有足够的保证金进行清算
      if (!this.hasSufficientMargin(opportunity, liquidationAmount)) {
        throw new Error('保证金不足');
      }

      // 执行清算
      const result = await this.performLiquidation(opportunity, liquidationAmount);

      return {
        success: true,
        txHash: result.txHash,
        liquidatedAmount: liquidationAmount,
        reward: result.reward,
        gasCost: result.gasCost,
        netProfit: result.netProfit
      };

    } catch (error) {
      console.error('清算执行失败:', error);
      return {
        success: false,
        liquidatedAmount: liquidationAmount,
        reward: 0,
        gasCost: 0,
        netProfit: 0,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 预执行验证
   * 在实际执行前进行各种检查
   */
  private async preExecutionValidation(params: FlashLiquidationParams): Promise<void> {
    // 检查市场状态
    await this.validateMarketStatus(params.marketId);

    // 检查滑点容忍度
    if (params.slippageTolerance < 0.001 || params.slippageTolerance > 0.05) {
      throw new Error('滑点容忍度必须在0.1%-5%之间');
    }

    // 检查截止时间
    const currentTime = Date.now() / 1000;
    if (params.deadline <= currentTime) {
      throw new Error('交易已过期');
    }

    // 检查网络拥堵
    await this.checkNetworkCongestion();
  }

  /**
   * 执行闪电贷清算的核心逻辑
   */
  private async performFlashLiquidation(params: FlashLiquidationParams): Promise<{
    txHash: string;
    reward: number;
    gasCost: number;
    netProfit: number;
  }> {
    // 模拟闪电贷清算执行过程
    // 实际实现中会调用Injective SDK

    // 1. 借入资金
    const borrowedAmount = parseFloat(params.liquidationAmount);

    // 2. 执行清算交易
    const liquidationTx = await this.createLiquidationTransaction(params);

    // 3. 偿还闪电贷
    const repaymentTx = await this.createRepaymentTransaction(params);

    // 4. 计算收益
    const reward = borrowedAmount * 0.08; // 8%清算奖励
    const gasCost = 5.5; // Gas费用
    const flashLoanFee = borrowedAmount * 0.0009; // 0.09%闪电贷费用
    const netProfit = reward - gasCost - flashLoanFee;

    return {
      txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
      reward,
      gasCost,
      netProfit
    };
  }

  /**
   * 执行普通清算
   */
  private async performLiquidation(
    opportunity: LiquidationOpportunity,
    liquidationAmount: number
  ): Promise<{
    txHash: string;
    reward: number;
    gasCost: number;
    netProfit: number;
  }> {
    // 模拟普通清算执行
    const reward = liquidationAmount * opportunity.liquidationBonus;
    const gasCost = 3.5;
    const netProfit = reward - gasCost;

    return {
      txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
      reward,
      gasCost,
      netProfit
    };
  }

  /**
   * 验证清算机会
   */
  private validateLiquidationOpportunity(opportunity: LiquidationOpportunity): boolean {
    // 检查健康因子
    if (opportunity.healthFactor >= 1) {
      return false;
    }

    // 检查清算阈值
    if (opportunity.liquidationThreshold && opportunity.healthFactor > opportunity.liquidationThreshold) {
      return false;
    }

    // 检查时间戳（避免过期的机会）
    if (opportunity.timestamp) {
      const age = Date.now() - opportunity.timestamp;
      if (age > 300000) { // 5分钟过期
        return false;
      }
    }

    return true;
  }

  /**
   * 检查是否有足够的保证金
   */
  private hasSufficientMargin(opportunity: LiquidationOpportunity, liquidationAmount: number): boolean {
    const requiredMargin = liquidationAmount * (opportunity.maintenanceMarginRatio || 0.05);
    return opportunity.position.margin >= requiredMargin.toString();
  }

  /**
   * 验证市场状态
   */
  private async validateMarketStatus(marketId: string): Promise<void> {
    // 模拟市场状态检查
    // 实际实现中会查询Injective市场状态
    const isActive = Math.random() > 0.1; // 90%概率市场活跃
    if (!isActive) {
      throw new Error('市场当前不可用');
    }
  }

  /**
   * 检查网络拥堵情况
   */
  private async checkNetworkCongestion(): Promise<void> {
    // 模拟网络拥堵检查
    const congestionLevel = Math.random();
    if (congestionLevel > 0.8) {
      throw new Error('网络拥堵，请稍后再试');
    }
  }

  /**
   * 创建清算交易
   */
  private async createLiquidationTransaction(params: FlashLiquidationParams): Promise<any> {
    // 模拟创建清算交易
    // 实际实现中会使用Injective SDK创建MsgLiquidatePosition
    return {
      type: 'liquidate',
      marketId: params.marketId,
      subaccountId: params.subaccountId,
      liquidationAmount: params.liquidationAmount
    };
  }

  /**
   * 创建还款交易
   */
  private async createRepaymentTransaction(params: FlashLiquidationParams): Promise<any> {
    // 模拟创建还款交易
    return {
      type: 'repayment',
      amount: params.liquidationAmount,
      fee: parseFloat(params.liquidationAmount) * 0.0009
    };
  }

  /**
   * 计算清算效率
   */
  calculateLiquidationEfficiency(opportunity: LiquidationOpportunity): number {
    const costs = this.liquidationScanner.calculateLiquidationCost(opportunity.maxLiquidationAmount);
    const reward = opportunity.maxLiquidationAmount * opportunity.liquidationBonus;
    const netProfit = reward - costs.totalCost;

    return netProfit / costs.totalCost; // 收益与成本比
  }

  /**
   * 获取最佳清算时机
   */
  getOptimalLiquidationTiming(opportunity: LiquidationOpportunity): {
    immediate: boolean;
    waitTime?: number;
    reason: string;
  } {
    const healthFactor = opportunity.healthFactor;

    if (healthFactor < 0.7) {
      return {
        immediate: true,
        reason: '健康因子极低，建议立即清算'
      };
    } else if (healthFactor < 0.9) {
      return {
        immediate: false,
        waitTime: 300000, // 5分钟
        reason: '健康因子较低，建议等待更优时机'
      };
    } else {
      return {
        immediate: false,
        waitTime: 600000, // 10分钟
        reason: '健康因子适中，建议等待进一步恶化'
      };
    }
  }
}
