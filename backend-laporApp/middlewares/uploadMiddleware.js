import { ImageKit } from "@imagekit/nodejs";
import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadToImageKit = async (file) => {
  console.log("CEK TOKEN DI RAILWAY:", {
    pub: process.env.IMAGEKIT_PUBLIC_KEY ? "Ada" : "Kosong/Undefined",
    priv: process.env.IMAGEKIT_PRIVATE_KEY ? "Ada" : "Kosong/Undefined",
    end: process.env.IMAGEKIT_URL_ENDPOINT ? "Ada" : "Kosong/Undefined"
  });

  const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });

  const response = await imagekit.upload({
    file: file.buffer,
    fileName: `${Date.now()}-${file.originalname}`,
    folder: "/laporapp",
  });
  return response.url;
};