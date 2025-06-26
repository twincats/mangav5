import {sha256sum} from './nodeCrypto.js';
import {versions} from './versions.js';
import {ipcRenderer} from 'electron';
import {getClipboard} from './clipboard.js';


function send(channel: string, message: string) {
  return ipcRenderer.invoke(channel, message);
}

export {sha256sum, versions, send, getClipboard};
