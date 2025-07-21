import { sha256sum } from "./nodeCrypto.js";
import { versions } from "./versions.js";
import { ipcRenderer } from "electron";
import { getClipboard } from "./clipboard.js";
import { mangaAPI } from "./manga.js";
import { getDialog } from "./dialog.js";

// General IPC send function
function send(channel: string, message: string) {
  return ipcRenderer.invoke(channel, message);
}

// mangaAPI is now imported from ./manga.js

export { sha256sum, versions, send, getClipboard, mangaAPI, getDialog };
