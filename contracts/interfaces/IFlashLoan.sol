// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IFlashLoan
 * @notice 闪电贷接口定义
 * @dev 定义了闪电贷的基本功能和回调接口
 */
interface IFlashLoan {
    /**
     * @notice 闪电贷参数结构体
     */
    struct FlashLoanParams {
        address asset;           // 借贷资产地址
        uint256 amount;          // 借贷金额
        address receiver;        // 接收地址
        bytes params;           // 额外参数
    }

    /**
     * @notice 闪电贷执行结果事件
     */
    event FlashLoanExecuted(
        address indexed asset,
        uint256 amount,
        uint256 premium,
        address indexed initiator,
        bool indexed success
    );

    /**
     * @notice 闪电贷费用更新事件
     */
    event FlashLoanPremiumUpdated(uint256 oldPremium, uint256 newPremium);

    /**
     * @notice 执行闪电贷
     * @param asset 借贷资产地址
     * @param amount 借贷金额
     * @param params 额外参数（传递给接收者的数据）
     */
    function flashLoan(
        address asset,
        uint256 amount,
        bytes calldata params
    ) external;

    /**
     * @notice 闪电贷回调函数（由接收者实现）
     * @param asset 借贷资产地址
     * @param amount 借贷金额
     * @param premium 费用
     * @param initiator 发起者地址
     * @param params 额外参数
     * @return 成功返回true
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external returns (bool);

    /**
     * @notice 获取闪电贷费用率
     * @return 费用率（基点，1 = 0.01%）
     */
    function FLASHLOAN_PREMIUM() external view returns (uint256);

    /**
     * @notice 检查资产是否支持闪电贷
     * @param asset 资产地址
     * @return 是否支持
     */
    function isFlashLoanSupported(address asset) external view returns (bool);

    /**
     * @notice 获取资产的可用流动性
     * @param asset 资产地址
     * @return 可用金额
     */
    function getAvailableLiquidity(address asset) external view returns (uint256);
}
