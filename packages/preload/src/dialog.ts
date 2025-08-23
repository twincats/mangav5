import { ipcRenderer } from "electron";
import type {
  OpenDialogOptions,
  SaveDialogOptions,
  OpenDialogReturnValue,
  SaveDialogReturnValue,
} from "electron";

export function getDialog() {
  const showOpenDialog = async (
    option: OpenDialogOptions
  ): Promise<OpenDialogReturnValue> => {
    const result = await ipcRenderer.invoke("dialog:showOpen", option);
    
    // Handle IpcResult wrapper
    if (result && result.success && result.data) {
      return result.data;
    } else {
      throw new Error(result?.error || 'Failed to show open dialog');
    }
  };

  const showSaveDialog = async (
    option: SaveDialogOptions
  ): Promise<SaveDialogReturnValue> => {
    const result = await ipcRenderer.invoke("dialog:showSave", option);
    
    // Handle IpcResult wrapper
    if (result && result.success && result.data) {
      return result.data;
    } else {
      throw new Error(result?.error || 'Failed to show save dialog');
    }
  };

  return { showOpenDialog, showSaveDialog };
}
