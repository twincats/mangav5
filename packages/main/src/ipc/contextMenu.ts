import { ipcMain, Menu } from "electron";
import type {MenuItemConstructorOptions} from "electron"

export function registerContextMenu() {
    ipcMain.on('context-menu', (event, context: { routeName: string, elementType: string, selectionText?: string, readingMode?: string, readingDirection?: string, isFullscreen?: boolean, containerWidth?: string, canNavigatePrev?: boolean, canNavigateNext?: boolean, imageFileName?: string, chapterPath?: string, mangaId?: number, mangaTitle?: string}) => {
        const { routeName, elementType, selectionText, readingMode, readingDirection, isFullscreen, containerWidth, canNavigatePrev, canNavigateNext, imageFileName, chapterPath, mangaId, mangaTitle } = context;
        // Base menu items for all routes
        const baseMenuItems: MenuItemConstructorOptions[] = [];

        switch(routeName){
            case 'home':
                baseMenuItems.push(
                    { label: 'Add Alternative Title', click: () => event.sender.send('execute-context-action', 'add-alternative-title', { mangaId, mangaTitle })},
                    { type: 'separator' },
                    { label: 'Convert Chapter Webp'},
                    { label: 'Compress Manga Chapter'},
                    { type: 'separator' },
                    { label: 'Delete Manga'},
                )
                break;
            case 'reader':
                baseMenuItems.push(
                    { label: 'Fullscreen', click: () => event.sender.send('execute-context-action', 'toggle-fullscreen')},
                    { label: readingMode === 'long-strip' ? '2 Pages Mode' : 'Long Strip Mode', click: () => event.sender.send('execute-context-action', 'toggle-reading-mode')},
                    { label: readingMode === 'two-page' ? (readingDirection === 'ltr' ? 'RTL' : 'LTR') : 'RTL', enabled: readingMode === 'two-page', click: () => event.sender.send('execute-context-action', 'toggle-reading-direction')},
                    { label: containerWidth === 'normal' ? 'Full Width' : 'Normal Width', enabled: !isFullscreen, click: () => event.sender.send('execute-context-action', 'toggle-container-width')},
                    { type: 'separator' },
                    { label: 'Previous Chapter', enabled: context.canNavigatePrev !== false, click: () => event.sender.send('execute-context-action', 'previous-chapter')},
                    { label: 'Home', click: () => event.sender.send('execute-context-action', 'go-home')},
                    { label: 'Next Chapter', enabled: context.canNavigateNext !== false, click: () => event.sender.send('execute-context-action', 'next-chapter')},
                    
                )
                if(elementType === 'img'){
                    baseMenuItems.push(
                        { type: 'separator' },
                        { label: 'Copy Image'},
                        { label: 'Image Link'},
                        { type: 'separator' },
                        { label: `Delete Chapter Image ${context.imageFileName || ''}`, click: () => event.sender.send('execute-context-action', 'delete-image', context.imageFileName, context.chapterPath)}
                    )
                }
                break;
            default:
                baseMenuItems.push(
                    { label: 'Cut', role: 'cut', enabled: (selectionText?.trim()?.length ?? 0) > 0 } ,
                    { label: 'Copy', role: 'copy', enabled: (selectionText?.trim()?.length ?? 0) > 0 },
                    { label: 'Paste', role: 'paste'},
                    { type: 'separator' },
                )
                break;
        }
        const menu = Menu.buildFromTemplate(baseMenuItems)
        menu.popup()
    });
}