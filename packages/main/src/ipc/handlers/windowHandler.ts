import { IpcHandler, IpcModule, IpcResult } from "../types.js";
import { createSuccessResponse, createErrorResponse } from "../utils/errorHandler.js";
import { BrowserWindow } from "electron";

const getCurrentWindow = () => {
    // Mendapatkan semua window yang aktif
    const allWindows = BrowserWindow.getAllWindows();
    const currentWindow = allWindows.find(w => !w.isDestroyed());
    return currentWindow;
}

const maximizeWindow: IpcHandler<[], boolean> = {
    name: "window:maximize",
    handler: async (): IpcResult<boolean> => {
        try {
            const window = getCurrentWindow();
            if (window) {
                window.maximize();
                return createSuccessResponse(true, "Window maximized successfully");
            }
            return createErrorResponse("No active window found");
        } catch (error) {
            return createErrorResponse(error as Error, "Failed to maximize window");
        }
    }
}

const minimizeWindow: IpcHandler<[], boolean> = {
    name: "window:minimize",
    handler: async (): IpcResult<boolean> => {
        try {
            const window = getCurrentWindow();
            if (window) {
                window.minimize();
                return createSuccessResponse(true, "Window minimized successfully");
            }
            return createErrorResponse("No active window found");
        } catch (error) {
            return createErrorResponse(error as Error, "Failed to minimize window");
        }
    }
}

const restoreWindow: IpcHandler<[], boolean> = {
    name: "window:restore",
    handler: async (): IpcResult<boolean> => {
        try {
            const window = getCurrentWindow();
            if (window) {
                if (window.isMaximized()) {
                    window.unmaximize();
                    return createSuccessResponse(true, "Window unmaximized successfully");
                } else if (window.isMinimized()) {
                    window.restore();
                    return createSuccessResponse(true, "Window restored from minimized successfully");
                } else {
                    return createSuccessResponse(true, "Window is already in normal state");
                }
            }
            return createErrorResponse("No active window found");
        } catch (error) {
            return createErrorResponse(error as Error, "Failed to restore window");
        }
    }
}

const unmaximizeWindow: IpcHandler<[], boolean> = {
    name: "window:unmaximize",
    handler: async (): IpcResult<boolean> => {
        try {
            const window = getCurrentWindow();
            if (window) {
                if (window.isMaximized()) {
                    window.unmaximize();
                    return createSuccessResponse(true, "Window unmaximized successfully");
                } else {
                    return createSuccessResponse(true, "Window is already not maximized");
                }
            }
            return createErrorResponse("No active window found");
        } catch (error) {
            return createErrorResponse(error as Error, "Failed to unmaximize window");
        }
    }
}

const closeWindow: IpcHandler<[], boolean> = {
    name: "window:close",
    handler: async (): IpcResult<boolean> => {
        try {
            const window = getCurrentWindow();
            if (window) {
                window.close();
                return createSuccessResponse(true, "Window closed successfully");
            }
            return createErrorResponse("No active window found");
        } catch (error) {
            return createErrorResponse(error as Error, "Failed to close window");
        }
    }
}

const getCurrentWindowInfo: IpcHandler<[], any> = {
    name: "window:get-current",
    handler: async (): IpcResult<any> => {
        try {
            const window = getCurrentWindow();
            if (window) {
                const info = {
                    id: window.id,
                    title: window.getTitle(),
                    isVisible: window.isVisible(),
                    isMinimized: window.isMinimized(),
                    isMaximized: window.isMaximized(),
                    bounds: window.getBounds(),
                    isFullScreen: window.isFullScreen()
                };
                return createSuccessResponse(info, "Current window info retrieved successfully");
            }
            return createErrorResponse("No active window found");
        } catch (error) {
            return createErrorResponse(error as Error, "Failed to get current window info");
        }
    }
}

const getAllWindows: IpcHandler<[], any> = {
    name: "window:get-all",
    handler: async (): IpcResult<any> => {
        try {
            const allWindows = BrowserWindow.getAllWindows()
                .filter(w => !w.isDestroyed())
                .map(window => ({
                    id: window.id,
                    title: window.getTitle(),
                    isVisible: window.isVisible(),
                    isMinimized: window.isMinimized(),
                    isMaximized: window.isMaximized(),
                    bounds: window.getBounds(),
                    isFullScreen: window.isFullScreen()
                }));
            
            return createSuccessResponse(allWindows, `Retrieved ${allWindows.length} windows successfully`);
        } catch (error) {
            return createErrorResponse(error as Error, "Failed to get all windows");
        }
    }
}

const setWindowSize: IpcHandler<[{ width: number; height: number }], boolean> = {
    name: "window:set-size",
    handler: async (_, params: { width: number; height: number }): IpcResult<boolean> => {
        try {
            const { width, height } = params;
            if (width <= 0 || height <= 0) {
                return createErrorResponse("Width and height must be positive numbers");
            }
            
            const window = getCurrentWindow();
            if (window) {
                window.setSize(width, height);
                return createSuccessResponse(true, `Window size set to ${width}x${height}`);
            }
            return createErrorResponse("No active window found");
        } catch (error) {
            return createErrorResponse(error as Error, "Failed to set window size");
        }
    }
}

const toggleFullScreen: IpcHandler<[], boolean> = {
    name: "window:toggle-fullscreen",
    handler: async (): IpcResult<boolean> => {
        try {
            const window = getCurrentWindow();
            if (window) {
                const isFullScreen = window.isFullScreen();
                window.setFullScreen(!isFullScreen);
                return createSuccessResponse(!isFullScreen, `Fullscreen ${!isFullScreen ? 'enabled' : 'disabled'}`);
            }
            return createErrorResponse("No active window found");
        } catch (error) {
            return createErrorResponse(error as Error, "Failed to toggle fullscreen");
        }
    }
}

export const windowHandler: IpcModule = {
    getHandlers: () => [
        maximizeWindow,
        minimizeWindow,
        restoreWindow,
        unmaximizeWindow,
        closeWindow,
        getCurrentWindowInfo,
        getAllWindows,
        setWindowSize,
        toggleFullScreen
    ]
}