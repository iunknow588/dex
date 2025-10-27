/**
 * 网络请求工具类
 * 提供带重试和错误处理的网络请求功能
 */

import { errorHandler, ErrorType } from './ErrorHandler';

export interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface RequestResult<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export class NetworkUtils {
  private static instance: NetworkUtils;

  private constructor() {}

  public static getInstance(): NetworkUtils {
    if (!NetworkUtils.instance) {
      NetworkUtils.instance = new NetworkUtils();
    }
    return NetworkUtils.instance;
  }

  /**
   * GET 请求
   */
  async get<T = any>(
    url: string,
    config: RequestConfig = {}
  ): Promise<RequestResult<T>> {
    return this.request<T>(url, {
      method: 'GET',
      ...config,
    });
  }

  /**
   * POST 请求
   */
  async post<T = any>(
    url: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<RequestResult<T>> {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      ...config,
    });
  }

  /**
   * 通用请求方法
   */
  async request<T = any>(
    url: string,
    config: RequestConfig & RequestInit = {}
  ): Promise<RequestResult<T>> {
    const {
      timeout = 30000,
      retries = 3,
      retryDelay = 1000,
      ...requestConfig
    } = config;

    return errorHandler.executeWithRetry(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const response = await fetch(url, {
            ...requestConfig,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw errorHandler.createError(
              `HTTP ${response.status}: ${response.statusText}`,
              ErrorType.NETWORK_ERROR,
              response.status,
              { url, status: response.status, statusText: response.statusText },
              response.status >= 500 // 5xx 错误可重试
            );
          }

          const data = await response.json();
          
          return {
            data,
            status: response.status,
            statusText: response.statusText,
            headers: this.parseHeaders(response.headers),
          };
        } catch (error: any) {
          clearTimeout(timeoutId);
          
          if (error.name === 'AbortError') {
            throw errorHandler.handleTimeoutError(error, `请求超时: ${url}`);
          }
          
          throw errorHandler.handleNetworkError(error, `请求失败: ${url}`);
        }
      },
      `网络请求: ${url}`,
      {
        maxAttempts: retries,
        baseDelay: retryDelay,
      }
    );
  }

  /**
   * 解析响应头
   */
  private parseHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * 检查网络连接状态
   */
  async checkConnection(): Promise<boolean> {
    try {
      await fetch('https://api.injective.network/health', {
        method: 'HEAD',
        mode: 'no-cors',
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取网络延迟
   */
  async getLatency(url: string = 'https://api.injective.network'): Promise<number> {
    const start = Date.now();
    try {
      await fetch(url, { method: 'HEAD' });
      return Date.now() - start;
    } catch (error) {
      return -1;
    }
  }
}

// 导出单例实例
export const networkUtils = NetworkUtils.getInstance();