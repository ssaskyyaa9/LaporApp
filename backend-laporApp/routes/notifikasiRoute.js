import express from "express"
import { getNotifikasiSaya, getJumlahUnread, readNotifikasi, readAllNotifikasi, deleteNotifikasi, deleteAllNotifikasi } from "../controllers/notifikasiController.js"
const router = express.Router()

router.get("/", getNotifikasiSaya)
router.get("/unread", getJumlahUnread)
router.patch("/:id/read", readNotifikasi)
router.patch("/read-all", readAllNotifikasi)
router.delete("/delete-all", deleteAllNotifikasi)
router.delete("/:id", deleteNotifikasi)

export default router