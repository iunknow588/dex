/**
 * 应用配置管理
 * 统一管理环境变量和配置项
 */

export interface AppConfig {
  // Injective 网络配置
  injective: {
    rpcUrl: string;
    restUrl: string;
    chainId: string;
  };
  
  // 闪电贷配置
  flashLoan: {
    contractAddress: string;
    maxLoanAmount: string;
    feeRate: string;
    supportedAssets: string[];
  };
  
  // 清算配置
  liquidation: {
    threshold: number;
    maxSlippage: number;
    gracePeriod: number;
  };
  
  // 应用配置
  app: {
    name: string;
    version: string;
    debugMode: boolean;
  };
  
  // 网络配置
  network: {
    requestTimeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  
  // 监控配置
  monitoring: {
    enableAnalytics: boolean;
    sentryDsn?: string;
  };
}

/**
 * 获取环境变量值，提供默认值
 */
function getEnvVar(key: string, defaultValue: string = ''): string {
  return (import.meta as any).env?.[key] || defaultValue;
}

/**
 * 获取布尔类型环境变量
 */
function getBooleanEnvVar(key: string, defaultValue: boolean = false): boolean {
  const value = getEnvVar(key);
  return value ? value.toLowerCase() === 'true' : defaultValue;
}

/**
 * 获取数字类型环境变量
 */
function getNumberEnvVar(key: string, defaultValue: number = 0): number {
  const value = getEnvVar(key);
  return value ? parseInt(value, 10) : defaultValue;
}

/**
 * 获取数组类型环境变量
 */
function getArrayEnvVar(key: string, defaultValue: string[] = []): string[] {
  const value = getEnvVar(key);
  return value ? value.split(',').map(item => item.trim()) : defaultValue;
}

/**
 * 应用配置实例
 */
export const appConfig: AppConfig = {
  injective: {
    rpcUrl: getEnvVar('VITE_INJECTIVE_RPC_URL', 'https://grpc.injective.network'),
    restUrl: getEnvVar('VITE_INJECTIVE_REST_URL', 'https://api.injective.network'),
    chainId: getEnvVar('VITE_INJECTIVE_CHAIN_ID', 'injective-1'),
  },
  
  flashLoan: {
    contractAddress: getEnvVar('VITE_FLASH_LOAN_CONTRACT_ADDRESS', ''),
    maxLoanAmount: getEnvVar('VITE_MAX_LOAN_AMOUNT', '1000000'),
    feeRate: getEnvVar('VITE_FLASH_LOAN_FEE_RATE', '0.0009'),
    supportedAssets: getArrayEnvVar('VITE_SUPPORTED_ASSETS', ['USDT', 'USDC', 'INJ']),
  },
  
  liquidation: {
    threshold: getNumberEnvVar('VITE_LIQUIDATION_THRESHOLD', 10000),
    maxSlippage: getNumberEnvVar('VITE_MAX_SLIPPAGE', 500),
    gracePeriod: getNumberEnvVar('VITE_GRACE_PERIOD', 300),
  },
  
  app: {
    name: getEnvVar('VITE_APP_NAME', '智运通闪电贷系统'),
    version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
    debugMode: getBooleanEnvVar('VITE_DEBUG_MODE', false),
  },
  
  network: {
    requestTimeout: getNumberEnvVar('VITE_REQUEST_TIMEOUT', 30000),
    retryAttempts: getNumberEnvVar('VITE_RETRY_ATTEMPTS', 3),
    retryDelay: getNumberEnvVar('VITE_RETRY_DELAY', 1000),
  },
  
  monitoring: {
    enableAnalytics: getBooleanEnvVar('VITE_ENABLE_ANALYTICS', false),
    sentryDsn: getEnvVar('VITE_SENTRY_DSN'),
  },
};

/**
 * 验证配置完整性
 */
export function validateConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!appConfig.flashLoan.contractAddress) {
    errors.push('闪电贷合约地址未配置');
  }
  
  if (appConfig.flashLoan.supportedAssets.length === 0) {
    errors.push('支持的资产列表为空');
  }
  
  if (!appConfig.injective.rpcUrl) {
    errors.push('Injective RPC URL 未配置');
  }
  
  if (!appConfig.injective.restUrl) {
    errors.push('Injective REST URL 未配置');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 获取配置摘要（用于调试）
 */
export function getConfigSummary(): Record<string, any> {
  return {
    app: appConfig.app,
    injective: {
      chainId: appConfig.injective.chainId,
      rpcUrl: appConfig.injective.rpcUrl ? 'configured' : 'not configured',
      restUrl: appConfig.injective.restUrl ? 'configured' : 'not configured',
    },
    flashLoan: {
      contractAddress: appConfig.flashLoan.contractAddress ? 'configured' : 'not configured',
      supportedAssets: appConfig.flashLoan.supportedAssets,
    },
    liquidation: appConfig.liquidation,
  };
}
