import { Order, HedgeConfig } from '../../../data/types';

export class RiskCalculator {
  // 计算持仓风险
  static calculatePositionRisk(position: {
    quantity: number;
    entryPrice: number;
    currentPrice: number;
    liquidationPrice?: number;
  }): {
    unrealizedPnL: number;
    unrealizedPnLPercent: number;
    riskLevel: 'low' | 'medium' | 'high';
    liquidationRisk: boolean;
  } {
    const { quantity, entryPrice, currentPrice, liquidationPrice } = position;

    const unrealizedPnL = quantity * (currentPrice - entryPrice);
    const unrealizedPnLPercent = (unrealizedPnL / (quantity * entryPrice)) * 100;

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (Math.abs(unrealizedPnLPercent) > 20) {
      riskLevel = 'high';
    } else if (Math.abs(unrealizedPnLPercent) > 10) {
      riskLevel = 'medium';
    }

    const liquidationRisk = liquidationPrice ?
      (currentPrice <= liquidationPrice) : false;

    return {
      unrealizedPnL,
      unrealizedPnLPercent,
      riskLevel,
      liquidationRisk
    };
  }

  // 计算对冲策略风险
  static calculateHedgeRisk(config: HedgeConfig, currentPrice: number): {
    riskLockDistance: number;
    profitLockDistance: number;
    optimalHedgeRatio: number;
    riskScore: number; // 0-100, 越高风险越大
  } {
    const riskLockPrice = parseFloat(config.riskLockPrice);
    const profitLockPrice = parseFloat(config.profitLockPrice);
    const quantity = parseFloat(config.quantity);

    const riskLockDistance = Math.abs(currentPrice - riskLockPrice) / currentPrice;
    const profitLockDistance = Math.abs(currentPrice - profitLockPrice) / currentPrice;

    // 计算最优对冲比例（基于凯利公式简化版）
    const optimalHedgeRatio = Math.min(0.5, Math.abs(riskLockDistance - profitLockDistance));

    // 计算风险评分
    let riskScore = 0;
    if (riskLockDistance < 0.05) riskScore += 30; // 风险线太近
    if (profitLockDistance < 0.05) riskScore += 20; // 利润线太近
    if (quantity > 1000) riskScore += 25; // 仓位过大
    if (!config.enabled) riskScore += 10; // 对冲未启用

    return {
      riskLockDistance,
      profitLockDistance,
      optimalHedgeRatio,
      riskScore: Math.min(100, riskScore)
    };
  }

  // 计算闪电贷风险
  static calculateFlashLoanRisk(params: {
    loanAmount: number;
    token: string;
    strategy: string;
    maxSlippage: number;
    gasEstimate: number;
  }): {
    liquidationRisk: number; // 0-1
    slippageRisk: number; // 0-1
    gasRisk: number; // 0-1
    overallRisk: number; // 0-1
    riskLevel: 'low' | 'medium' | 'high';
  } {
    const { loanAmount, maxSlippage, gasEstimate } = params;

    // 简化的风险计算
    const liquidationRisk = Math.min(1, loanAmount / 100000); // 大额借贷风险
    const slippageRisk = maxSlippage / 100; // 滑点风险
    const gasRisk = Math.min(1, gasEstimate / 100000); // Gas费用风险

    const overallRisk = (liquidationRisk + slippageRisk + gasRisk) / 3;

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (overallRisk > 0.7) {
      riskLevel = 'high';
    } else if (overallRisk > 0.4) {
      riskLevel = 'medium';
    }

    return {
      liquidationRisk,
      slippageRisk,
      gasRisk,
      overallRisk,
      riskLevel
    };
  }

  // 计算投资组合风险
  static calculatePortfolioRisk(orders: Order[], currentPrices: Record<string, number>): {
    totalValue: number;
    totalRisk: number;
    diversificationScore: number; // 0-1, 越高越分散
    concentrationRisk: string[];
  } {
    const symbolValues: Record<string, number> = {};
    let totalValue = 0;

    orders.forEach(order => {
      const price = currentPrices[order.marketId] || 0;
      const value = parseFloat(order.quantity) * price;
      symbolValues[order.marketId] = (symbolValues[order.marketId] || 0) + value;
      totalValue += value;
    });

    // 计算集中度风险
    const concentrations = Object.entries(symbolValues)
      .map(([symbol, value]) => ({
        symbol,
        percentage: value / totalValue,
        risk: value / totalValue > 0.5 ? 'high' : value / totalValue > 0.3 ? 'medium' : 'low'
      }))
      .filter(item => item.risk !== 'low');

    // 计算分散化评分
    const symbolCount = Object.keys(symbolValues).length;
    const diversificationScore = Math.min(1, symbolCount / 5); // 5个以上资产为满分

    return {
      totalValue,
      totalRisk: concentrations.length,
      diversificationScore,
      concentrationRisk: concentrations.map(c => `${c.symbol}: ${c.risk} risk`)
    };
  }

  // 计算VaR（风险价值）
  static calculateVaR(params: {
    position: number;
    volatility: number; // 年度波动率
    confidence: number; // 置信度，如0.95
    timeHorizon: number; // 时间跨度（天）
  }): {
    var95: number; // 95%置信度下的最大损失
    expectedShortfall: number; // 期望亏空
    riskLevel: 'low' | 'medium' | 'high';
  } {
    const { position, volatility, confidence, timeHorizon } = params;

    // 简化的VaR计算（正态分布假设）
    const zScore = confidence === 0.95 ? 1.645 :
                   confidence === 0.99 ? 2.326 : 1.96;

    const dailyVolatility = volatility / Math.sqrt(365);
    const timeAdjustedVolatility = dailyVolatility * Math.sqrt(timeHorizon);

    const var95 = position * timeAdjustedVolatility * zScore;
    const expectedShortfall = position * timeAdjustedVolatility * (zScore / (1 - confidence));

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    const varPercent = Math.abs(var95 / position);
    if (varPercent > 0.1) riskLevel = 'high';
    else if (varPercent > 0.05) riskLevel = 'medium';

    return {
      var95,
      expectedShortfall,
      riskLevel
    };
  }

  // 生成风险报告
  static generateRiskReport(params: {
    orders: Order[];
    hedgeConfig?: HedgeConfig;
    currentPrices: Record<string, number>;
  }): {
    summary: string;
    recommendations: string[];
    riskMetrics: Record<string, any>;
  } {
    const { orders, hedgeConfig, currentPrices } = params;

    // 计算各项风险指标
    const portfolioRisk = this.calculatePortfolioRisk(orders, currentPrices);
    const hedgeRisk = hedgeConfig ? this.calculateHedgeRisk(hedgeConfig, 30) : null; // 假设当前价格30

    // 生成总结
    const summary = this.generateSummary(portfolioRisk, hedgeRisk);

    // 生成建议
    const recommendations = this.generateRecommendations(portfolioRisk, hedgeRisk);

    return {
      summary,
      recommendations,
      riskMetrics: {
        portfolioRisk,
        hedgeRisk
      }
    };
  }

  private static generateSummary(portfolioRisk: any, hedgeRisk: any): string {
    let summary = `投资组合总价值: $${portfolioRisk.totalValue.toFixed(2)}`;

    if (portfolioRisk.diversificationScore < 0.6) {
      summary += '。警告：投资过于集中，建议分散投资。';
    }

    if (hedgeRisk && hedgeRisk.riskScore > 50) {
      summary += `对冲风险评分: ${hedgeRisk.riskScore}/100，建议调整对冲策略。`;
    }

    return summary;
  }

  private static generateRecommendations(portfolioRisk: any, hedgeRisk: any): string[] {
    const recommendations: string[] = [];

    if (portfolioRisk.diversificationScore < 0.6) {
      recommendations.push('增加资产多样性，降低集中风险');
    }

    if (hedgeRisk && hedgeRisk.riskScore > 50) {
      recommendations.push('调整对冲价格区间，避免风险过于集中');
    }

    if (portfolioRisk.concentrationRisk.length > 0) {
      recommendations.push(`关注高风险资产: ${portfolioRisk.concentrationRisk.join(', ')}`);
    }

    return recommendations;
  }
}
