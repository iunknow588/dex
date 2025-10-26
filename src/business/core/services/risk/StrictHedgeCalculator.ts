import { Order } from '../../../data/types';

export class StrictHedgeCalculator {
  // 严格对冲计算：主订单 + 固定比例对冲单
  static calculateStrictHedge(mainOrder: Order, hedgeRatio: number = 0.5): {
    mainOrder: Order;
    hedgeOrder: Order;
    totalExposure: number;
    netExposure: number;
    hedgeEfficiency: number; // 对冲效率 0-1
  } {
    const mainQuantity = parseFloat(mainOrder.quantity);
    const hedgeQuantity = mainQuantity * hedgeRatio;

    // 创建对冲订单（反向操作）
    const hedgeOrder: Order = {
      ...mainOrder,
      id: Math.random().toString(36).substring(2, 15),
      side: mainOrder.side === 'buy' ? 'sell' : 'buy',
      quantity: hedgeQuantity.toString(),
      filledQuantity: '0',
      remainingQuantity: hedgeQuantity.toString(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const totalExposure = mainQuantity + hedgeQuantity;
    const netExposure = Math.abs(mainQuantity - hedgeQuantity);
    const hedgeEfficiency = 1 - (netExposure / totalExposure);

    return {
      mainOrder,
      hedgeOrder,
      totalExposure,
      netExposure,
      hedgeEfficiency
    };
  }

  // 计算严格对冲的最优比例
  static calculateOptimalHedgeRatio(params: {
    volatility: number;
    correlation: number;
    riskTolerance: number;
  }): number {
    const { volatility, correlation, riskTolerance } = params;

    // 基于现代投资组合理论计算最优对冲比例
    // 简化公式：h = (σ² - ρσ₁σ₂) / (σ₁² + σ₂² - 2ρσ₁σ₂)
    // 假设两个资产的相关系数和波动率

    // 简化计算：根据风险容忍度调整
    let optimalRatio = 0.5; // 基础50%对冲

    if (volatility > 0.3) {
      optimalRatio = Math.min(0.8, optimalRatio + 0.2); // 高波动增加对冲
    }

    if (correlation > 0.7) {
      optimalRatio = Math.min(0.9, optimalRatio + 0.1); // 高相关性增加对冲
    }

    if (riskTolerance > 0.7) {
      optimalRatio = Math.max(0.2, optimalRatio - 0.2); // 高风险容忍减少对冲
    }

    return optimalRatio;
  }

  // 评估严格对冲的有效性
  static evaluateHedgeEffectiveness(params: {
    mainReturns: number[];
    hedgeReturns: number[];
    benchmarkReturns: number[];
  }): {
    hedgeRatio: number;
    sharpeRatio: number;
    maxDrawdown: number;
    effectiveness: number; // 对冲有效性评分 0-1
  } {
    const { mainReturns, hedgeReturns, benchmarkReturns } = params;

    // 计算对冲组合收益
    const hedgedReturns = mainReturns.map((main, i) =>
      main + (hedgeReturns[i] || 0) * 0.5
    );

    // 计算夏普比率
    const avgReturn = hedgedReturns.reduce((a, b) => a + b, 0) / hedgedReturns.length;
    const volatility = Math.sqrt(
      hedgedReturns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / hedgedReturns.length
    );
    const sharpeRatio = volatility > 0 ? avgReturn / volatility : 0;

    // 计算最大回撤
    let maxDrawdown = 0;
    let peak = hedgedReturns[0] || 0;

    hedgedReturns.forEach(ret => {
      if (ret > peak) peak = ret;
      const drawdown = (peak - ret) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    });

    // 计算对冲有效性（相对于基准的对冲效果）
    const benchmarkVolatility = Math.sqrt(
      benchmarkReturns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / benchmarkReturns.length
    );

    const effectiveness = Math.max(0, Math.min(1,
      (benchmarkVolatility - volatility) / benchmarkVolatility
    ));

    return {
      hedgeRatio: 0.5, // 假设50%对冲
      sharpeRatio,
      maxDrawdown,
      effectiveness
    };
  }
}
