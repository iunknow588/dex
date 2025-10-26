/**
 * 闪电贷服务
 * 基于Injective EVM兼容性实现闪电贷功能
 */

import { ethers } from 'ethers';
import { FlashLiquidationParams, LiquidationResult } from '../../../../data/types';

export interface FlashLoanConfig {
  providerUrl: string;
  flashLoanContractAddress: string;
  privateKey: string;
  maxLoanAmount: string;
  supportedAssets: string[];
}

export class FlashLoanService {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private flashLoanContract: ethers.Contract;
  private config: FlashLoanConfig;

  constructor(config: FlashLoanConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.providerUrl);
    this.signer = new ethers.Wallet(config.privateKey, this.provider);

    // 闪电贷合约ABI
    const flashLoanABI = [
      'function flashLoan(address asset, uint256 amount, bytes params) external',
      'function executeOperation(address asset, uint256 amount, uint256 premium, address initiator, bytes params) external returns (bool)',
      'event FlashLoanExecuted(address indexed asset, uint256 amount, uint256 premium)'
    ];

    this.flashLoanContract = new ethers.Contract(
      config.flashLoanContractAddress,
      flashLoanABI,
      this.signer
    );
  }

  /**
   * 执行闪电贷清算
   */
  async executeFlashLiquidation(
    params: FlashLiquidationParams
  ): Promise<LiquidationResult> {
    try {
      // 验证参数
      await this.validateFlashLoanParams(params);

      // 编码清算参数
      const liquidationParams = this.encodeLiquidationParams(params);

      // 获取资产地址
      const assetAddress = await this.getAssetAddress(params.collateralAsset);

      // 执行闪电贷
      const tx = await this.flashLoanContract.flashLoan(
        assetAddress,
        ethers.parseEther(params.liquidationAmount),
        liquidationParams
      );

      // 等待交易确认
      const receipt = await tx.wait();

      // 解析执行结果
      const result = this.parseFlashLoanResult(receipt, params);

      return {
        success: true,
        txHash: receipt.hash,
        liquidatedAmount: parseFloat(params.liquidationAmount),
        reward: result.reward,
        gasCost: result.gasCost,
        netProfit: result.netProfit
      };

    } catch (error) {
      console.error('闪电贷清算失败:', error);
      return {
        success: false,
        liquidatedAmount: parseFloat(params.liquidationAmount),
        reward: 0,
        gasCost: 0,
        netProfit: 0,
        error: error instanceof Error ? error.message : '闪电贷执行失败'
      };
    }
  }

  /**
   * 验证闪电贷参数
   */
  private async validateFlashLoanParams(params: FlashLiquidationParams): Promise<void> {
    // 检查支持的资产
    if (!this.config.supportedAssets.includes(params.collateralAsset)) {
      throw new Error(`不支持的资产: ${params.collateralAsset}`);
    }

    // 检查贷款金额上限
    const loanAmount = parseFloat(params.liquidationAmount);
    const maxAmount = parseFloat(this.config.maxLoanAmount);
    if (loanAmount > maxAmount) {
      throw new Error(`贷款金额超过上限: ${maxAmount}`);
    }

    // 检查滑点容忍度
    if (params.slippageTolerance < 0.001 || params.slippageTolerance > 0.1) {
      throw new Error('滑点容忍度必须在0.1%-10%之间');
    }

    // 检查截止时间
    const currentTime = Math.floor(Date.now() / 1000);
    if (params.deadline <= currentTime) {
      throw new Error('交易截止时间已过期');
    }
  }

  /**
   * 编码清算参数
   */
  private encodeLiquidationParams(params: FlashLiquidationParams): string {
    // 编码清算所需的数据
    const liquidationData = {
      marketId: params.marketId,
      subaccountId: params.subaccountId,
      liquidationAmount: params.liquidationAmount,
      collateralAsset: params.collateralAsset,
      debtAsset: params.debtAsset,
      slippageTolerance: params.slippageTolerance,
      deadline: params.deadline
    };

    return ethers.AbiCoder.defaultAbiCoder().encode(
      ['tuple(string marketId, string subaccountId, string liquidationAmount, string collateralAsset, string debtAsset, uint256 slippageTolerance, uint256 deadline)'],
      [liquidationData]
    );
  }

  /**
   * 获取资产地址
   */
  private async getAssetAddress(asset: string): Promise<string> {
    // 资产地址映射（实际实现中应该从配置或链上查询）
    const assetAddresses: { [key: string]: string } = {
      'INJ': '0x0000000000000000000000000000000000000000', // INJ原生代币
      'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7', // 示例地址
      'USDC': '0xA0b86a33E6441e88c5C5F8e5E5E5E5E5E5E5E5E5', // 示例地址
      'ATOM': '0x0000000000000000000000000000000000000001'  // 示例地址
    };

    const address = assetAddresses[asset];
    if (!address) {
      throw new Error(`未找到资产地址: ${asset}`);
    }

    return address;
  }

  /**
   * 解析闪电贷执行结果
   */
  private parseFlashLoanResult(
    receipt: ethers.TransactionReceipt,
    params: FlashLiquidationParams
  ): {
    reward: number;
    gasCost: number;
    netProfit: number;
  } {
    // 解析交易日志获取清算奖励等信息
    let liquidationReward = 0;
    let gasCost = 0;

    // 计算Gas费用
    gasCost = parseFloat(ethers.formatEther(receipt.gasUsed * receipt.gasPrice));

    // 解析清算奖励（从事件日志中提取）
    for (const log of receipt.logs) {
      try {
        const parsedLog = this.flashLoanContract.interface.parseLog(log);
        if (parsedLog?.name === 'FlashLoanExecuted') {
          // 假设清算奖励信息包含在事件中
          liquidationReward = parseFloat(params.liquidationAmount) * 0.08; // 8%清算奖励
        }
      } catch (error) {
        // 忽略无法解析的日志
      }
    }

    // 如果没有从日志中获取到奖励，使用默认计算
    if (liquidationReward === 0) {
      liquidationReward = parseFloat(params.liquidationAmount) * 0.08;
    }

    // 计算净收益
    const flashLoanFee = parseFloat(params.liquidationAmount) * 0.0009; // 0.09%闪电贷费用
    const netProfit = liquidationReward - gasCost - flashLoanFee;

    return {
      reward: liquidationReward,
      gasCost,
      netProfit
    };
  }

  /**
   * 估算闪电贷费用
   */
  estimateFlashLoanCost(amount: string, asset: string): {
    flashLoanFee: number;
    estimatedGasCost: number;
    totalCost: number;
  } {
    const loanAmount = parseFloat(amount);
    const flashLoanFee = loanAmount * 0.0009; // 0.09%闪电贷费用
    const estimatedGasCost = this.getEstimatedGasCost(asset);

    return {
      flashLoanFee,
      estimatedGasCost,
      totalCost: flashLoanFee + estimatedGasCost
    };
  }

  /**
   * 获取预估Gas费用
   */
  private getEstimatedGasCost(asset: string): number {
    // 不同资产的Gas费用可能不同
    const gasCosts: { [key: string]: number } = {
      'INJ': 5.5,
      'USDT': 6.2,
      'USDC': 6.2,
      'ATOM': 7.1
    };

    return gasCosts[asset] || 6.0;
  }

  /**
   * 检查资产流动性
   */
  async checkAssetLiquidity(asset: string, amount: string): Promise<{
    available: boolean;
    availableAmount: number;
    utilizationRate: number;
  }> {
    try {
      const assetAddress = await this.getAssetAddress(asset);

      // 查询闪电贷合约的可用流动性
      // 实际实现中需要调用合约的相应方法
      const availableAmount = parseFloat(amount) * 1.5; // 模拟可用金额
      const utilizationRate = Math.random() * 0.8; // 模拟利用率

      return {
        available: availableAmount >= parseFloat(amount),
        availableAmount,
        utilizationRate
      };

    } catch (error) {
      console.error('检查资产流动性失败:', error);
      return {
        available: false,
        availableAmount: 0,
        utilizationRate: 1.0
      };
    }
  }

  /**
   * 获取闪电贷配置信息
   */
  getFlashLoanConfig(): FlashLoanConfig {
    return { ...this.config };
  }

  /**
   * 更新闪电贷配置
   */
  updateConfig(newConfig: Partial<FlashLoanConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // 如果关键配置改变，需要重新初始化合约
    if (newConfig.flashLoanContractAddress || newConfig.privateKey) {
      this.initializeContract();
    }
  }

  /**
   * 重新初始化合约
   */
  private initializeContract(): void {
    const flashLoanABI = [
      'function flashLoan(address asset, uint256 amount, bytes params) external',
      'function executeOperation(address asset, uint256 amount, uint256 premium, address initiator, bytes params) external returns (bool)',
      'event FlashLoanExecuted(address indexed asset, uint256 amount, uint256 premium)'
    ];

    this.flashLoanContract = new ethers.Contract(
      this.config.flashLoanContractAddress,
      flashLoanABI,
      this.signer
    );
  }
}
