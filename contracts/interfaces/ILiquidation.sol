// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ILiquidation
 * @notice 清算接口定义
 * @dev 定义了清算操作的基本功能
 */
interface ILiquidation {
    /**
     * @notice 清算参数结构体
     */
    struct LiquidationParams {
        bytes32 marketId;       // 市场ID
        address subaccountId;   // 子账户地址
        uint256 liquidationAmount; // 清算金额
        address collateralAsset;   // 抵押资产
        address debtAsset;      // 债务资产
        uint256 slippageTolerance; // 滑点容忍度
        uint256 deadline;       // 截止时间
    }

    /**
     * @notice 清算执行事件
     */
    event LiquidationExecuted(
        bytes32 indexed marketId,
        address indexed subaccountId,
        address indexed liquidator,
        uint256 liquidationAmount,
        uint256 reward,
        uint256 gasCost
    );

    /**
     * @notice 清算失败事件
     */
    event LiquidationFailed(
        bytes32 indexed marketId,
        address indexed subaccountId,
        address indexed liquidator,
        string reason
    );

    /**
     * @notice 执行清算操作
     * @param params 清算参数
     * @return success 是否成功
     * @return reward 清算奖励
     * @return gasCost Gas费用
     */
    function executeLiquidation(
        LiquidationParams calldata params
    ) external returns (bool success, uint256 reward, uint256 gasCost);

    /**
     * @notice 验证清算机会
     * @param marketId 市场ID
     * @param subaccountId 子账户地址
     * @return isValid 是否有效
     * @return healthFactor 健康因子
     * @return maxLiquidationAmount 最大清算金额
     */
    function validateLiquidationOpportunity(
        bytes32 marketId,
        address subaccountId
    ) external view returns (bool isValid, uint256 healthFactor, uint256 maxLiquidationAmount);

    /**
     * @notice 计算清算奖励
     * @param liquidationAmount 清算金额
     * @param liquidationBonus 清算奖励比例
     * @return 奖励金额
     */
    function calculateLiquidationReward(
        uint256 liquidationAmount,
        uint256 liquidationBonus
    ) external pure returns (uint256);

    /**
     * @notice 获取清算奖励比例
     * @param marketId 市场ID
     * @return 奖励比例（基点）
     */
    function getLiquidationBonus(bytes32 marketId) external view returns (uint256);
}
