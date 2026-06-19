import multer from "multer"
import path from "path"

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, "uploads/") },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9)
        cb(null, uniqueName + path.extname(file.originalname))
    }
})

const fileFilter = (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    if (allowed.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error("Format file tidak didukung. Gunakan JPEG, PNG, JPG, atau WEBP."))
    }
}

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // maks 5MB
})