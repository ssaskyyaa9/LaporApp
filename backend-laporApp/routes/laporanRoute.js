import express from "express"
import { roleMiddleware } from "../middlewares/roleMiddleware.js"
import { upload } from "../middlewares/uploadMiddleware.js"
import { getAllLaporan, getLaporanSaya, getLaporanById, createLaporan, updateLaporan, updateStatusLaporan, deleteLaporan } from "../controllers/laporanController.js"

const router = express.Router()

const cekUser = roleMiddleware("user")
const cekAdmin = roleMiddleware("admin", "super admin")

router.get("/", getAllLaporan)
router.get("/saya", cekUser, getLaporanSaya)
router.get("/:id", getLaporanById)
router.post("/", upload.single("gambar"), cekUser, createLaporan)
router.put("/:id", upload.single("gambar"), updateLaporan)
router.patch("/:id/status", cekAdmin, updateStatusLaporan)
router.delete("/:id", cekUser, deleteLaporan)

export default router