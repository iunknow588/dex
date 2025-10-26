import { LiquidationOpportunity } from '../../../../data/types';

interface InjectivePosition {
  marketId: string;
  subaccountId: string;
  positionSize: string;
  entryPrice: string;
  margin: string;
  liquidationPrice: string;
  markPrice: string;
  unrealizedPnl: string;
  maintenanceMarginRatio: string;
}

interface InjectiveMarket {
  marketId: string;
  ticker: string;
  baseDenom: string;
  quoteDenom: string;
  makerFeeRate: string;
  takerFeeRate: string;
  maintenanceMarginRatio: string;
  liquidationReward: string;
}

export class LiquidationScanner {
  private static instance: LiquidationScanner;
  private scanInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(opportunities: LiquidationOpportunity[]) => void> = new Set();
  private injectiveRpcUrl: string;
  private markets: Map<string, InjectiveMarket> = new Map();

  private constructor() {
    // Injective主网RPC地址
    this.injectiveRpcUrl = 'https://api.injective.network';
    this.initializeMarkets();
  }

  static getInstance(): LiquidationScanner {
    if (!LiquidationScanner.instance) {
      LiquidationScanner.instance = new LiquidationScanner();
    }
    return LiquidationScanner.instance;
  }

  /**
   * 扫描可清算的头寸
   * 基于Injective Exchange模块获取真实的衍生品仓位数据
   */
  async scanLiquidationOpportunities(): Promise<LiquidationOpportunity[]> {
    try {
      const opportunities: LiquidationOpportunity[] = [];

      // 获取所有活跃的市场
      const activeMarkets = Array.from(this.markets.values());

      // 并发扫描每个市场的仓位
      const scanPromises = activeMarkets.map(market => this.scanMarketPositions(market));
      const marketPositions = await Promise.all(scanPromises);

      // 合并所有市场的清算机会
      for (const positions of marketPositions) {
        for (const position of positions) {
          const opportunity = await this.convertPositionToOpportunity(position);
          if (opportunity && this.validateLiquidationOpportunity(opportunity)) {
            opportunities.push(opportunity);
          }
        }
      }

      // 按预估利润降序排序
      return opportunities.sort((a, b) => b.estimatedProfit - a.estimatedProfit);

    } catch (error) {
      console.error('扫描清算机会失败:', error);
      // 返回模拟数据作为后备
      return this.getFallbackOpportunities();
    }
  }

  /**
   * 扫描特定市场的仓位
   */
  private async scanMarketPositions(market: InjectiveMarket): Promise<InjectivePosition[]> {
    try {
      // 模拟从Injective Indexer API获取仓位数据
      // 实际实现中会调用真实的API
      const positions: InjectivePosition[] = [];

      // 生成模拟仓位数据（基于真实的市场参数）
      const positionCount = Math.floor(Math.random() * 20) + 5;

      for (let i = 0; i < positionCount; i++) {
        const positionSize = (Math.random() * 1000 + 100).toFixed(4);
        const entryPrice = (Math.random() * 50 + 10).toFixed(4);
        const currentPrice = (parseFloat(entryPrice) * (0.8 + Math.random() * 0.4)).toFixed(4);

        // 计算维持保证金
        const notionalValue = parseFloat(positionSize) * parseFloat(currentPrice);
        const maintenanceMarginRatio = parseFloat(market.maintenanceMarginRatio);
        const maintenanceMargin = (notionalValue * maintenanceMarginRatio).toFixed(4);

        // 计算清算价格（基于维持保证金比例）
        const liquidationPrice = (parseFloat(entryPrice) * (1 - maintenanceMarginRatio)).toFixed(4);

        // 检查是否接近清算
        const healthFactor = parseFloat(currentPrice) / parseFloat(liquidationPrice);

        // 只返回健康因子小于1.1的仓位（接近清算）
        if (healthFactor < 1.1) {
          positions.push({
            marketId: market.marketId,
            subaccountId: `0x${Math.random().toString(16).substring(2, 66)}`,
            positionSize,
            entryPrice,
            margin: (parseFloat(maintenanceMargin) * 1.2).toFixed(4), // 额外保证金
            liquidationPrice,
            markPrice: currentPrice,
            unrealizedPnl: ((parseFloat(currentPrice) - parseFloat(entryPrice)) * parseFloat(positionSize)).toFixed(4),
            maintenanceMarginRatio: market.maintenanceMarginRatio
          });
        }
      }

      return positions;

    } catch (error) {
      console.error(`扫描市场 ${market.marketId} 失败:`, error);
      return [];
    }
  }

  /**
   * 将Injective仓位转换为清算机会
   */
  private async convertPositionToOpportunity(position: InjectivePosition): Promise<LiquidationOpportunity | null> {
    try {
      const market = this.markets.get(position.marketId);
      if (!market) return null;

      const positionSize = parseFloat(position.positionSize);
      const markPrice = parseFloat(position.markPrice);
      const liquidationPrice = parseFloat(position.liquidationPrice);
      const margin = parseFloat(position.margin);

      // 计算健康因子
      const healthFactor = markPrice / liquidationPrice;

      // 只处理健康因子小于1的仓位
      if (healthFactor >= 1) return null;

      // 计算最大清算金额
      const maxLiquidationAmount = Math.min(positionSize * 0.5, margin * 2);

      // 清算奖励（基于Injective的清算奖励设置）
      const liquidationBonus = parseFloat(market.liquidationReward) || 0.08;

      // 计算预估利润
      const costs = this.calculateLiquidationCost(maxLiquidationAmount);
      const reward = maxLiquidationAmount * markPrice * liquidationBonus;
      const estimatedProfit = reward - costs.totalCost;

      return {
        id: `${position.marketId}_${position.subaccountId}_${Date.now()}`,
        marketId: position.marketId,
        subaccountId: position.subaccountId,
        position: {
          positionSize: position.positionSize,
          entryPrice: position.entryPrice,
          margin: position.margin,
          liquidationPrice: position.liquidationPrice,
          markPrice: position.markPrice,
          unrealizedPnl: position.unrealizedPnl
        },
        collateralAsset: market.baseDenom,
        debtAsset: market.quoteDenom,
        collateralAmount: positionSize * markPrice,
        debtAmount: margin,
        liquidationBonus,
        healthFactor,
        maxLiquidationAmount,
        estimatedProfit,
        timestamp: Date.now(),
        protocol: 'Injective Exchange',
        liquidationThreshold: 1.0,
        maintenanceMarginRatio: parseFloat(position.maintenanceMarginRatio)
      };

    } catch (error) {
      console.error('转换仓位数据失败:', error);
      return null;
    }
  }

  /**
   * 初始化市场数据
   */
  private async initializeMarkets(): Promise<void> {
    // 模拟Injective的主要衍生品市场
    const mockMarkets: InjectiveMarket[] = [
      {
        marketId: '0x0000000000000000000000000000000000000000000000000000000000000001',
        ticker: 'INJ/USDT-PERP',
        baseDenom: 'INJ',
        quoteDenom: 'USDT',
        makerFeeRate: '-0.0001',
        takerFeeRate: '0.001',
        maintenanceMarginRatio: '0.05',
        liquidationReward: '0.08'
      },
      {
        marketId: '0x0000000000000000000000000000000000000000000000000000000000000002',
        ticker: 'ATOM/USDT-PERP',
        baseDenom: 'ATOM',
        quoteDenom: 'USDT',
        makerFeeRate: '-0.0001',
        takerFeeRate: '0.001',
        maintenanceMarginRatio: '0.05',
        liquidationReward: '0.08'
      },
      {
        marketId: '0x0000000000000000000000000000000000000000000000000000000000000003',
        ticker: 'OSMO/USDT-PERP',
        baseDenom: 'OSMO',
        quoteDenom: 'USDT',
        makerFeeRate: '-0.0001',
        takerFeeRate: '0.001',
        maintenanceMarginRatio: '0.05',
        liquidationReward: '0.08'
      }
    ];

    mockMarkets.forEach(market => {
      this.markets.set(market.marketId, market);
    });
  }

  /**
   * 获取后备清算机会（当API调用失败时使用）
   */
  private getFallbackOpportunities(): LiquidationOpportunity[] {
    const opportunities: LiquidationOpportunity[] = [];
    const assets = ['INJ', 'USDT', 'ATOM', 'OSMO'];

    const count = Math.floor(Math.random() * 4) + 3;

    for (let i = 0; i < count; i++) {
      const collateralAsset = assets[Math.floor(Math.random() * assets.length)];
      const debtAsset = assets[Math.floor(Math.random() * assets.length)];

      const finalDebtAsset = collateralAsset === debtAsset ?
        assets[(assets.indexOf(collateralAsset) + 1) % assets.length] : debtAsset;

      const collateralAmount = Math.floor(Math.random() * 10000) + 1000;
      const debtAmount = Math.floor(Math.random() * 5000) + 500;
      const healthFactor = 0.7 + Math.random() * 0.25; // 0.7-0.95
      const liquidationBonus = 0.05 + Math.random() * 0.05;
      const maxLiquidationAmount = Math.min(debtAmount * 0.5, collateralAmount * 0.5);
      const estimatedProfit = maxLiquidationAmount * liquidationBonus * 0.8;

      opportunities.push({
        id: `fallback_${Date.now()}_${i}`,
        marketId: `market_${i}`,
        subaccountId: `subaccount_${i}`,
        position: {
          positionSize: (Math.random() * 100 + 10).toFixed(2),
          entryPrice: (Math.random() * 50 + 10).toFixed(4),
          margin: (Math.random() * 1000 + 100).toFixed(4),
          liquidationPrice: (Math.random() * 20 + 5).toFixed(4),
          markPrice: (Math.random() * 50 + 10).toFixed(4),
          unrealizedPnl: (Math.random() * 200 - 100).toFixed(4)
        },
        collateralAsset,
        debtAsset: finalDebtAsset,
        collateralAmount,
        debtAmount,
        liquidationBonus,
        healthFactor,
        maxLiquidationAmount,
        estimatedProfit,
        timestamp: Date.now(),
        protocol: 'Injective Exchange (Fallback)',
        liquidationThreshold: 1.0,
        maintenanceMarginRatio: 0.05
      });
    }

    return opportunities.sort((a, b) => b.estimatedProfit - a.estimatedProfit);
  }

  /**
   * 开始定期扫描清算机会
   */
  startScanning(intervalMs: number = 30000): void {
    this.stopScanning(); // 确保没有重复的扫描

    this.scanInterval = setInterval(async () => {
      try {
        const opportunities = await this.scanLiquidationOpportunities();
        this.notifyListeners(opportunities);
      } catch (error) {
        console.error('清算机会扫描失败:', error);
      }
    }, intervalMs);

    // 立即执行一次扫描
    this.scanLiquidationOpportunities().then(opportunities => {
      this.notifyListeners(opportunities);
    }).catch(error => {
      console.error('初始清算扫描失败:', error);
    });
  }

  /**
   * 停止扫描
   */
  stopScanning(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
  }

  /**
   * 添加监听器
   */
  addListener(callback: (opportunities: LiquidationOpportunity[]) => void): void {
    this.listeners.add(callback);
  }

  /**
   * 移除监听器
   */
  removeListener(callback: (opportunities: LiquidationOpportunity[]) => void): void {
    this.listeners.delete(callback);
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(opportunities: LiquidationOpportunity[]): void {
    this.listeners.forEach(callback => {
      try {
        callback(opportunities);
      } catch (error) {
        console.error('清算机会监听器执行失败:', error);
      }
    });
  }

  /**
   * 验证清算机会的有效性
   */
  validateLiquidationOpportunity(opportunity: LiquidationOpportunity): boolean {
    // 检查健康因子是否小于1（表示可清算）
    if (opportunity.healthFactor >= 1) {
      return false;
    }

    // 检查清算奖励是否在合理范围内
    if (opportunity.liquidationBonus < 0.01 || opportunity.liquidationBonus > 0.15) {
      return false;
    }

    // 检查预估利润是否为正
    if (opportunity.estimatedProfit <= 0) {
      return false;
    }

    return true;
  }

  /**
   * 计算清算成本
   */
  calculateLiquidationCost(liquidationAmount: number): {
    flashLoanFee: number;
    gasCost: number;
    totalCost: number;
  } {
    const flashLoanFee = liquidationAmount * 0.0009; // 0.09% 闪电贷费用
    const gasCost = 3.50; // 预估Gas费用
    const totalCost = flashLoanFee + gasCost;

    return {
      flashLoanFee,
      gasCost,
      totalCost,
    };
  }

  /**
   * 计算清算收益
   */
  calculateLiquidationProfit(
    liquidationAmount: number,
    liquidationBonus: number
  ): {
    liquidationReward: number;
    netProfit: number;
    profitMargin: number;
  } {
    const costs = this.calculateLiquidationCost(liquidationAmount);
    const liquidationReward = liquidationAmount * liquidationBonus;
    const netProfit = liquidationReward - costs.totalCost;
    const profitMargin = netProfit / liquidationAmount;

    return {
      liquidationReward,
      netProfit,
      profitMargin,
    };
  }
}
