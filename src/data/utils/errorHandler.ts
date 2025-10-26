import { ErrorType, AppError } from '../types';

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: Set<(error: AppError) => void> = new Set();

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // 创建错误对象
  createError(
    type: ErrorType,
    code: string,
    message: string,
    details?: any,
    recoverable: boolean = true
  ): AppError {
    return {
      type,
      code,
      message,
      details,
      timestamp: Date.now(),
      recoverable
    };
  }

  // 处理错误
  handleError(error: Error | AppError | any): AppError {
    let appError: AppError;

    if (this.isAppError(error)) {
      appError = error;
    } else if (error instanceof Error) {
      appError = this.convertNativeError(error);
    } else {
      appError = this.createError(
        ErrorType.UNKNOWN_ERROR,
        'UNKNOWN_ERROR',
        '发生未知错误',
        error,
        false
      );
    }

    // 通知所有监听器
    this.notifyListeners(appError);

    // 记录错误日志
    this.logError(appError);

    return appError;
  }

  // 转换原生错误
  private convertNativeError(error: Error): AppError {
    // 网络错误
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return this.createError(
        ErrorType.NETWORK_ERROR,
        'NETWORK_ERROR',
        '网络连接失败，请检查网络连接',
        error,
        true
      );
    }

    // 区块链相关错误
    if (error.message.includes('transaction') || error.message.includes('blockchain')) {
      return this.createError(
        ErrorType.BLOCKCHAIN_ERROR,
        'BLOCKCHAIN_ERROR',
        '区块链操作失败',
        error,
        true
      );
    }

    // 超时错误
    if (error.message.includes('timeout')) {
      return this.createError(
        ErrorType.TIMEOUT_ERROR,
        'TIMEOUT_ERROR',
        '操作超时，请重试',
        error,
        true
      );
    }

    // 权限错误
    if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      return this.createError(
        ErrorType.PERMISSION_ERROR,
        'PERMISSION_ERROR',
        '权限不足，请检查钱包连接',
        error,
        true
      );
    }

    // 默认未知错误
    return this.createError(
      ErrorType.UNKNOWN_ERROR,
      'UNKNOWN_ERROR',
      error.message || '发生未知错误',
      error,
      false
    );
  }

  // 检查是否为AppError
  private isAppError(error: any): error is AppError {
    return error &&
           typeof error.type === 'string' &&
           typeof error.code === 'string' &&
           typeof error.message === 'string' &&
           typeof error.timestamp === 'number' &&
           typeof error.recoverable === 'boolean';
  }

  // 添加错误监听器
  addErrorListener(listener: (error: AppError) => void): void {
    this.errorListeners.add(listener);
  }

  // 移除错误监听器
  removeErrorListener(listener: (error: AppError) => void): void {
    this.errorListeners.delete(listener);
  }

  // 通知所有监听器
  private notifyListeners(error: AppError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (e) {
        console.error('Error listener threw an error:', e);
      }
    });
  }

  // 记录错误日志
  private logError(error: AppError): void {
    const logLevel = error.recoverable ? 'warn' : 'error';

    console[logLevel](`[${error.type}] ${error.code}: ${error.message}`, {
      details: error.details,
      timestamp: new Date(error.timestamp).toISOString(),
      recoverable: error.recoverable
    });

    // 在生产环境中，这里可以发送到错误监控服务
    // this.sendToMonitoringService(error);
  }

  // 获取用户友好的错误信息
  getUserFriendlyMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        return '网络连接出现问题，请检查网络连接后重试';
      case ErrorType.BLOCKCHAIN_ERROR:
        return '区块链操作失败，可能由于网络拥堵或Gas费不足';
      case ErrorType.VALIDATION_ERROR:
        return '输入信息有误，请检查后重新输入';
      case ErrorType.PERMISSION_ERROR:
        return '权限不足，请确保钱包正确连接并授权';
      case ErrorType.TIMEOUT_ERROR:
        return '操作超时，请稍后重试';
      default:
        return error.recoverable ? '操作失败，请重试' : '发生系统错误，请联系技术支持';
    }
  }

  // 获取恢复建议
  getRecoverySuggestion(error: AppError): string {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        return '1. 检查网络连接\n2. 刷新页面重试\n3. 稍后再次尝试';
      case ErrorType.BLOCKCHAIN_ERROR:
        return '1. 检查钱包余额是否充足\n2. 确认网络拥堵情况\n3. 调整Gas费用后重试';
      case ErrorType.VALIDATION_ERROR:
        return '1. 检查输入信息的格式\n2. 确认数值在有效范围内\n3. 重新填写表单';
      case ErrorType.PERMISSION_ERROR:
        return '1. 确认钱包已正确连接\n2. 检查是否已授权应用\n3. 重新连接钱包';
      case ErrorType.TIMEOUT_ERROR:
        return '1. 等待网络情况改善\n2. 减少并发操作数量\n3. 稍后重试';
      default:
        return error.recoverable ? '请重试操作' : '请联系技术支持获取帮助';
    }
  }
}

// 全局错误处理工具
export const errorHandler = ErrorHandler.getInstance();

// 便捷的错误创建函数
export const createNetworkError = (message: string, details?: any) =>
  errorHandler.createError(ErrorType.NETWORK_ERROR, 'NETWORK_ERROR', message, details, true);

export const createBlockchainError = (message: string, details?: any) =>
  errorHandler.createError(ErrorType.BLOCKCHAIN_ERROR, 'BLOCKCHAIN_ERROR', message, details, true);

export const createValidationError = (message: string, details?: any) =>
  errorHandler.createError(ErrorType.VALIDATION_ERROR, 'VALIDATION_ERROR', message, details, true);

export const createPermissionError = (message: string, details?: any) =>
  errorHandler.createError(ErrorType.PERMISSION_ERROR, 'PERMISSION_ERROR', message, details, true);

export const createTimeoutError = (message: string, details?: any) =>
  errorHandler.createError(ErrorType.TIMEOUT_ERROR, 'TIMEOUT_ERROR', message, details, true);

// 便捷的错误处理函数
export const handleError = (error: any) => errorHandler.handleError(error);
export const getUserFriendlyMessage = (error: AppError) => errorHandler.getUserFriendlyMessage(error);
export const getRecoverySuggestion = (error: AppError) => errorHandler.getRecoverySuggestion(error);
