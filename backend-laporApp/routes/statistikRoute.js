import express from "express"
import { getStatistikLaporan, getStatistikAdmin, getGrafikHarian, getGrafikKategori } from "../controllers/statistikController.js"
import { jwtMiddleware, requireAdmin } from "../middlewares/authMiddleware.js"
 
const router = express.Router()
router.get("/", getStatistikLaporan)
router.get("/admin", jwtMiddleware, requireAdmin, getStatistikAdmin)
router.get("/admin/harian",   jwtMiddleware, requireAdmin, getGrafikHarian)
router.get("/admin/kategori", jwtMiddleware, requireAdmin, getGrafikKategori)
 
export default router