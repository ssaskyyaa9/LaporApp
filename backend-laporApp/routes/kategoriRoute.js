import express from "express"
import { getAllKategori, getKategoriById } from "../controllers/kategoriController.js"

const router = express.Router()

router.get("/", getAllKategori)
router.get("/:id", getKategoriById)

// /api/laporan?id_kategori=1

export default router