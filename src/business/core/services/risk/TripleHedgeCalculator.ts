import { Order, HedgeConfig, OrderStatus } from '../../../data/types';

export class TripleHedgeCalculator {
  // 动态对冲计算：主订单 + 互斥对冲单（最多两单）
  static calculateTripleHedge(config: HedgeConfig): {
    mainOrder: Partial<Order>;
    stopLossOrder: Partial<Order>;
    takeProfitOrder: Partial<Order>;
    riskRewardRatio: number;
    breakevenPrice: number;
    maxProfit: number;
    maxLoss: number;
  } {
    const entryPrice = 30; // 假设当前价格
    const quantity = parseFloat(config.quantity);
    const riskLockPrice = parseFloat(config.riskLockPrice);
    const profitLockPrice = parseFloat(config.profitLockPrice);

    // 主订单
    const mainOrder: Partial<Order> = {
      side: 'buy', // 假设做多
      quantity: config.quantity,
      orderState: OrderStatus.NORMAL_RUNNING
    };

    // 止损单（反向风险锁定）
    const stopLossOrder: Partial<Order> = {
      side: 'sell',
      quantity: config.quantity,
      price: config.riskLockPrice,
      orderState: OrderStatus.RISK_LOCKING
    };

    // 止盈单（正向利润锁定）
    const takeProfitOrder: Partial<Order> = {
      side: 'sell',
      quantity: config.quantity,
      price: config.profitLockPrice,
      orderState: OrderStatus.PROFIT_LOCKING
    };

    // 计算风险收益比
    const riskAmount = (entryPrice - riskLockPrice) * quantity;
    const rewardAmount = (profitLockPrice - entryPrice) * quantity;
    const riskRewardRatio = rewardAmount / riskAmount;

    // 计算保本价格
    const commission = 0.001; // 假设0.1%手续费
    const breakevenPrice = entryPrice * (1 + commission);

    // 计算最大利润和损失
    const maxProfit = rewardAmount - (entryPrice * quantity * commission);
    const maxLoss = riskAmount + (entryPrice * quantity * commission);

    return {
      mainOrder,
      stopLossOrder,
      takeProfitOrder,
      riskRewardRatio,
      breakevenPrice,
      maxProfit,
      maxLoss
    };
  }

  // 计算动态对冲的盈亏概率
  static calculateTripleHedgeProbabilities(params: {
    entryPrice: number;
    stopLossPrice: number;
    takeProfitPrice: number;
    currentPrice: number;
    volatility: number; // 价格波动率
    timeToExpiry: number; // 到期时间（天）
  }): {
    winProbability: number;
    lossProbability: number;
    breakevenProbability: number;
    expectedReturn: number;
    riskOfRuin: number;
  } {
    const { stopLossPrice, takeProfitPrice, currentPrice, volatility, timeToExpiry } = params;

    // 简化的概率计算（基于几何布朗运动）
    const riskDistance = Math.abs(currentPrice - stopLossPrice) / currentPrice;
    const rewardDistance = Math.abs(takeProfitPrice - currentPrice) / currentPrice;

    // 使用波动率调整概率
    const timeAdjustedVolatility = volatility * Math.sqrt(timeToExpiry / 365);
    const riskProb = this.calculateBarrierProbability(riskDistance, timeAdjustedVolatility);
    const rewardProb = this.calculateBarrierProbability(rewardDistance, timeAdjustedVolatility);

    const winProbability = rewardProb;
    const lossProbability = riskProb;
    const breakevenProbability = 1 - winProbability - lossProbability;

    // 计算期望收益
    const positionSize = 1; // 标准化
    const winAmount = rewardDistance * positionSize;
    const lossAmount = riskDistance * positionSize;

    const expectedReturn = (winProbability * winAmount) - (lossProbability * lossAmount);

    // 计算破产风险（简化）
    const riskOfRuin = lossProbability > 0.5 ? 0.8 :
                       lossProbability > 0.3 ? 0.4 : 0.1;

    return {
      winProbability,
      lossProbability,
      breakevenProbability,
      expectedReturn,
      riskOfRuin
    };
  }

  // 计算价格突破概率（简化实现）
  private static calculateBarrierProbability(distance: number, volatility: number): number {
    // 使用简化的正态分布计算
    const z = distance / volatility;
    return 1 - this.normalCDF(z);
  }

  // 正态分布累积分布函数（近似）
  private static normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
  }

  // 优化动态对冲参数
  static optimizeTripleHedge(params: {
    entryPrice: number;
    volatility: number;
    riskTolerance: number; // 0-1
    rewardTarget: number; // 期望收益倍数
  }): {
    optimalStopLoss: number;
    optimalTakeProfit: number;
    expectedRRRatio: number;
    winRate: number;
  } {
    const { entryPrice, volatility, riskTolerance, rewardTarget } = params;

    // 基于波动率和风险容忍度计算最优止损位
    const optimalRiskDistance = volatility * (1 - riskTolerance) * 2;
    const optimalStopLoss = entryPrice * (1 - optimalRiskDistance);

    // 基于期望收益倍数计算止盈位
    const optimalRewardDistance = optimalRiskDistance * rewardTarget;
    const optimalTakeProfit = entryPrice * (1 + optimalRewardDistance);

    // 计算期望风险收益比
    const expectedRRRatio = optimalRewardDistance / optimalRiskDistance;

    // 估算胜率（简化）
    const winRate = Math.max(0.3, Math.min(0.7, 0.5 + (riskTolerance - 0.5) * 0.4));

    return {
      optimalStopLoss,
      optimalTakeProfit,
      expectedRRRatio,
      winRate
    };
  }

  // 动态对冲的资金效率分析
  static analyzeTripleHedgeEfficiency(params: {
    accountBalance: number;
    positionSize: number;
    stopLossDistance: number;
    takeProfitDistance: number;
    winRate: number;
  }): {
    capitalEfficiency: number; // 资金使用效率 0-1
    riskAdjustedReturn: number;
    kellyCriterion: number; // 凯利公式建议仓位
    optimalPositionSize: number;
  } {
    const { accountBalance, positionSize, stopLossDistance, takeProfitDistance, winRate } = params;

    // 计算资金效率
    const capitalEfficiency = Math.min(1, positionSize / accountBalance);

    // 计算风险调整收益
    const avgWin = takeProfitDistance;
    const avgLoss = stopLossDistance;
    const riskAdjustedReturn = (winRate * avgWin) - ((1 - winRate) * avgLoss);

    // 凯利公式计算最优仓位
    const winLossRatio = avgWin / avgLoss;
    const kellyCriterion = winRate - ((1 - winRate) / winLossRatio);

    // 建议最优仓位（保守估计）
    const optimalPositionSize = Math.max(0, Math.min(
      accountBalance * 0.1, // 最高10%
      accountBalance * kellyCriterion * 0.5 // 凯利建议的一半（保守）
    ));

    return {
      capitalEfficiency,
      riskAdjustedReturn,
      kellyCriterion,
      optimalPositionSize
    };
  }
}
