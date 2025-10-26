import { expect } from "chai";
import { ethers } from "hardhat";
import { LuckeeFlashLiquidation, TestERC20 } from "../typechain";

describe("LuckeeFlashLiquidation", function () {
  let flashLiquidation: LuckeeFlashLiquidation;
  let testToken: TestERC20;
  let owner: any;
  let user: any;
  let liquidator: any;

  const FLASHLOAN_PREMIUM = 9; // 0.09%

  beforeEach(async function () {
    [owner, user, liquidator] = await ethers.getSigners();

    // 部署测试代币
    const TestERC20Factory = await ethers.getContractFactory("TestERC20");
    testToken = await TestERC20Factory.deploy("Test Token", "TEST", ethers.parseEther("1000000"));
    await testToken.waitForDeployment();

    // 部署闪电贷合约
    const LuckeeFlashLiquidationFactory = await ethers.getContractFactory("LuckeeFlashLiquidation");
    flashLiquidation = await LuckeeFlashLiquidationFactory.deploy();
    await flashLiquidation.waitForDeployment();

    // 授权清算者
    await flashLiquidation.authorizeLiquidator(liquidator.address);

    // 添加支持的资产
    await flashLiquidation.addSupportedAsset(await testToken.getAddress());

    // 存入流动性
    await testToken.transfer(await flashLiquidation.getAddress(), ethers.parseEther("10000"));
    await flashLiquidation.deposit(await testToken.getAddress(), ethers.parseEther("10000"));

    // 存入ETH流动性
    await owner.sendTransaction({
      to: await flashLiquidation.getAddress(),
      value: ethers.parseEther("10")
    });
  });

  describe("闪电贷功能", function () {
    it("应该成功执行闪电贷", async function () {
      const borrowAmount = ethers.parseEther("100");
      const premium = (borrowAmount * BigInt(FLASHLOAN_PREMIUM)) / BigInt(10000);

      // 编码清算参数（简化版本用于测试）
      const liquidationParams = {
        marketId: ethers.encodeBytes32String("TEST/USD"),
        subaccountId: user.address,
        liquidationAmount: borrowAmount,
        collateralAsset: await testToken.getAddress(),
        debtAsset: await testToken.getAddress(),
        slippageTolerance: 500, // 5%
        deadline: Math.floor(Date.now() / 1000) + 3600
      };

      const params = ethers.AbiCoder.defaultAbiCoder().encode(
        ["tuple(bytes32 marketId, address subaccountId, uint256 liquidationAmount, address collateralAsset, address debtAsset, uint256 slippageTolerance, uint256 deadline)"],
        [liquidationParams]
      );

      // 执行闪电贷
      await expect(
        flashLiquidation.connect(user).flashLoan(
          await testToken.getAddress(),
          borrowAmount,
          params
        )
      ).to.not.be.reverted;

      // 验证费用已收取
      const contractBalance = await testToken.balanceOf(await flashLiquidation.getAddress());
      expect(contractBalance).to.equal(ethers.parseEther("10000") + premium);
    });

    it("应该在执行失败时回滚", async function () {
      const borrowAmount = ethers.parseEther("100");

      // 使用过期的截止时间
      const liquidationParams = {
        marketId: ethers.encodeBytes32String("TEST/USD"),
        subaccountId: user.address,
        liquidationAmount: borrowAmount,
        collateralAsset: await testToken.getAddress(),
        debtAsset: await testToken.getAddress(),
        slippageTolerance: 500,
        deadline: Math.floor(Date.now() / 1000) - 3600 // 过期
      };

      const params = ethers.AbiCoder.defaultAbiCoder().encode(
        ["tuple(bytes32 marketId, address subaccountId, uint256 liquidationAmount, address collateralAsset, address debtAsset, uint256 slippageTolerance, uint256 deadline)"],
        [liquidationParams]
      );

      // 应该失败
      await expect(
        flashLiquidation.connect(user).flashLoan(
          await testToken.getAddress(),
          borrowAmount,
          params
        )
      ).to.be.revertedWith("Transaction expired");
    });

    it("应该拒绝不支持的资产", async function () {
      const unsupportedToken = await TestERC20Factory.deploy("Unsupported", "UNS", ethers.parseEther("1000"));
      await unsupportedToken.waitForDeployment();

      await expect(
        flashLiquidation.connect(user).flashLoan(
          await unsupportedToken.getAddress(),
          ethers.parseEther("10"),
          "0x"
        )
      ).to.be.revertedWith("Asset not supported");
    });
  });

  describe("清算功能", function () {
    it("应该成功执行清算", async function () {
      const liquidationAmount = ethers.parseEther("50");

      const params = {
        marketId: ethers.encodeBytes32String("TEST/USD"),
        subaccountId: user.address,
        liquidationAmount,
        collateralAsset: await testToken.getAddress(),
        debtAsset: await testToken.getAddress(),
        slippageTolerance: 300, // 3%
        deadline: Math.floor(Date.now() / 1000) + 3600
      };

      const result = await flashLiquidation.connect(liquidator).executeLiquidation(params);

      // 验证交易成功
      expect(result[0]).to.be.true; // success
      expect(result[1]).to.be.gt(0); // reward > 0
    });

    it("应该拒绝未授权的清算者", async function () {
      const liquidationAmount = ethers.parseEther("50");

      const params = {
        marketId: ethers.encodeBytes32String("TEST/USD"),
        subaccountId: user.address,
        liquidationAmount,
        collateralAsset: await testToken.getAddress(),
        debtAsset: await testToken.getAddress(),
        slippageTolerance: 300,
        deadline: Math.floor(Date.now() / 1000) + 3600
      };

      await expect(
        flashLiquidation.connect(user).executeLiquidation(params)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("资产管理", function () {
    it("应该允许存款", async function () {
      const depositAmount = ethers.parseEther("100");

      await testToken.connect(user).approve(await flashLiquidation.getAddress(), depositAmount);
      await flashLiquidation.connect(user).deposit(await testToken.getAddress(), depositAmount);

      const availableLiquidity = await flashLiquidation.getAvailableLiquidity(await testToken.getAddress());
      expect(availableLiquidity).to.equal(ethers.parseEther("10100"));
    });

    it("应该允许所有者提款", async function () {
      const withdrawAmount = ethers.parseEther("100");
      const initialOwnerBalance = await testToken.balanceOf(owner.address);

      await flashLiquidation.connect(owner).withdraw(await testToken.getAddress(), withdrawAmount);

      const finalOwnerBalance = await testToken.balanceOf(owner.address);
      expect(finalOwnerBalance - initialOwnerBalance).to.equal(withdrawAmount);
    });

    it("应该拒绝非所有者提款", async function () {
      await expect(
        flashLiquidation.connect(user).withdraw(await testToken.getAddress(), ethers.parseEther("10"))
      ).to.be.revertedWithCustomError(flashLiquidation, "OwnableUnauthorizedAccount");
    });
  });

  describe("风险控制", function () {
    it("应该在暂停时拒绝闪电贷", async function () {
      await flashLiquidation.connect(owner).pause();

      await expect(
        flashLiquidation.connect(user).flashLoan(
          await testToken.getAddress(),
          ethers.parseEther("10"),
          "0x"
        )
      ).to.be.revertedWith("Pausable: paused");
    });

    it("应该验证滑点容忍度", async function () {
      const liquidationParams = {
        marketId: ethers.encodeBytes32String("TEST/USD"),
        subaccountId: user.address,
        liquidationAmount: ethers.parseEther("10"),
        collateralAsset: await testToken.getAddress(),
        debtAsset: await testToken.getAddress(),
        slippageTolerance: 600, // 6% > 5% max
        deadline: Math.floor(Date.now() / 1000) + 3600
      };

      const params = ethers.AbiCoder.defaultAbiCoder().encode(
        ["tuple(bytes32 marketId, address subaccountId, uint256 liquidationAmount, address collateralAsset, address debtAsset, uint256 slippageTolerance, uint256 deadline)"],
        [liquidationParams]
      );

      await expect(
        flashLiquidation.connect(user).flashLoan(
          await testToken.getAddress(),
          ethers.parseEther("10"),
          params
        )
      ).to.be.reverted; // 由于滑点过高
    });
  });
});
