import express from "express"
import { getKomentarByLaporan, createKomentar, updateKomentar, deleteKomentar } from "../controllers/komentarController.js"

const router = express.Router()

router.get("/:id_laporan", getKomentarByLaporan)
router.post("/:id_laporan", createKomentar)
router.put("/:id_komentar", updateKomentar)
router.delete("/:id_komentar", deleteKomentar)

export default router