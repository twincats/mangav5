import { IpcHandler, IpcModule } from "../types.js";
import sharp from "sharp";

const genBlue: IpcHandler = {
  name: "generate-blue",
  handler: async (_, msg: string) => {
    const buffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 0, g: 0, b: 255 },
      },
    })
      .png()
      .toBuffer();
    console.log("create image from sharp: ", msg);
    // return 'from Main : + '+msg;
    return `data:image/png;base64,${buffer.toString("base64")}`;
  },
};

export const imageHandlers: IpcModule = {
  getHandlers: () => [genBlue],
};
