// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/IFlashLoan.sol";
import "../interfaces/ILiquidation.sol";

/**
 * @title LuckeeFlashLiquidation
 * @notice 智运通闪电贷清算合约
 * @dev 结合闪电贷和清算功能，实现无本金清算套利
 */
contract LuckeeFlashLiquidation is
    IFlashLoan,
    ILiquidation,
    Ownable,
    ReentrancyGuard,
    Pausable
{
    using SafeERC20 for IERC20;

    // 闪电贷费用率（0.09%）
    uint256 public constant FLASHLOAN_PREMIUM = 9; // 9基点 = 0.09%

    // 清算相关常量
    uint256 public constant LIQUIDATION_THRESHOLD = 10000; // 100% = 10000基点
    uint256 public constant MAX_SLIPPAGE = 500; // 5%最大滑点
    uint256 public constant GRACE_PERIOD = 300; // 5分钟宽限期

    // 状态变量
    mapping(address => bool) public supportedAssets;
    mapping(address => uint256) public assetBalances;
    mapping(bytes32 => uint256) public marketLiquidationBonuses;
    mapping(address => bool) public authorizedLiquidators;

    // 事件
    event AssetAdded(address indexed asset);
    event AssetRemoved(address indexed asset);
    event LiquidatorAuthorized(address indexed liquidator);
    event LiquidatorRevoked(address indexed liquidator);
    event MarketBonusUpdated(bytes32 indexed marketId, uint256 bonus);

    /**
     * @notice 构造函数
     */
    constructor() Ownable(msg.sender) {
        // 默认支持的资产（可以后续添加）
        _addSupportedAsset(address(0)); // ETH
    }

    /**
     * @notice 添加支持的资产
     * @param asset 资产地址
     */
    function addSupportedAsset(address asset) external onlyOwner {
        _addSupportedAsset(asset);
    }

    /**
     * @notice 移除支持的资产
     * @param asset 资产地址
     */
    function removeSupportedAsset(address asset) external onlyOwner {
        require(supportedAssets[asset], "Asset not supported");
        supportedAssets[asset] = false;
        emit AssetRemoved(asset);
    }

    /**
     * @notice 授权清算者
     * @param liquidator 清算者地址
     */
    function authorizeLiquidator(address liquidator) external onlyOwner {
        authorizedLiquidators[liquidator] = true;
        emit LiquidatorAuthorized(liquidator);
    }

    /**
     * @notice 撤销清算者授权
     * @param liquidator 清算者地址
     */
    function revokeLiquidator(address liquidator) external onlyOwner {
        authorizedLiquidators[liquidator] = false;
        emit LiquidatorRevoked(liquidator);
    }

    /**
     * @notice 设置市场清算奖励
     * @param marketId 市场ID
     * @param bonus 清算奖励（基点）
     */
    function setMarketLiquidationBonus(bytes32 marketId, uint256 bonus) external onlyOwner {
        require(bonus <= 1000, "Bonus too high"); // 最大10%
        marketLiquidationBonuses[marketId] = bonus;
        emit MarketBonusUpdated(marketId, bonus);
    }

    /**
     * @notice 执行闪电贷
     * @param asset 借贷资产地址
     * @param amount 借贷金额
     * @param params 额外参数（包含清算信息）
     */
    function flashLoan(
        address asset,
        uint256 amount,
        bytes calldata params
    ) external nonReentrant whenNotPaused {
        require(supportedAssets[asset], "Asset not supported");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= getAvailableLiquidity(asset), "Insufficient liquidity");

        // 解码参数
        LiquidationParams memory liquidationParams = abi.decode(params, (LiquidationParams));
        require(liquidationParams.deadline >= block.timestamp, "Transaction expired");
        require(liquidationParams.slippageTolerance <= MAX_SLIPPAGE, "Slippage too high");

        // 记录初始余额
        uint256 initialBalance = _getBalance(asset);

        // 计算费用
        uint256 premium = (amount * FLASHLOAN_PREMIUM) / 10000;

        // 转出资金给调用者
        if (asset == address(0)) {
            // ETH转账
            (bool success,) = msg.sender.call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(asset).safeTransfer(msg.sender, amount);
        }

        // 调用执行操作
        bool success = this.executeOperation(asset, amount, premium, msg.sender, params);

        // 检查结果
        require(success, "Flash loan execution failed");

        // 检查资金是否已归还
        uint256 finalBalance = _getBalance(asset);
        uint256 expectedBalance = initialBalance + premium;
        require(finalBalance >= expectedBalance, "Insufficient repayment");

        emit FlashLoanExecuted(asset, amount, premium, msg.sender, true);
    }

    /**
     * @notice 闪电贷回调函数
     * @dev 这个函数会被闪电贷调用，执行清算逻辑
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external returns (bool) {
        require(msg.sender == address(this), "Only flash loan contract");

        // 解码清算参数
        LiquidationParams memory liquidationParams = abi.decode(params, (LiquidationParams));

        // 执行清算
        (bool success, uint256 reward,) = this.executeLiquidation(liquidationParams);

        // 归还闪电贷资金和费用
        uint256 totalRepayment = amount + premium;

        if (asset == address(0)) {
            require(address(this).balance >= totalRepayment, "Insufficient ETH balance");
        } else {
            require(IERC20(asset).balanceOf(address(this)) >= totalRepayment, "Insufficient token balance");
        }

        return success;
    }

    /**
     * @notice 执行清算操作
     */
    function executeLiquidation(
        LiquidationParams calldata params
    ) external returns (bool success, uint256 reward, uint256 gasCost) {
        require(authorizedLiquidators[msg.sender] || msg.sender == address(this), "Not authorized");

        // 验证清算机会
        (bool isValid, uint256 healthFactor, uint256 maxLiquidationAmount) =
            this.validateLiquidationOpportunity(params.marketId, params.subaccountId);

        if (!isValid) {
            emit LiquidationFailed(params.marketId, params.subaccountId, msg.sender, "Invalid liquidation opportunity");
            return (false, 0, 0);
        }

        // 检查清算金额
        if (params.liquidationAmount > maxLiquidationAmount) {
            emit LiquidationFailed(params.marketId, params.subaccountId, msg.sender, "Liquidation amount too high");
            return (false, 0, 0);
        }

        // 执行清算逻辑（调用Injective Exchange模块）
        // 注意：这里需要与Injective的原生模块交互
        (bool liquidationSuccess, uint256 liquidationReward) = _executeInjectiveLiquidation(params);

        if (liquidationSuccess) {
            // 计算Gas费用（估算）
            gasCost = _estimateGasCost();

            emit LiquidationExecuted(
                params.marketId,
                params.subaccountId,
                msg.sender,
                params.liquidationAmount,
                liquidationReward,
                gasCost
            );

            return (true, liquidationReward, gasCost);
        } else {
            emit LiquidationFailed(params.marketId, params.subaccountId, msg.sender, "Liquidation execution failed");
            return (false, 0, 0);
        }
    }

    /**
     * @notice 验证清算机会
     */
    function validateLiquidationOpportunity(
        bytes32 marketId,
        address subaccountId
    ) external view returns (bool isValid, uint256 healthFactor, uint256 maxLiquidationAmount) {
        // 这里需要调用Injective的查询接口来获取真实数据
        // 暂时使用模拟逻辑

        // 模拟健康因子检查（< 1表示可清算）
        healthFactor = 9500; // 95%

        if (healthFactor >= LIQUIDATION_THRESHOLD) {
            return (false, healthFactor, 0);
        }

        // 模拟最大清算金额
        maxLiquidationAmount = 1000 * 1e18; // 1000 USDT

        return (true, healthFactor, maxLiquidationAmount);
    }

    /**
     * @notice 计算清算奖励
     */
    function calculateLiquidationReward(
        uint256 liquidationAmount,
        uint256 liquidationBonus
    ) external pure returns (uint256) {
        return (liquidationAmount * liquidationBonus) / 10000;
    }

    /**
     * @notice 获取清算奖励比例
     */
    function getLiquidationBonus(bytes32 marketId) external view returns (uint256) {
        uint256 bonus = marketLiquidationBonuses[marketId];
        return bonus > 0 ? bonus : 80; // 默认8%
    }

    /**
     * @notice 检查资产是否支持闪电贷
     */
    function isFlashLoanSupported(address asset) external view returns (bool) {
        return supportedAssets[asset];
    }

    /**
     * @notice 获取资产的可用流动性
     */
    function getAvailableLiquidity(address asset) public view returns (uint256) {
        return assetBalances[asset];
    }

    /**
     * @notice 存款到合约（增加流动性）
     * @param asset 资产地址
     * @param amount 金额
     */
    function deposit(address asset, uint256 amount) external payable {
        require(supportedAssets[asset], "Asset not supported");

        if (asset == address(0)) {
            require(msg.value == amount, "Incorrect ETH amount");
        } else {
            IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        }

        assetBalances[asset] += amount;
    }

    /**
     * @notice 从合约提款
     * @param asset 资产地址
     * @param amount 金额
     */
    function withdraw(address asset, uint256 amount) external onlyOwner {
        require(assetBalances[asset] >= amount, "Insufficient balance");

        assetBalances[asset] -= amount;

        if (asset == address(0)) {
            (bool success,) = msg.sender.call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(asset).safeTransfer(msg.sender, amount);
        }
    }

    /**
     * @notice 暂停合约
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice 恢复合约
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice 内部函数：添加支持的资产
     */
    function _addSupportedAsset(address asset) internal {
        supportedAssets[asset] = true;
        emit AssetAdded(asset);
    }

    /**
     * @notice 内部函数：获取资产余额
     */
    function _getBalance(address asset) internal view returns (uint256) {
        if (asset == address(0)) {
            return address(this).balance;
        } else {
            return IERC20(asset).balanceOf(address(this));
        }
    }

    /**
     * @notice 内部函数：执行Injective清算
     * @dev 这里需要与Injective的原生模块交互
     */
    function _executeInjectiveLiquidation(
        LiquidationParams memory params
    ) internal returns (bool success, uint256 reward) {
        // 这里需要实现与Injective Exchange模块的实际交互
        // 目前返回模拟结果

        // 模拟清算成功
        success = true;
        reward = (params.liquidationAmount * this.getLiquidationBonus(params.marketId)) / 10000;

        return (success, reward);
    }

    /**
     * @notice 内部函数：估算Gas费用
     */
    function _estimateGasCost() internal pure returns (uint256) {
        // 估算清算操作的Gas费用
        return 5.5 * 1e18; // 5.5 INJ (假设INJ价格为1美元)
    }

    /**
     * @notice 接收ETH
     */
    receive() external payable {
        assetBalances[address(0)] += msg.value;
    }
}
