// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RiskControl
 * @notice 风险控制库
 * @dev 提供各种风险控制和安全检查功能
 */
library RiskControl {
    // 错误定义
    error InvalidSlippageTolerance();
    error TransactionExpired();
    error InsufficientLiquidity();
    error HealthFactorTooHigh();
    error LiquidationAmountTooHigh();
    error UnauthorizedAccess();

    /**
     * @notice 验证滑点容忍度
     * @param slippageTolerance 滑点容忍度（基点）
     * @param maxSlippage 最大允许滑点
     */
    function validateSlippageTolerance(uint256 slippageTolerance, uint256 maxSlippage) internal pure {
        if (slippageTolerance > maxSlippage) {
            revert InvalidSlippageTolerance();
        }
    }

    /**
     * @notice 验证交易截止时间
     * @param deadline 截止时间戳
     */
    function validateDeadline(uint256 deadline) internal view {
        if (deadline < block.timestamp) {
            revert TransactionExpired();
        }
    }

    /**
     * @notice 验证流动性
     * @param requestedAmount 请求金额
     * @param availableAmount 可用金额
     */
    function validateLiquidity(uint256 requestedAmount, uint256 availableAmount) internal pure {
        if (requestedAmount > availableAmount) {
            revert InsufficientLiquidity();
        }
    }

    /**
     * @notice 验证健康因子
     * @param healthFactor 健康因子（基点）
     * @param threshold 阈值（基点）
     */
    function validateHealthFactor(uint256 healthFactor, uint256 threshold) internal pure {
        if (healthFactor >= threshold) {
            revert HealthFactorTooHigh();
        }
    }

    /**
     * @notice 验证清算金额
     * @param liquidationAmount 清算金额
     * @param maxLiquidationAmount 最大清算金额
     */
    function validateLiquidationAmount(uint256 liquidationAmount, uint256 maxLiquidationAmount) internal pure {
        if (liquidationAmount > maxLiquidationAmount) {
            revert LiquidationAmountTooHigh();
        }
    }

    /**
     * @notice 验证授权
     * @param authorized 是否已授权
     */
    function validateAuthorization(bool authorized) internal pure {
        if (!authorized) {
            revert UnauthorizedAccess();
        }
    }

    /**
     * @notice 计算滑点调整后的金额
     * @param amount 原始金额
     * @param slippageTolerance 滑点容忍度（基点）
     * @param isBuy 是否为买入操作
     * @return 调整后的最小/最大金额
     */
    function calculateSlippageAmount(
        uint256 amount,
        uint256 slippageTolerance,
        bool isBuy
    ) internal pure returns (uint256) {
        uint256 slippageAmount = (amount * slippageTolerance) / 10000;
        return isBuy ? amount + slippageAmount : amount - slippageAmount;
    }

    /**
     * @notice 计算健康因子
     * @param collateralValue 抵押资产价值
     * @param debtValue 债务价值
     * @param liquidationThreshold 清算阈值（基点）
     * @return 健康因子（基点）
     */
    function calculateHealthFactor(
        uint256 collateralValue,
        uint256 debtValue,
        uint256 liquidationThreshold
    ) internal pure returns (uint256) {
        if (debtValue == 0) return type(uint256).max;
        return (collateralValue * liquidationThreshold) / debtValue;
    }

    /**
     * @notice 计算最大清算金额
     * @param debtAmount 债务金额
     * @param collateralAmount 抵押金额
     * @param liquidationBonus 清算奖励比例（基点）
     * @param maxLiquidationRatio 最大清算比例（基点，默认50%）
     * @return 最大清算金额
     */
    function calculateMaxLiquidationAmount(
        uint256 debtAmount,
        uint256 collateralAmount,
        uint256 liquidationBonus,
        uint256 maxLiquidationRatio
    ) internal pure returns (uint256) {
        uint256 debtBasedMax = (debtAmount * maxLiquidationRatio) / 10000;
        uint256 collateralBasedMax = (collateralAmount * (10000 + liquidationBonus)) / (10000 + liquidationBonus);

        return debtBasedMax < collateralBasedMax ? debtBasedMax : collateralBasedMax;
    }

    /**
     * @notice 计算清算奖励
     * @param liquidationAmount 清算金额
     * @param liquidationBonus 清算奖励比例（基点）
     * @return 奖励金额
     */
    function calculateLiquidationReward(
        uint256 liquidationAmount,
        uint256 liquidationBonus
    ) internal pure returns (uint256) {
        return (liquidationAmount * liquidationBonus) / 10000;
    }

    /**
     * @notice 计算闪电贷费用
     * @param amount 借贷金额
     * @param premium 费用率（基点）
     * @return 费用金额
     */
    function calculateFlashLoanPremium(
        uint256 amount,
        uint256 premium
    ) internal pure returns (uint256) {
        return (amount * premium) / 10000;
    }

    /**
     * @notice 检查价格偏差
     * @param expectedPrice 期望价格
     * @param actualPrice 实际价格
     * @param maxDeviation 最大偏差（基点）
     * @return 是否在允许范围内
     */
    function checkPriceDeviation(
        uint256 expectedPrice,
        uint256 actualPrice,
        uint256 maxDeviation
    ) internal pure returns (bool) {
        if (expectedPrice == 0) return false;

        uint256 deviation;
        if (actualPrice > expectedPrice) {
            deviation = ((actualPrice - expectedPrice) * 10000) / expectedPrice;
        } else {
            deviation = ((expectedPrice - actualPrice) * 10000) / expectedPrice;
        }

        return deviation <= maxDeviation;
    }

    /**
     * @notice 计算时间加权平均价格
     * @param prices 价格数组
     * @param timestamps 时间戳数组
     * @param currentTime 当前时间
     * @param windowSize 时间窗口大小（秒）
     * @return TWAP价格
     */
    function calculateTWAP(
        uint256[] memory prices,
        uint256[] memory timestamps,
        uint256 currentTime,
        uint256 windowSize
    ) internal pure returns (uint256) {
        require(prices.length == timestamps.length, "Array lengths mismatch");
        require(prices.length > 0, "Empty price array");

        uint256 weightedSum = 0;
        uint256 totalWeight = 0;

        for (uint256 i = 0; i < prices.length; i++) {
            if (timestamps[i] <= currentTime && timestamps[i] >= currentTime - windowSize) {
                uint256 weight = timestamps[i] >= currentTime - windowSize ?
                    timestamps[i] - (currentTime - windowSize) : windowSize;

                weightedSum += prices[i] * weight;
                totalWeight += weight;
            }
        }

        return totalWeight > 0 ? weightedSum / totalWeight : prices[prices.length - 1];
    }
}
