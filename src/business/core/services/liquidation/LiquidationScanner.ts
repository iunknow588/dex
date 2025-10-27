/**
 * 清算机会扫描器
 * 实时扫描可清算的仓位
 */

import { InjectiveService } from '../injective/InjectiveService';

export interface LiquidationOpportunity {
  id: string;
  marketId: string;
  subaccountId: string;
  liquidationAmount: string;
  collateralAsset: string;
  debtAsset: string;
  liquidationBonus: number;
  healthFactor: number;
  estimatedProfit: number;
  timestamp?: number;
  protocol?: string;
}

export interface ScannerConfig {
  scanInterval: number; // 扫描间隔（毫秒）
  maxConcurrentScans: number; // 最大并发扫描数
  enabledMarkets: string[]; // 启用的市场列表
  minProfitThreshold: number; // 最小收益阈值
}

export interface ScanResult {
  opportunities: LiquidationOpportunity[];
  scanTime: number;
  totalScanned: number;
  errors: string[];
}

export class LiquidationScanner {
  private injectiveService: InjectiveService;
  private config: ScannerConfig;
  private isScanning: boolean = false;
  private scanTimer?: NodeJS.Timeout;
  private onOpportunityFound?: (opportunity: LiquidationOpportunity) => void;
  private onScanComplete?: (result: ScanResult) => void;

  constructor(
    injectiveService: InjectiveService,
    config: Partial<ScannerConfig> = {}
  ) {
    this.injectiveService = injectiveService;
    this.config = {
      scanInterval: 10000, // 10秒
      maxConcurrentScans: 5,
      enabledMarkets: [],
      minProfitThreshold: 10, // 最小10美元收益
      ...config,
    };
  }

  /**
   * 设置回调函数
   */
  setCallbacks(
    onOpportunityFound?: (opportunity: LiquidationOpportunity) => void,
    onScanComplete?: (result: ScanResult) => void
  ) {
    this.onOpportunityFound = onOpportunityFound;
    this.onScanComplete = onScanComplete;
  }

  /**
   * 开始扫描
   */
  startScanning(): void {
    if (this.isScanning) {
      console.warn('扫描器已在运行中');
      return;
    }

    this.isScanning = true;
    console.log('开始清算机会扫描...');
    
    // 立即执行一次扫描
    this.performScan();
    
    // 设置定时扫描
    this.scanTimer = setInterval(() => {
      this.performScan();
    }, this.config.scanInterval);
  }

  /**
   * 停止扫描
   */
  stopScanning(): void {
    if (!this.isScanning) {
      return;
    }

    this.isScanning = false;
    
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = undefined;
    }
    
    console.log('清算机会扫描已停止');
  }

  /**
   * 执行单次扫描
   */
  async performScan(): Promise<ScanResult> {
    const startTime = Date.now();
    const opportunities: LiquidationOpportunity[] = [];
    const errors: string[] = [];
    let totalScanned = 0;

    try {
      // 获取所有市场
      const markets = await this.injectiveService.getAllMarkets();
      const enabledMarkets = this.config.enabledMarkets.length > 0 
        ? markets.filter(m => this.config.enabledMarkets.includes(m.marketId))
        : markets;

      console.log(`开始扫描 ${enabledMarkets.length} 个市场...`);

      // 并发扫描市场
      const scanPromises = enabledMarkets.map(async (market) => {
        try {
          const marketOpportunities = await this.scanMarketForOpportunities(market.marketId);
          opportunities.push(...marketOpportunities);
          totalScanned++;
        } catch (error) {
          const errorMsg = `扫描市场 ${market.ticker} 失败: ${error instanceof Error ? error.message : '未知错误'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      });

      // 等待所有扫描完成
      await Promise.allSettled(scanPromises);

      // 过滤低收益机会
      const filteredOpportunities = opportunities.filter(
        opp => opp.estimatedProfit >= this.config.minProfitThreshold
      );

      // 按收益排序
      filteredOpportunities.sort((a, b) => b.estimatedProfit - a.estimatedProfit);

      const result: ScanResult = {
        opportunities: filteredOpportunities,
        scanTime: Date.now() - startTime,
        totalScanned,
        errors,
      };

      console.log(`扫描完成: 发现 ${filteredOpportunities.length} 个清算机会，耗时 ${result.scanTime}ms`);

      // 触发回调
      if (this.onScanComplete) {
        this.onScanComplete(result);
      }

      // 通知新发现的机会
      filteredOpportunities.forEach(opportunity => {
        if (this.onOpportunityFound) {
          this.onOpportunityFound(opportunity);
        }
      });

      return result;
    } catch (error) {
      const errorMsg = `扫描过程中发生错误: ${error instanceof Error ? error.message : '未知错误'}`;
      console.error(errorMsg);
      errors.push(errorMsg);

      const result: ScanResult = {
        opportunities: [],
        scanTime: Date.now() - startTime,
        totalScanned,
        errors,
      };

      if (this.onScanComplete) {
        this.onScanComplete(result);
      }

      return result;
    }
  }

  /**
   * 扫描单个市场的清算机会
   */
  private async scanMarketForOpportunities(marketId: string): Promise<LiquidationOpportunity[]> {
    const opportunities: LiquidationOpportunity[] = [];

    try {
      // 获取市场数据
      const marketData = await this.injectiveService.getMarketData(marketId);
      if (!marketData) {
        return opportunities;
      }

      // 这里需要实现获取所有子账户的逻辑
      // 由于 Injective 的限制，我们可能需要通过其他方式获取
      // 暂时使用模拟数据演示
      const mockSubaccounts = await this.getMockSubaccounts(marketId);

      // 检查每个子账户的清算机会
      for (const subaccountId of mockSubaccounts) {
        try {
          const validation = await this.injectiveService.validateLiquidationOpportunity(
            marketId,
            subaccountId
          );

          if (validation.isValid && validation.maxLiquidationAmount > 0) {
            const opportunity = await this.createLiquidationOpportunity(
              marketId,
              subaccountId,
              validation,
              marketData
            );

            if (opportunity) {
              opportunities.push(opportunity);
            }
          }
        } catch (error) {
          console.warn(`检查子账户 ${subaccountId} 失败:`, error);
        }
      }
    } catch (error) {
      console.error(`扫描市场 ${marketId} 失败:`, error);
    }

    return opportunities;
  }

  /**
   * 创建清算机会对象
   */
  private async createLiquidationOpportunity(
    marketId: string,
    subaccountId: string,
    validation: any,
    marketData: any
  ): Promise<LiquidationOpportunity | null> {
    try {
      const liquidationAmount = Math.min(
        validation.maxLiquidationAmount,
        parseFloat(marketData.price) * 1000 // 限制最大金额
      );

      const liquidationBonus = validation.liquidationBonus / 10000; // 转换为小数
      const reward = liquidationAmount * liquidationBonus;
      const flashLoanFee = liquidationAmount * 0.0009; // 0.09% 闪电贷费用
      const gasCost = 5.5; // 预估 Gas 费用
      const netProfit = reward - flashLoanFee - gasCost;

      // 检查是否满足最小收益要求
      if (netProfit < this.config.minProfitThreshold) {
        return null;
      }

      return {
        id: `${marketId}-${subaccountId}-${Date.now()}`,
        marketId,
        subaccountId,
        liquidationAmount: liquidationAmount.toString(),
        collateralAsset: 'USDT', // 需要根据实际情况确定
        debtAsset: 'USDT',
        liquidationBonus,
        healthFactor: validation.healthFactor / 10000, // 转换为小数
        estimatedProfit: netProfit,
        timestamp: Date.now(),
        protocol: 'Injective',
      };
    } catch (error) {
      console.error('创建清算机会失败:', error);
      return null;
    }
  }

  /**
   * 获取模拟子账户列表
   * 实际实现中需要从链上获取真实的子账户
   */
  private async getMockSubaccounts(_marketId: string): Promise<string[]> {
    // 这里返回模拟的子账户ID
    // 实际实现中需要查询链上数据
    return [
      'inj1...mock1',
      'inj1...mock2',
      'inj1...mock3',
    ];
  }

  /**
   * 获取扫描状态
   */
  getScanStatus(): {
    isScanning: boolean;
    config: ScannerConfig;
  } {
    return {
      isScanning: this.isScanning,
      config: this.config,
    };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ScannerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('扫描器配置已更新:', this.config);
  }

  /**
   * 手动触发扫描
   */
  async triggerScan(): Promise<ScanResult> {
    if (this.isScanning) {
      console.log('手动触发扫描...');
      return this.performScan();
    } else {
      throw new Error('扫描器未启动');
    }
  }
}