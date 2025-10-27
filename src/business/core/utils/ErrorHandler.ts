/**
 * 错误处理和重试机制
 */

export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BLOCKCHAIN_ERROR = 'BLOCKCHAIN_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: ErrorType[];
}

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  code?: string | number;
  details?: any;
  timestamp: number;
  retryable: boolean;
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly code?: string | number;
  public readonly details?: any;
  public readonly retryable: boolean;
  public readonly timestamp: number;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN_ERROR,
    code?: string | number,
    details?: any,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.code = code;
    this.details = details;
    this.retryable = retryable;
    this.timestamp = Date.now();
  }

  toErrorInfo(): ErrorInfo {
    return {
      type: this.type,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      retryable: this.retryable,
    };
  }
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private retryConfig: RetryConfig;

  private constructor() {
    this.retryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: [
        ErrorType.NETWORK_ERROR,
        ErrorType.TIMEOUT_ERROR,
        ErrorType.BLOCKCHAIN_ERROR,
      ],
    };
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 更新重试配置
   */
  updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  /**
   * 分类错误类型
   */
  classifyError(error: any): ErrorType {
    if (error instanceof AppError) {
      return error.type;
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
        return ErrorType.NETWORK_ERROR;
      }
      
      if (message.includes('timeout') || message.includes('timed out')) {
        return ErrorType.TIMEOUT_ERROR;
      }
      
      if (message.includes('validation') || message.includes('invalid')) {
        return ErrorType.VALIDATION_ERROR;
      }
      
      if (message.includes('blockchain') || message.includes('transaction') || message.includes('gas')) {
        return ErrorType.BLOCKCHAIN_ERROR;
      }
    }

    return ErrorType.UNKNOWN_ERROR;
  }

  /**
   * 创建应用错误
   */
  createError(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN_ERROR,
    code?: string | number,
    details?: any,
    retryable: boolean = false
  ): AppError {
    return new AppError(message, type, code, details, retryable);
  }

  /**
   * 包装原始错误
   */
  wrapError(error: any, context?: string): AppError {
    const type = this.classifyError(error);
    const message = context ? `${context}: ${error.message || error}` : (error.message || error);
    const retryable = this.retryConfig.retryableErrors.includes(type);
    
    return new AppError(message, type, error.code, error, retryable);
  }

  /**
   * 带重试的执行函数
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context?: string,
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.retryConfig, ...customRetryConfig };
    let lastError: AppError;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.wrapError(error, context);
        
        // 如果不是可重试的错误，直接抛出
        if (!lastError.retryable || !config.retryableErrors.includes(lastError.type)) {
          throw lastError;
        }

        // 如果是最后一次尝试，抛出错误
        if (attempt === config.maxAttempts) {
          throw lastError;
        }

        // 计算延迟时间
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelay
        );

        console.warn(
          `操作失败 (尝试 ${attempt}/${config.maxAttempts}): ${lastError.message}，${delay}ms 后重试...`
        );

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * 处理网络错误
   */
  handleNetworkError(error: any, _context?: string): AppError {
    return this.createError(
      `网络连接失败: ${error.message || error}`,
      ErrorType.NETWORK_ERROR,
      error.code,
      error,
      true
    );
  }

  /**
   * 处理超时错误
   */
  handleTimeoutError(error: any, _context?: string): AppError {
    return this.createError(
      `操作超时: ${error.message || error}`,
      ErrorType.TIMEOUT_ERROR,
      error.code,
      error,
      true
    );
  }

  /**
   * 处理验证错误
   */
  handleValidationError(message: string, details?: any): AppError {
    return this.createError(
      `验证失败: ${message}`,
      ErrorType.VALIDATION_ERROR,
      'VALIDATION_ERROR',
      details,
      false
    );
  }

  /**
   * 处理区块链错误
   */
  handleBlockchainError(error: any, _context?: string): AppError {
    return this.createError(
      `区块链操作失败: ${error.message || error}`,
      ErrorType.BLOCKCHAIN_ERROR,
      error.code,
      error,
      true
    );
  }

  /**
   * 获取用户友好的错误消息
   */
  getUserFriendlyMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        return '网络连接失败，请检查网络连接后重试';
      case ErrorType.TIMEOUT_ERROR:
        return '操作超时，请稍后重试';
      case ErrorType.VALIDATION_ERROR:
        return `输入验证失败: ${error.message}`;
      case ErrorType.BLOCKCHAIN_ERROR:
        return '区块链操作失败，请稍后重试';
      default:
        return '操作失败，请稍后重试';
    }
  }

  /**
   * 记录错误
   */
  logError(error: AppError, context?: string): void {
    const logData = {
      type: error.type,
      message: error.message,
      code: error.code,
      details: error.details,
      timestamp: error.timestamp,
      context,
    };

    console.error('应用错误:', logData);
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出单例实例
export const errorHandler = ErrorHandler.getInstance();