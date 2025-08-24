import { ipcRenderer } from "electron";

interface ContextMenuContext {
    routeName: string;
    elementType: string;
    selectionText?: string;
    readingMode?: string;
    readingDirection?: string;
    isFullscreen?: boolean;
    containerWidth?: string;
    canNavigatePrev?: boolean;
    canNavigateNext?: boolean;
}

export function showContextMenu(context: ContextMenuContext) {
    ipcRenderer.send('context-menu', context);
}

// Listen for context menu actions
ipcRenderer.on('execute-context-action', (_event, action: string) => {
    // Emit custom event that renderer can listen to
    window.dispatchEvent(new CustomEvent('context-menu-action', { detail: action }));
});