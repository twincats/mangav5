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
    return ipcRenderer.invoke("dialog:showOpen", option);
  };

  const showSaveDialog = async (
    option: SaveDialogOptions
  ): Promise<SaveDialogReturnValue> => {
    return ipcRenderer.invoke("dialog:showSave", option);
  };

  return { showOpenDialog, showSaveDialog };
}
