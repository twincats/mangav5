import {clipboard} from 'electron';

export const getClipboard = () => {
  const copy = (content:string)=>{
    clipboard.writeText(content)
  }
  const paste = ()=>{
    return clipboard.readText()
  }
  return {copy, paste};
}
