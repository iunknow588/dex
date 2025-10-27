/**
 * Injective 链服务
 * 提供与 Injective 区块链的交互功能
 */

import { 
  ChainRestTendermintApi,
  IndexerGrpcDerivativesApi,
  IndexerGrpcSpotApi,
  IndexerGrpcAccountApi,
  MsgBroadcasterWithPk,
  PrivateKey
} from '@injectivelabs/sdk-ts';

export interface InjectiveNetworkConfig {
  rpcUrl: string;
  restUrl: string;
  chainId: string;
}

export interface LiquidationParams {
  marketId: string;
  subaccountId: string;
  liquidationAmount: string;
  collateralAsset: string;
  debtAsset: string;
  slippageTolerance: number;
  deadline: number;
}

export interface LiquidationResult {
  success: boolean;
  txHash?: string;
  liquidatedAmount: number;
  reward: number;
  gasCost: number;
  netProfit: number;
  error?: string;
}

export class InjectiveService {
  private network: any;
  private chainRestTendermintApi: ChainRestTendermintApi;
  private derivativesApi: IndexerGrpcDerivativesApi;
  private spotApi: IndexerGrpcSpotApi;
  private accountApi: IndexerGrpcAccountApi;
  private msgBroadcaster?: MsgBroadcasterWithPk;

  constructor(config?: InjectiveNetworkConfig) {
    const networkConfig = config || {
      rpcUrl: 'https://grpc.injective.network',
      restUrl: 'https://api.injective.network',
      chainId: 'injective-1',
    };

    // 初始化网络
    this.network = {
      chainId: networkConfig.chainId,
      rpc: networkConfig.rpcUrl,
      rest: networkConfig.restUrl,
    };
    
    // 初始化 API 客户端
    this.chainRestTendermintApi = new ChainRestTendermintApi(networkConfig.restUrl);
    this.derivativesApi = new IndexerGrpcDerivativesApi(networkConfig.rpcUrl);
    this.spotApi = new IndexerGrpcSpotApi(networkConfig.rpcUrl);
    this.accountApi = new IndexerGrpcAccountApi(networkConfig.rpcUrl);
  }

  /**
   * 设置私钥用于交易签名
   */
  setPrivateKey(privateKey: string) {
    const privateKeyObj = PrivateKey.fromHex(privateKey);
    this.msgBroadcaster = new MsgBroadcasterWithPk({
      privateKey: privateKeyObj,
      network: this.network,
    });
  }

  /**
   * 获取市场数据
   */
  async getMarketData(marketId: string): Promise<any> {
    try {
      // 获取现货市场数据
      const spotMarkets = await this.spotApi.fetchMarkets();
      const spotMarket = spotMarkets.find(market => market.marketId === marketId);
      
      if (spotMarket) {
        return {
          symbol: spotMarket.ticker,
          price: '0',
          change24h: '0',
          change24hPercent: 0,
          volume24h: '0',
          high24h: '0',
          low24h: '0',
          timestamp: Date.now(),
        };
      }

      // 获取衍生品市场数据
      const derivativesMarkets = await this.derivativesApi.fetchMarkets();
      const derivativesMarket = derivativesMarkets.find(market => market.marketId === marketId);
      
      if (derivativesMarket) {
        return {
          symbol: derivativesMarket.ticker,
          price: '0',
          change24h: '0',
          change24hPercent: 0,
          volume24h: '0',
          high24h: '0',
          low24h: '0',
          timestamp: Date.now(),
        };
      }

      return null;
    } catch (error) {
      console.error('获取市场数据失败:', error);
      throw new Error(`获取市场数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取所有支持的市场
   */
  async getAllMarkets(): Promise<Array<{ marketId: string; ticker: string; type: 'spot' | 'derivatives' }>> {
    try {
      const [spotMarkets, derivativesMarkets] = await Promise.all([
        this.spotApi.fetchMarkets(),
        this.derivativesApi.fetchMarkets(),
      ]);

      const markets = [
        ...spotMarkets.map(market => ({
          marketId: market.marketId,
          ticker: market.ticker,
          type: 'spot' as const,
        })),
        ...derivativesMarkets.map(market => ({
          marketId: market.marketId,
          ticker: market.ticker,
          type: 'derivatives' as const,
        })),
      ];

      return markets;
    } catch (error) {
      console.error('获取市场列表失败:', error);
      throw new Error(`获取市场列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取子账户信息
   */
  async getSubaccountInfo(subaccountId: string): Promise<any> {
    try {
      const subaccounts = await this.accountApi.fetchSubaccountsList(subaccountId);
      return Array.isArray(subaccounts) ? subaccounts[0] : subaccounts;
    } catch (error) {
      console.error('获取子账户信息失败:', error);
      throw new Error(`获取子账户信息失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取子账户持仓
   */
  async getSubaccountPositions(subaccountId: string): Promise<any[]> {
    try {
      const positions = await this.derivativesApi.fetchPositions({
        subaccountId,
      });
      return Array.isArray(positions) ? positions : (positions.positions || []);
    } catch (error) {
      console.error('获取子账户持仓失败:', error);
      throw new Error(`获取子账户持仓失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 验证清算机会
   */
  async validateLiquidationOpportunity(
    marketId: string,
    subaccountId: string
  ): Promise<{
    isValid: boolean;
    healthFactor: number;
    maxLiquidationAmount: number;
    liquidationBonus: number;
  }> {
    try {
      // 获取子账户信息
      await this.getSubaccountInfo(subaccountId);
      
      // 获取市场信息
      const marketData = await this.getMarketData(marketId);
      if (!marketData) {
        throw new Error('市场不存在');
      }

      // 获取子账户持仓
      const positions = await this.getSubaccountPositions(subaccountId);
      const position = positions.find(p => p.marketId === marketId);
      
      if (!position) {
        return {
          isValid: false,
          healthFactor: 1,
          maxLiquidationAmount: 0,
          liquidationBonus: 0,
        };
      }

      // 计算健康因子
      const collateralValue = parseFloat(position.collateral || '0');
      const debtValue = parseFloat(position.entryPrice || '0') * parseFloat(position.quantity || '0');
      const healthFactor = debtValue > 0 ? (collateralValue / debtValue) * 10000 : 10000;

      // 检查是否可清算（健康因子 < 100%）
      const isValid = healthFactor < 10000;
      
      // 计算最大清算金额
      const maxLiquidationAmount = isValid ? Math.min(
        parseFloat(position.quantity || '0') * 0.5, // 最大清算50%
        parseFloat(marketData.price) * 1000 // 限制最大金额
      ) : 0;

      // 获取清算奖励比例
      const liquidationBonus = 800; // 8% 默认奖励

      return {
        isValid,
        healthFactor,
        maxLiquidationAmount,
        liquidationBonus,
      };
    } catch (error) {
      console.error('验证清算机会失败:', error);
      throw new Error(`验证清算机会失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 执行清算操作
   */
  async executeLiquidation(params: LiquidationParams): Promise<LiquidationResult> {
    try {
      if (!this.msgBroadcaster) {
        throw new Error('未设置私钥，无法执行交易');
      }

      // 验证清算机会
      const validation = await this.validateLiquidationOpportunity(params.marketId, params.subaccountId);
      
      if (!validation.isValid) {
        return {
          success: false,
          liquidatedAmount: 0,
          reward: 0,
          gasCost: 0,
          netProfit: 0,
          error: '清算机会无效',
        };
      }

      // 这里需要实现具体的清算交易逻辑
      // 由于 Injective 的清算机制比较复杂，这里提供框架
      
      // 模拟交易执行
      const mockTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;
      const liquidatedAmount = parseFloat(params.liquidationAmount);
      const reward = liquidatedAmount * (validation.liquidationBonus / 10000);
      const gasCost = 5.5; // 预估 Gas 费用
      const netProfit = reward - gasCost;

      return {
        success: true,
        txHash: mockTxHash,
        liquidatedAmount,
        reward,
        gasCost,
        netProfit,
      };
    } catch (error) {
      console.error('执行清算失败:', error);
      return {
        success: false,
        liquidatedAmount: parseFloat(params.liquidationAmount),
        reward: 0,
        gasCost: 0,
        netProfit: 0,
        error: error instanceof Error ? error.message : '执行失败',
      };
    }
  }

  /**
   * 获取链上状态
   */
  async getChainStatus(): Promise<{
    isConnected: boolean;
    blockHeight: number;
    chainId: string;
  }> {
    try {
      const latestBlock = await this.chainRestTendermintApi.fetchLatestBlock();
      return {
        isConnected: true,
        blockHeight: parseInt(latestBlock.header.height),
        chainId: this.network.chainId,
      };
    } catch (error) {
      console.error('获取链状态失败:', error);
      return {
        isConnected: false,
        blockHeight: 0,
        chainId: this.network.chainId,
      };
    }
  }
}