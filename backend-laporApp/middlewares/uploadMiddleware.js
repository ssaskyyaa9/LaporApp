import { ImageKit } from "@imagekit/nodejs";
import multer from "multer";
import connection from "../database.js";
import bcrypt from "bcrypt";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Format file tidak didukung. Gunakan JPEG, PNG, JPG, atau WEBP."));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadToImageKit = async (file) => {
  console.log("CEK TOKEN DI RAILWAY:", {
    pub: process.env.IMAGEKIT_PUBLIC_KEY ? "Ada" : "Kosong/Undefined",
    priv: process.env.IMAGEKIT_PRIVATE_KEY ? "Ada" : "Kosong/Undefined",
    end: process.env.IMAGEKIT_URL_ENDPOINT ? "Ada" : "Kosong/Undefined"
  });

  const ImageKitClass = ImageKit.default || ImageKit;
  
  const imagekit = new ImageKitClass({
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