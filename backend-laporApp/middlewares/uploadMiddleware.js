import ImageKit, { toFile } from "@imagekit/nodejs";
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
  const imagekit = new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  });

  const response = await imagekit.files.upload({
    file: await toFile(file.buffer, file.originalname),
    fileName: `${Date.now()}-${file.originalname}`,
    folder: "/laporapp",
  });

  return response.url;
};