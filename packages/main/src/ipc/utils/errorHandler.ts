export interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Type aliases yang ringkas
export type IpcResult<T> = Promise<IpcResponse<T>>;
export type IpcSuccess<T> = IpcResponse<T>;
export type IpcError = IpcResponse<never>;

export function createSuccessResponse<T>(data: T, message?: string): IpcSuccess<T> {
  return {
    success: true,
    data,
    message
  };
}

export function createErrorResponse(error: Error | string, message?: string): IpcError {
  return {
    success: false,
    error: typeof error === 'string' ? error : error.message,
    message
  };
}

export function wrapHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
): (...args: T) => IpcResult<R> {
  return async (...args: T) => {
    try {
      const result = await handler(...args);
      return createSuccessResponse(result);
    } catch (error) {
      console.error('IPC Handler Error:', error);
      return createErrorResponse(error as Error);
    }
  };
}
